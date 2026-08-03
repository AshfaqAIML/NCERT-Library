import { db } from "@/lib/db";
import { retrieve, compressContext } from "@/lib/ai-engine/retriever";
import { chat, extractJson } from "@/lib/ai";
import { requireUser, handle } from "@/lib/http-auth";
import type { MCQ } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

// Generate a quiz from the user's reading history
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { count, subjectSlug } = await req.json();

    // Get user's reading history
    const progress = await db.readingProgress.findMany({
      where: { userId: session.id },
      include: { book: { include: { subject: true } } },
      orderBy: { lastReadAt: "desc" },
      take: 10,
    });

    if (progress.length === 0) {
      return new Response(JSON.stringify({ error: "No reading history found. Read some books first!" }), { status: 400 });
    }

    // Gather content from recently read books
    const bookIds = progress.map((p) => p.bookId);
    const chunks = await db.knowledgeChunk.findMany({
      where: { bookId: { in: bookIds } },
      take: 20,
    });

    if (chunks.length === 0) {
      return new Response(JSON.stringify({ error: "No indexed content found for your books." }), { status: 400 });
    }

    // Build context from chunks
    const context = chunks.map((c) => `[${c.book?.title || "Book"} · ${c.chapter || "Chapter"} · p.${c.page}]\n${c.text}`).join("\n\n");

    const numQuestions = count || 5;
    const raw = await chat([
      {
        role: "system",
        content: "You generate high-quality UPSC Prelims-style MCQs from NCERT content. Return STRICT JSON only: an array of objects with fields question, options (array of 4 strings), answer (index 0-3), explanation (string). No prose.",
      },
      {
        role: "user",
        content: `Generate ${numQuestions} MCQs from the following NCERT content that the user has been reading:\n\n${context}\n\nMake questions exam-relevant and test conceptual understanding.`,
      },
    ]);

    const mcqs = extractJson<MCQ[]>(raw) ?? [];

    // Log study analytic
    await db.studyAnalytic.create({
      data: { userId: session.id, event: "mcq", query: `Quiz from ${progress.length} books`, retrievalCount: chunks.length, hasCitations: true },
    });

    return {
      mcqs,
      sourceBooks: progress.map((p) => ({ title: p.book.title, subject: p.book.subject.name, percent: p.percent })),
    };
  });
}

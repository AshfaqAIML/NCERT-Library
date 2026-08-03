import { ragChat } from "@/lib/ai-engine/llm";
import { getSession, handle } from "@/lib/http-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

// RAG-grounded chat — retrieves relevant chunks then answers with citations
export async function POST(req: Request) {
  return handle(async () => {
    const session = await getSession();
    const { question, history, bookId, subjectSlug, classNum, pageStart, pageEnd, upscMode, preferredStyle, language, topK } = await req.json();

    if (!question) return new Response(JSON.stringify({ error: "Question is required." }), { status: 400 });

    const answer = await ragChat(question, history || [], {
      filter: { bookId, subjectSlug, classNum, pageStart, pageEnd },
      upscMode: upscMode ?? true,
      preferredStyle: preferredStyle ?? "detailed",
      language: language ?? "en",
      topK: topK ?? 6,
    });

    // Log the question for analytics + memory
    if (session) {
      await logQuestion(session.id, question, answer.answer, answer.citations, bookId);
    }

    return answer;
  });
}

async function logQuestion(userId: string, query: string, answer: string, citations: any[], bookId?: string) {
  try {
    const { db } = await import("@/lib/db");
    await db.questionHistory.create({
      data: { userId, query, answer, citations: JSON.stringify(citations), bookId },
    });
    // Update AI memory with recent question
    const mem = await db.aIMemory.findUnique({ where: { userId } });
    if (mem) {
      const recent = JSON.parse(mem.recentQuestions || "[]");
      recent.unshift(query.slice(0, 100));
      await db.aIMemory.update({ where: { userId }, data: { recentQuestions: JSON.stringify(recent.slice(0, 20)) } });
    }
    // Study analytic
    await db.studyAnalytic.create({
      data: { userId, bookId, event: "question", query, retrievalCount: citations.length, hasCitations: citations.length > 0 },
    });
  } catch {}
}

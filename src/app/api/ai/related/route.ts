import { retrieve } from "@/lib/ai-engine/retriever";
import { db } from "@/lib/db";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 30;

// Find related chapters/books for a topic
export async function POST(req: Request) {
  return handle(async () => {
    const { topic, bookId, topK } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "Topic is required." }), { status: 400 });

    const result = await retrieve(topic, { topK: topK ?? 10, filter: { bookId } });

    // Group by book to find related books
    const bookMap = new Map<string, { bookId: string; bookTitle: string; subject: string; classNum: number; chunks: number }>();
    for (const chunk of result.chunks) {
      const existing = bookMap.get(chunk.bookId);
      if (existing) existing.chunks++;
      else bookMap.set(chunk.bookId, { bookId: chunk.bookId, bookTitle: chunk.bookTitle, subject: chunk.subjectName, classNum: chunk.classNum, chunks: 1 });
    }

    const relatedBooks = [...bookMap.values()].sort((a, b) => b.chunks - a.chunks);

    // Find related chapters within the current book
    const relatedChapters = result.chunks
      .filter((c) => c.chapter)
      .reduce((acc: { chapter: string; page: number; bookTitle: string }[], c) => {
        if (!acc.find((x) => x.chapter === c.chapter)) acc.push({ chapter: c.chapter!, page: c.page, bookTitle: c.bookTitle });
        return acc;
      }, []);

    return { relatedBooks, relatedChapters, chunks: result.chunks };
  });
}

import { retrieve, buildCitations } from "@/lib/ai-engine/retriever";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 30;

// Semantic search across the knowledge base
export async function POST(req: Request) {
  return handle(async () => {
    const { query, bookId, subjectSlug, classNum, topK } = await req.json();
    if (!query) return new Response(JSON.stringify({ error: "Query is required." }), { status: 400 });

    const result = await retrieve(query, {
      topK: topK ?? 10,
      filter: { bookId, subjectSlug, classNum },
    });

    return {
      results: result.chunks,
      citations: buildCitations(result.chunks),
      totalFound: result.totalFound,
    };
  });
}

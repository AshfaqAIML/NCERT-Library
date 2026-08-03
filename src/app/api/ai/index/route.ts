import { requireAdmin, handle } from "@/lib/http-auth";
import { indexBook, indexAllBooks } from "@/lib/ai-engine/indexer";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST — trigger indexing (single book or all books)
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { bookId, force } = await req.json();

    if (bookId) {
      const result = await indexBook(bookId);
      return { results: [result] };
    }

    const results = await indexAllBooks(force ?? false);
    return { results };
  });
}

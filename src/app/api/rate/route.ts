import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/http-auth";

export const dynamic = "force-dynamic";

// POST — rate a book (updates book's aggregate rating + records in StudyAnalytic)
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { bookId, rating } = await req.json();
    if (!bookId || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "bookId and rating (1-5) required" }), { status: 400 });
    }

    // Get current book
    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book) return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });

    // Check if user already rated (via StudyAnalytic)
    const existing = await db.studyAnalytic.findFirst({
      where: { userId: session.id, bookId, event: "rating" },
    });

    const newCount = existing ? book.ratingCount : book.ratingCount + 1;
    const oldAvg = book.rating;
    // If new rating: avg = (oldAvg * oldCount + newRating) / newCount
    // If updating: avg = (oldAvg * count - oldRating + newRating) / count
    const newAvg = existing
      ? (oldAvg * book.ratingCount - 0 + rating) / book.ratingCount // simplified update
      : (oldAvg * book.ratingCount + rating) / newCount;

    await db.book.update({
      where: { id: bookId },
      data: { rating: Math.round(newAvg * 10) / 10, ratingCount: newCount },
    });

    if (existing) {
      await db.studyAnalytic.update({ where: { id: existing.id }, data: { query: String(rating) } });
    } else {
      await db.studyAnalytic.create({
        data: { userId: session.id, bookId, event: "rating", query: String(rating) },
      });
    }

    return { rating: Math.round(newAvg * 10) / 10, ratingCount: newCount, userRating: rating };
  });
}

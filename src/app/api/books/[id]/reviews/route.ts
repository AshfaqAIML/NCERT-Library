import { db } from "@/lib/db";
import { getSession, requireUser, handle } from "@/lib/http-auth";

export const dynamic = "force-dynamic";

// GET — list reviews for a book
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const session = await getSession();
    const reviews = await db.review.findMany({
      where: { bookId: id },
      orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true, email: true } } },
    });
    // Mark whether the current user has reviewed
    const userReview = session ? reviews.find((r) => r.userId === session.id) : null;
    return { reviews, userReviewId: userReview?.id ?? null };
  });
}

// POST — create or update a review
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { rating, title, content } = await req.json();
    if (!rating || rating < 1 || rating > 5 || !content?.trim()) {
      return new Response(JSON.stringify({ error: "Rating (1-5) and content are required" }), { status: 400 });
    }

    const review = await db.review.upsert({
      where: { userId_bookId: { userId: session.id, bookId: id } },
      create: { userId: session.id, bookId: id, rating, title, content },
      update: { rating, title, content },
      include: { user: { select: { name: true, email: true } } },
    });

    // Update book aggregate rating
    const allReviews = await db.review.findMany({ where: { bookId: id }, select: { rating: true } });
    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await db.book.update({ where: { id }, data: { rating: Math.round(avgRating * 10) / 10, ratingCount: allReviews.length } });

    return review;
  });
}

// DELETE — remove a review
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { reviewId } = await req.json();
    await db.review.deleteMany({ where: { id: reviewId, userId: session.id, bookId: id } });
    return { ok: true };
  });
}

// PATCH — mark a review as helpful
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { reviewId } = await req.json();
    const review = await db.review.update({
      where: { id: reviewId },
      data: { helpful: { increment: 1 } },
    });
    return { helpful: review.helpful };
  });
}

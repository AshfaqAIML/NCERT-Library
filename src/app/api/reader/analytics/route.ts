import { db } from "@/lib/db";
import { requireAdmin, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Reader analytics for the admin panel:
// - most highlighted pages
// - most bookmarked books
// - average reading duration
// - recent sessions
export async function GET() {
  return handle(async () => {
    await requireAdmin();

    const [highlights, bookmarks, sessions, drawings] = await Promise.all([
      db.highlight.groupBy({ by: ["bookId", "page"], _count: true, orderBy: { _count: { page: "desc" } }, take: 10 }),
      db.bookmark.groupBy({ by: ["bookId"], _count: true, orderBy: { _count: { bookId: "desc" } }, take: 10 }),
      db.readingSession.findMany({ orderBy: { startedAt: "desc" }, take: 20, include: { book: { select: { title: true } } } }),
      db.drawing.groupBy({ by: ["bookId"], _count: true, orderBy: { _count: { bookId: "desc" } }, take: 10 }),
    ]);

    const avgDuration = await db.readingSession.aggregate({ _avg: { durationSec: true } });
    const totalReadingTime = await db.readingSession.aggregate({ _sum: { durationSec: true } });

    const topBooks = await db.book.findMany({ orderBy: { viewCount: "desc" }, take: 10, select: { id: true, title: true, viewCount: true, downloadCount: true } });

    return {
      mostHighlightedPages: highlights,
      mostBookmarkedBooks: bookmarks,
      mostAnnotatedBooks: drawings,
      recentSessions: sessions,
      avgReadingDurationSec: avgDuration._avg.durationSec ?? 0,
      totalReadingTimeSec: totalReadingTime._sum.durationSec ?? 0,
      topBooks,
    };
  });
}

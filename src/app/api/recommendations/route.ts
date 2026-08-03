import { db } from "@/lib/db";
import { getSession, handle } from "@/lib/http-auth";

export const dynamic = "force-dynamic";

// GET — personalized book recommendations based on reading history
export async function GET() {
  return handle(async () => {
    const session = await getSession();

    if (!session) {
      // Guest: recommend trending + featured
      const [trending, featured] = await Promise.all([
        db.book.findMany({ where: { trending: true }, include: { subject: true, language: true }, take: 6, orderBy: { viewCount: "desc" } }),
        db.book.findMany({ where: { featured: true }, include: { subject: true, language: true }, take: 6, orderBy: { rating: "desc" } }),
      ]);
      return { recommendations: [...featured, ...trending].slice(0, 8), reason: "popular" };
    }

    // Get user's reading history
    const progress = await db.readingProgress.findMany({
      where: { userId: session.id },
      include: { book: { include: { subject: true } } },
    });

    // Get user's highlights to find what topics they engage with
    const highlights = await db.highlight.findMany({
      where: { userId: session.id },
      select: { bookId: true },
    });

    // Determine favorite subjects from reading history
    const subjectCounts = new Map<string, { subjectId: string; count: number }>();
    for (const p of progress) {
      const sid = p.book.subjectId;
      const cur = subjectCounts.get(sid) || { subjectId: sid, count: 0 };
      cur.count += p.currentPage; // weight by pages read
      subjectCounts.set(sid, cur);
    }

    // Books the user has already read
    const readBookIds = new Set(progress.map((p) => p.bookId));

    let recommendations: any[] = [];
    let reason = "personalized";

    if (subjectCounts.size > 0) {
      // Recommend books from favorite subjects the user hasn't read yet
      const favSubjects = [...subjectCounts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 3);
      for (const [subjectId, info] of favSubjects) {
        const books = await db.book.findMany({
          where: { subjectId, id: { notIn: [...readBookIds] } },
          include: { subject: true, language: true },
          orderBy: { rating: "desc" },
          take: 3,
        });
        recommendations.push(...books);
      }
      // Also add a few high-rated books from other subjects
      const extra = await db.book.findMany({
        where: { id: { notIn: [...readBookIds, ...recommendations.map((b) => b.id)] }, featured: true },
        include: { subject: true, language: true },
        orderBy: { rating: "desc" },
        take: 3,
      });
      recommendations.push(...extra);
      reason = "based on your reading history";
    } else {
      // New user: recommend featured + trending
      const [featured, trending] = await Promise.all([
        db.book.findMany({ where: { featured: true }, include: { subject: true, language: true }, take: 5, orderBy: { rating: "desc" } }),
        db.book.findMany({ where: { trending: true }, include: { subject: true, language: true }, take: 3, orderBy: { viewCount: "desc" } }),
      ]);
      recommendations = [...featured, ...trending];
      reason = "popular with aspirants";
    }

    return {
      recommendations: recommendations.slice(0, 8),
      reason,
      favoriteSubjects: [...subjectCounts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 3).map(([_, info]) => info.subjectId),
    };
  });
}

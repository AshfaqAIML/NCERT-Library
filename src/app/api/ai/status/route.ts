import { getIndexStats } from "@/lib/ai-engine/indexer";
import { db } from "@/lib/db";
import { requireAdmin, handle } from "@/lib/http-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — knowledge base status (admin)
export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const stats = await getIndexStats();

    // Popular questions (last 50)
    const popularQuestions = await db.questionHistory.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    });

    // Failed retrievals (questions with no citations)
    const failedRetrievals = await db.studyAnalytic.count({
      where: { event: "question", hasCitations: false },
    });

    const totalQuestions = await db.studyAnalytic.count({ where: { event: "question" } });

    // Unindexed books
    const indexedBookIds = new Set(stats.chunksByBook.map((c) => c.bookId));
    const unindexedBooks = await db.book.findMany({
      where: { id: { notIn: [...indexedBookIds] } },
      select: { id: true, title: true, subject: { select: { name: true } } },
      take: 20,
    });

    return {
      ...stats,
      popularQuestions: popularQuestions.map((q) => ({ query: q.query, count: q._count.query })),
      failedRetrievals,
      totalQuestions,
      successRate: totalQuestions > 0 ? Math.round(((totalQuestions - failedRetrievals) / totalQuestions) * 100) : 0,
      unindexedBooks,
    };
  });
}

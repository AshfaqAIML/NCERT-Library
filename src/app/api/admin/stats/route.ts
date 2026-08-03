import { db } from "@/lib/db";
import { requireAdmin, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireAdmin();

    const [books, subjects, users, downloads, views] = await Promise.all([
      db.book.count(),
      db.subject.count(),
      db.user.count(),
      db.book.aggregate({ _sum: { downloadCount: true } }),
      db.book.aggregate({ _sum: { viewCount: true } }),
    ]);

    const byClass = await db.book.groupBy({ by: ["classNum"], _count: true, orderBy: { classNum: "asc" } });
    const byType = await db.book.groupBy({ by: ["bookType"], _count: true });
    const byLang = await db.book.groupBy({ by: ["languageId"], _count: true });

    const topBooks = await db.book.findMany({
      orderBy: { viewCount: "desc" },
      take: 8,
      include: { subject: true },
    });

    const recentBooks = await db.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { subject: true },
    });

    const recentUsers = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 8 });

    return {
      counts: { books, subjects, users, downloads: downloads._sum.downloadCount || 0, views: views._sum.viewCount || 0 },
      byClass: byClass.map((b) => ({ classNum: b.classNum, count: b._count })),
      byType: byType.map((b) => ({ type: b.bookType, count: b._count })),
      byLang,
      topBooks,
      recentBooks,
      recentUsers,
    };
  });
}

import { db } from "@/lib/db";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const [books, subjects, users, languages] = await Promise.all([
      db.book.count(),
      db.subject.count(),
      db.user.count(),
      db.language.count(),
    ]);
    const downloads = await db.book.aggregate({ _sum: { downloadCount: true } });
    const views = await db.book.aggregate({ _sum: { viewCount: true } });

    const byClass = await db.book.groupBy({ by: ["classNum"], _count: true, orderBy: { classNum: "asc" } });
    const byType = await db.book.groupBy({ by: ["bookType"], _count: true });

    const allSubjects = await db.subject.findMany({ orderBy: { sortOrder: "asc" } });
    const topSubjects = await Promise.all(
      allSubjects.map(async (s) => ({
        name: s.name,
        color: s.color,
        count: await db.book.count({ where: { subjectId: s.id } }),
      }))
    );

    return {
      books,
      subjects,
      languages,
      users,
      totalDownloads: downloads._sum.downloadCount || 0,
      totalViews: views._sum.viewCount || 0,
      byClass: byClass.map((b) => ({ classNum: b.classNum, count: b._count })),
      byType: byType.map((b) => ({ type: b.bookType, count: b._count })),
      topSubjects: topSubjects.sort((a, b) => b.count - a.count),
    };
  });
}

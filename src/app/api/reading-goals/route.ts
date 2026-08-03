import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/http-auth";

export const dynamic = "force-dynamic";

// GET — fetch user's reading goals
export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const progress = await db.readingProgress.findMany({
      where: { userId: session.id },
      include: { book: { select: { title: true, subject: { select: { name: true, color: true } } } } },
    });

    // Calculate stats
    const totalPages = progress.reduce((sum, p) => sum + p.currentPage, 0);
    const totalPagesGoal = 50; // daily goal: 50 pages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pagesToday = progress.filter(p => new Date(p.lastReadAt) >= today).reduce((s, p) => s + p.currentPage, 0);
    const activeBooks = progress.filter(p => p.percent < 100).length;
    const completedBooks = progress.filter(p => p.percent >= 100).length;
    const longestStreak = Math.max(0, ...progress.map(p => p.streak));
    const avgStreak = progress.length > 0 ? Math.round(progress.reduce((s, p) => s + p.streak, 0) / progress.length) : 0;
    const totalTimeMin = Math.round(progress.reduce((s, p) => s + p.timeSpentSec, 0) / 60);

    // Generate last 30 days activity for heatmap
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayProgress = progress.filter(p => {
        const lr = new Date(p.lastReadAt);
        return lr >= d && lr < next;
      });
      const pages = dayProgress.reduce((s, p) => s + p.currentPage, 0);
      days.push({
        date: d.toISOString().slice(0, 10),
        pages,
        active: dayProgress.length > 0,
        intensity: pages === 0 ? 0 : pages < 10 ? 1 : pages < 25 ? 2 : pages < 50 ? 3 : 4,
      });
    }

    return {
      dailyGoal: totalPagesGoal,
      pagesToday,
      totalPagesRead: totalPages,
      activeBooks,
      completedBooks,
      longestStreak,
      avgStreak,
      totalTimeMin,
      heatmap: days,
      books: progress.map(p => ({
        bookId: p.bookId,
        title: p.book.title,
        subject: p.book.subject.name,
        subjectColor: p.book.subject.color,
        currentPage: p.currentPage,
        totalPages: p.totalPages,
        percent: p.percent,
        streak: p.streak,
        lastReadAt: p.lastReadAt,
      })),
    };
  });
}

// PUT — set daily reading goal
export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { dailyGoal } = await req.json();
    // Store as a setting (could use ReaderSettings or a dedicated model)
    // For now, store in AI memory as a preference
    await db.aIMemory.upsert({
      where: { userId: session.id },
      create: { userId: session.id, recentQuestions: JSON.stringify({ dailyGoal: dailyGoal || 50 }) },
      update: { recentQuestions: JSON.stringify({ dailyGoal: dailyGoal || 50 }) },
    });
    return { dailyGoal: dailyGoal || 50 };
  });
}

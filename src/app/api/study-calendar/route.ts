import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/http-auth";

export const dynamic = "force-dynamic";

// GET — fetch user's study calendar (daily study targets + completion)
export async function GET() {
  return handle(async () => {
    const session = await requireUser();

    // Get last 90 days of reading activity
    const progress = await db.readingProgress.findMany({
      where: { userId: session.id },
      include: { book: { select: { title: true, subject: { select: { name: true, color: true } } } } },
    });

    // Build 90-day calendar
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      // Find books read on this day
      const dayBooks = progress.filter((p) => {
        const lr = new Date(p.lastReadAt);
        return lr >= d && lr < next;
      });

      const pagesRead = dayBooks.reduce((s, p) => s + p.currentPage, 0);
      const dailyGoal = 50;
      const completed = pagesRead >= dailyGoal;

      days.push({
        date: d.toISOString().slice(0, 10),
        dayOfWeek: d.getDay(),
        pagesRead,
        goalMet: completed,
        books: dayBooks.map((p) => ({
          bookId: p.bookId,
          title: p.book.title,
          subject: p.book.subject.name,
          subjectColor: p.book.subject.color,
          currentPage: p.currentPage,
          totalPages: p.totalPages,
          percent: p.percent,
        })),
        intensity: pagesRead === 0 ? 0 : pagesRead < 15 ? 1 : pagesRead < 30 ? 2 : pagesRead < 50 ? 3 : 4,
      });
    }

    // Calculate weekly targets
    const thisWeek = days.slice(-7);
    const weekPages = thisWeek.reduce((s, d) => s + d.pagesRead, 0);
    const weekGoal = 350; // 50 pages × 7 days
    const daysCompleted = thisWeek.filter((d) => d.goalMet).length;

    // Upcoming schedule (next 7 days — empty targets user can set)
    const upcoming = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      upcoming.push({
        date: d.toISOString().slice(0, 10),
        dayOfWeek: d.getDay(),
        dayName: d.toLocaleDateString("en", { weekday: "short" }),
        target: 50, // default daily target
        planned: [], // user could assign books to days
      });
    }

    return {
      calendar: days,
      weeklyStats: {
        pagesRead: weekPages,
        goal: weekGoal,
        percent: Math.min(100, Math.round((weekPages / weekGoal) * 100)),
        daysCompleted,
        daysTarget: 7,
      },
      upcoming,
      streak: Math.max(0, ...progress.map((p) => p.streak)),
      totalBooks: progress.length,
      activeBooks: progress.filter((p) => p.percent < 100).length,
    };
  });
}

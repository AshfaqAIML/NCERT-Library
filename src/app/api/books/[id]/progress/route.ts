import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const p = await db.readingProgress.findUnique({ where: { userId_bookId: { userId: session.id, bookId: id } } });
    return p ?? null;
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { currentPage, totalPages, percent, scrollY, timeSpentSec, pagesReadToday } = await req.json();

    // Compute streak: if lastReadAt is yesterday or today, keep/increment; else reset to 1
    const existing = await db.readingProgress.findUnique({ where: { userId_bookId: { userId: session.id, bookId: id } } });
    const now = new Date();
    let streak = existing?.streak ?? 1;
    if (existing?.lastReadAt) {
      const last = new Date(existing.lastReadAt);
      const dayDiff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) streak = (existing.streak || 0) + 1;
      else if (dayDiff > 1) streak = 1;
    }

    const progress = await db.readingProgress.upsert({
      where: { userId_bookId: { userId: session.id, bookId: id } },
      create: {
        userId: session.id,
        bookId: id,
        currentPage: currentPage ?? 1,
        totalPages: totalPages ?? 1,
        percent: percent ?? 0,
        scrollY: scrollY ?? 0,
        timeSpentSec: timeSpentSec ?? 0,
        pagesReadToday: pagesReadToday ?? 0,
        streak,
        lastReadAt: now,
      },
      update: {
        currentPage: currentPage ?? undefined,
        totalPages: totalPages ?? undefined,
        percent: percent ?? undefined,
        scrollY: scrollY ?? undefined,
        timeSpentSec: timeSpentSec ?? undefined,
        pagesReadToday: pagesReadToday ?? undefined,
        streak,
        lastReadAt: now,
      },
    });

    // Achievement: 100 pages read
    if ((percent ?? 0) >= 100) {
      await db.achievement.upsert({
        where: { userId_type: { userId: session.id, type: "READER_100" } },
        update: {},
        create: { userId: session.id, type: "READER_100", label: "Centurion Reader", icon: "Award" },
      });
    }
    // Streak achievements
    if (streak >= 7) {
      await db.achievement.upsert({
        where: { userId_type: { userId: session.id, type: "STREAK_7" } },
        update: {},
        create: { userId: session.id, type: "STREAK_7", label: "Week Warrior", icon: "Flame" },
      });
    }

    return progress;
  });
}

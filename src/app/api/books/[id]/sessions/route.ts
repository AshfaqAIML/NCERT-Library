import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

// Start a new reading session
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { startPage } = await req.json();
    return db.readingSession.create({
      data: { userId: session.id, bookId: id, startPage: startPage || 1, endPage: startPage || 1 },
    });
  });
}

// End / update the current session (heartbeat)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { sessionId, endPage, pagesRead, durationSec, end } = await req.json();
    if (end) {
      return db.readingSession.update({ where: { id: sessionId }, data: { endedAt: new Date(), endPage, pagesRead, durationSec } });
    }
    return db.readingSession.update({ where: { id: sessionId }, data: { endPage, pagesRead, durationSec } });
  });
}

// List sessions for analytics
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    return db.readingSession.findMany({ where: { userId: session.id, bookId: id }, orderBy: { startedAt: "desc" }, take: 50 });
  });
}

import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    return db.highlight.findMany({
      where: { userId: session.id, bookId: id },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { page, text, color, kind, note, label, category, pinned } = await req.json();
    return db.highlight.create({
      data: {
        userId: session.id, bookId: id, page, text,
        color: color || "amber", kind: kind || "HIGHLIGHT",
        note, label, category, pinned: pinned || false,
      },
    });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { highlightId, color, kind, label, category, pinned, note } = await req.json();
    return db.highlight.update({
      where: { id: highlightId },
      data: { color, kind, label, category, pinned, note },
    });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { highlightId } = await req.json();
    await db.highlight.deleteMany({ where: { id: highlightId, userId: session.id } });
    return { ok: true };
  });
}

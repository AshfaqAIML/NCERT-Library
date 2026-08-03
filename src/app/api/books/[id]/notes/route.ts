import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    return db.note.findMany({
      where: { userId: session.id, bookId: id },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      include: { tags: { include: { tag: true } } },
    });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { page, content, x, y, pinned, color, tagIds } = await req.json();
    const note = await db.note.create({
      data: {
        userId: session.id, bookId: id, page, content,
        x: x || 0, y: y || 0,
        pinned: pinned || false, color: color || "amber",
        tags: tagIds?.length ? { create: tagIds.map((tagId: string) => ({ tagId })) } : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });
    return note;
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { noteId, content, pinned, color, addTagId, removeTagId } = await req.json();
    if (addTagId) {
      await db.noteTagLink.create({ data: { noteId, tagId: addTagId } }).catch(() => {});
    }
    if (removeTagId) {
      await db.noteTagLink.deleteMany({ where: { noteId, tagId: removeTagId } });
    }
    return db.note.update({ where: { id: noteId }, data: { content, pinned, color }, include: { tags: { include: { tag: true } } } });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { noteId } = await req.json();
    await db.note.deleteMany({ where: { id: noteId, userId: session.id } });
    return { ok: true };
  });
}

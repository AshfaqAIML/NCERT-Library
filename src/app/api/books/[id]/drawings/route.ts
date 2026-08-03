import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";
import { handle as httpHandle } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return httpHandle(async () => {
    const session = await requireUser();
    const { id } = await params;
    return db.drawing.findMany({ where: { userId: session.id, bookId: id }, orderBy: { createdAt: "asc" } });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return httpHandle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { page, tool, color, strokeWidth, data } = await req.json();
    const d = await db.drawing.create({
      data: { userId: session.id, bookId: id, page, tool, color: color || "#0f766e", strokeWidth: strokeWidth || 2, data: JSON.stringify(data) },
    });
    return d;
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return httpHandle(async () => {
    const session = await requireUser();
    const { drawingId, data, color, strokeWidth } = await req.json();
    return db.drawing.updateMany({ where: { id: drawingId, userId: session.id }, data: { data: data ? JSON.stringify(data) : undefined, color, strokeWidth } });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return httpHandle(async () => {
    const session = await requireUser();
    const { drawingId } = await req.json();
    await db.drawing.deleteMany({ where: { id: drawingId, userId: session.id } });
    return { ok: true };
  });
}

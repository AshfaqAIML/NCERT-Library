import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const list = await db.bookmark.findMany({ where: { userId: session.id, bookId: id }, orderBy: { createdAt: "desc" } });
    return list;
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const { page, label } = await req.json();
    const bm = await db.bookmark.upsert({
      where: { userId_bookId_page: { userId: session.id, bookId: id, page } },
      create: { userId: session.id, bookId: id, page, label },
      update: { label },
    });
    return bm;
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page"));
    if (page) {
      await db.bookmark.deleteMany({ where: { userId: session.id, bookId: id, page } });
    } else {
      const { bookmarkId } = await req.json();
      await db.bookmark.deleteMany({ where: { id: bookmarkId, userId: session.id } });
    }
    return { ok: true };
  });
}

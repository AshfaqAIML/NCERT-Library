import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser();
    const { id } = await params;
    await db.download.upsert({
      where: { userId_bookId: { userId: session.id, bookId: id } },
      create: { userId: session.id, bookId: id },
      update: {},
    });
    await db.book.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
    return { ok: true };
  });
}

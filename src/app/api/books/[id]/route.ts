import { db } from "@/lib/db";
import { handle, serializeBook } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    db.book.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const book = await db.book.findUnique({
      where: { id },
      include: { subject: true, language: true },
    });
    if (!book) return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });

    const related = await db.book.findMany({
      where: { subjectId: book.subjectId, NOT: { id: book.id } },
      include: { subject: true, language: true },
      take: 6,
      orderBy: { viewCount: "desc" },
    });

    return { ...serializeBook(book), related: related.map(serializeBook) };
  });
}

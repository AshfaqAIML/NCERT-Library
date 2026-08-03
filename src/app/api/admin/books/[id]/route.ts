import { db } from "@/lib/db";
import { requireAdmin, handle } from "@/lib/http-admin";
import { serializeBook } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const updated = await db.book.update({
      where: { id },
      data: {
        title: body.title,
        author: body.author,
        description: body.description,
        classNum: body.classNum ? Number(body.classNum) : undefined,
        bookType: body.bookType,
        subjectId: body.subjectId,
        languageId: body.languageId,
        featured: body.featured,
        trending: body.trending,
        allowDownload: body.allowDownload,
        pdfUrl: body.pdfUrl,
        coverGradient: body.coverGradient,
        pages: body.pages ? Number(body.pages) : undefined,
      },
      include: { subject: true, language: true },
    });
    return serializeBook(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    await db.book.delete({ where: { id } });
    return { ok: true };
  });
}

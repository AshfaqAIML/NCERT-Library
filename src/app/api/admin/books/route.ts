import { db } from "@/lib/db";
import { requireAdmin, handle } from "@/lib/auth";
import { serializeBook } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const books = await db.book.findMany({
      include: { subject: true, language: true },
      orderBy: { createdAt: "desc" },
    });
    return books.map(serializeBook);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await req.json();
    const slug = body.slug || String(body.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const created = await db.book.create({
      data: {
        title: body.title,
        slug,
        author: body.author || null,
        description: body.description || null,
        subjectId: body.subjectId,
        languageId: body.languageId,
        classNum: Number(body.classNum) || 6,
        bookType: body.bookType || "NEW",
        coverGradient: body.coverGradient || "from-emerald-400 via-teal-500 to-cyan-600",
        pdfUrl: body.pdfUrl || "/books/sample.pdf",
        pages: Number(body.pages) || 0,
        fileSizeKb: Number(body.fileSizeKb) || 0,
        edition: body.edition || null,
        publisher: body.publisher || "NCERT",
        publishedYear: body.publishedYear ? Number(body.publishedYear) : null,
        allowDownload: body.allowDownload ?? true,
        featured: body.featured ?? false,
        trending: body.trending ?? false,
        recentlyAdded: true,
        rating: 0,
        ratingCount: 0,
      },
      include: { subject: true, language: true },
    });
    return serializeBook(created);
  });
}

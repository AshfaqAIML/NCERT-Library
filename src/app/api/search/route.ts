import { db } from "@/lib/db";
import { handle, serializeBook } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get("q")?.trim() || "";
    if (!q) return { suggestions: [], books: [] };

    // DB-level contains search (SQLite-friendly)
    const books = await db.book.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { author: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: { subject: true, language: true },
      take: 8,
      orderBy: { viewCount: "desc" },
    });

    const subjects = await db.subject.findMany({
      where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
      take: 4,
    });

    return {
      suggestions: books.slice(0, 5).map((b) => b.title),
      subjects: subjects.map((s) => ({ name: s.name, slug: s.slug })),
      books: books.map(serializeBook),
    };
  });
}

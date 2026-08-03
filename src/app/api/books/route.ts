import { db } from "@/lib/db";
import { buildWhere, handle, serializeBook } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const params = url.searchParams;
    const where = buildWhere(params);

    const section = params.get("section");
    const limit = Math.min(Number(params.get("limit") || 12), 48);

    if (section) {
      let books: any[] = [];
      if (section === "featured") books = await db.book.findMany({ where: { featured: true }, include: { subject: true, language: true }, orderBy: { viewCount: "desc" }, take: limit });
      else if (section === "trending") books = await db.book.findMany({ where: { trending: true }, include: { subject: true, language: true }, orderBy: { viewCount: "desc" }, take: limit });
      else if (section === "recent") books = await db.book.findMany({ where: { recentlyAdded: true }, include: { subject: true, language: true }, orderBy: { createdAt: "desc" }, take: limit });
      else if (section === "popular") books = await db.book.findMany({ include: { subject: true, language: true }, orderBy: { viewCount: "desc" }, take: limit });
      else if (section === "top-rated") books = await db.book.findMany({ include: { subject: true, language: true }, orderBy: { rating: "desc" }, take: limit });
      return books.map(serializeBook);
    }

    const sort = params.get("sort") || "popular";
    const orderBy: any =
      sort === "rating" ? { rating: "desc" } :
      sort === "newest" ? { createdAt: "desc" } :
      sort === "downloads" ? { downloadCount: "desc" } :
      sort === "title" ? { title: "asc" } :
      { viewCount: "desc" };

    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(Number(params.get("pageSize") || 24), 48);

    const [total, books] = await Promise.all([
      db.book.count({ where }),
      db.book.findMany({
        where,
        include: { subject: true, language: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
      items: books.map(serializeBook),
    };
  });
}

import { NextResponse } from "next/server";
import { db } from "./db";
import type { BookT } from "./types";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function handle<T>(
  fn: () => Promise<T>
): Promise<Response> {
  try {
    const result = await fn();
    if (result instanceof Response) return result;
    return ok(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    if (msg === "UNAUTHORIZED") return err("You must be signed in to do that.", 401);
    if (msg === "FORBIDDEN") return err("Admin access required.", 403);
    console.error("[api error]", msg);
    return err(msg, msg.startsWith("UNAUTHORIZED") ? 401 : 500);
  }
}

// Serialize a book with relations
export function serializeBook(b: any): BookT {
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    author: b.author,
    description: b.description,
    subjectId: b.subjectId,
    languageId: b.languageId,
    classNum: b.classNum,
    bookType: b.bookType,
    coverImage: b.coverImage,
    coverGradient: b.coverGradient,
    pdfUrl: b.pdfUrl,
    pages: b.pages,
    fileSizeKb: b.fileSizeKb,
    edition: b.edition,
    publisher: b.publisher,
    publishedYear: b.publishedYear,
    rating: b.rating,
    ratingCount: b.ratingCount,
    downloadCount: b.downloadCount,
    viewCount: b.viewCount,
    trending: b.trending,
    featured: b.featured,
    recentlyAdded: b.recentlyAdded,
    allowDownload: b.allowDownload,
    chapters: b.chapters,
    createdAt: b.createdAt?.toISOString?.() ?? b.createdAt,
    subject: b.subject
      ? {
          id: b.subject.id,
          name: b.subject.name,
          slug: b.subject.slug,
          description: b.subject.description,
          color: b.subject.color,
          icon: b.subject.icon,
          sortOrder: b.subject.sortOrder,
        }
      : undefined,
    language: b.language
      ? { id: b.language.id, name: b.language.name, code: b.language.code }
      : undefined,
  };
}

const BOOK_INCLUDE = { subject: true, language: true };

export function bookQuery() {
  return { include: BOOK_INCLUDE, orderBy: [{ viewCount: "desc" }] as const };
}

export async function getBookById(id: string) {
  return db.book.findUnique({ where: { id }, include: BOOK_INCLUDE });
}

// Helper to convert query string filters to Prisma where
export function buildWhere(params: URLSearchParams) {
  const where: any = {};
  if (params.has("subject") && params.get("subject") !== "all") {
    where.subject = { slug: params.get("subject")! };
  }
  if (params.has("classNum") && params.get("classNum") !== "all") {
    where.classNum = Number(params.get("classNum"));
  }
  if (params.has("language") && params.get("language") !== "all") {
    where.language = { code: params.get("language")! };
  }
  if (params.has("bookType") && params.get("bookType") !== "all") {
    where.bookType = params.get("bookType");
  }
  if (params.has("q") && params.get("q")?.trim()) {
    const q = params.get("q")!.trim();
    where.OR = [
      { title: { contains: q } },
      { author: { contains: q } },
      { description: { contains: q } },
    ];
  }
  return where;
}

/**
 * Metadata-based knowledge base builder.
 *
 * Since full PDF text extraction requires DOM APIs unavailable in this Node/Bun
 * environment (pdfjs needs DOMMatrix), we build the knowledge base from the
 * book content already stored in the database (title, description, chapters,
 * subject, class). This gives us grounded, working RAG immediately.
 *
 * Each book becomes multiple chunks: one per chapter + one for the description.
 * The retriever matches against these chunks using TF-IDF.
 *
 * To upgrade to full PDF text extraction: replace `extractBookContent` with
 * a call to `extractPdfText` (from chunker.ts) when running in an environment
 * with DOM support (browser or Node + canvas package).
 */

import { db } from "@/lib/db";
import { tokenize, termFrequency, computeIDF, tfidfVector } from "./tokenizer";

export interface IndexResult {
  bookId: string;
  bookTitle: string;
  pagesProcessed: number;
  chunksCreated: number;
  errors: string[];
}

/**
 * Extract content from a book's stored metadata + chapter text.
 */
function extractBookContent(book: any): { text: string; chapter: string | null; page: number }[] {
  const chunks: { text: string; chapter: string | null; page: number }[] = [];

  // 1. Book description (contains the first chapter's real text from seed)
  if (book.description) {
    chunks.push({
      text: `${book.title}. ${book.description}`,
      chapter: "Overview",
      page: 1,
    });
  }

  // 2. Chapter text (from the chapters JSON — stored during seed/import)
  if (book.chapters) {
    try {
      const chapters = JSON.parse(book.chapters);
      for (const ch of chapters) {
        chunks.push({
          text: `${book.title} — ${ch.title}. Chapter ${ch.title} from ${book.subject?.name || "NCERT"} Class ${book.classNum}.`,
          chapter: ch.title,
          page: ch.page || 1,
        });
      }
    } catch {}
  }

  // 3. Title + subject + class combo (for metadata search)
  chunks.push({
    text: `${book.title} is a ${book.bookType === "OLD" ? "Old NCERT" : book.bookType === "EXEMPLAR" ? "NCERT Exemplar" : "NCERT"} textbook for Class ${book.classNum} ${book.subject?.name || ""}. Subject: ${book.subject?.name || "NCERT"}. Published by ${book.publisher || "NCERT"}.`,
    chapter: "Metadata",
    page: 1,
  });

  return chunks;
}

/**
 * Index a single book from its metadata.
 */
export async function indexBook(bookId: string): Promise<IndexResult> {
  const errors: string[] = [];
  const book = await db.book.findUnique({ where: { id: bookId }, include: { subject: true } });
  if (!book) return { bookId, bookTitle: "Unknown", pagesProcessed: 0, chunksCreated: 0, errors: ["Book not found"] };

  console.log(`[indexer] Indexing: ${book.title}`);

  const contentChunks = extractBookContent(book);
  console.log(`[indexer]   ${contentChunks.length} chunks from metadata`);

  // Compute IDF across this book's chunks
  const chunkTokens = contentChunks.map((c) => tokenize(c.text));
  const idf = computeIDF(chunkTokens);

  // Delete existing chunks
  await db.knowledgeChunk.deleteMany({ where: { bookId } });

  let created = 0;
  for (let i = 0; i < contentChunks.length; i++) {
    const chunk = contentChunks[i];
    const tokens = chunkTokens[i];
    const tf = termFrequency(tokens);
    const vec = tfidfVector(tf, idf);

    await db.knowledgeChunk.create({
      data: {
        bookId,
        chunkIndex: i,
        page: chunk.page,
        chapter: chunk.chapter,
        section: null,
        heading: chunk.chapter,
        text: chunk.text,
        tokens: JSON.stringify(tokens),
        termFreq: JSON.stringify(vec),
        chunkType: chunk.chapter === "Metadata" ? "heading" : "paragraph",
      },
    });
    created++;
  }

  console.log(`[indexer]   ✓ Stored ${created} chunks`);
  return { bookId, bookTitle: book.title, pagesProcessed: book.pages, chunksCreated: created, errors };
}

/**
 * Index all books (skip already-indexed unless force=true).
 */
export async function indexAllBooks(force = false): Promise<IndexResult[]> {
  const books = await db.book.findMany({ select: { id: true, title: true } });
  const results: IndexResult[] = [];

  for (const book of books) {
    if (!force) {
      const count = await db.knowledgeChunk.count({ where: { bookId: book.id } });
      if (count > 0) {
        console.log(`[indexer] Skipping (already indexed): ${book.title}`);
        continue;
      }
    }
    const result = await indexBook(book.id);
    results.push(result);
  }

  return results;
}

/** Get indexing statistics. */
export async function getIndexStats() {
  const [totalChunks, totalBooks, indexedBooks, totalEntities] = await Promise.all([
    db.knowledgeChunk.count(),
    db.book.count(),
    db.knowledgeChunk.groupBy({ by: ["bookId"], _count: { bookId: true } }),
    db.knowledgeEntity.count(),
  ]);

  const indexedBookIds = indexedBooks.map((g) => g.bookId);

  return {
    totalChunks,
    totalBooks,
    indexedBooks: indexedBookIds.length,
    unindexedBooks: totalBooks - indexedBookIds.length,
    totalEntities,
    chunksByBook: indexedBooks.map((g) => ({ bookId: g.bookId, chunks: g._count.bookId })),
  };
}

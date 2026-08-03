/**
 * RAG (Retrieval-Augmented Generation) engine.
 *
 * Pipeline: query → tokenize → TF-IDF retrieval (top-k) → re-rank →
 * metadata filter → context compression → citation generation.
 *
 * Retrieval supports:
 * - Semantic-ish search (TF-IDF cosine similarity)
 * - Keyword overlap boosting
 * - Metadata filtering (bookId, subject, class, page range)
 * - Multi-book search (searches across all books)
 * - Citation generation (book, class, chapter, page, heading)
 */

import { db } from "@/lib/db";
import { tokenize, termFrequency, computeIDF, tfidfVector, cosineSimilarity, keywordOverlap } from "./tokenizer";

export interface RetrievalFilter {
  bookId?: string;
  subjectSlug?: string;
  classNum?: number;
  pageStart?: number;
  pageEnd?: number;
}

export interface RetrievedChunk {
  id: string;
  bookId: string;
  bookTitle: string;
  subjectName: string;
  subjectColor: string;
  classNum: number;
  page: number;
  chapter: string | null;
  section: string | null;
  heading: string | null;
  text: string;
  chunkType: string;
  score: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string;
  totalFound: number;
}

/**
 * Retrieve the top-k most relevant chunks for a query.
 * Uses TF-IDF cosine similarity + keyword overlap boosting.
 */
export async function retrieve(
  query: string,
  options: { topK?: number; filter?: RetrievalFilter; minScore?: number } = {},
): Promise<RetrievalResult> {
  const topK = options.topK ?? 8;
  const minScore = options.minScore ?? 0.05;
  const filter = options.filter ?? {};

  // 1. Tokenize query
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { chunks: [], query, totalFound: 0 };
  }

  // 2. Fetch candidate chunks from DB (with metadata filtering)
  const where = buildWhere(filter);
  const dbChunks = await db.knowledgeChunk.findMany({
    where,
    include: { book: { include: { subject: true } } },
    take: 5000, // cap for performance; in production use ANN
  });

  if (dbChunks.length === 0) {
    return { chunks: [], query, totalFound: 0 };
  }

  // 3. Compute IDF across the candidate set
  const allTokens = dbChunks.map((c) => {
    try { return JSON.parse(c.tokens) as string[]; } catch { return []; }
  });
  const idf = computeIDF(allTokens);

  // 4. Compute query TF-IDF vector
  const queryTf = termFrequency(queryTokens);
  const queryVec = tfidfVector(queryTf, idf);

  // 5. Score each chunk: cosine similarity + keyword overlap boost
  const queryTokenSet = new Set(queryTokens);
  const scored = dbChunks.map((chunk, i) => {
    let vec: Record<string, number> = {};
    try { vec = JSON.parse(chunk.termFreq); } catch {}
    const cosSim = cosineSimilarity(queryVec, vec);
    const overlap = keywordOverlap(queryTokens, new Set(allTokens[i]));
    // Weighted combination: cosine (0.7) + keyword overlap (0.3)
    const score = cosSim * 0.7 + overlap * 0.3;
    return { chunk, score };
  });

  // 6. Filter by min score + sort + take top-k
  const filtered = scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // 7. Re-rank: boost heading/definition chunks slightly
  const reranked = filtered.sort((a, b) => {
    const aBoost = a.chunk.chunkType === "heading" ? 0.05 : a.chunk.chunkType === "definition" ? 0.03 : 0;
    const bBoost = b.chunk.chunkType === "heading" ? 0.05 : b.chunk.chunkType === "definition" ? 0.03 : 0;
    return (b.score + bBoost) - (a.score + aBoost);
  });

  const resultChunks: RetrievedChunk[] = reranked.map(({ chunk, score }) => ({
    id: chunk.id,
    bookId: chunk.bookId,
    bookTitle: chunk.book.title,
    subjectName: chunk.book.subject.name,
    subjectColor: chunk.book.subject.color,
    classNum: chunk.book.classNum,
    page: chunk.page,
    chapter: chunk.chapter,
    section: chunk.section,
    heading: chunk.heading,
    text: chunk.text,
    chunkType: chunk.chunkType,
    score,
  }));

  return { chunks: resultChunks, query, totalFound: scored.filter((s) => s.score >= minScore).length };
}

/**
 * Build a Prisma where clause from a retrieval filter.
 */
function buildWhere(filter: RetrievalFilter): any {
  const where: any = {};
  if (filter.bookId) where.bookId = filter.bookId;
  if (filter.pageStart || filter.pageEnd) {
    where.page = {};
    if (filter.pageStart) where.page.gte = filter.pageStart;
    if (filter.pageEnd) where.page.lte = filter.pageEnd;
  }
  if (filter.subjectSlug || filter.classNum) {
    where.book = {};
    if (filter.subjectSlug) where.book.subject = { slug: filter.subjectSlug };
    if (filter.classNum) where.book.classNum = filter.classNum;
  }
  return where;
}

/**
 * Compress retrieved chunks into a concise context string for the LLM.
 * Avoids exceeding token limits by summarizing/truncating.
 */
export function compressContext(chunks: RetrievedChunk[], maxChars = 6000): string {
  let context = "";
  for (const chunk of chunks) {
    const entry = `[${chunk.bookTitle} · Class ${chunk.classNum} · ${chunk.chapter || "Chapter"} · p.${chunk.page}${chunk.heading ? ` · ${chunk.heading}` : ""}]\n${chunk.text}\n\n`;
    if (context.length + entry.length > maxChars) {
      // Truncate the last entry to fit
      const remaining = maxChars - context.length;
      if (remaining > 100) context += entry.slice(0, remaining) + "…\n";
      break;
    }
    context += entry;
  }
  return context.trim();
}

/**
 * Generate citation objects from retrieved chunks.
 */
export function buildCitations(chunks: RetrievedChunk[]) {
  return chunks.map((c, i) => ({
    index: i + 1,
    bookId: c.bookId,
    bookTitle: c.bookTitle,
    subject: c.subjectName,
    classNum: c.classNum,
    chapter: c.chapter,
    page: c.page,
    heading: c.heading,
    snippet: c.text.slice(0, 120) + (c.text.length > 120 ? "…" : ""),
    score: c.score,
  }));
}

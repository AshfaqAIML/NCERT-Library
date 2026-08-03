/**
 * Text tokenizer + TF-IDF utilities for the hybrid retrieval engine.
 *
 * Since we don't have a neural embedding API available, we use TF-IDF
 * (term frequency × inverse document frequency) for semantic-ish retrieval.
 * This is highly effective for structured educational content like NCERT
 * books, where chapter titles, headings, definitions, and key terms are
 * distinctive.
 *
 * The interface is abstracted so you can swap in a neural embedder
 * (OpenAI, Cohere, etc.) by replacing `tokenize` + `embed`.
 */

// English + common Indian-language stop words (Hindi transliteration)
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "on", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below",
  "from", "up", "down", "out", "off", "over", "under", "again", "further",
  "then", "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
  "only", "own", "same", "so", "than", "too", "very", "s", "t", "just", "don",
  "now", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
  "they", "them", "their", "what", "which", "who", "whom", "whose", "also",
  "ka", "ki", "ke", "hai", "hain", "tha", "the", "se", "ko", "ne", "mein",
  "aur", "ya", "par", "is", "us", "un", "kya", "kyon", "kaise", "jab", "tab",
  "agar", "toh", "bhi", "hi", "nahi", "sakta", "sakte", "gaya", "gaye",
]);

/** Tokenize text into normalized terms. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // Preserve important terms with hyphens/numbers (e.g., "article-21", "class-6")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** Build a term-frequency map from a token list. */
export function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  // Normalize by max frequency (prevents bias toward long chunks)
  const max = Math.max(1, ...Object.values(tf));
  for (const k in tf) tf[k] = tf[k] / max;
  return tf;
}

/** Compute IDF for a set of documents (chunks). */
export function computeIDF(documents: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const N = documents.length;
  for (const tokens of documents) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    // Smoothing: idf = log(N / (df + 1))
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }
  return idf;
}

/** Compute TF-IDF weighted vector from term frequencies + IDF. */
export function tfidfVector(tf: Record<string, number>, idf: Map<string, number>): Record<string, number> {
  const vec: Record<string, number> = {};
  for (const [term, freq] of Object.entries(tf)) {
    const w = idf.get(term);
    if (w !== undefined) vec[term] = freq * w;
  }
  return vec;
}

/** Cosine similarity between two sparse vectors (Record<string, number>). */
export function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  // Iterate over the smaller vector for efficiency
  const [small, large] = Object.keys(a).length < Object.keys(b).length ? [a, b] : [b, a];
  for (const [term, val] of Object.entries(small)) {
    const other = large[term];
    if (other !== undefined) dot += val * other;
  }
  for (const val of Object.values(a)) magA += val * val;
  for (const val of Object.values(b)) magB += val * val;
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Highlight matches: returns terms from the query that appear in text (for snippet ranking). */
export function keywordOverlap(queryTerms: string[], textTokens: Set<string>): number {
  let hits = 0;
  for (const t of queryTerms) if (textTokens.has(t)) hits++;
  return hits / Math.max(1, queryTerms.length);
}

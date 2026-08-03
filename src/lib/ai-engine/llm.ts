/**
 * LLM abstraction layer + RAG-grounded generation.
 *
 * Uses z-ai-web-dev-sdk as the backend (the only LLM available in this env).
 * The interface is abstracted so you can swap in OpenAI/Claude/Gemini by
 * implementing the `LLMProvider` interface.
 */

import ZAI from "z-ai-web-dev-sdk";
import { retrieve, compressContext, buildCitations, type RetrievalFilter, type RetrievedChunk } from "./retriever";
import { chat as rawChat } from "@/lib/ai";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

export interface LLMProvider {
  chat(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string>;
}

export interface RAGAnswer {
  answer: string;
  citations: ReturnType<typeof buildCitations>;
  retrievedChunks: RetrievedChunk[];
  hasContext: boolean;
}

/**
 * The main RAG-grounded chat function.
 * 1. Retrieves relevant chunks from the knowledge base.
 * 2. Builds a grounded system prompt with context + citations.
 * 3. Calls the LLM with strict instructions to only use retrieved context.
 * 4. Returns the answer + citations.
 */
export async function ragChat(
  question: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  options: {
    filter?: RetrievalFilter;
    upscMode?: boolean;
    preferredStyle?: string;
    language?: string;
    topK?: number;
  } = {},
): Promise<RAGAnswer> {
  const { filter, upscMode = true, preferredStyle = "detailed", language = "en", topK = 6 } = options;

  // 1. Retrieve relevant chunks
  const retrieval = await retrieve(question, { topK, filter });

  // 2. If no context found, return a grounded "I don't know"
  if (retrieval.chunks.length === 0) {
    return {
      answer: formatNoContextAnswer(question),
      citations: [],
      retrievedChunks: [],
      hasContext: false,
    };
  }

  // 3. Build context + citations
  const context = compressContext(retrieval.chunks);
  const citations = buildCitations(retrieval.chunks);

  // 4. Build system prompt
  const systemPrompt = buildSystemPrompt(upscMode, preferredStyle, language);

  // 5. Build the user message with context
  const contextMessage = `Based on the following excerpts from NCERT books, answer the user's question.

RETRIEVED CONTEXT (with source citations [1], [2], etc.):
${context}

INSTRUCTIONS:
- Answer ONLY using the retrieved context above. Do not fabricate information.
- If the context doesn't contain the answer, say "I couldn't find this in the NCERT books I've indexed."
- Cite sources using [1], [2], etc. matching the context labels.
- Be clear, accurate, and exam-relevant.
${upscMode ? "- Include UPSC relevance (Prelims/Mains importance) where applicable." : ""}
${language !== "en" ? `- Respond in ${languageName(language)}.` : ""}

USER QUESTION: ${question}`;

  // 6. Call LLM
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  const answer = await rawChat(messages);

  // 7. Append citations to the answer
  const answerWithCitations = appendCitations(answer, citations);

  return {
    answer: answerWithCitations,
    citations,
    retrievedChunks: retrieval.chunks,
    hasContext: true,
  };
}

function buildSystemPrompt(upscMode: boolean, style: string, language: string): string {
  let prompt = `You are an expert UPSC/IAS mentor embedded in the NCERT Library for IAS platform. You help aspirants understand NCERT concepts clearly, accurately, and exam-relevantly.

CRITICAL RULES:
1. Answer ONLY using the provided retrieved context. Never fabricate information or citations.
2. If the context is insufficient, explicitly say so.
3. Always cite sources using [1], [2] notation matching the context labels.
4. Be accurate, clear, and structured (use headings, bullet points where helpful).`;

  if (upscMode) {
    prompt += `\n5. UPSC MODE: For each answer, briefly note:
   - UPSC Relevance (Prelims/Mains)
   - Key facts to remember
   - Common mistakes to avoid`;
  }

  if (style === "concise") prompt += "\n6. Keep answers concise and to-the-point.";
  else if (style === "simple") prompt += "\n6. Use simple language suitable for a beginner.";
  else if (style === "exam-focused") prompt += "\n6. Focus on exam-relevant points only.";

  return prompt;
}

function appendCitations(answer: string, citations: ReturnType<typeof buildCitations>): string {
  if (citations.length === 0) return answer;
  const citeText = citations.map((c) => `[${c.index}] ${c.bookTitle} · Class ${c.classNum} · ${c.chapter || "Chapter"} · p.${c.page}`).join("\n");
  return `${answer}

---
**Sources:**
${citeText}`;
}

function formatNoContextAnswer(question: string): string {
  return `I couldn't find information about "${question.slice(0, 80)}" in the NCERT books I've indexed.

This could be because:
1. The relevant book hasn't been indexed yet (check the admin panel → AI panel)
2. The topic uses different terminology — try rephrasing your question
3. The topic isn't covered in the indexed NCERT books

Try asking about a specific concept, chapter, or term from your NCERT books.`;
}

function languageName(code: string): string {
  const map: Record<string, string> = {
    en: "English", hi: "Hindi", ur: "Urdu", ta: "Tamil", te: "Telugu",
    bn: "Bengali", mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam",
  };
  return map[code] || "English";
}

/**
 * Non-RAG chat (for general UPSC mentoring not tied to specific book content).
 */
export async function generalChat(
  question: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  context?: string,
): Promise<string> {
  const systemPrompt = `You are a knowledgeable UPSC/IAS mentor in the NCERT Library for IAS platform. Help aspirants with general UPSC guidance, study strategies, and concept explanations. Be encouraging, accurate, and structured.${context ? `\n\nCurrent context: ${context}` : ""}`;
  return rawChat([{ role: "system", content: systemPrompt }, ...history.slice(-6), { role: "user", content: question }]);
}

import ZAI from "z-ai-web-dev-sdk";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

export async function chat(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const zai = await getZai();
  const completion = await zai.chat.completions.create({
    // SDK expects 'assistant' role for the system prompt
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content ?? "";
}

// Robust JSON extraction from LLM output
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  // strip code fences
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const SYSTEM =
  "You are a knowledgeable UPSC/IAS mentor embedded in the NCERT Library for IAS platform. " +
  "You help aspirants understand NCERT topics clearly, concisely and exam-relevantly. " +
  "Use simple language, structure answers with headings and bullet points where helpful, " +
  "and connect concepts to UPSC Prelims and Mains whenever relevant.";

export async function mentorChat(history: { role: "user" | "assistant"; content: string }[], question: string, context?: string) {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM + (context ? `\n\nCurrent reading context:\n${context}` : "") },
    ...history.slice(-8),
    { role: "user", content: question },
  ];
  return chat(messages);
}

export async function summarize(text: string) {
  return chat([
    { role: "system", content: "You are an expert UPSC content summarizer. Produce a crisp, structured summary with: a one-line gist, key points (5-7 bullets), important terms, and a 'UPSC relevance' note. Use markdown." },
    { role: "user", content: `Summarize the following passage for an IAS aspirant:\n\n${text}` },
  ]);
}

export async function explain(text: string, question?: string) {
  return chat([
    { role: "system", content: "You are a patient UPSC mentor. Explain the given passage or concept in simple, layered language. Give an analogy, break down jargon, and end with a one-line takeaway." },
    { role: "user", content: `${question ? `Question: ${question}\n\n` : ""}Explain this:\n\n${text}` },
  ]);
}

export interface MCQ {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export async function generateMCQs(text: string, count = 5): Promise<MCQ[]> {
  const raw = await chat([
    {
      role: "system",
      content:
        "You generate high-quality UPSC Prelims-style multiple choice questions. " +
        "Return STRICT JSON only: an array of objects with fields question (string), options (array of 4 strings), answer (index 0-3), explanation (string). No prose.",
    },
    { role: "user", content: `Generate ${count} MCQs from this passage:\n\n${text}` },
  ]);
  return extractJson<MCQ[]>(raw) ?? [];
}

export interface Flashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(text: string, count = 8): Promise<Flashcard[]> {
  const raw = await chat([
    {
      role: "system",
      content:
        "You generate concise revision flashcards for UPSC aspirants. " +
        "Return STRICT JSON only: an array of objects with fields front (term/concept) and back (brief definition/key points). No prose.",
    },
    { role: "user", content: `Generate ${count} flashcards from this passage:\n\n${text}` },
  ]);
  return extractJson<Flashcard[]>(raw) ?? [];
}

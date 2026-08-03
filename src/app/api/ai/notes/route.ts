import { retrieve, compressContext } from "@/lib/ai-engine/retriever";
import { chat } from "@/lib/ai";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

// Generate UPSC-style notes from retrieved context
export async function POST(req: Request) {
  return handle(async () => {
    const { topic, bookId, subjectSlug, classNum, noteType, upscMode } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "Topic is required." }), { status: 400 });

    // Retrieve relevant chunks
    const result = await retrieve(topic, { topK: 8, filter: { bookId, subjectSlug, classNum } });
    if (result.chunks.length === 0) {
      return { notes: "I couldn't find relevant content in the NCERT books to generate notes from.", citations: [] };
    }

    const context = compressContext(result.chunks);

    const notePrompts: Record<string, string> = {
      "upsc-notes": "Generate structured UPSC notes with: key definitions, important points, facts & figures, examples, and UPSC relevance (Prelims/Mains).",
      "one-page": "Generate a concise one-page note covering the essential points. Keep it to under 300 words.",
      "revision": "Generate quick revision notes with bullet points only — no explanations, just key facts and terms.",
      "detailed": "Generate detailed study notes with headings, sub-points, definitions, examples, and important facts.",
    };

    const prompt = notePrompts[noteType || "detailed"];

    const notes = await chat([
      { role: "system", content: `You are an expert UPSC note-maker. Generate well-structured, accurate notes in markdown format. Use ONLY the provided context — do not fabricate. Cite sources as [1], [2] etc.${upscMode ? " Include UPSC relevance." : ""}` },
      { role: "user", content: `Topic: ${topic}\n\nContext:\n${context}\n\n${prompt}` },
    ]);

    return { notes, citations: result.chunks.map((c, i) => ({ index: i + 1, bookTitle: c.bookTitle, chapter: c.chapter, page: c.page })) };
  });
}

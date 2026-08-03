import { retrieve, compressContext } from "@/lib/ai-engine/retriever";
import { chat } from "@/lib/ai";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

// Generate revision content (quick/5min/10min/one-page/cheat-sheet/last-minute)
export async function POST(req: Request) {
  return handle(async () => {
    const { topic, bookId, revisionType } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "Topic is required." }), { status: 400 });

    const result = await retrieve(topic, { topK: 6, filter: { bookId } });
    if (result.chunks.length === 0) {
      return { content: "No content found for revision.", citations: [] };
    }

    const context = compressContext(result.chunks, 4000);

    const typePrompts: Record<string, string> = {
      "quick": "Create a QUICK REVISION sheet: 5-7 bullet points with only the most important facts. No explanations.",
      "5min": "Create a 5-MINUTE REVISION guide: 10-12 key points you can read in 5 minutes. Include definitions and one-word facts.",
      "10min": "Create a 10-MINUTE REVISION guide: comprehensive but concise. Include all key concepts, definitions, and important examples.",
      "one-page": "Create a ONE-PAGE NOTE: everything essential on one page. Use tight bullet points and bold key terms.",
      "cheat-sheet": "Create a CHEAT SHEET: ultra-condensed. Only formulas, definitions, dates, and key terms. No full sentences.",
      "last-minute": "Create LAST-MINUTE NOTES: 15 rapid-fire points for exam day. Only the most likely-to-be-asked facts.",
    };

    const content = await chat([
      { role: "system", content: "You are a UPSC revision expert. Generate concise, high-yield revision material in markdown. Use ONLY the provided context." },
      { role: "user", content: `Topic: ${topic}\n\nContext:\n${context}\n\n${typePrompts[revisionType || "quick"]}` },
    ]);

    return { content, citations: result.chunks.map((c, i) => ({ index: i + 1, bookTitle: c.bookTitle, page: c.page })) };
  });
}

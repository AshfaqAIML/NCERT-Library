import { chat, handle } from "@/lib/ai-bridge";

export const runtime = "nodejs";
export const maxDuration = 60;

// Translate selected text into a target language (defaults to Hindi).
export async function POST(req: Request) {
  return handle(async () => {
    const { text, target } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: "Text is required." }), { status: 400 });
    const lang = target || "Hindi";
    const out = await chat([
      { role: "system", content: `You are a precise translator for UPSC aspirants. Translate the given passage into ${lang}. Preserve meaning, technical terms and proper nouns. Return only the translation, no commentary.` },
      { role: "user", content: text },
    ]);
    return { translation: out, target: lang };
  });
}

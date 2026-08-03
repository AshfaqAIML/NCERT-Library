import { explain, handle } from "@/lib/ai-bridge";

export const runtime = "nodejs";
export const maxDuration = 60;

// Explain a selected passage, optionally with a specific question.
export async function POST(req: Request) {
  return handle(async () => {
    const { text, question } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: "Text is required." }), { status: 400 });
    return { explanation: await explain(text, question) };
  });
}

import { summarize, handle } from "@/lib/ai-bridge";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(async () => {
    const { text } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: "Text is required." }), { status: 400 });
    return { summary: await summarize(text) };
  });
}

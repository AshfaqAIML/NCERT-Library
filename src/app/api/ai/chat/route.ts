import { mentorChat, handle } from "@/lib/ai-bridge";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(async () => {
    const { history, question, context } = await req.json();
    if (!question) return new Response(JSON.stringify({ error: "Question is required." }), { status: 400 });
    const answer = await mentorChat(history || [], question, context);
    return { answer };
  });
}

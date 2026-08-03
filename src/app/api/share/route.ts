import { db } from "@/lib/db";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST — create a shareable highlight card (returns a token + data)
export async function POST(req: Request) {
  return handle(async () => {
    const { highlightId, bookId, text, color } = await req.json();

    let highlight: any = null;
    if (highlightId) {
      highlight = await db.highlight.findUnique({
        where: { id: highlightId },
        include: { book: { include: { subject: true } } },
      });
    } else if (bookId && text) {
      const book = await db.book.findUnique({ where: { id: bookId }, include: { subject: true } });
      highlight = { text, color: color || "amber", book };
    }

    if (!highlight) return new Response(JSON.stringify({ error: "Highlight not found" }), { status: 404 });

    // Generate a share token (simple hash)
    const token = Buffer.from(JSON.stringify({ h: highlight.id || highlight.text.slice(0, 20), t: Date.now() })).toString("base64url");

    return {
      token,
      highlight: {
        text: highlight.text,
        color: highlight.color,
        bookTitle: highlight.book?.title,
        subject: highlight.book?.subject?.name,
        subjectColor: highlight.book?.subject?.color,
        classNum: highlight.book?.classNum,
        page: highlight.page,
      },
      shareUrl: `/share/${token}`,
    };
  });
}

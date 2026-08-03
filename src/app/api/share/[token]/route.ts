import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — resolve a share token to the highlight data
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    const highlightText = typeof decoded.h === "string" ? decoded.h : String(decoded.h);

    const highlight = await db.highlight.findFirst({
      where: { text: { contains: highlightText.slice(0, 50) } },
      include: { book: { include: { subject: true } } },
    });

    if (highlight) {
      return NextResponse.json({
        text: highlight.text,
        color: highlight.color,
        bookTitle: highlight.book.title,
        subject: highlight.book.subject.name,
        subjectColor: highlight.book.subject.color,
        classNum: highlight.book.classNum,
        page: highlight.page,
        bookId: highlight.bookId,
        createdAt: highlight.createdAt,
      });
    }

    return NextResponse.json({
      text: highlightText,
      color: "amber",
      bookTitle: null,
      sharedAt: new Date(decoded.t).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
  }
}

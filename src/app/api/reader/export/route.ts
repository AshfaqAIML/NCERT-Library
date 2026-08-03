import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Record an export operation
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { bookId, kind, format } = await req.json();
    return db.exportHistory.create({ data: { userId: session.id, bookId, kind, format } });
  });
}

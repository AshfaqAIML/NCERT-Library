import { db } from "@/lib/db";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const subjects = await db.subject.findMany({ orderBy: { sortOrder: "asc" } });
    const withCounts = await Promise.all(
      subjects.map(async (s) => ({
        ...s,
        bookCount: await db.book.count({ where: { subjectId: s.id } }),
      }))
    );
    return withCounts;
  });
}

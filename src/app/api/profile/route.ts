import { db } from "@/lib/db";
import { getUserWithStats, requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const user = await getUserWithStats(session.id);
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    const stats = {
      booksOpened: user.progress.length,
      bookmarks: user.bookmarks.length,
      highlights: user.highlights.length,
      notes: user.notes.length,
      downloads: user.downloads.length,
      pagesRead: user.progress.reduce((sum, p) => sum + p.currentPage, 0),
      achievements: user.achievements.length,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      stats,
      bookmarks: user.bookmarks,
      progress: user.progress,
      highlights: user.highlights,
      notes: user.notes,
      downloads: user.downloads,
      achievements: user.achievements,
    };
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { name, bio } = await req.json();
    const updated = await db.user.update({
      where: { id: session.id },
      data: { name, bio },
    });
    return { id: updated.id, name: updated.name, bio: updated.bio, email: updated.email };
  });
}

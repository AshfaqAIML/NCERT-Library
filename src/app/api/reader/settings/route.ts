import { db } from "@/lib/db";
import { requireUser, handle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const settings = await db.readerSettings.findUnique({ where: { userId: session.id } });
    return settings ?? null;
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requireUser();
    const body = await req.json();
    const data = {
      theme: body.theme,
      zoom: body.zoom,
      layout: body.layout,
      pageSpacing: body.pageSpacing,
      readingDirection: body.readingDirection,
      pageTransition: body.pageTransition,
      autoSaveSec: body.autoSaveSec,
      defaultSidebar: body.defaultSidebar,
      leftSidebarOpen: body.leftSidebarOpen,
      rightSidebarOpen: body.rightSidebarOpen,
    };
    // strip undefined
    Object.keys(data).forEach((k) => (data as any)[k] === undefined && delete (data as any)[k]);

    return db.readerSettings.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...data },
      update: data,
    });
  });
}

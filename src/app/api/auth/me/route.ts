import { getSession } from "@/lib/auth";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    return { user: await getSession() };
  });
}

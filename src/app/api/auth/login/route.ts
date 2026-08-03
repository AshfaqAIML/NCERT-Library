import { db } from "@/lib/db";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { handle } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user || !user.passwordHash) {
      return new Response(JSON.stringify({ error: "Invalid email or password." }), { status: 401 });
    }

    // Seeded demo accounts (hash prefixed $demo$) accept the demo password "demo1234".
    let authed: boolean;
    if (user.passwordHash.startsWith("$demo$")) {
      authed = password === "demo1234";
    } else {
      authed = verifyPassword(password, user.passwordHash);
    }

    if (!authed) {
      return new Response(JSON.stringify({ error: "Invalid email or password." }), { status: 401 });
    }

    // Normalize demo accounts to a real hash on first real login
    if (user.passwordHash.startsWith("$demo$")) {
      await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } });
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "USER" | "ADMIN",
      avatar: user.avatar,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  });
}

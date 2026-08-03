import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handle } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password, name } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "Email and password are required." }), { status: 400 });

    const exists = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (exists) return new Response(JSON.stringify({ error: "An account with this email already exists." }), { status: 409 });

    const user = await db.user.create({
      data: {
        email: String(email).toLowerCase(),
        name: name || email.split("@")[0],
        passwordHash: hashPassword(password),
        role: "USER",
      },
    });

    await db.achievement.create({
      data: { userId: user.id, type: "FIRST_BOOK", label: "Welcome Aboard", icon: "Sparkles" },
    }).catch(() => {});

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

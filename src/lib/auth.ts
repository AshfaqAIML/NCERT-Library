import { cookies } from "next/headers";
import { db } from "./db";
import type { SessionUser } from "./types";

// Lightweight signed-cookie session for the demo platform.
// (Production would use NextAuth/JWT with proper secrets.)

const COOKIE = "nl_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET = process.env.AUTH_SECRET || "ncert-library-ias-demo-secret-2024";

function sign(payload: string): string {
  // Simple HMAC (async-free via node:crypto sync)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("node:crypto");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("node:crypto");
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  return payload;
}

export async function createSession(user: SessionUser) {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    exp: Date.now() + MAX_AGE * 1000,
  });
  const token = sign(Buffer.from(payload, "utf8").toString("base64url"));
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const payload = verify(token);
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      avatar: decoded.avatar,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) {
    throw new Error("UNAUTHORIZED");
  }
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireUser();
  if (s.role !== "ADMIN") throw new Error("FORBIDDEN");
  return s;
}

// Hash helper (bcrypt-free, demo-only). DO NOT use in production.
export function hashPassword(pw: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("node:crypto");
  const salt = "ncert-ias";
  return crypto.createHmac("sha256", SECRET).update(salt + pw).digest("hex");
}

export function verifyPassword(pw: string, hash: string): boolean {
  return hashPassword(pw) === hash;
}

export async function syncUserToStore() {
  const session = await getSession();
  return session;
}

export async function getUserWithStats(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      bookmarks: { include: { book: true }, orderBy: { createdAt: "desc" } },
      progress: { include: { book: true }, orderBy: { lastReadAt: "desc" } },
      highlights: { include: { book: true }, orderBy: { createdAt: "desc" } },
      notes: { include: { book: true }, orderBy: { updatedAt: "desc" } },
      downloads: { include: { book: true }, orderBy: { createdAt: "desc" } },
      achievements: { orderBy: { unlockedAt: "desc" } },
    },
  });
}

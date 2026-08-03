"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenText, Mail, Lock, User, Sparkles, ArrowRight, Loader2, CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { email: "aspirant@ncertias.in", role: "Aspirant", color: "from-emerald-400 to-teal-500" },
  { email: "admin@ncertias.in", role: "Admin", color: "from-amber-400 to-orange-500" },
];

export function AuthView() {
  const tab = useStore((s) => s.authTab);
  const setTab = useStore((s) => s.setAuthTab);
  const go = useStore((s) => s.go);
  const setUser = useStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = tab === "login" ? { email, password } : { email, password, name };
      const res = await api<SessionUser>(endpoint, { method: "POST", body: JSON.stringify(body) });
      setUser(res);
      toast.success(tab === "login" ? `Welcome back, ${res.name || "aspirant"}!` : "Account created!");
      go(res.role === "ADMIN" ? "admin" : "profile");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo1234");
    setTab("login");
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/[0.05] via-background to-amber-500/[0.04]" />
      <div className="absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block">
          <div className="mb-6 inline-flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
              <BookOpenText className="h-6 w-6" />
            </span>
            <div>
              <p className="font-serif text-lg font-bold leading-none">NCERT Library</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">for IAS</p>
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight">
            Your UPSC prep,{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">beautifully organised</span>
          </h1>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Sign in to sync your highlights, bookmarks, notes and reading progress across every device —
            and unlock your AI study companion.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Resume reading exactly where you left off",
              "Sync highlights & sticky notes everywhere",
              "AI summaries, MCQs and flashcards on demand",
              "Track achievements and reading streaks",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-foreground/85">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} onClick={() => quickLogin(a.email)} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-2 text-left transition-colors hover:border-emerald-500/40">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white", a.color)}>{a.role[0]}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{a.role}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{a.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Password: <code className="rounded bg-muted px-1 py-0.5">demo1234</code></p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-lift sm:p-8">
            <div className="mb-6 text-center lg:hidden">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
                <GraduationCap className="h-6 w-6" />
              </span>
            </div>

            <div className="mb-6 flex rounded-full bg-muted p-1">
              <button onClick={() => setTab("login")} className={cn("flex-1 rounded-full py-2 text-sm font-medium transition-all", tab === "login" ? "bg-background shadow-sm" : "text-muted-foreground")}>Sign in</button>
              <button onClick={() => setTab("register")} className={cn("flex-1 rounded-full py-2 text-sm font-medium transition-all", tab === "register" ? "bg-background shadow-sm" : "text-muted-foreground")}>Create account</button>
            </div>

            <h2 className="font-serif text-2xl font-bold tracking-tight">{tab === "login" ? "Welcome back" : "Join the library"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tab === "login" ? "Sign in to continue your preparation." : "Create a free account to start reading."}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {tab === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" className="h-11 pl-10" required />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pl-10" required />
                </div>
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {tab === "login" ? "Sign in" : "Create account"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {tab === "login" ? "New here? " : "Already have an account? "}
              <button onClick={() => setTab(tab === "login" ? "register" : "login")} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                {tab === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

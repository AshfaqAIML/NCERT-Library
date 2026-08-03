"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen, Bookmark, Highlighter, StickyNote, Download, Award, Clock,
  TrendingUp, User as UserIcon, Pencil, ArrowRight, BookMarked, Sparkles, Library,
  Target, Calendar, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { api, timeAgo } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { ReadingGoals } from "./reading-goals";
import { StudyCalendar } from "./study-calendar";
import { PracticeQuiz } from "./practice-quiz";

interface ProfileData {
  user: { id: string; email: string; name: string | null; avatar: string | null; role: string; bio: string | null; createdAt: string };
  stats: { booksOpened: number; bookmarks: number; highlights: number; notes: number; downloads: number; pagesRead: number; achievements: number };
  bookmarks: any[];
  progress: any[];
  highlights: any[];
  notes: any[];
  downloads: any[];
  achievements: any[];
}

export function ProfileView() {
  const user = useStore((s) => s.user);
  const go = useStore((s) => s.go);
  const setAuthTab = useStore((s) => s.setAuthTab);
  const profileTab = useStore((s) => s.profileTab);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const openBook = useStore((s) => s.openBook);

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () => api("/api/profile"),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <UserIcon className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="font-serif text-2xl font-bold">Sign in to view your library</h2>
        <p className="mt-2 text-sm text-muted-foreground">Track your reading progress, bookmarks, highlights and achievements.</p>
        <Button className="mt-6 rounded-full" onClick={() => { setAuthTab("login"); go("auth"); }}>Sign in</Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="mx-auto max-w-5xl px-4 py-12"><div className="h-32 animate-pulse rounded-2xl bg-muted" /></div>;
  }

  const { user: u, stats } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] p-6 shadow-soft sm:p-8"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-lift">
            {(u.name || u.email)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">{u.name || "Aspirant"}</h1>
              {u.role === "ADMIN" && <Badge className="bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">Admin</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{u.email}</p>
            {u.bio && <p className="mt-2 max-w-xl text-sm text-foreground/80">{u.bio}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Member since {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => toast.info("Profile editing coming soon")}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Button>
        </div>

        {/* Stat row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatTile icon={BookOpen} label="Books opened" value={stats.booksOpened} />
          <StatTile icon={Bookmark} label="Bookmarks" value={stats.bookmarks} />
          <StatTile icon={Highlighter} label="Highlights" value={stats.highlights} />
          <StatTile icon={StickyNote} label="Notes" value={stats.notes} />
          <StatTile icon={Download} label="Downloads" value={stats.downloads} />
          <StatTile icon={Library} label="Pages read" value={stats.pagesRead} />
          <StatTile icon={Award} label="Achievements" value={stats.achievements} />
        </div>
      </motion.div>

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-semibold">Achievements</h2>
          <div className="flex flex-wrap gap-3">
            {data.achievements.map((a) => {
              const Icon = (Icons as any)[a.icon || "Award"] || Award;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3 pr-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{timeAgo(a.unlockedAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tabs */}
      <Tabs value={profileTab} onValueChange={setProfileTab} className="mt-8">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="overview"><TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="goals"><Target className="mr-1.5 h-3.5 w-3.5" /> Goals</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="mr-1.5 h-3.5 w-3.5" /> Calendar</TabsTrigger>
          <TabsTrigger value="quiz"><Brain className="mr-1.5 h-3.5 w-3.5" /> Quiz</TabsTrigger>
          <TabsTrigger value="history"><Clock className="mr-1.5 h-3.5 w-3.5" /> History</TabsTrigger>
          <TabsTrigger value="bookmarks"><BookMarked className="mr-1.5 h-3.5 w-3.5" /> Bookmarks</TabsTrigger>
          <TabsTrigger value="highlights"><Highlighter className="mr-1.5 h-3.5 w-3.5" /> Highlights</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="mr-1.5 h-3.5 w-3.5" /> Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Continue reading" icon={BookOpen} empty="No reading history yet.">
              {data.progress.slice(0, 4).map((p) => (
                <ResumeRow key={p.id} item={p} onOpen={() => openBook(p.book.id, "reader")} />
              ))}
            </Panel>
            <Panel title="Recent highlights" icon={Highlighter} empty="Select text while reading to highlight.">
              {data.highlights.slice(0, 4).map((h) => (
                <button key={h.id} onClick={() => openBook(h.book.id, "reader")} className="block w-full rounded-lg p-2 text-left hover:bg-accent/60">
                  <p className={cn("mb-1 line-clamp-2 text-xs leading-relaxed", hlTextClass(h.color))}>{h.text}</p>
                  <p className="text-[10px] text-muted-foreground">{h.book.title} · p.{h.page}</p>
                </button>
              ))}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <ReadingGoals />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <StudyCalendar />
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
          <PracticeQuiz />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Panel title="Reading history" icon={Clock} empty="Books you've opened will appear here.">
            {data.progress.map((p) => <ResumeRow key={p.id} item={p} onOpen={() => openBook(p.book.id, "reader")} />)}
          </Panel>
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-4">
          <Panel title="All bookmarks" icon={BookMarked} empty="Bookmark pages while reading.">
            {data.bookmarks.map((b) => (
              <button key={b.id} onClick={() => openBook(b.book.id, "reader")} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent/60">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-xs font-bold text-amber-600 dark:text-amber-400">{b.page}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.book.title}</p>
                  <p className="text-[10px] text-muted-foreground">Bookmarked {timeAgo(b.createdAt)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </Panel>
        </TabsContent>

        <TabsContent value="highlights" className="mt-4">
          <Panel title="All highlights" icon={Highlighter} empty="Highlight important lines as you read.">
            {data.highlights.map((h) => (
              <button key={h.id} onClick={() => openBook(h.book.id, "reader")} className="block w-full rounded-lg p-2.5 text-left hover:bg-accent/60">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", hlDotClass(h.color))} />
                  <span className="text-[10px] text-muted-foreground">{h.book.title} · p.{h.page} · {timeAgo(h.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-foreground/80">{h.text}</p>
              </button>
            ))}
          </Panel>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Panel title="All notes" icon={StickyNote} empty="Take sticky notes while reading.">
            {data.notes.map((n) => (
              <button key={n.id} onClick={() => openBook(n.book.id, "reader")} className="block w-full rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-2.5 text-left hover:bg-amber-400/10">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground">{n.book.title} · p.{n.page}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(n.updatedAt)}</span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/85">{n.content}</p>
              </button>
            ))}
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/60 p-3 backdrop-blur">
      <Icon className="mb-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <p className="font-serif text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, empty, children }: { title: string; icon: any; empty: string; children?: React.ReactNode }) {
  const items = Array.isArray(children) ? children : children ? [children] : [];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  );
}

function ResumeRow({ item, onOpen }: { item: any; onOpen: () => void }) {
  const percent = Math.round(item.percent || 0);
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent/60">
      <div className={cn("h-12 w-9 shrink-0 rounded-md bg-gradient-to-br ring-1 ring-black/10", item.book.coverGradient)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.book.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{percent}%</span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Page {item.currentPage}/{item.totalPages} · {timeAgo(item.lastReadAt)}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function hlTextClass(color: string) {
  const map: Record<string, string> = {
    amber: "bg-amber-400/20", emerald: "bg-emerald-400/20", rose: "bg-rose-400/20",
    violet: "bg-violet-400/20", sky: "bg-sky-400/20",
  };
  return map[color] ?? map.amber;
}
function hlDotClass(color: string) {
  const map: Record<string, string> = {
    amber: "bg-amber-400", emerald: "bg-emerald-400", rose: "bg-rose-400",
    violet: "bg-violet-400", sky: "bg-sky-400",
  };
  return map[color] ?? map.amber;
}

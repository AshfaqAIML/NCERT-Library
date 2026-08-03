"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Target, Flame, Clock, BookOpen, TrendingUp, Trophy, Calendar,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface GoalData {
  dailyGoal: number;
  pagesToday: number;
  totalPagesRead: number;
  activeBooks: number;
  completedBooks: number;
  longestStreak: number;
  avgStreak: number;
  totalTimeMin: number;
  heatmap: { date: string; pages: number; active: boolean; intensity: number }[];
  books: { bookId: string; title: string; subject: string; subjectColor: string; currentPage: number; totalPages: number; percent: number; streak: number; lastReadAt: string }[];
}

export function ReadingGoals() {
  const { data, isLoading } = useQuery<GoalData>({
    queryKey: ["reading-goals"],
    queryFn: () => api("/api/reading-goals"),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  const goalPercent = Math.min(100, Math.round((data.pagesToday / data.dailyGoal) * 100));
  const hoursRead = Math.floor(data.totalTimeMin / 60);
  const minsRead = data.totalTimeMin % 60;

  return (
    <div className="space-y-4">
      {/* Daily goal + streak */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily goal card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card p-6 shadow-soft"
        >
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Target className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-base font-semibold">Daily Goal</h3>
                  <p className="text-[11px] text-muted-foreground">Pages read today</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.pagesToday}</p>
                <p className="text-[10px] text-muted-foreground">/ {data.dailyGoal} pages</p>
              </div>
            </div>
            <Progress value={goalPercent} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400" />
            <p className="mt-2 text-xs text-muted-foreground">
              {goalPercent >= 100 ? "🎉 Daily goal achieved! Keep the streak going." : `${data.dailyGoal - data.pagesToday} pages to go — you've got this!`}
            </p>
          </div>
        </motion.div>

        {/* Streak card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-amber-500/[0.06] via-card to-card p-6 shadow-soft"
        >
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-base font-semibold">Reading Streak</h3>
                  <p className="text-[11px] text-muted-foreground">Best: {data.longestStreak} days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-400">{data.avgStreak}</p>
                <p className="text-[10px] text-muted-foreground">avg days</p>
              </div>
            </div>
            {/* Mini streak visualization */}
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => {
                const day = data.heatmap[data.heatmap.length - 7 + i];
                const active = day?.active;
                return (
                  <div key={i} className="flex-1 text-center">
                    <div className={cn(
                      "mx-auto mb-1 flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold",
                      active ? cn("text-white", intensityBg(day?.intensity || 0)) : "bg-muted text-muted-foreground"
                    )}>
                      {day?.pages || "·"}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{day ? new Date(day.date).toLocaleDateString("en", { weekday: "narrow" }) : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 30-day heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
      >
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-serif text-base font-semibold">30-Day Activity</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.heatmap.map((day) => (
            <div
              key={day.date}
              className={cn(
                "h-7 w-7 rounded-md transition-transform hover:scale-110",
                day.active ? intensityBg(day.intensity) : "bg-muted/50"
              )}
              title={`${day.date}: ${day.pages} pages`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="h-3 w-3 rounded bg-muted/50" />
          <div className="h-3 w-3 rounded intensityBg(1)" style={{ background: "oklch(0.8 0.1 145)" }} />
          <div className="h-3 w-3 rounded" style={{ background: "oklch(0.65 0.15 145)" }} />
          <div className="h-3 w-3 rounded" style={{ background: "oklch(0.5 0.17 145)" }} />
          <div className="h-3 w-3 rounded" style={{ background: "oklch(0.4 0.18 145)" }} />
          <span>More</span>
        </div>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat icon={BookOpen} label="Pages read" value={String(data.totalPagesRead)} color="emerald" />
        <SummaryStat icon={Clock} label="Time read" value={`${hoursRead}h ${minsRead}m`} color="violet" />
        <SummaryStat icon={Trophy} label="Books done" value={String(data.completedBooks)} color="amber" />
        <SummaryStat icon={TrendingUp} label="Active books" value={String(data.activeBooks)} color="sky" />
      </div>

      {/* In-progress books */}
      {data.books.filter(b => b.percent < 100).length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-serif text-base font-semibold">Continue Reading</h3>
          <div className="space-y-2">
            {data.books.filter(b => b.percent < 100).slice(0, 5).map((b) => (
              <div key={b.bookId} className="flex items-center gap-3 rounded-lg border border-border/50 p-2">
                <div className={cn("h-8 w-6 shrink-0 rounded", subjectColor(b.subjectColor))} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{b.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={b.percent} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{b.percent}%</span>
                  </div>
                </div>
                {b.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <Flame className="h-3 w-3" /> {b.streak}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <span className={cn("mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg", colorMap[color])}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-serif text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function intensityBg(intensity: number): string {
  const map: Record<number, string> = {
    0: "bg-muted",
    1: "bg-emerald-200 dark:bg-emerald-900",
    2: "bg-emerald-400 dark:bg-emerald-700",
    3: "bg-emerald-500 dark:bg-emerald-600",
    4: "bg-emerald-600 dark:bg-emerald-500",
  };
  return map[intensity] ?? map[0];
}

function subjectColor(color: string): string {
  const map: Record<string, string> = {
    amber: "bg-amber-400", emerald: "bg-emerald-400", rose: "bg-rose-400",
    violet: "bg-violet-400", sky: "bg-sky-400",
  };
  return map[color] ?? "bg-emerald-400";
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Target, TrendingUp, Flame, BookOpen, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface CalendarDay {
  date: string;
  dayOfWeek: number;
  pagesRead: number;
  goalMet: boolean;
  books: { bookId: string; title: string; subject: string; subjectColor: string; currentPage: number; totalPages: number; percent: number }[];
  intensity: number;
}

interface CalendarData {
  calendar: CalendarDay[];
  weeklyStats: { pagesRead: number; goal: number; percent: number; daysCompleted: number; daysTarget: number };
  upcoming: { date: string; dayOfWeek: number; dayName: string; target: number; planned: any[] }[];
  streak: number;
  totalBooks: number;
  activeBooks: number;
}

export function StudyCalendar() {
  const { data, isLoading } = useQuery<CalendarData>({
    queryKey: ["study-calendar"],
    queryFn: () => api("/api/study-calendar"),
  });

  if (isLoading || !data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Weekly progress */}
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
                <h3 className="font-serif text-base font-semibold">This Week's Goal</h3>
                <p className="text-[11px] text-muted-foreground">{data.weeklyStats.daysCompleted}/{data.weeklyStats.daysTarget} days completed</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.weeklyStats.pagesRead}</p>
              <p className="text-[10px] text-muted-foreground">/ {data.weeklyStats.goal} pages</p>
            </div>
          </div>
          <Progress value={data.weeklyStats.percent} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400" />
          <div className="mt-3 flex items-center gap-2">
            {/* 7-day dots */}
            {data.calendar.slice(-7).map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={cn(
                  "mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold",
                  day.goalMet ? "bg-emerald-500 text-white" : day.pagesRead > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                )}>
                  {day.goalMet ? <CheckCircle2 className="h-4 w-4" /> : day.pagesRead > 0 ? day.pagesRead : "·"}
                </div>
                <span className="text-[9px] text-muted-foreground">{["S", "M", "T", "W", "T", "F", "S"][day.dayOfWeek]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon={Flame} label="Streak" value={`${data.streak}d`} color="amber" />
        <SummaryCard icon={BookOpen} label="Total books" value={String(data.totalBooks)} color="emerald" />
        <SummaryCard icon={TrendingUp} label="Active" value={String(data.activeBooks)} color="sky" />
      </div>

      {/* 90-day heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
      >
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-serif text-base font-semibold">90-Day Activity</h3>
        </div>
        {/* Month labels */}
        <div className="mb-2 flex gap-1 text-[10px] text-muted-foreground">
          {getMonthLabels(data.calendar).map((m, i) => (
            <span key={i} className="flex-1">{m}</span>
          ))}
        </div>
        {/* Heatmap grid: 13 weeks × 7 days */}
        <div className="flex flex-wrap gap-1">
          {data.calendar.map((day) => (
            <div
              key={day.date}
              className={cn(
                "h-4 w-4 rounded-sm transition-transform hover:scale-125",
                intensityBg(day.intensity),
                day.date === today && "ring-2 ring-emerald-500 ring-offset-1"
              )}
              title={`${day.date}: ${day.pagesRead} pages${day.books.length ? ` (${day.books.map((b) => b.title).join(", ")})` : ""}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="h-3 w-3 rounded-sm bg-muted/50" />
          <div className="h-3 w-3 rounded-sm" style={{ background: "oklch(0.8 0.1 145)" }} />
          <div className="h-3 w-3 rounded-sm" style={{ background: "oklch(0.65 0.15 145)" }} />
          <div className="h-3 w-3 rounded-sm" style={{ background: "oklch(0.5 0.17 145)" }} />
          <div className="h-3 w-3 rounded-sm" style={{ background: "oklch(0.4 0.18 145)" }} />
          <span>More</span>
          <span className="ml-auto">● = today</span>
        </div>
      </motion.div>

      {/* Upcoming schedule */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
      >
        <h3 className="mb-3 font-serif text-base font-semibold">Upcoming Week</h3>
        <div className="grid grid-cols-7 gap-2">
          {data.upcoming.map((day) => (
            <div key={day.date} className="rounded-lg border border-border/50 p-2 text-center">
              <p className="text-[10px] font-medium text-muted-foreground">{day.dayName}</p>
              <p className="font-serif text-sm font-bold">{new Date(day.date).getDate()}</p>
              <p className="mt-1 text-[9px] text-muted-foreground">{day.target}p</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Today's books */}
      {data.calendar[data.calendar.length - 1]?.books.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
        >
          <h3 className="mb-3 font-serif text-base font-semibold">Today's Reading</h3>
          <div className="space-y-2">
            {data.calendar[data.calendar.length - 1].books.map((b) => (
              <div key={b.bookId} className="flex items-center gap-3 rounded-lg border border-border/50 p-2">
                <div className={cn("h-8 w-6 shrink-0 rounded", subjectColor(b.subjectColor))} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{b.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={b.percent} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{b.percent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
      <Icon className={cn("mx-auto mb-1.5 h-4 w-4", colorMap[color])} />
      <p className="font-serif text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function intensityBg(intensity: number): string {
  const map: Record<number, string> = {
    0: "bg-muted/50",
    1: "bg-emerald-200 dark:bg-emerald-900",
    2: "bg-emerald-400 dark:bg-emerald-700",
    3: "bg-emerald-500 dark:bg-emerald-600",
    4: "bg-emerald-600 dark:bg-emerald-500",
  };
  return map[intensity] ?? map[0];
}

function subjectColor(color: string): string {
  const map: Record<string, string> = {
    amber: "bg-amber-400", emerald: "bg-emerald-400", rose: "bg-rose-400", violet: "bg-violet-400", sky: "bg-sky-400",
  };
  return map[color] ?? "bg-emerald-400";
}

function getMonthLabels(days: CalendarDay[]): string[] {
  const labels: string[] = [];
  let lastMonth = -1;
  for (const day of days) {
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) {
      labels.push(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m]);
      lastMonth = m;
    } else {
      labels.push("");
    }
  }
  // Compress: return only ~6 labels spread across
  const step = Math.floor(labels.length / 6);
  return labels.filter((_, i) => i % step === 0).slice(0, 6);
}

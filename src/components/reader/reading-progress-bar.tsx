"use client";

import { Clock, Flame, BookOpen, TrendingUp, Timer, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ReadingStats } from "./types";

interface Props {
  stats: ReadingStats;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

/**
 * Bottom progress bar showing reading stats + page navigation.
 */
export function ReadingProgressBar({ stats, onPrev, onNext, canPrev, canNext }: Props) {
  const [expanded, setExpanded] = useState(false);

  const mins = Math.floor(stats.timeSpentSec / 60);
  const secs = stats.timeSpentSec % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="border-t border-border/60 bg-background/90 backdrop-blur">
      {/* Stats strip (expandable) */}
      {expanded && (
        <div className="grid grid-cols-2 gap-2 border-b border-border/60 p-3 sm:grid-cols-4 lg:grid-cols-6">
          <Stat icon={Clock} label="Time today" value={timeStr} />
          <Stat icon={BookOpen} label="Pages today" value={String(stats.pagesReadToday)} />
          <Stat icon={Flame} label="Streak" value={`${stats.streak}d`} highlight={stats.streak > 0} />
          <Stat icon={TrendingUp} label="Avg speed" value={`${stats.avgSpeedPagesPerMin.toFixed(1)} p/m`} />
          <Stat icon={Timer} label="Est. remaining" value={stats.estRemainingMin > 0 ? `${stats.estRemainingMin}m` : "—"} />
          <Stat icon={BookOpen} label="Progress" value={`${stats.percent}%`} />
        </div>
      )}

      {/* Progress bar + nav */}
      <div className="flex items-center gap-3 px-3 py-2">
        <button onClick={onPrev} disabled={!canPrev} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-30" aria-label="Previous page">
          <ChevronUp className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center gap-3">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${stats.percent}%` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-semibold tabular-nums text-foreground/60">{stats.currentPage} / {stats.totalPages}</span>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-muted-foreground hover:text-foreground" aria-label="Toggle stats">
            {expanded ? "Hide stats" : "Show stats"}
          </button>
        </div>

        <button onClick={onNext} disabled={!canNext} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-30" aria-label="Next page">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2 py-1.5">
      <Icon className={cn("h-3.5 w-3.5", highlight ? "text-orange-500" : "text-emerald-600 dark:text-emerald-400")} />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold tabular-nums">{value}</p>
        <p className="truncate text-[9px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

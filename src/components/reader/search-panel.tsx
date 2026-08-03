"use client";

import { Search, X, ChevronUp, ChevronDown, Loader2, CaseSensitive, WholeWord, Regex, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { useTextSearch } from "./hooks/use-text-search";

interface Props {
  search: ReturnType<typeof useTextSearch>;
  onClose: () => void;
  onNavigate: (page: number) => void;
}

export function SearchPanel({ search, onClose, onNavigate }: Props) {
  const { query, setQuery, matches, searching, current, setCurrent, options, setOptions, run, next, prev } = search;

  function highlightSnippet(text: string, q: string) {
    if (!q) return text;
    try {
      const escaped = options.regex ? q : q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return text.replace(new RegExp(`(${escaped})`, options.caseSensitive ? "g" : "gi"), '<mark class="rounded bg-amber-300/60 px-0.5">$1</mark>');
    } catch { return text; }
  }

  return (
    <div className="flex h-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <h3 className="flex-1 text-sm font-semibold">Search in book</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="border-b border-border/60 p-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(query, options)}
            placeholder="Search entire book…"
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={() => run(query, options)} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Options */}
        <div className="mt-2 flex items-center gap-1">
          <Toggle active={options.caseSensitive} onClick={() => setOptions({ ...options, caseSensitive: !options.caseSensitive })} icon={CaseSensitive} label="Aa" />
          <Toggle active={options.wholeWord} onClick={() => setOptions({ ...options, wholeWord: !options.wholeWord })} icon={WholeWord} label="|W|" />
          <Toggle active={options.regex} onClick={() => setOptions({ ...options, regex: !options.regex })} icon={Regex} label=".*" />
          <div className="ml-auto text-xs text-muted-foreground">
            {matches.length > 0 ? `${current + 1} of ${matches.length}` : searching ? "searching…" : query ? "no matches" : ""}
          </div>
        </div>

        {/* Match nav */}
        {matches.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={prev} disabled={matches.length < 2}><ChevronUp className="h-3.5 w-3.5" /> Prev</Button>
            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={next} disabled={matches.length < 2}>Next <ChevronDown className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {matches.length === 0 && !searching && query && (
            <div className="px-2 py-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No matches found</p>
            </div>
          )}
          <div className="space-y-1">
            {matches.map((m, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); onNavigate(m.page); }}
                className={cn(
                  "block w-full rounded-lg border p-2 text-left transition-colors",
                  i === current ? "border-emerald-500 bg-emerald-500/[0.06]" : "border-border/60 hover:bg-accent/60"
                )}
              >
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Page {m.page}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">match {m.matchIndex + 1}</span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: highlightSnippet(m.snippet, query) }} />
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function Toggle({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-mono font-medium transition-colors",
        active ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground hover:bg-accent"
      )}
      title={label}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );
}

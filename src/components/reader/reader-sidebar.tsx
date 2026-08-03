"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  List, ListTree, Bookmark, Highlighter, PenLine, StickyNote, History,
  X, ChevronRight, Search, Trash2, Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, colorFillClass, colorDotClass } from "./reader-utils";
import type { BookmarkAnnotation, DrawingAnnotation, HighlightAnnotation, NoteAnnotation } from "./types";

type Tab = "thumbnails" | "outline" | "bookmarks" | "highlights" | "drawings" | "notes" | "history";

interface Props {
  doc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  chapters: { title: string; page: number }[];
  bookmarks: BookmarkAnnotation[];
  highlights: HighlightAnnotation[];
  drawings: DrawingAnnotation[];
  notes: NoteAnnotation[];
  history: { id: string; title: string; lastReadAt: string; percent: number }[];
  onNavigate: (page: number) => void;
  onRemoveHighlight?: (id: string) => void;
  onRemoveBookmark?: (page: number) => void;
  onRemoveDrawing?: (id: string) => void;
  onRemoveNote?: (id: string) => void;
  defaultTab?: Tab;
  onClose?: () => void;
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "thumbnails", label: "Pages", icon: List },
  { id: "outline", label: "Contents", icon: ListTree },
  { id: "bookmarks", label: "Marks", icon: Bookmark },
  { id: "highlights", label: "Highs", icon: Highlighter },
  { id: "drawings", label: "Draws", icon: PenLine },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "history", label: "History", icon: History },
];

export function ReaderSidebar(props: Props) {
  const [tab, setTab] = useState<Tab>(props.defaultTab || "thumbnails");
  const [search, setSearch] = useState("");

  const counts: Record<Tab, number> = {
    thumbnails: props.doc?.numPages ?? 0,
    outline: props.chapters.length,
    bookmarks: props.bookmarks.length,
    highlights: props.highlights.length,
    drawings: props.drawings.length,
    notes: props.notes.length,
    history: props.history.length,
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border/60 bg-background">
      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-border/60 p-1.5">
        <div className="flex flex-1 gap-0.5 overflow-x-auto scroll-elegant">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                tab === t.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title={t.label}
            >
              <t.icon className="h-3.5 w-3.5" />
              {counts[t.id] > 0 && (
                <span className="rounded-full bg-muted px-1 text-[9px] tabular-nums">{counts[t.id]}</span>
              )}
            </button>
          ))}
        </div>
        {props.onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg lg:hidden" onClick={props.onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search (for lists) */}
      {tab !== "thumbnails" && tab !== "outline" && (
        <div className="border-b border-border/60 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter…" className="h-8 pl-8 text-xs" />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2">
          {tab === "thumbnails" && <ThumbnailGrid doc={props.doc} currentPage={props.currentPage} onNavigate={props.onNavigate} />}
          {tab === "outline" && <OutlineView chapters={props.chapters} currentPage={props.currentPage} onNavigate={props.onNavigate} />}
          {tab === "bookmarks" && <BookmarksView bookmarks={props.bookmarks} search={search} onNavigate={props.onNavigate} onRemove={props.onRemoveBookmark} />}
          {tab === "highlights" && <HighlightsView highlights={props.highlights} search={search} currentPage={props.currentPage} onNavigate={props.onNavigate} onRemove={props.onRemoveHighlight} />}
          {tab === "drawings" && <DrawingsView drawings={props.drawings} search={search} onNavigate={props.onNavigate} onRemove={props.onRemoveDrawing} />}
          {tab === "notes" && <NotesView notes={props.notes} search={search} onNavigate={props.onNavigate} onRemove={props.onRemoveNote} />}
          {tab === "history" && <HistoryView history={props.history} onNavigate={props.onNavigate} />}
        </div>
      </ScrollArea>
    </aside>
  );
}

// ---- Thumbnails (lazy, virtualized-ish) ----
function ThumbnailGrid({ doc, currentPage, onNavigate }: { doc: pdfjsLib.PDFDocumentProxy | null; currentPage: number; onNavigate: (p: number) => void }) {
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const renderingRef = useRef<Set<number>>(new Set());

  async function renderThumb(page: number) {
    if (!doc || renderingRef.current.has(page)) return;
    renderingRef.current.add(page);
    try {
      const pdfPage = await doc.getPage(page);
      const viewport = pdfPage.getViewport({ scale: 0.18 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      setThumbs((t) => ({ ...t, [page]: canvas.toDataURL("image/jpeg", 0.5) }));
    } catch {}
    renderingRef.current.delete(page);
  }

  useEffect(() => {
    if (!doc) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const page = Number((entry.target as HTMLElement).dataset.page);
            if (!renderingRef.current.has(page) && !thumbs[page]) {
              renderThumb(page);
            }
          }
        }
      },
      { root: containerRef.current, rootMargin: "200px" }
    );
    document.querySelectorAll("[data-thumb-page]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [doc, thumbs]);

  if (!doc) return <SkeletonGrid />;
  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-2">
      {Array.from({ length: doc.numPages }).map((_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            data-thumb-page={page}
            data-page={page}
            onClick={() => onNavigate(page)}
            className={cn(
              "group relative overflow-hidden rounded-md bg-white ring-1 transition-all",
              currentPage === page ? "ring-2 ring-emerald-500" : "ring-black/10 hover:ring-emerald-500/40"
            )}
          >
            <div className="aspect-[3/4] w-full bg-muted">
              {thumbs[page] ? (
                <img src={thumbs[page]} alt={`Page ${page}`} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              )}
            </div>
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">{page}</span>
          </button>
        );
      })}
    </div>
  );
}

function SkeletonGrid() {
  return <div className="grid grid-cols-2 gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-md bg-muted" />)}</div>;
}

// ---- Outline ----
function OutlineView({ chapters, currentPage, onNavigate }: { chapters: { title: string; page: number }[]; currentPage: number; onNavigate: (p: number) => void }) {
  if (chapters.length === 0) return <Empty icon={ListTree} label="No table of contents" />;
  return (
    <div className="space-y-0.5">
      {chapters.map((c, i) => (
        <button key={i} onClick={() => onNavigate(c.page)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors", currentPage === c.page ? "bg-accent font-medium" : "hover:bg-accent/60")}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
          <span className="flex-1 leading-tight">{c.title}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">p.{c.page}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Bookmarks ----
function BookmarksView({ bookmarks, search, onNavigate, onRemove }: { bookmarks: BookmarkAnnotation[]; search: string; onNavigate: (p: number) => void; onRemove?: (p: number) => void }) {
  const filtered = bookmarks.filter((b) => !search || String(b.page).includes(search) || (b.label || "").toLowerCase().includes(search.toLowerCase()));
  if (filtered.length === 0) return <Empty icon={Bookmark} label="No bookmarks yet" hint="Bookmark pages to jump back quickly" />;
  return (
    <div className="space-y-1">
      {filtered.map((b) => (
        <div key={b.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/60">
          <button onClick={() => onNavigate(b.page)} className="flex flex-1 items-center gap-2 text-left">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-[10px] font-bold text-amber-600 dark:text-amber-400">{b.page}</span>
            <span className="flex-1 truncate text-xs">{b.label || `Page ${b.page}`}</span>
          </button>
          {onRemove && <button onClick={() => onRemove(b.page)} className="opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3 w-3 text-muted-foreground hover:text-rose-500" /></button>}
        </div>
      ))}
    </div>
  );
}

// ---- Highlights ----
function HighlightsView({ highlights, search, currentPage, onNavigate, onRemove }: { highlights: HighlightAnnotation[]; search: string; currentPage: number; onNavigate: (p: number) => void; onRemove?: (id: string) => void }) {
  const filtered = highlights.filter((h) => !search || h.text.toLowerCase().includes(search.toLowerCase()) || (h.category || "").toLowerCase().includes(search.toLowerCase()));
  if (filtered.length === 0) return <Empty icon={Highlighter} label="No highlights yet" hint="Select text on the page to highlight" />;
  return (
    <div className="space-y-1.5">
      {filtered.map((h) => (
        <div key={h.id} className="group rounded-lg border border-border/60 bg-card p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", colorDotClass(h.color))} />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{h.color}</span>
            {h.pinned && <Pin className="h-3 w-3 fill-amber-400 text-amber-500" />}
            <button onClick={() => onNavigate(h.page)} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">p.{h.page}</button>
            {onRemove && <button onClick={() => onRemove(h.id)} className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-rose-500" /></button>}
          </div>
          <p className="line-clamp-3 text-xs leading-relaxed text-foreground/80">{h.text}</p>
        </div>
      ))}
    </div>
  );
}

// ---- Drawings ----
function DrawingsView({ drawings, search, onNavigate, onRemove }: { drawings: DrawingAnnotation[]; search: string; onNavigate: (p: number) => void; onRemove?: (id: string) => void }) {
  if (drawings.length === 0) return <Empty icon={PenLine} label="No drawings yet" hint="Use the pen tool to annotate" />;
  return (
    <div className="space-y-1">
      {drawings.map((d) => (
        <div key={d.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/60">
          <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
          <button onClick={() => onNavigate(d.page)} className="flex-1 text-left text-xs">
            {d.tool.toLowerCase()} · p.{d.page} · {d.points.length} pts
          </button>
          {onRemove && <button onClick={() => onRemove(d.id)} className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-rose-500" /></button>}
        </div>
      ))}
    </div>
  );
}

// ---- Notes ----
function NotesView({ notes, search, onNavigate, onRemove }: { notes: NoteAnnotation[]; search: string; onNavigate: (p: number) => void; onRemove?: (id: string) => void }) {
  const filtered = notes.filter((n) => !search || n.content.toLowerCase().includes(search.toLowerCase()) || n.tags.some((t) => t.name.toLowerCase().includes(search.toLowerCase())));
  if (filtered.length === 0) return <Empty icon={StickyNote} label="No notes yet" hint="Add sticky notes while reading" />;
  return (
    <div className="space-y-1.5">
      {filtered.map((n) => (
        <div key={n.id} className="group rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-2">
          <div className="mb-1 flex items-center justify-between">
            <button onClick={() => onNavigate(n.page)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground">p.{n.page}</button>
            {n.pinned && <Pin className="h-3 w-3 fill-amber-400 text-amber-500" />}
            {onRemove && <button onClick={() => onRemove(n.id)} className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-rose-500" /></button>}
          </div>
          <p className="line-clamp-3 text-xs leading-relaxed text-foreground/85">{n.content}</p>
          {n.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {n.tags.map((t) => <span key={t.id} className="rounded-full bg-emerald-500/15 px-1.5 py-0 text-[9px] text-emerald-700 dark:text-emerald-300">{t.name}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- History ----
function HistoryView({ history, onNavigate }: { history: { id: string; title: string; lastReadAt: string; percent: number }[]; onNavigate: (p: number) => void }) {
  if (history.length === 0) return <Empty icon={History} label="No reading history" />;
  return (
    <div className="space-y-1">
      {history.map((h) => (
        <button key={h.id} onClick={() => onNavigate(1)} className="block w-full rounded-lg p-2 text-left hover:bg-accent/60">
          <p className="truncate text-xs font-medium">{h.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${h.percent}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{h.percent}%</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function Empty({ icon: Icon, label, hint }: { icon: any; label: string; hint?: string }) {
  return (
    <div className="px-2 py-10 text-center">
      <Icon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

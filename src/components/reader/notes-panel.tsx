"use client";

import { useState } from "react";
import {
  StickyNote, Plus, Search, Pin, Trash2, Pencil, Tag, Download, X, Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, colorDotClass } from "./reader-utils";
import type { NoteAnnotation } from "./types";
import { toast } from "sonner";

interface Props {
  notes: NoteAnnotation[];
  currentPage: number;
  onAdd: (page: number, content: string, color: string) => void;
  onUpdate: (id: string, patch: Partial<NoteAnnotation>) => void;
  onRemove: (id: string) => void;
  onNavigate: (page: number) => void;
  onExport: (format: "md" | "txt" | "json") => void;
  onClose?: () => void;
}

const COLORS = ["amber", "emerald", "rose", "violet", "sky"];

export function NotesPanel({ notes, currentPage, onAdd, onUpdate, onRemove, onNavigate, onExport, onClose }: Props) {
  const [filter, setFilter] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState("amber");

  const filtered = notes
    .filter((n) => !filter || n.content.toLowerCase().includes(filter.toLowerCase()) || n.tags.some((t) => t.name.toLowerCase().includes(filter.toLowerCase())))
    .filter((n) => !showPinnedOnly || n.pinned)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function add() {
    if (!draft.trim()) return;
    onAdd(currentPage, draft.trim(), color);
    setDraft("");
    toast.success("Note added", { description: `Page ${currentPage}` });
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <StickyNote className="h-4 w-4 text-amber-500" />
        <h3 className="flex-1 text-sm font-semibold">Notes</h3>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">{notes.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" aria-label="Export notes"><Download className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("md")} className="text-xs"><Tag className="mr-2 h-3.5 w-3.5" /> Export as Markdown</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("txt")} className="text-xs"><Tag className="mr-2 h-3.5 w-3.5" /> Export as TXT</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("json")} className="text-xs"><Tag className="mr-2 h-3.5 w-3.5" /> Export as JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {onClose && <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg lg:hidden" onClick={onClose}><X className="h-4 w-4" /></Button>}
      </div>

      {/* Add note */}
      <div className="border-b border-border/60 p-3">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add a note for page ${currentPage}…`} className="mb-2 min-h-[60px] resize-none text-sm" />
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={cn("h-5 w-5 rounded-full ring-1 ring-black/10 transition-transform", colorDotClass(c), color === c && "scale-125 ring-2 ring-emerald-500")} aria-label={c} />
            ))}
          </div>
          <Button size="sm" className="h-8" onClick={add} disabled={!draft.trim()}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 border-b border-border/60 p-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search notes…" className="h-8 pl-8 text-xs" />
        </div>
        <Button variant={showPinnedOnly ? "default" : "outline"} size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowPinnedOnly(!showPinnedOnly)} aria-label="Pinned only"><Pin className="h-3.5 w-3.5" /></Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {filtered.length === 0 ? (
            <div className="px-2 py-12 text-center">
              <StickyNote className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">{filter ? "No matching notes" : "No notes yet"}</p>
            </div>
          ) : (
            filtered.map((n) => (
              <NoteCard key={n.id} note={n} editing={editing === n.id} draft={draft} setDraft={setDraft}
                onEdit={() => { setEditing(n.id); setDraft(n.content); }}
                onCancel={() => { setEditing(null); setDraft(""); }}
                onSave={() => { onUpdate(n.id, { content: draft }); setEditing(null); setDraft(""); toast.success("Note updated"); }}
                onTogglePin={() => onUpdate(n.id, { pinned: !n.pinned })}
                onNavigate={() => onNavigate(n.page)}
                onDelete={() => onRemove(n.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function NoteCard({ note, editing, draft, setDraft, onEdit, onCancel, onSave, onTogglePin, onNavigate, onDelete }: {
  note: NoteAnnotation; editing: boolean; draft: string; setDraft: (s: string) => void;
  onEdit: () => void; onCancel: () => void; onSave: () => void; onTogglePin: () => void; onNavigate: () => void; onDelete: () => void;
}) {
  return (
    <div className={cn("rounded-xl border p-2.5", note.pinned ? "border-amber-400/40 bg-amber-400/[0.08]" : "border-border/60 bg-card")}>
      <div className="mb-1 flex items-center justify-between">
        <button onClick={onNavigate} className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
          <span className={cn("h-2 w-2 rounded-full", colorDotClass(note.color))} /> Page {note.page}
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={onTogglePin} className="rounded p-1 hover:bg-accent"><Pin className={cn("h-3 w-3", note.pinned ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} /></button>
          {editing ? (
            <>
              <button onClick={onSave} className="rounded p-1 text-emerald-600 hover:bg-accent"><Check className="h-3 w-3" /></button>
              <button onClick={onCancel} className="rounded p-1 hover:bg-accent"><X className="h-3 w-3" /></button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="rounded p-1 hover:bg-accent"><Pencil className="h-3 w-3" /></button>
              <button onClick={onDelete} className="rounded p-1 text-rose-500 hover:bg-accent"><Trash2 className="h-3 w-3" /></button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[60px] resize-none text-xs" autoFocus />
      ) : (
        <p className="text-xs leading-relaxed text-foreground/85">{note.content}</p>
      )}
      {note.tags.length > 0 && !editing && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {note.tags.map((t) => <span key={t.id} className="rounded-full bg-emerald-500/15 px-1.5 py-0 text-[9px] text-emerald-700 dark:text-emerald-300">#{t.name}</span>)}
        </div>
      )}
    </div>
  );
}

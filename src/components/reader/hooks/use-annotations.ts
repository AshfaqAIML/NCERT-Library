"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type {
  BookmarkAnnotation, DrawingAnnotation, HighlightAnnotation, NoteAnnotation, Rect,
} from "../types";

interface Annotations {
  highlights: HighlightAnnotation[];
  bookmarks: BookmarkAnnotation[];
  notes: NoteAnnotation[];
  drawings: DrawingAnnotation[];
  loading: boolean;
}

function parseRects(note?: string | null): Rect[] {
  if (!note) return [];
  try {
    const p = JSON.parse(note);
    return Array.isArray(p?.rects) ? p.rects : [];
  } catch {
    return [];
  }
}

/**
 * Loads & mutates all annotations for a book. Keeps local state in sync with the API.
 * Falls back to local-only storage for guests (no persistence).
 */
export function useAnnotations(bookId: string | null, isAuthed: boolean) {
  const [state, setState] = useState<Annotations>({
    highlights: [], bookmarks: [], notes: [], drawings: [], loading: true,
  });

  // Load
  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        if (isAuthed) {
          const [h, b, n, d] = await Promise.all([
            api<any[]>(`/api/books/${bookId}/highlights`),
            api<any[]>(`/api/books/${bookId}/bookmarks`),
            api<any[]>(`/api/books/${bookId}/notes`),
            api<any[]>(`/api/books/${bookId}/drawings`),
          ]);
          if (cancelled) return;
          setState({
            loading: false,
            highlights: h.map(normalizeHighlight),
            bookmarks: b.map(normalizeBookmark),
            notes: n.map(normalizeNote),
            drawings: d.map(normalizeDrawing),
          });
        } else {
          // guests: try localStorage
          const local = loadLocal(bookId);
          setState({ loading: false, ...local });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [bookId, isAuthed]);

  // ---- Highlights ----
  const addHighlight = useCallback(async (page: number, text: string, rects: Rect[], color: string, kind: "HIGHLIGHT" | "UNDERLINE" | "STRIKETHROUGH" = "HIGHLIGHT") => {
    const tempId = `tmp-${Date.now()}`;
    const local: HighlightAnnotation = {
      id: tempId, page, text, color: color as any, kind, rects, createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, highlights: [local, ...s.highlights] }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, highlights: [local, ...cur.highlights] })); return local; }
    try {
      const created = await api<any>(`/api/books/${bookId}/highlights`, {
        method: "POST", body: JSON.stringify({ page, text, color, kind, note: JSON.stringify({ rects }) }),
      });
      const norm = normalizeHighlight(created);
      setState((s) => ({ ...s, highlights: s.highlights.map((h) => (h.id === tempId ? norm : h)) }));
      return norm;
    } catch { return local; }
  }, [bookId, isAuthed]);

  const removeHighlight = useCallback(async (id: string) => {
    setState((s) => ({ ...s, highlights: s.highlights.filter((h) => h.id !== id) }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, highlights: cur.highlights.filter((h) => h.id !== id) })); return; }
    if (id.startsWith("tmp-")) return;
    api(`/api/books/${bookId}/highlights`, { method: "DELETE", body: JSON.stringify({ highlightId: id }) }).catch(() => {});
  }, [bookId, isAuthed]);

  const updateHighlight = useCallback(async (id: string, patch: Partial<HighlightAnnotation>) => {
    setState((s) => ({ ...s, highlights: s.highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
    if (!isAuthed || id.startsWith("tmp-")) return;
    api(`/api/books/${bookId}/highlights`, { method: "PATCH", body: JSON.stringify({ highlightId: id, ...patch }) }).catch(() => {});
  }, [bookId, isAuthed]);

  // ---- Bookmarks ----
  const toggleBookmark = useCallback(async (page: number, label?: string) => {
    const existing = state.bookmarks.find((b) => b.page === page);
    if (existing) {
      setState((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.page !== page) }));
      if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, bookmarks: cur.bookmarks.filter((b) => b.page !== page) })); return false; }
      api(`/api/books/${bookId}/bookmarks?page=${page}`, { method: "DELETE" }).catch(() => {});
      return false;
    }
    const temp: BookmarkAnnotation = { id: `tmp-${Date.now()}`, page, label, color: "amber", folder: "default", createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, bookmarks: [temp, ...s.bookmarks] }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, bookmarks: [temp, ...cur.bookmarks] })); return true; }
    try {
      const created = await api<any>(`/api/books/${bookId}/bookmarks`, { method: "POST", body: JSON.stringify({ page, label }) });
      setState((s) => ({ ...s, bookmarks: s.bookmarks.map((b) => (b.id === temp.id ? normalizeBookmark(created) : b)) }));
    } catch {}
    return true;
  }, [bookId, isAuthed, state.bookmarks]);

  // ---- Notes ----
  const addNote = useCallback(async (page: number, content: string, x = 0, y = 0, color = "amber") => {
    const temp: NoteAnnotation = {
      id: `tmp-${Date.now()}`, page, content, x, y, pinned: false, color, tags: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, notes: [temp, ...s.notes] }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, notes: [temp, ...cur.notes] })); return temp; }
    try {
      const created = await api<any>(`/api/books/${bookId}/notes`, { method: "POST", body: JSON.stringify({ page, content, x, y, color }) });
      const norm = normalizeNote(created);
      setState((s) => ({ ...s, notes: s.notes.map((n) => (n.id === temp.id ? norm : n)) }));
      return norm;
    } catch { return temp; }
  }, [bookId, isAuthed]);

  const updateNote = useCallback(async (id: string, patch: Partial<NoteAnnotation>) => {
    setState((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)) }));
    if (!isAuthed || id.startsWith("tmp-")) { if (!isAuthed) saveLocal(bookId, (cur) => ({ ...cur, notes: cur.notes })); return; }
    api(`/api/books/${bookId}/notes`, { method: "PATCH", body: JSON.stringify({ noteId: id, ...patch }) }).catch(() => {});
  }, [bookId, isAuthed]);

  const removeNote = useCallback(async (id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, notes: cur.notes.filter((n) => n.id !== id) })); return; }
    if (id.startsWith("tmp-")) return;
    api(`/api/books/${bookId}/notes`, { method: "DELETE", body: JSON.stringify({ noteId: id }) }).catch(() => {});
  }, [bookId, isAuthed]);

  // ---- Drawings ----
  const addDrawing = useCallback(async (page: number, tool: any, color: string, strokeWidth: number, points: any[]) => {
    const temp: DrawingAnnotation = { id: `tmp-${Date.now()}`, page, tool, color, strokeWidth, points, createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, drawings: [...s.drawings, temp] }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, drawings: [...cur.drawings, temp] })); return temp; }
    try {
      const created = await api<any>(`/api/books/${bookId}/drawings`, { method: "POST", body: JSON.stringify({ page, tool, color, strokeWidth, data: points }) });
      setState((s) => ({ ...s, drawings: s.drawings.map((d) => (d.id === temp.id ? normalizeDrawing(created) : d)) }));
      return created;
    } catch { return temp; }
  }, [bookId, isAuthed]);

  const removeDrawing = useCallback(async (id: string) => {
    setState((s) => ({ ...s, drawings: s.drawings.filter((d) => d.id !== id) }));
    if (!isAuthed) { saveLocal(bookId, (cur) => ({ ...cur, drawings: cur.drawings.filter((d) => d.id !== id) })); return; }
    if (id.startsWith("tmp-")) return;
    api(`/api/books/${bookId}/drawings`, { method: "DELETE", body: JSON.stringify({ drawingId: id }) }).catch(() => {});
  }, [bookId, isAuthed]);

  return {
    ...state,
    addHighlight, removeHighlight, updateHighlight,
    toggleBookmark,
    addNote, updateNote, removeNote,
    addDrawing, removeDrawing,
  };
}

// ---- normalizers ----
function normalizeHighlight(h: any): HighlightAnnotation {
  return {
    id: h.id, page: h.page, text: h.text, color: h.color, kind: h.kind,
    rects: parseRects(h.note), note: h.note, label: h.label, category: h.category,
    pinned: h.pinned, createdAt: h.createdAt,
  };
}
function normalizeBookmark(b: any): BookmarkAnnotation {
  return { id: b.id, page: b.page, label: b.label, color: b.color, folder: b.folder, createdAt: b.createdAt };
}
function normalizeNote(n: any): NoteAnnotation {
  return {
    id: n.id, page: n.page, content: n.content, x: n.x, y: n.y, pinned: n.pinned, color: n.color,
    tags: (n.tags || []).map((t: any) => ({ id: t.tag?.id || t.id, name: t.tag?.name || t.name, color: t.tag?.color || t.color })),
    createdAt: n.createdAt, updatedAt: n.updatedAt,
  };
}
function normalizeDrawing(d: any): DrawingAnnotation {
  let pts: any[] = [];
  try { pts = JSON.parse(d.data); } catch {}
  return { id: d.id, page: d.page, tool: d.tool, color: d.color, strokeWidth: d.strokeWidth, points: pts, createdAt: d.createdAt };
}

// ---- guest local storage ----
const LOCAL_KEY = (bookId: string) => `nl-reader-${bookId}`;
function loadLocal(bookId: string): Pick<Annotations, "highlights" | "bookmarks" | "notes" | "drawings"> {
  if (typeof window === "undefined") return { highlights: [], bookmarks: [], notes: [], drawings: [] };
  try {
    const raw = localStorage.getItem(LOCAL_KEY(bookId));
    if (!raw) return { highlights: [], bookmarks: [], notes: [], drawings: [] };
    return JSON.parse(raw);
  } catch { return { highlights: [], bookmarks: [], notes: [], drawings: [] }; }
}
function saveLocal(bookId: string, fn: (cur: Pick<Annotations, "highlights" | "bookmarks" | "notes" | "drawings">) => Pick<Annotations, "highlights" | "bookmarks" | "notes" | "drawings">) {
  if (typeof window === "undefined") return;
  const cur = loadLocal(bookId);
  localStorage.setItem(LOCAL_KEY(bookId), JSON.stringify(fn(cur)));
}

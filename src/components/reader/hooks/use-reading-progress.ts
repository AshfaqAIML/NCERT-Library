"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { ReadingStats } from "../types";

interface ProgressState {
  currentPage: number;
  totalPages: number;
  percent: number;
  timeSpentSec: number;
  pagesReadToday: number;
  streak: number;
  sessionId: string | null;
}

/**
 * Tracks reading progress: current page, percent, time spent, pages today, streak.
 * - Starts a ReadingSession on mount.
 * - Heartbeats every 30s, accumulating time spent.
 * - Auto-saves progress on a debounced interval.
 */
export function useReadingProgress(bookId: string | null, isAuthed: boolean, totalPages: number) {
  const [state, setState] = useState<ProgressState>({
    currentPage: 1, totalPages, percent: 0, timeSpentSec: 0, pagesReadToday: 0, streak: 0, sessionId: null,
  });
  const sessionRef = useRef<{ startPage: number; lastTick: number; pagesRead: number } | null>(null);
  const visitedPagesRef = useRef<Set<number>>(new Set());
  const stateRef = useRef(state);
  useLayoutEffect(() => { stateRef.current = state; }, [state]);

  // Resume + start session
  useEffect(() => {
    if (!bookId || !isAuthed) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await api<any>(`/api/books/${bookId}/progress`);
        if (cancelled || !p) return;
        setState((s) => ({
          ...s,
          currentPage: p.currentPage || 1,
          totalPages: p.totalPages || totalPages,
          percent: p.percent || 0,
          timeSpentSec: p.timeSpentSec || 0,
          pagesReadToday: p.pagesReadToday || 0,
          streak: p.streak || 0,
        }));
        visitedPagesRef.current.add(p.currentPage || 1);
      } catch {}
      try {
        const startPage = stateRef.current.currentPage;
        const sess = await api<any>(`/api/books/${bookId}/sessions`, { method: "POST", body: JSON.stringify({ startPage }) });
        if (!cancelled && sess) {
          setState((s) => ({ ...s, sessionId: sess.id }));
          sessionRef.current = { startPage, lastTick: Date.now(), pagesRead: visitedPagesRef.current.size };
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [bookId, isAuthed, totalPages]);

  // Heartbeat — accumulate time every 30s and ping the session
  useEffect(() => {
    const id = setInterval(() => {
      const sess = sessionRef.current;
      if (!sess) return;
      const now = Date.now();
      const delta = Math.round((now - sess.lastTick) / 1000);
      sess.lastTick = now;
      sess.pagesRead = visitedPagesRef.current.size;
      setState((s) => ({ ...s, timeSpentSec: s.timeSpentSec + delta }));
      const cur = stateRef.current;
      if (cur.sessionId && isAuthed && bookId) {
        api(`/api/books/${bookId}/sessions`, {
          method: "PATCH",
          body: JSON.stringify({ sessionId: cur.sessionId, endPage: cur.currentPage, pagesRead: sess.pagesRead, durationSec: delta }),
        }).catch(() => {});
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [bookId, isAuthed]);

  // End session on unmount
  useEffect(() => {
    return () => {
      const sess = sessionRef.current;
      const cur = stateRef.current;
      if (sess && cur.sessionId && isAuthed && bookId) {
        api(`/api/books/${bookId}/sessions`, {
          method: "PATCH",
          body: JSON.stringify({ sessionId: cur.sessionId, end: true, endPage: cur.currentPage, pagesRead: sess.pagesRead, durationSec: 0 }),
        }).catch(() => {});
      }
    };
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    visitedPagesRef.current.add(page);
    setState((s) => {
      const percent = s.totalPages > 1 ? Math.round((page / s.totalPages) * 100) : 0;
      return { ...s, currentPage: page, percent, pagesReadToday: visitedPagesRef.current.size };
    });
  }, []);

  // Auto-save progress (debounced)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!bookId || !isAuthed) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const s = stateRef.current;
      api(`/api/books/${bookId}/progress`, {
        method: "PUT",
        body: JSON.stringify({
          currentPage: s.currentPage, totalPages: s.totalPages,
          percent: s.percent, timeSpentSec: s.timeSpentSec,
          pagesReadToday: s.pagesReadToday,
        }),
      }).catch(() => {});
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [bookId, isAuthed, state.currentPage, state.percent, state.timeSpentSec, state.pagesReadToday]);

  const avgSpeed = state.timeSpentSec > 0 ? state.pagesReadToday / (state.timeSpentSec / 60) : 0;
  const stats: ReadingStats = {
    timeSpentSec: state.timeSpentSec,
    pagesReadToday: state.pagesReadToday,
    streak: state.streak,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    percent: state.percent,
    avgSpeedPagesPerMin: avgSpeed,
    estRemainingMin: avgSpeed > 0 ? Math.round((state.totalPages - state.currentPage) / avgSpeed) : 0,
  };

  return { state, setCurrentPage, stats, resumePage: state.currentPage };
}

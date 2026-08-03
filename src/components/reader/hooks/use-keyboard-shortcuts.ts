"use client";

import { useEffect } from "react";

export interface ShortcutHandlers {
  nextPage?: () => void;
  prevPage?: () => void;
  firstPage?: () => void;
  lastPage?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  toggleSearch?: () => void;
  toggleBookmark?: () => void;
  toggleFullscreen?: () => void;
  toggleLeftSidebar?: () => void;
  toggleRightSidebar?: () => void;
  cycleTheme?: () => void;
  exit?: () => void;
  openAi?: () => void;
  toggleFocus?: () => void;
}

/**
 * Centralized keyboard shortcut handler for the reader.
 * - ArrowRight/PageDown/Space → next page
 * - ArrowLeft/PageUp/Shift+Space → prev page
 * - Home/End → first/last
 * - +/- → zoom
 * - Ctrl/Cmd+F → search
 * - Ctrl/Cmd+B → bookmark
 * - Ctrl/Cmd+Shift+B → left sidebar
 * - Ctrl/Cmd+Shift+N → right sidebar
 * - F11/f → fullscreen
 * - t → cycle theme
 * - Esc → exit (when no dialog open)
 * - a → open AI
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "f") { e.preventDefault(); handlers.toggleSearch?.(); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); handlers.toggleLeftSidebar?.(); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === "n") { e.preventDefault(); handlers.toggleRightSidebar?.(); return; }
      if (mod && !e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); handlers.toggleBookmark?.(); return; }
      if (mod && (e.key === "+" || e.key === "=")) { e.preventDefault(); handlers.zoomIn?.(); return; }
      if (mod && e.key === "-") { e.preventDefault(); handlers.zoomOut?.(); return; }

      if (typing) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) { e.preventDefault(); handlers.nextPage?.(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) { e.preventDefault(); handlers.prevPage?.(); }
      else if (e.key === "Home") { e.preventDefault(); handlers.firstPage?.(); }
      else if (e.key === "End") { e.preventDefault(); handlers.lastPage?.(); }
      else if (e.key === "+" || e.key === "=") { handlers.zoomIn?.(); }
      else if (e.key === "-") { handlers.zoomOut?.(); }
      else if (e.key.toLowerCase() === "f" && !mod) { handlers.toggleFullscreen?.(); }
      else if (e.key === "F11") { e.preventDefault(); handlers.toggleFullscreen?.(); }
      else if (e.key.toLowerCase() === "t") { handlers.cycleTheme?.(); }
      else if (e.key.toLowerCase() === "a") { handlers.openAi?.(); }
      else if (e.key.toLowerCase() === "z") { handlers.toggleFocus?.(); }
      else if (e.key === "Escape") { handlers.exit?.(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers, enabled]);
}

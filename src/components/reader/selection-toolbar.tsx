"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Highlighter, Underline, Strikethrough, Copy, Sparkles, StickyNote, X, Type, Share2,
} from "lucide-react";
import { HIGHLIGHT_PALETTE, cn, colorDotClass } from "./reader-utils";
import type { HighlightColor, HighlightKind } from "./types";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  selection: { text: string; rects: { x: number; y: number; w: number; h: number }[]; page: number; clientX: number; clientY: number } | null;
  bookId: string | null;
  onHighlight: (color: HighlightColor, kind: HighlightKind) => void;
  onComment: () => void;
  onAiExplain: () => void;
  onDismiss: () => void;
}

/**
 * Floating toolbar that appears above the user's text selection.
 * Quick actions: highlight colors, underline, strikethrough, copy, comment, AI explain.
 */
export function SelectionToolbar({ selection, bookId, onHighlight, onComment, onAiExplain, onDismiss }: Props) {
  const [colorOpen, setColorOpen] = useState(false);

  async function shareHighlight() {
    if (!selection || !bookId) return;
    try {
      const { api } = await import("@/lib/api-client");
      const res = await api<{ shareUrl: string }>("/api/share", {
        method: "POST",
        body: JSON.stringify({ bookId, text: selection.text, color: "amber" }),
      });
      if (navigator.share) {
        navigator.share({ title: "NCERT Highlight", text: selection.text, url: window.location.origin + res.shareUrl }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(window.location.origin + res.shareUrl);
        toast.success("Share link copied!");
      }
    } catch {
      toast.error("Could not share highlight");
    }
    onDismiss();
  }

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 -translate-y-full"
          style={{
            left: Math.min(Math.max(selection.clientX - 140, 8), window.innerWidth - 320),
            top: selection.clientY - 12,
          }}
        >
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-lift">
            {/* Color picker */}
            <div className="relative">
              <button
                onClick={() => setColorOpen(!colorOpen)}
                className="flex h-8 items-center gap-1 rounded-lg px-2 hover:bg-accent"
                aria-label="Highlight color"
              >
                <Highlighter className="h-4 w-4 text-amber-500" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
              </button>
              {colorOpen && (
                <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lift">
                  {HIGHLIGHT_PALETTE.slice(0, 6).map((c) => (
                    <button
                      key={c.key}
                      onClick={() => { onHighlight(c.key, "HIGHLIGHT"); setColorOpen(false); }}
                      className={cn("h-6 w-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110", c.dot)}
                      aria-label={c.label}
                      title={c.label}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-border" />

            <button onClick={() => onHighlight("amber", "UNDERLINE")} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent" aria-label="Underline" title="Underline">
              <Underline className="h-4 w-4" />
            </button>
            <button onClick={() => onHighlight("rose", "STRIKETHROUGH")} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent" aria-label="Strikethrough" title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-border" />

            <button
              onClick={() => { navigator.clipboard.writeText(selection.text); toast.success("Copied"); onDismiss(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Copy"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={shareHighlight} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent" aria-label="Share" title="Share highlight">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={onComment} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent" aria-label="Add note" title="Add note">
              <StickyNote className="h-4 w-4" />
            </button>
            <button onClick={onAiExplain} className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-white hover:bg-emerald-700" aria-label="AI explain" title="Explain with AI">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Explain</span>
            </button>
            <button onClick={onDismiss} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

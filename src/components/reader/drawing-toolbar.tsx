"use client";

import { Pen, Highlighter, Square, ArrowRight, Minus, Type as TypeIcon, Eraser, Undo2, Redo2, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DrawingTool } from "./types";
import { useState } from "react";

interface Props {
  active: boolean;
  tool: DrawingTool | null;
  color: string;
  strokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (t: DrawingTool) => void;
  onColor: (c: string) => void;
  onStrokeWidth: (w: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
}

const TOOLS: { id: DrawingTool; icon: any; label: string }[] = [
  { id: "PEN", icon: Pen, label: "Pen" },
  { id: "HIGHLIGHTER", icon: Highlighter, label: "Highlighter" },
  { id: "RECTANGLE", icon: Square, label: "Rectangle" },
  { id: "ARROW", icon: ArrowRight, label: "Arrow" },
  { id: "LINE", icon: Minus, label: "Line" },
  { id: "TEXT_BOX", icon: TypeIcon, label: "Text" },
  { id: "ERASER", icon: Eraser, label: "Eraser" },
];

const COLORS = ["#0f766e", "#dc2626", "#f59e0b", "#7c3aed", "#2563eb", "#ec4899", "#000000"];

/**
 * Floating drawing toolbar — appears when annotation/drawing mode is enabled.
 */
export function DrawingToolbar({ active, tool, color, strokeWidth, canUndo, canRedo, onTool, onColor, onStrokeWidth, onUndo, onRedo, onClose }: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  if (!active) return null;

  return (
    <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-0.5 rounded-2xl border border-border bg-card p-1.5 shadow-lift">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTool(t.id)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
              tool === t.id ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            title={t.label}
            aria-label={t.label}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Color */}
        <div className="relative">
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-accent"
            aria-label="Color"
          >
            <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: color }} />
          </button>
          {paletteOpen && (
            <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-xl border border-border bg-card p-2 shadow-lift">
              {COLORS.map((c) => (
                <button key={c} onClick={() => { onColor(c); setPaletteOpen(false); }} className="h-6 w-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110" style={{ background: c }} aria-label={c} />
              ))}
            </div>
          )}
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-1 px-1">
          <input
            type="range"
            min={1}
            max={12}
            value={strokeWidth}
            onChange={(e) => onStrokeWidth(Number(e.target.value))}
            className="w-16 accent-emerald-600"
            aria-label="Stroke width"
          />
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        <button onClick={onUndo} disabled={!canUndo} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent disabled:opacity-30" aria-label="Undo"><Undo2 className="h-4 w-4" /></button>
        <button onClick={onRedo} disabled={!canRedo} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent disabled:opacity-30" aria-label="Redo"><Redo2 className="h-4 w-4" /></button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 hover:bg-accent" aria-label="Exit drawing"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

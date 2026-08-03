"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { DrawingTool, Point, DrawingAnnotation } from "./types";

interface Props {
  active: boolean;
  tool: DrawingTool | null;
  color: string;
  strokeWidth: number;
  page: number;
  scale: number;
  drawings: DrawingAnnotation[];
  onAddDrawing: (page: number, tool: DrawingTool, color: string, strokeWidth: number, points: Point[]) => void;
  onRemoveDrawing: (id: string) => void;
}

interface ActiveStroke {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  points: Point[];
}

/**
 * Drawing canvas overlay for the PDF reader.
 * Sits above the PDF page and captures freehand pen, shapes, and text annotations.
 * Drawings are persisted via the onAddDrawing callback.
 */
export function DrawingCanvas({ active, tool, color, strokeWidth, page, scale, drawings, onAddDrawing, onRemoveDrawing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStroke, setActiveStroke] = useState<ActiveStroke | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Resize canvas to match container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Redraw all existing drawings + active stroke
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing drawings for this page
    const pageDrawings = drawings.filter((d) => d.page === page);
    for (const d of pageDrawings) {
      drawStroke(ctx, { tool: d.tool, color: d.color, strokeWidth: d.strokeWidth, points: d.points });
    }

    // Draw active stroke
    if (activeStroke) {
      drawStroke(ctx, activeStroke);
    }
  }, [drawings, page, activeStroke]);

  useEffect(() => { redraw(); }, [redraw]);

  // Pointer handlers
  const getPoint = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  function onPointerDown(e: React.PointerEvent) {
    if (!active || !tool || tool === "ERASER") return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pt = getPoint(e);
    setActiveStroke({ tool, color, strokeWidth, points: [pt] });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!activeStroke) return;
    e.preventDefault();
    const pt = getPoint(e);
    setActiveStroke((s) => s ? { ...s, points: [...s.points, pt] } : s);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!activeStroke) return;
    e.preventDefault();
    // Simplify points (reduce density) — keep every 2nd point for pen
    const pts = activeStroke.tool === "PEN" || activeStroke.tool === "HIGHLIGHTER"
      ? activeStroke.points.filter((_, i) => i % 2 === 0 || i === activeStroke.points.length - 1)
      : activeStroke.points;

    if (pts.length >= 2 || activeStroke.tool === "TEXT_BOX") {
      onAddDrawing(page, activeStroke.tool, activeStroke.color, activeStroke.strokeWidth, pts);
    }
    setActiveStroke(null);
  }

  // Eraser: click to remove nearest drawing
  function onPointerDownEraser(e: React.PointerEvent) {
    if (!active || tool !== "ERASER") return;
    const pt = getPoint(e);
    const pageDrawings = drawings.filter((d) => d.page === page);
    // Find nearest drawing (by distance to any of its points)
    let closest: DrawingAnnotation | null = null;
    let minDist = Infinity;
    for (const d of pageDrawings) {
      for (const p of d.points) {
        const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
        if (dist < minDist) { minDist = dist; closest = d; }
      }
    }
    if (closest && minDist < 0.05) {
      onRemoveDrawing(closest.id);
    }
  }

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{ pointerEvents: active ? "auto" : "none", cursor: active ? "crosshair" : "default" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerDown={tool === "ERASER" ? onPointerDownEraser : onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={tool === "ERASER" ? undefined : onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </div>
  );
}

/** Draw a stroke (pen, shape, or text placeholder) onto the canvas. */
function drawStroke(ctx: CanvasRenderingContext2D, stroke: { tool: DrawingTool; color: string; strokeWidth: number; points: Point[] }) {
  if (stroke.points.length === 0) return;
  const w = ctx.canvas.width / (window.devicePixelRatio || 1);
  const h = ctx.canvas.height / (window.devicePixelRatio || 1);

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (stroke.tool === "HIGHLIGHTER") {
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = stroke.strokeWidth * 3;
  }

  const pts = stroke.points.map((p) => ({ x: p.x * w, y: p.y * h }));

  switch (stroke.tool) {
    case "PEN":
    case "HIGHLIGHTER":
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      break;
    case "LINE":
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      break;
    case "RECTANGLE":
      if (pts.length >= 2) {
        const x = Math.min(pts[0].x, pts[pts.length - 1].x);
        const y = Math.min(pts[0].y, pts[pts.length - 1].y);
        const rw = Math.abs(pts[pts.length - 1].x - pts[0].x);
        const rh = Math.abs(pts[pts.length - 1].y - pts[0].y);
        ctx.strokeRect(x, y, rw, rh);
      }
      break;
    case "ARROW":
      if (pts.length >= 2) {
        const start = pts[0];
        const end = pts[pts.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 12;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      break;
    case "TEXT_BOX":
      if (pts.length >= 1) {
        ctx.globalAlpha = 0.15;
        ctx.fillRect(pts[0].x - 2, pts[0].y - 12, 80, 20);
        ctx.globalAlpha = 1;
        ctx.font = "12px sans-serif";
        ctx.fillText("Click to add text", pts[0].x, pts[0].y);
      }
      break;
  }
  ctx.restore();
}

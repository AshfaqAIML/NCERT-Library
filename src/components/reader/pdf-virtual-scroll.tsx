"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PageRenderCache } from "./hooks/use-pdf-render";
import type { HighlightAnnotation, NoteAnnotation } from "./types";
import { colorFillClass } from "./types";

interface PdfVirtualScrollProps {
  doc: pdfjsLib.PDFDocumentProxy | null;
  cacheRef: React.MutableRefObject<PageRenderCache | null>;
  scale: number;
  rotation: number;
  pageSpacing: number;
  layout: "continuous" | "single" | "two";
  readingDirection: "ltr" | "rtl";
  pageTransition: "none" | "slide" | "fade";
  currentPage: number;
  onPageChange: (page: number) => void;
  highlights: HighlightAnnotation[];
  notes: NoteAnnotation[];
  onPageText?: (page: number, text: string) => void;
  onSelectionChange?: (sel: { text: string; rects: { x: number; y: number; w: number; h: number }[]; page: number; clientX: number; clientY: number } | null) => void;
}

interface PageInfo { width: number; height: number; top: number }

/**
 * Virtualized continuous-scroll PDF renderer.
 * - Computes page layout (positions/sizes) up-front.
 * - Only renders canvases for pages near the viewport (virtualization).
 * - Renders a text layer for selectable text + highlight overlay support.
 * - Recycles canvases via the PageRenderCache.
 * - Prefetches adjacent pages.
 */
export function PdfVirtualScroll({
  doc, cacheRef, scale, rotation, pageSpacing, layout, readingDirection, pageTransition,
  currentPage, onPageChange, highlights, notes, onPageText, onSelectionChange,
}: PdfVirtualScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [visible, setVisible] = useState<Set<number>>(new Set([1]));
  const [rendered, setRendered] = useState<Map<number, RenderedSlot>>(new Map());
  const scrollLockRef = useRef(false);

  // 1. Compute page layout (width/height/top for every page) up front.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async layout computation publishes results once
    if (!doc) { setPages([]); return; }
    let cancelled = false;
    (async () => {
      const infos: PageInfo[] = [];
      let top = 0;
      const baseScale = scale;
      for (let i = 1; i <= doc.numPages; i++) {
        if (cancelled) return;
        try {
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: baseScale, rotation });
          infos.push({ width: vp.width, height: vp.height, top });
          // two-page layout: pages share a row; continuous & single stack vertically
          top += vp.height + pageSpacing;
        } catch { /* skip */ }
      }
      if (!cancelled) setPages(infos);
    })();
    return () => { cancelled = true; };
  }, [doc, scale, rotation, pageSpacing]);

  // 2. Determine which pages are visible + prefetch neighbors.
  const computeVisible = useCallback(() => {
    const el = containerRef.current;
    if (!el || pages.length === 0) return;
    const scrollTop = el.scrollTop;
    const viewportH = el.clientHeight;
    const vis = new Set<number>();
    const PREFETCH = 2;
    const first = pages.findIndex((p) => p.top + p.height > scrollTop);
    const last = pages.findIndex((p) => p.top > scrollTop + viewportH);
    const from = Math.max(0, first - PREFETCH);
    const to = Math.min(pages.length - 1, (last < 0 ? pages.length - 1 : last) + PREFETCH);
    for (let i = from; i <= to; i++) vis.add(i + 1);

    // Determine the "current" page (most visible)
    const center = scrollTop + viewportH / 2;
    let curPage = currentPage;
    let bestDist = Infinity;
    pages.forEach((p, i) => {
      const pageCenter = p.top + p.height / 2;
      const d = Math.abs(pageCenter - center);
      if (d < bestDist) { bestDist = d; curPage = i + 1; }
    });
    if (curPage !== currentPage && !scrollLockRef.current) {
      onPageChange(curPage);
    }
    // Only update if the visible set actually changed (avoids extra re-renders)
    setVisible((prev) => {
      if (prev.size === vis.size && [...vis].every((v) => prev.has(v))) return prev;
      return vis;
    });
  }, [pages, currentPage, onPageChange]);

  // 3. Render visible pages. We intentionally do NOT depend on `rendered` here
  // (we read it via the setter callback) to avoid render→setState→render loops.
  const renderedRef = useRef(rendered);
  useLayoutEffect(() => { renderedRef.current = rendered; }, [rendered]);
  useEffect(() => {
    if (!doc || visible.size === 0) return;
    let cancelled = false;
    (async () => {
      for (const page of visible) {
        if (cancelled) return;
        if (renderedRef.current.has(page)) continue;
        try {
          const r = await cacheRef.current!.render(page, scale, rotation);
          if (cancelled) return;
          setRendered((m) => {
            if (m.has(page)) return m; // no change → no re-render
            const next = new Map(m);
            next.set(page, { canvas: r.canvas, width: r.width, height: r.height });
            return next;
          });
        } catch (e) {
          // RenderingCancelledException etc — ignore
        }
      }
      // evict rendered pages far from viewport (only if something actually leaves)
      setRendered((m) => {
        let changed = false;
        const next = new Map(m);
        for (const key of next.keys()) {
          if (!visible.has(key) && Math.abs(key - currentPage) > 4) {
            next.delete(key);
            changed = true;
          }
        }
        return changed ? next : m;
      });
    })();
    return () => { cancelled = true; };
  }, [doc, visible, scale, rotation, currentPage]);

  // 4. Re-render when scale/rotation changes (invalidate cache).
  useEffect(() => {
    cacheRef.current?.invalidate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cache invalidation must reset rendered slots
    setRendered(new Map());
  }, [scale, rotation, cacheRef]);

  // 5. Scroll listener (throttled via rAF).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeVisible);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial visible-pages computation
    computeVisible();
    return () => { el.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [computeVisible]);

  // 6. Scroll to a specific page (when currentPage changes externally, e.g. TOC click).
  const lastScrollToRef = useRef(0);
  useEffect(() => {
    if (!pages.length) return;
    // if the current page is already the visible center, don't jump
    const info = pages[currentPage - 1];
    if (!info) return;
    const el = containerRef.current;
    if (!el) return;
    const center = el.scrollTop + el.clientHeight / 2;
    const pageCenter = info.top + info.height / 2;
    if (Math.abs(center - pageCenter) > info.height * 0.6 && Date.now() - lastScrollToRef.current > 300) {
      lastScrollToRef.current = Date.now();
      scrollLockRef.current = true;
      el.scrollTo({ top: Math.max(0, info.top - (el.clientHeight - info.height) / 2), behavior: pageTransition === "none" ? "auto" : "smooth" });
      setTimeout(() => { scrollLockRef.current = false; }, 600);
    }
  }, [currentPage, pages, pageTransition]);

  // 7. Extract text content for the current page (for AI search/highlight).
  useEffect(() => {
    if (!doc || !onPageText) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(currentPage);
        const tc = await page.getTextContent();
        const text = tc.items.map((it: any) => it.str).join(" ");
        if (!cancelled) onPageText(currentPage, text);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [doc, currentPage, onPageText]);

  // 8. Text selection → highlight rects
  function handleMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !onSelectionChange) { onSelectionChange?.(null); return; }
    const text = sel.toString().trim();
    if (!text) { onSelectionChange?.(null); return; }
    // find which page the selection is on
    const range = sel.getRangeAt(0);
    const pageEl = (range.startContainer as HTMLElement)?.closest?.("[data-page]");
    if (!pageEl) { onSelectionChange?.(null); return; }
    const page = Number(pageEl.getAttribute("data-page"));
    const wrap = pageEl.getBoundingClientRect();
    const domRects = range.getClientRects();
    const rects: { x: number; y: number; w: number; h: number }[] = [];
    for (let i = 0; i < domRects.length; i++) {
      const r = domRects[i];
      if (r.width < 2) continue;
      rects.push({
        x: (r.left - wrap.left) / wrap.width,
        y: (r.top - wrap.top) / wrap.height,
        w: r.width / wrap.width,
        h: r.height / wrap.height,
      });
    }
    if (rects.length === 0) { onSelectionChange?.(null); return; }
    const lastRect = domRects[domRects.length - 1];
    onSelectionChange({ text, rects, page, clientX: lastRect.right, clientY: lastRect.top });
  }

  const totalHeight = pages.length ? pages[pages.length - 1].top + pages[pages.length - 1].height : 0;
  const pageHighlights = (page: number) => highlights.filter((h) => h.page === page);
  const pageNotes = (page: number) => notes.filter((n) => n.page === page);

  return (
    <div
      ref={containerRef}
      className="scroll-elegant relative h-full overflow-auto"
      onMouseUp={handleMouseUp}
      role="document"
      aria-label="PDF document content"
    >
      <div
        className="relative mx-auto"
        style={{
          height: totalHeight,
          width: pages.length ? Math.max(...pages.map((p) => p.width)) + 64 : "100%",
          maxWidth: "100%",
        }}
      >
        {pages.map((info, i) => {
          const pageNum = i + 1;
          const slot = rendered.get(pageNum);
          const isVisible = visible.has(pageNum);
          const hls = pageHighlights(pageNum);
          const nts = pageNotes(pageNum);
          return (
            <div
              key={pageNum}
              data-page={pageNum}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: info.top,
                width: info.width,
                height: info.height,
                visibility: isVisible ? "visible" : "hidden",
              }}
            >
              {/* Page canvas */}
              <div className="relative bg-white shadow-lg ring-1 ring-black/5" style={{ width: info.width, height: info.height }}>
                {slot ? (
                  <CanvasSlot canvas={slot.canvas} width={info.width} height={info.height} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/30">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                )}

                {/* Text layer (transparent, selectable) */}
                <TextLayer doc={doc} pageNum={pageNum} scale={scale} rotation={rotation} width={info.width} height={info.height} />

                {/* Highlight overlay */}
                {hls.map((hl) =>
                  hl.rects.map((r, ri) => (
                    <div
                      key={`${hl.id}-${ri}`}
                      className={`pdf-highlight-rect ${colorFillClass(hl.color)}`}
                      style={{
                        left: `${r.x * 100}%`,
                        top: `${r.y * 100}%`,
                        width: `${r.w * 100}%`,
                        height: `${r.h * 100}%`,
                        borderBottomStyle: hl.kind === "UNDERLINE" ? "solid" : undefined,
                        borderBottomWidth: hl.kind === "UNDERLINE" ? 2 : undefined,
                        borderBottomColor: hl.kind === "UNDERLINE" ? "currentColor" : undefined,
                        textDecoration: hl.kind === "STRIKETHROUGH" ? "line-through" : undefined,
                      }}
                    />
                  ))
                )}

                {/* Sticky note pins */}
                {nts.map((n) => (
                  <div
                    key={n.id}
                    className="pdf-note-pin group"
                    style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
                    title={n.content}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white shadow-md ring-2 ring-white">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M5 3h14a1 1 0 011 1v3l-6 6v6l-4-2v-4L4 7V4a1 1 0 011-1z"/></svg>
                    </span>
                    {n.pinned && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />}
                  </div>
                ))}

                {/* Page number badge */}
                <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                  {pageNum}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RenderedSlot { canvas: HTMLCanvasElement; width: number; height: number }

function CanvasSlot({ canvas, width, height }: { canvas: HTMLCanvasElement; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // Copy the canvas into our host (cloneNode would produce a BLANK canvas —
    // pixel data is not part of the DOM and is never cloned). Copy the bitmap
    // instead so the page stays visible even after the cache recycles the source.
    host.innerHTML = "";
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext("2d")!.drawImage(canvas, 0, 0);
    copy.style.width = `${width}px`;
    copy.style.height = `${height}px`;
    copy.style.display = "block";
    host.appendChild(copy);
  }, [canvas, width, height]);
  return <div ref={ref} className="absolute inset-0" />;
}

/** Renders the PDF.js text layer so text is selectable + searchable. */
function TextLayer({
  doc, pageNum, scale, rotation, width, height,
}: { doc: pdfjsLib.PDFDocumentProxy | null; pageNum: number; scale: number; rotation: number; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale, rotation });
        const tc = await page.getTextContent();
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        ref.current.style.setProperty("--scale-factor", String(scale));
        for (const item of tc.items as any[]) {
          if (!item.str) continue;
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontSize = Math.hypot(tx[2], tx[3]);
          const span = document.createElement("span");
          span.textContent = item.str;
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - fontSize}px`;
          span.style.fontSize = `${fontSize}px`;
          span.style.fontFamily = "sans-serif";
          if (item.width && fontSize) {
            const scaleFactor = (item.width * scale) / (fontSize * item.str.length || 1);
            span.style.transform = `scaleX(${scaleFactor})`;
          }
          span.style.transformOrigin = "0% 0%";
          ref.current.appendChild(span);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [doc, pageNum, scale, rotation]);
  return <div ref={ref} className="pdf-text-layer" style={{ width, height }} />;
}

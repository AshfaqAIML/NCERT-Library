"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * A render-cache that renders pages on demand into recycled canvases.
 * Keeps at most `maxCached` pages in memory; LRU eviction.
 * Returns a synchronous "get" for cached pages and a "render" promise.
 */
export class PageRenderCache {
  private cache = new Map<number, RenderedPage>();
  private free: HTMLCanvasElement[] = [];
  private tasks = new Map<number, Promise<RenderedPage>>();
  private doc: pdfjsLib.PDFDocumentProxy | null = null;

  constructor(private maxCached = 12) {}

  setDocument(doc: pdfjsLib.PDFDocumentProxy | null) {
    this.doc = doc;
    this.cache.clear();
    this.tasks.clear();
    this.free = [];
  }

  has(page: number) {
    return this.cache.has(page);
  }
  get(page: number): RenderedPage | undefined {
    const r = this.cache.get(page);
    if (r) {
      // refresh LRU
      this.cache.delete(page);
      this.cache.set(page, r);
    }
    return r;
  }

  /** Returns a page's viewport dimensions without rendering. */
  async getViewport(page: number, scale: number, rotation = 0) {
    if (!this.doc) return null;
    const p = await this.doc.getPage(page);
    return p.getViewport({ scale, rotation });
  }

  async render(page: number, scale: number, rotation = 0): Promise<RenderedPage> {
    if (!this.doc) throw new Error("no document");
    const key = page;
    const existing = this.cache.get(key);
    if (existing && existing.width > 0) return existing;
    const inFlight = this.tasks.get(key);
    if (inFlight) return inFlight;

    const task = (async () => {
      const pdfPage = await this.doc!.getPage(page);
      const viewport = pdfPage.getViewport({ scale, rotation });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = this.free.pop() ?? document.createElement("canvas");
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext("2d", { alpha: false })!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // @ts-ignore — render signature varies across pdfjs versions
      const renderTask = pdfPage.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
      const result: RenderedPage = { canvas, width: viewport.width, height: viewport.height };
      this.put(key, result);
      this.tasks.delete(key);
      return result;
    })();
    this.tasks.set(key, task);
    return task;
  }

  private put(page: number, rendered: RenderedPage) {
    if (this.cache.size >= this.maxCached) {
      // evict oldest
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        const evicted = this.cache.get(oldest);
        this.cache.delete(oldest);
        if (evicted) this.free.push(evicted.canvas); // recycle canvas
      }
    }
    this.cache.set(page, rendered);
  }

  invalidate(page?: number) {
    if (page !== undefined) {
      const r = this.cache.get(page);
      if (r) { this.free.push(r.canvas); this.cache.delete(page); }
    } else {
      for (const r of this.cache.values()) this.free.push(r.canvas);
      this.cache.clear();
    }
  }

  clear() { this.invalidate(); this.free = []; }
}

/**
 * React hook wrapper that ties a cache to a document.
 * The cache is stored in a ref so it persists across renders; consumers access
 * it via the returned ref. We do NOT force a re-render here — the parent
 * re-renders naturally when `doc` (passed as a prop) changes.
 */
export function usePageCache(doc: pdfjsLib.PDFDocumentProxy | null) {
  const cacheRef = useRef<PageRenderCache | null>(null);
  useEffect(() => {
    if (cacheRef.current == null) cacheRef.current = new PageRenderCache(14);
    cacheRef.current.setDocument(doc);
  }, [doc]);
  return cacheRef;
}

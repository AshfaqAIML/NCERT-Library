"use client";

import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ensureWorker } from "../pdf-worker";

interface State {
  doc: pdfjsLib.PDFDocumentProxy | null;
  loading: boolean;
  error: string | null;
  numPages: number;
}

/**
 * Loads a PDF document via pdf.js, ensuring the worker is configured.
 * Caches the document proxy across re-renders.
 */
export function usePdfDocument(url: string | null | undefined) {
  const [state, setState] = useState<State>({ doc: null, loading: false, error: null, numPages: 0 });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;

    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        await ensureWorker();
        loadingTask = pdfjsLib.getDocument({
          url,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          disableRange: false,
          disableStream: false,
        });
        const doc = await (loadingTask as any).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        setState({ doc, loading: false, error: null, numPages: doc.numPages });
      } catch (e) {
        if (!cancelled) {
          setState({ doc: null, loading: false, error: e instanceof Error ? e.message : "Failed to load PDF", numPages: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy?.().catch(() => {});
    };
  }, [url]);

  return state;
}

export { pdfjsLib };

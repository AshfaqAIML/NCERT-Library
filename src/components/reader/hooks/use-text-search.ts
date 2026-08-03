"use client";

import { useCallback, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { SearchMatch } from "../types";

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

/**
 * Full-text search across the entire PDF.
 * Walks pages lazily, extracts text via pdf.js, caches it.
 * Returns matches with snippets and supports navigation between them.
 */
export function useTextSearch(doc: pdfjsLib.PDFDocumentProxy | null) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState<SearchOptions>({ caseSensitive: false, wholeWord: false, regex: false });
  const textCache = useRef<Map<number, string>>(new Map());
  const cancelRef = useRef(false);

  const run = useCallback(async (q: string, opts: SearchOptions) => {
    if (!doc || !q.trim()) { setMatches([]); setCurrent(0); return; }
    setSearching(true);
    setMatches([]);
    setCurrent(0);
    cancelRef.current = false;

    const out: SearchMatch[] = [];
    let matchIndex = 0;
    const needle = opts.regex ? q : opts.caseSensitive ? q : q.toLowerCase();

    for (let i = 1; i <= doc.numPages; i++) {
      if (cancelRef.current) break;
      let text = textCache.current.get(i);
      if (!text) {
        try {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          text = tc.items.map((it: any) => it.str).join(" ");
          textCache.current.set(i, text);
        } catch { continue; }
      }
      const hay = opts.caseSensitive ? text : text.toLowerCase();
      let from = 0;
      let idx = opts.regex ? hay.search(needle) : hay.indexOf(needle as string, from);
      while (idx >= 0) {
        if (opts.wholeWord) {
          const before = idx > 0 ? hay[idx - 1] : " ";
          const after = hay[idx + q.length] || " ";
          if (!/[\s\W]/.test(before) || !/[\s\W]/.test(after)) {
            from = idx + q.length;
            idx = hay.indexOf(needle as string, from);
            continue;
          }
        }
        const start = Math.max(0, idx - 40);
        const snippet = (start > 0 ? "…" : "") + text.slice(start, idx + q.length + 60) + "…";
        out.push({ page: i, snippet, matchIndex: matchIndex++ });
        from = idx + q.length;
        idx = hay.indexOf(needle as string, from);
      }
      // incremental update so user sees results stream in
      if (out.length) setMatches([...out]);
    }
    setSearching(false);
  }, [doc]);

  const next = useCallback(() => setCurrent((c) => (matches.length ? (c + 1) % matches.length : 0)), [matches.length]);
  const prev = useCallback(() => setCurrent((c) => (matches.length ? (c - 1 + matches.length) % matches.length : 0)), [matches.length]);
  const cancel = useCallback(() => { cancelRef.current = true; }, []);

  return { query, setQuery, matches, searching, current, setCurrent, options, setOptions, run, next, prev, cancel };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2, AlertCircle, Pen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/hooks/use-books";
import { useStore } from "@/lib/store";
import { api, formatBytes } from "@/lib/api-client";
import { toast } from "sonner";
import { ensureWorker } from "./pdf-worker";
import { usePdfDocument } from "./hooks/use-pdf-document";
import { usePageCache } from "./hooks/use-pdf-render";
import { useAnnotations } from "./hooks/use-annotations";
import { useReadingProgress } from "./hooks/use-reading-progress";
import { useReaderSettings } from "./hooks/use-reader-settings";
import { useTextSearch } from "./hooks/use-text-search";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { ReaderToolbar } from "./reader-toolbar";
import { ReaderSidebar } from "./reader-sidebar";
import { NotesPanel } from "./notes-panel";
import { SelectionToolbar } from "./selection-toolbar";
import { SearchPanel } from "./search-panel";
import { SettingsDialog } from "./settings-dialog";
import { DrawingToolbar } from "./drawing-toolbar";
import { DrawingCanvas } from "./drawing-canvas";
import { ReadingProgressBar } from "./reading-progress-bar";
import { ReaderAiPanel } from "./reader-ai-panel";
import { PdfVirtualScroll } from "./pdf-virtual-scroll";
import { THEME_VARS, type ReaderTheme, type DrawingTool, type HighlightColor, type HighlightKind } from "./types";
import { exportAsMarkdown, exportAsText, exportAsJson, downloadFile } from "./export-utils";
import { cn } from "@/lib/utils";

interface Selection {
  text: string;
  rects: { x: number; y: number; w: number; h: number }[];
  page: number;
  clientX: number;
  clientY: number;
}

export function ReaderView() {
  const bookId = useStore((s) => s.bookId);
  const go = useStore((s) => s.go);
  const user = useStore((s) => s.user);
  const setAiOpen = useStore((s) => s.setAiOpen);
  const { data: book, isLoading } = useBook(bookId);

  // Load PDF
  const { doc, loading: pdfLoading, error: pdfError, numPages } = usePdfDocument(book?.pdfUrl);
  const cacheRef = usePageCache(doc);

  // Settings
  const { settings, update: updateSettings } = useReaderSettings(!!user);

  // Annotations
  const ann = useAnnotations(bookId, !!user);

  // Progress
  const progress = useReadingProgress(bookId, !!user, numPages || book?.pages || 1);

  // Search
  const search = useTextSearch(doc);

  // Local UI state
  const [scale, setScale] = useState(settings.zoom);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(settings.leftSidebarOpen);
  const [rightOpen, setRightOpen] = useState(settings.rightSidebarOpen);
  const [aiOpen, setAiPanelOpen] = useState(false);
  const [pageText, setPageText] = useState("");
  const [selection, setSelection] = useState<Selection | null>( null);
  const [focusMode, setFocusMode] = useState(false);

  // Stable callbacks passed to PdfVirtualScroll (prevents effect loops)
  const setCurrentPage = progress.setCurrentPage;
  const handlePageText = useCallback((_p: number, text: string) => setPageText(text), []);
  const handleSelectionChange = useCallback((sel: Selection | null) => setSelection(sel), []);
  const handlePageChange = useCallback((p: number) => setCurrentPage(p), [setCurrentPage]);

  // Drawing mode
  const [drawMode, setDrawMode] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawingTool | null>(null);
  const [drawColor, setDrawColor] = useState("#0f766e");
  const [drawStroke, setDrawStroke] = useState(2);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);

  // Apply theme — set CSS vars on the reader root AND toggle `dark` on <html>
  // so Tailwind `dark:` variants work for all child components (AI panel, etc).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const vars = THEME_VARS[settings.theme];
    root.style.setProperty("--reader-bg", vars.bg);
    root.style.setProperty("--reader-surface", vars.surface);
    root.style.setProperty("--reader-ink", vars.ink);
    root.style.setProperty("--reader-page", vars.page);
    const isDark = settings.theme === "dark" || settings.theme === "night" || settings.theme === "contrast";
    root.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("dark", isDark);
    // remember to restore the html class on unmount
    return () => { document.documentElement.classList.remove("dark"); };
  }, [settings.theme]);

  // Sync scale when settings.zoom changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply persisted zoom preference
    setScale(settings.zoom);
  }, [settings.zoom]);

  // Keyboard shortcuts — handlers recreated each render but the hook re-subscribes
  // cheaply. Functions below are hoisted declarations so they're safe to reference.
  useKeyboardShortcuts({
    nextPage: () => progress.setCurrentPage(Math.min(numPages, progress.state.currentPage + 1)),
    prevPage: () => progress.setCurrentPage(Math.max(1, progress.state.currentPage - 1)),
    firstPage: () => progress.setCurrentPage(1),
    lastPage: () => progress.setCurrentPage(numPages),
    zoomIn: () => setScale((s) => Math.min(8, +(s + 0.1).toFixed(2))),
    zoomOut: () => setScale((s) => Math.max(0.25, +(s - 0.1).toFixed(2))),
    toggleSearch: () => setSearchOpen((v) => !v),
    toggleBookmark: () => handleToggleBookmark(),
    toggleFullscreen: () => toggleFullscreen(),
    toggleLeftSidebar: () => setLeftOpen((v) => !v),
    toggleRightSidebar: () => setRightOpen((v) => !v),
    cycleTheme: () => cycleTheme(),
    toggleFocus: () => setFocusMode((v) => !v),
    exit: () => {
      if (focusMode) setFocusMode(false);
      else if (fullscreen) document.exitFullscreen?.();
      else if (searchOpen) setSearchOpen(false);
      else if (aiOpen) setAiPanelOpen(false);
      else if (drawMode) setDrawMode(false);
      else go("book");
    },
    openAi: () => setAiPanelOpen(true),
  }, !!doc);

  // Fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    else document.exitFullscreen?.().then(() => setFullscreen(false));
  }
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  function cycleTheme() {
    const order: ReaderTheme[] = ["light", "sepia", "paper", "dark", "night", "contrast"];
    const idx = order.indexOf(settings.theme);
    updateSettings({ theme: order[(idx + 1) % order.length] });
  }

  function fitWidth() {
    const el = rootRef.current?.querySelector(".scroll-elegant") as HTMLElement;
    if (!el || !doc) return;
    // compute scale so widest page fits container width
    const containerW = el.clientWidth - 64;
    doc.getPage(1).then(async (p) => {
      const vp = p.getViewport({ scale: 1 });
      setScale(containerW / vp.width);
    });
  }
  function fitPage() {
    const el = rootRef.current?.querySelector(".scroll-elegant") as HTMLElement;
    if (!el || !doc) return;
    const containerH = el.clientHeight - 32;
    doc.getPage(1).then(async (p) => {
      const vp = p.getViewport({ scale: 1 });
      const elW = el.clientWidth - 64;
      setScale(Math.min(elW / vp.width, containerH / vp.height));
    });
  }

  // Bookmark toggle
  function handleToggleBookmark() {
    if (!bookId) return;
    if (!user) { toast.info("Sign in to bookmark pages"); return; }
    ann.toggleBookmark(progress.state.currentPage).then((added) => {
      toast.success(added ? "Page bookmarked" : "Bookmark removed");
    });
  }

  // Highlight from selection toolbar
  async function handleHighlight(color: HighlightColor, kind: HighlightKind) {
    if (!selection) return;
    await ann.addHighlight(selection.page, selection.text, selection.rects, color, kind);
    toast.success(`${kind.toLowerCase()} added`);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  // Comment from selection → add note at selection position
  async function handleComment() {
    if (!selection) return;
    const lastRect = selection.rects[selection.rects.length - 1];
    await ann.addNote(selection.page, "New note", lastRect.x + lastRect.w, lastRect.y);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
    setRightOpen(true);
    toast.success("Note added — edit in the notes panel");
  }

  // AI explain selection
  function handleAiExplain() {
    if (!selection) return;
    setAiPanelOpen(true);
    // Could pre-fill the AI with the selection; for now we open the panel.
    toast.info("AI panel opened — ask about your selection");
  }

  // Download / share / print
  function handleDownload() {
    if (!book) return;
    api(`/api/books/${book.id}/download`, { method: "POST" }).catch(() => {});
    const a = document.createElement("a");
    a.href = book.pdfUrl;
    a.download = `${book.slug}.pdf`;
    a.click();
    toast.success("Download started");
  }
  function handlePrint() {
    if (!book) return;
    const w = window.open(book.pdfUrl, "_blank");
    w?.addEventListener("load", () => w.print());
  }
  function handleShare() {
    if (!book) return;
    if (navigator.share) {
      navigator.share({ title: book.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    }
  }

  // Export notes/highlights/bookmarks
  function handleExport(format: "md" | "txt" | "json") {
    if (!book) return;
    const opts = { bookTitle: book.title, highlights: ann.highlights, notes: ann.notes, bookmarks: ann.bookmarks };
    const slug = book.slug;
    if (format === "md") downloadFile(`${slug}-notes.md`, exportAsMarkdown(opts), "text/markdown");
    else if (format === "txt") downloadFile(`${slug}-notes.txt`, exportAsText(opts));
    else downloadFile(`${slug}-notes.json`, exportAsJson(opts), "application/json");
    api("/api/reader/export", { method: "POST", body: JSON.stringify({ bookId: book.id, kind: "notes", format }) }).catch(() => {});
    toast.success(`Exported as ${format.toUpperCase()}`);
  }

  // Drawing — undo/redo (simplified: undo last drawing)
  function handleUndo() {
    if (ann.drawings.length === 0) return;
    const last = ann.drawings[ann.drawings.length - 1];
    setRedoStack((s) => [...s, last.id]);
    ann.removeDrawing(last.id);
  }
  function handleRedo() {
    if (redoStack.length === 0) return;
    toast.info("Redo not yet supported for drawings");
  }

  // ---- Loading / error states ----
  if (isLoading || !book) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (pdfError) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-rose-500" />
        <h2 className="font-serif text-xl font-bold">Couldn't open this PDF</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{pdfError}</p>
        <Button className="mt-6" onClick={() => go("book")}>Back to book details</Button>
      </div>
    );
  }

  const chapters: { title: string; page: number }[] = book.chapters ? JSON.parse(book.chapters) : [];
  const bookmarked = ann.bookmarks.some((b) => b.page === progress.state.currentPage);
  const currentChapter = chapters.slice().reverse().find((c) => c.page <= progress.state.currentPage);

  return (
    <div ref={rootRef} className={cn("fixed inset-0 z-50 flex flex-col bg-background", fullscreen && "bg-background")}>
      {!focusMode && (
      <ReaderToolbar
        bookTitle={book.title}
        chapter={currentChapter?.title}
        page={progress.state.currentPage}
        totalPages={numPages || book.pages}
        scale={scale}
        rotation={rotation}
        theme={settings.theme}
        isFullscreen={fullscreen}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        searchOpen={searchOpen}
        bookmarked={bookmarked}
        allowDownload={book.allowDownload}
        onPage={progress.setCurrentPage}
        onZoom={setScale}
        onZoomPreset={setScale}
        onFitWidth={fitWidth}
        onFitPage={fitPage}
        onRotate={() => setRotation((r) => (r + 90) % 360)}
        onToggleFullscreen={toggleFullscreen}
        onTheme={(t) => updateSettings({ theme: t })}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        onToggleRight={() => setRightOpen((v) => !v)}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        onToggleBookmark={handleToggleBookmark}
        onDownload={handleDownload}
        onPrint={handlePrint}
        onShare={handleShare}
        onSettings={() => setSettingsOpen(true)}
        onExit={() => go("book")}
        onAi={() => setAiPanelOpen(true)}
      />
      )}

      {/* Focus mode floating exit bar */}
      {focusMode && (
        <div className="absolute left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 shadow-soft backdrop-blur">
          <span className="text-xs font-medium">{progress.state.currentPage} / {numPages || book.pages}</span>
          <button onClick={() => setFocusMode(false)} className="rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Exit focus mode">
            Exit focus
          </button>
        </div>
      )}

      <div className={cn("flex min-h-0 flex-1", focusMode && "transition-all")}>
        {/* Left sidebar */}
        {leftOpen && !focusMode && (
          <div className="hidden w-60 shrink-0 md:block lg:w-64">
            <ReaderSidebar
              doc={doc}
              currentPage={progress.state.currentPage}
              chapters={chapters}
              bookmarks={ann.bookmarks}
              highlights={ann.highlights}
              drawings={ann.drawings}
              notes={ann.notes}
              history={[]}
              onNavigate={progress.setCurrentPage}
              onRemoveHighlight={ann.removeHighlight}
              onRemoveBookmark={(p) => ann.toggleBookmark(p)}
              onRemoveDrawing={ann.removeDrawing}
              onRemoveNote={ann.removeNote}
              defaultTab={settings.defaultSidebar as any}
              onClose={() => setLeftOpen(false)}
            />
          </div>
        )}

        {/* PDF area */}
        <div className="relative min-w-0 flex-1" style={{ background: "var(--reader-bg)" }}>
          {pdfLoading || !doc ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm text-muted-foreground">Loading PDF…</p>
              </div>
            </div>
          ) : (
            <PdfVirtualScroll
              doc={doc}
              cacheRef={cacheRef}
              scale={scale}
              rotation={rotation}
              pageSpacing={settings.pageSpacing}
              layout={settings.layout}
              readingDirection={settings.readingDirection}
              pageTransition={settings.pageTransition}
              currentPage={progress.state.currentPage}
              onPageChange={handlePageChange}
              highlights={ann.highlights}
              notes={ann.notes}
              onPageText={handlePageText}
              onSelectionChange={handleSelectionChange}
            />
          )}

          {/* Drawing canvas overlay */}
          {drawMode && doc && (
            <DrawingCanvas
              active={drawMode}
              tool={drawTool}
              color={drawColor}
              strokeWidth={drawStroke}
              page={progress.state.currentPage}
              scale={scale}
              drawings={ann.drawings}
              onAddDrawing={ann.addDrawing}
              onRemoveDrawing={ann.removeDrawing}
            />
          )}

          {/* Drawing toolbar */}
          <DrawingToolbar
            active={drawMode}
            tool={drawTool}
            color={drawColor}
            strokeWidth={drawStroke}
            canUndo={ann.drawings.length > 0}
            canRedo={redoStack.length > 0}
            onTool={(t) => { setDrawTool(t); if (t === "ERASER") toast.info("Eraser mode — click drawings to remove"); }}
            onColor={setDrawColor}
            onStrokeWidth={setDrawStroke}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClose={() => setDrawMode(false)}
          />

          {/* Draw mode toggle (when not active) */}
          {!drawMode && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-card/90 shadow-lift backdrop-blur"
                onClick={() => { setDrawMode(true); setDrawTool("PEN"); }}
              >
                <Pen className="mr-1.5 h-3.5 w-3.5" /> Annotate
              </Button>
            </div>
          )}

          {/* Selection toolbar */}
          <SelectionToolbar
            selection={selection}
            bookId={bookId}
            onHighlight={handleHighlight}
            onComment={handleComment}
            onAiExplain={handleAiExplain}
            onDismiss={() => { setSelection(null); window.getSelection()?.removeAllRanges(); }}
          />

          {/* AI panel (overlay on right) */}
          <ReaderAiPanel
            open={aiOpen}
            onClose={() => setAiPanelOpen(false)}
            pageText={pageText}
            bookTitle={book.title}
            subject={book.subject?.name}
          />

          {/* Search panel (overlay on right, below AI) */}
          {searchOpen && !aiOpen && (
            <div className="absolute right-0 top-0 z-30 h-full w-full max-w-sm">
              <SearchPanel search={search} onClose={() => setSearchOpen(false)} onNavigate={progress.setCurrentPage} />
            </div>
          )}
        </div>

        {/* Right sidebar (notes) */}
        {rightOpen && !aiOpen && !searchOpen && !focusMode && (
          <div className="hidden w-72 shrink-0 lg:block">
            <NotesPanel
              notes={ann.notes}
              currentPage={progress.state.currentPage}
              onAdd={ann.addNote}
              onUpdate={ann.updateNote}
              onRemove={ann.removeNote}
              onNavigate={progress.setCurrentPage}
              onExport={handleExport}
              onClose={() => setRightOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom progress bar */}
      {!focusMode && (
      <ReadingProgressBar
        stats={progress.stats}
        onPrev={() => progress.setCurrentPage(Math.max(1, progress.state.currentPage - 1))}
        onNext={() => progress.setCurrentPage(Math.min(numPages, progress.state.currentPage + 1))}
        canPrev={progress.state.currentPage > 1}
        canNext={progress.state.currentPage < numPages}
      />
      )}

      {/* Settings dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onUpdate={updateSettings} />

      {/* Mobile sidebar overlays */}
      {(leftOpen || rightOpen || searchOpen) && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => { setLeftOpen(false); setRightOpen(false); setSearchOpen(false); }} />
      )}
    </div>
  );
}

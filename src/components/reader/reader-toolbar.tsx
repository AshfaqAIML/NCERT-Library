"use client";

import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2,
  Bookmark, Search, PanelLeft, PanelRight, Sparkles, Download, Share2, Printer,
  Settings, Sun, Moon, BookOpen, Type, ChevronDown, ListTree, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReaderTheme } from "./types";

const THEMES: { key: ReaderTheme; label: string; icon: any }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "sepia", label: "Sepia", icon: BookOpen },
  { key: "paper", label: "Paper", icon: Type },
  { key: "night", label: "Night", icon: Moon },
  { key: "contrast", label: "High Contrast", icon: Type },
];

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4, 8];

interface Props {
  bookTitle: string;
  chapter?: string;
  page: number;
  totalPages: number;
  scale: number;
  rotation: number;
  theme: ReaderTheme;
  isFullscreen: boolean;
  leftOpen: boolean;
  rightOpen: boolean;
  searchOpen: boolean;
  bookmarked: boolean;
  allowDownload: boolean;
  onPage: (p: number) => void;
  onZoom: (s: number) => void;
  onZoomPreset: (s: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onRotate: () => void;
  onToggleFullscreen: () => void;
  onTheme: (t: ReaderTheme) => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleSearch: () => void;
  onToggleBookmark: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onShare: () => void;
  onSettings: () => void;
  onExit: () => void;
  onAi: () => void;
}

export function ReaderToolbar(p: Props) {
  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-14 items-center gap-1 border-b border-border/60 bg-background/85 px-2 backdrop-blur sm:px-3">
        {/* Exit */}
        <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onExit} aria-label="Exit reader">
          <X className="h-4 w-4" />
        </Button>

        {/* Book title + chapter */}
        <div className="ml-1 hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">{p.bookTitle}</p>
            {p.chapter ? (
              <p className="truncate text-[11px] text-muted-foreground">{p.chapter}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Chapter {Math.ceil(p.page / 3)}</p>
            )}
          </div>
        </div>

        <div className="mx-1 h-6 w-px bg-border hidden md:block" />

        <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onToggleLeft} aria-label="Toggle contents" data-active={p.leftOpen}>
          <PanelLeft className={cn("h-4 w-4", p.leftOpen && "text-emerald-600")} />
        </Button>

        {/* Page navigation */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="rounded-lg" disabled={p.page <= 1} onClick={() => p.onPage(p.page - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-1">
            <Input
              type="number"
              value={p.page}
              min={1}
              max={p.totalPages}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= p.totalPages) p.onPage(v);
              }}
              className="h-8 w-14 rounded-lg text-center text-sm tabular-nums"
              aria-label="Current page"
            />
            <span className="whitespace-nowrap text-xs text-muted-foreground">/ {p.totalPages}</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-lg" disabled={p.page >= p.totalPages} onClick={() => p.onPage(p.page + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        {/* Zoom controls */}
        <div className="hidden items-center gap-0.5 sm:flex">
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => p.onZoom(p.scale - 0.1)} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 min-w-[3.5rem] items-center justify-center rounded-lg px-2 text-xs font-medium tabular-nums hover:bg-accent">
                {Math.round(p.scale * 100)}%
                <ChevronDown className="ml-0.5 h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-40">
              <DropdownMenuLabel className="text-xs">Zoom</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ZOOM_PRESETS.map((z) => (
                <DropdownMenuItem key={z} onSelect={() => p.onZoomPreset(z)} className="text-xs tabular-nums">
                  {Math.round(z * 100)}%
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={p.onFitWidth} className="text-xs"><Type className="mr-2 h-3.5 w-3.5" /> Fit Width</DropdownMenuItem>
              <DropdownMenuItem onSelect={p.onFitPage} className="text-xs"><Maximize2 className="mr-2 h-3.5 w-3.5" /> Fit Page</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => p.onZoom(p.scale + 0.1)} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onRotate} aria-label="Rotate">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onToggleSearch} aria-label="Search in book" data-active={p.searchOpen}>
            <Search className={cn("h-4 w-4", p.searchOpen && "text-emerald-600")} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onToggleBookmark} aria-label="Bookmark page">
            <Bookmark className={cn("h-4 w-4", p.bookmarked && "fill-amber-400 text-amber-500")} />
          </Button>

          {/* Theme switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Reading mode">
                {p.theme === "light" ? <Sun className="h-4 w-4" /> : p.theme === "sepia" || p.theme === "paper" ? <BookOpen className="h-4 w-4" /> : p.theme === "contrast" ? <Type className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Reading mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {THEMES.map((t) => (
                <DropdownMenuItem key={t.key} onSelect={() => p.onTheme(t.key)} className={cn("text-xs", p.theme === t.key && "bg-accent")}>
                  <t.icon className="mr-2 h-3.5 w-3.5" /> {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="rounded-lg hidden sm:inline-flex" onClick={p.onToggleFullscreen} aria-label="Fullscreen">
            {p.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Share / Download / Print */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg" aria-label="More actions">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={p.onShare} className="text-xs"><Share2 className="mr-2 h-3.5 w-3.5" /> Share</DropdownMenuItem>
              {p.allowDownload && <DropdownMenuItem onSelect={p.onDownload} className="text-xs"><Download className="mr-2 h-3.5 w-3.5" /> Download</DropdownMenuItem>}
              <DropdownMenuItem onSelect={p.onPrint} className="text-xs"><Printer className="mr-2 h-3.5 w-3.5" /> Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onSettings} aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-lg" onClick={p.onToggleRight} aria-label="Toggle notes" data-active={p.rightOpen}>
            <PanelRight className={cn("h-4 w-4", p.rightOpen && "text-emerald-600")} />
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="ml-1 rounded-lg bg-emerald-600 hover:bg-emerald-700" onClick={p.onAi}>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI study tools (A)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

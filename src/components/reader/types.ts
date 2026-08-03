// Shared types for the world-class PDF reader.

export type ReaderTheme = "light" | "dark" | "sepia" | "paper" | "night" | "contrast";
export type ReaderLayout = "continuous" | "single" | "two";
export type ReadingDirection = "ltr" | "rtl";
export type PageTransition = "none" | "slide" | "fade";

export interface Rect { x: number; y: number; w: number; h: number }

export type HighlightKind = "HIGHLIGHT" | "UNDERLINE" | "STRIKETHROUGH";
export type HighlightColor =
  | "amber" | "emerald" | "rose" | "violet" | "sky"
  | "yellow" | "green" | "blue" | "pink" | "orange" | "purple";

export interface HighlightAnnotation {
  id: string;
  page: number;
  text: string;
  color: HighlightColor;
  kind: HighlightKind;
  rects: Rect[];
  note?: string | null;
  label?: string | null;
  category?: string | null;
  pinned?: boolean;
  createdAt: string;
}

export type DrawingTool = "PEN" | "HIGHLIGHTER" | "RECTANGLE" | "ARROW" | "LINE" | "TEXT_BOX" | "ERASER";
export interface Point { x: number; y: number }

export interface DrawingAnnotation {
  id: string;
  page: number;
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  points: Point[];
  createdAt: string;
}

export interface BookmarkAnnotation {
  id: string;
  page: number;
  label?: string | null;
  color: string;
  folder: string;
  createdAt: string;
}

export interface NoteAnnotation {
  id: string;
  page: number;
  content: string;
  x: number;
  y: number;
  pinned: boolean;
  color: string;
  tags: { id: string; name: string; color: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ReaderSettingsT {
  theme: ReaderTheme;
  zoom: number;
  layout: ReaderLayout;
  pageSpacing: number;
  readingDirection: ReadingDirection;
  pageTransition: PageTransition;
  autoSaveSec: number;
  defaultSidebar: string;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

export interface SearchMatch {
  page: number;
  snippet: string;
  matchIndex: number;
}

export interface ReadingStats {
  timeSpentSec: number;
  pagesReadToday: number;
  streak: number;
  currentPage: number;
  totalPages: number;
  percent: number;
  avgSpeedPagesPerMin: number;
  estRemainingMin: number;
}

export const DEFAULT_SETTINGS: ReaderSettingsT = {
  theme: "light",
  zoom: 1.2,
  layout: "continuous",
  pageSpacing: 16,
  readingDirection: "ltr",
  pageTransition: "slide",
  autoSaveSec: 5,
  defaultSidebar: "thumbnails",
  leftSidebarOpen: true,
  rightSidebarOpen: false,
};

// Theme → background/ink CSS variables (applied on the reader root).
export const THEME_VARS: Record<ReaderTheme, { bg: string; surface: string; ink: string; page: string }> = {
  light:    { bg: "oklch(0.965 0.008 90)",  surface: "oklch(1 0 0)",          ink: "oklch(0.2 0.012 60)",  page: "oklch(1 0 0)" },
  dark:     { bg: "oklch(0.14 0.006 60)",   surface: "oklch(0.2 0.008 60)",   ink: "oklch(0.92 0.005 95)", page: "oklch(0.18 0.006 60)" },
  sepia:    { bg: "oklch(0.95 0.03 75)",    surface: "oklch(0.97 0.025 80)",  ink: "oklch(0.27 0.02 55)",  page: "oklch(0.96 0.03 78)" },
  paper:    { bg: "oklch(0.94 0.012 85)",   surface: "oklch(0.97 0.008 85)",  ink: "oklch(0.22 0.01 60)",  page: "oklch(0.95 0.014 82)" },
  night:    { bg: "oklch(0.1 0.005 260)",   surface: "oklch(0.13 0.006 260)", ink: "oklch(0.82 0.01 260)", page: "oklch(0.12 0.005 260)" },
  contrast: { bg: "oklch(0 0 0)",           surface: "oklch(0.05 0 0)",       ink: "oklch(1 0 0)",         page: "oklch(0 0 0)" },
};

export const HIGHLIGHT_PALETTE: { key: HighlightColor; label: string; dot: string; fill: string }[] = [
  { key: "yellow",  label: "Yellow",  dot: "bg-yellow-400",  fill: "bg-yellow-400/50" },
  { key: "green",   label: "Green",   dot: "bg-green-400",   fill: "bg-green-400/50" },
  { key: "blue",    label: "Blue",    dot: "bg-blue-400",    fill: "bg-blue-400/50" },
  { key: "pink",    label: "Pink",    dot: "bg-pink-400",    fill: "bg-pink-400/50" },
  { key: "orange",  label: "Orange",  dot: "bg-orange-400",  fill: "bg-orange-400/50" },
  { key: "purple",  label: "Purple",  dot: "bg-purple-400",  fill: "bg-purple-400/50" },
  { key: "amber",   label: "Amber",   dot: "bg-amber-400",   fill: "bg-amber-400/50" },
  { key: "emerald", label: "Emerald", dot: "bg-emerald-400", fill: "bg-emerald-400/50" },
  { key: "rose",    label: "Rose",    dot: "bg-rose-400",    fill: "bg-rose-400/50" },
  { key: "violet",  label: "Violet",  dot: "bg-violet-400", fill: "bg-violet-400/50" },
  { key: "sky",     label: "Sky",     dot: "bg-sky-400",     fill: "bg-sky-400/50" },
];

export function colorFillClass(color: HighlightColor): string {
  return HIGHLIGHT_PALETTE.find((p) => p.key === color)?.fill ?? "bg-amber-400/50";
}
export function colorDotClass(color: HighlightColor | string): string {
  return HIGHLIGHT_PALETTE.find((p) => p.key === color)?.dot ?? "bg-amber-400";
}

"use client";

// Export helpers: notes/highlights/bookmarks → Markdown / TXT / JSON
import type { BookmarkAnnotation, HighlightAnnotation, NoteAnnotation } from "./types";

export function exportAsMarkdown(opts: {
  bookTitle: string;
  highlights: HighlightAnnotation[];
  notes: NoteAnnotation[];
  bookmarks: BookmarkAnnotation[];
}) {
  const { bookTitle, highlights, notes, bookmarks } = opts;
  const lines: string[] = [`# ${bookTitle} — Study Notes`, ""];
  lines.push(`_Exported ${new Date().toLocaleString()}_`, "");

  if (highlights.length) {
    lines.push("## Highlights", "");
    const byPage = groupBy(highlights, (h) => h.page);
    for (const page of Object.keys(byPage).sort((a, b) => +a - +b)) {
      lines.push(`### Page ${page}`, "");
      for (const h of byPage[page]) {
        lines.push(`- **[${h.color}${h.kind !== "HIGHLIGHT" ? `/${h.kind}` : ""}]** ${h.text}`);
        if (h.note) lines.push(`  - _note_: ${h.note}`);
      }
      lines.push("");
    }
  }

  if (notes.length) {
    lines.push("## Notes", "");
    const byPage = groupBy(notes, (n) => n.page);
    for (const page of Object.keys(byPage).sort((a, b) => +a - +b)) {
      lines.push(`### Page ${page}`, "");
      for (const n of byPage[page]) {
        lines.push(`- ${n.pinned ? "📌 " : ""}${n.content}`);
        if (n.tags.length) lines.push(`  - tags: ${n.tags.map((t) => `#${t.name}`).join(" ")}`);
      }
      lines.push("");
    }
  }

  if (bookmarks.length) {
    lines.push("## Bookmarks", "");
    for (const b of bookmarks.sort((a, c) => a.page - c.page)) {
      lines.push(`- p.${b.page}${b.label ? ` — ${b.label}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function exportAsText(opts: { bookTitle: string; highlights: HighlightAnnotation[]; notes: NoteAnnotation[]; bookmarks: BookmarkAnnotation[] }) {
  const { bookTitle, highlights, notes, bookmarks } = opts;
  const lines: string[] = [`${bookTitle} — Study Notes`, `Exported ${new Date().toLocaleString()}`, "=".repeat(60), ""];

  if (highlights.length) {
    lines.push("HIGHLIGHTS", "-".repeat(40), "");
    const byPage = groupBy(highlights, (h) => h.page);
    for (const page of Object.keys(byPage).sort((a, b) => +a - +b)) {
      lines.push(`[Page ${page}]`);
      for (const h of byPage[page]) lines.push(`  • ${h.text}`);
      lines.push("");
    }
  }
  if (notes.length) {
    lines.push("NOTES", "-".repeat(40), "");
    const byPage = groupBy(notes, (n) => n.page);
    for (const page of Object.keys(byPage).sort((a, b) => +a - +b)) {
      lines.push(`[Page ${page}]`);
      for (const n of byPage[page]) lines.push(`  • ${n.content}`);
      lines.push("");
    }
  }
  if (bookmarks.length) {
    lines.push("BOOKMARKS", "-".repeat(40), "");
    for (const b of bookmarks.sort((a, c) => a.page - c.page)) lines.push(`  p.${b.page}${b.label ? ` — ${b.label}` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function exportAsJson(opts: { bookTitle: string; highlights: HighlightAnnotation[]; notes: NoteAnnotation[]; bookmarks: BookmarkAnnotation[] }) {
  return JSON.stringify({
    book: opts.bookTitle,
    exportedAt: new Date().toISOString(),
    highlights: opts.highlights,
    notes: opts.notes,
    bookmarks: opts.bookmarks,
  }, null, 2);
}

export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function groupBy<T>(arr: T[], key: (t: T) => string | number): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(key(item));
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

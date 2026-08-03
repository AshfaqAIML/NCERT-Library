"use client";

import { motion } from "framer-motion";
import { Bookmark, BookOpen, Download, Eye } from "lucide-react";
import { BookCover } from "./book-cover";
import { RatingStars } from "./rating-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatBytes, formatNumber } from "@/lib/api-client";
import type { BookT } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BookCard({ book, index = 0 }: { book: BookT; index?: number }) {
  const openBook = useStore((s) => s.openBook);
  const pushRecent = useStore((s) => s.pushRecent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className="group book-lift relative flex flex-col"
    >
      <button
        onClick={() => {
          pushRecent(book.id);
          openBook(book.id, "book");
        }}
        className="relative block w-full text-left"
        aria-label={`Open ${book.title}`}
      >
        <BookCover book={book} className="ring-1 ring-black/5 transition-all duration-300 group-hover:shadow-lift group-hover:ring-emerald-500/20" />

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-xl bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
          <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg transition-transform duration-300 group-hover:scale-105">
            <BookOpen className="h-3.5 w-3.5" /> Read book
          </span>
        </div>

        {book.trending && (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            <span className="h-1 w-1 animate-soft-pulse rounded-full bg-white" /> Trending
          </span>
        )}
      </button>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="mb-1 flex items-center gap-1.5">
          {book.subject && (
            <Badge variant="secondary" className={cn("ring-1", subjectBadgeClass(book.subject.color))}>
              {book.subject.name}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">Class {book.classNum}</span>
        </div>
        <button
          onClick={() => {
            pushRecent(book.id);
            openBook(book.id, "book");
          }}
          className="line-clamp-2 text-left font-serif text-[15px] font-semibold leading-snug hover:text-primary"
        >
          {book.title}
        </button>
        {book.author && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{book.author}</p>}

        <div className="mt-2">
          <RatingStars rating={book.rating} count={book.ratingCount} />
        </div>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{book.pages}p</span>
          <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" />{formatBytes(book.fileSizeKb)}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(book.viewCount)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 flex-1 rounded-full"
            onClick={() => {
              pushRecent(book.id);
              openBook(book.id, "reader");
            }}
          >
            <BookOpen className="h-3.5 w-3.5" /> Read
          </Button>
          {book.allowDownload ? (
            <Button size="sm" variant="outline" className="h-8 rounded-full" aria-label="Download">
              <Download className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" className="h-8 rounded-full" aria-label="Bookmark">
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function subjectBadgeClass(color: string) {
  const map: Record<string, string> = {
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
    violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/30",
    sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
  };
  return map[color] ?? map.emerald;
}

"use client";

import { BookCard } from "./book-card";
import type { BookT } from "@/lib/types";

export function BookGrid({ books, loading }: { books: BookT[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="font-serif text-lg font-semibold">No books found</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try adjusting your filters or search query to discover more NCERT titles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((b, i) => (
        <BookCard key={b.id} book={b} index={i} />
      ))}
    </div>
  );
}

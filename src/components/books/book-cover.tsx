"use client";

import { cn } from "@/lib/utils";
import type { BookT } from "@/lib/types";

const GRADIENT_CLASS: Record<string, string> = {
  "from-amber-400 via-orange-500 to-rose-500": "from-amber-400 via-orange-500 to-rose-500",
  "from-emerald-400 via-teal-500 to-cyan-600": "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-400 via-pink-500 to-fuchsia-600": "from-rose-400 via-pink-500 to-fuchsia-600",
  "from-violet-400 via-purple-500 to-indigo-500": "from-violet-400 via-purple-500 to-indigo-500",
  "from-sky-400 via-blue-500 to-indigo-500": "from-sky-400 via-blue-500 to-indigo-500",
  "from-lime-400 via-green-500 to-emerald-600": "from-lime-400 via-green-500 to-emerald-600",
  "from-cyan-400 via-sky-500 to-blue-600": "from-cyan-400 via-sky-500 to-blue-600",
  "from-fuchsia-400 via-pink-500 to-rose-600": "from-fuchsia-400 via-pink-500 to-rose-600",
};

export function BookCover({
  book,
  className,
  size = "md",
}: {
  book: Pick<BookT, "title" | "author" | "coverGradient" | "coverImage" | "subject" | "classNum" | "bookType">;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const gradient = book.coverGradient || "from-emerald-400 via-teal-500 to-cyan-600";
  const gradClass = GRADIENT_CLASS[gradient] ?? gradient;

  const padMap = { sm: "p-3", md: "p-4", lg: "p-5" };
  const titleSize = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const subSize = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" };

  if (book.coverImage) {
    return (
      <img
        src={book.coverImage}
        alt={book.title}
        className={cn("aspect-[3/4] w-full rounded-xl object-cover shadow-soft ring-1 ring-black/5", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-br shadow-soft ring-1 ring-black/5",
        gradClass,
        className
      )}
    >
      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:5px_5px]" />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-black/20" />
      <div className="absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-white/25 to-transparent" />
      <div className={cn("relative flex h-full flex-col justify-between text-white", padMap[size])}>
        <div className="flex items-start justify-between gap-1">
          <span className={cn("rounded-full bg-white/20 px-1.5 py-0.5 font-semibold uppercase tracking-wide backdrop-blur-sm", subSize[size])}>
            Class {book.classNum}
          </span>
          {book.bookType === "OLD" && (
            <span className={cn("rounded-full bg-black/30 px-1.5 py-0.5 font-semibold uppercase tracking-wide backdrop-blur-sm", subSize[size])}>
              Old
            </span>
          )}
        </div>
        <div>
          <p className={cn("mb-1 font-serif font-bold leading-tight drop-shadow-sm", titleSize[size])}>
            {book.title}
          </p>
          {book.author && <p className={cn("opacity-90", subSize[size])}>{book.author}</p>}
          {book.subject && (
            <p className={cn("mt-1 uppercase tracking-wider opacity-80", subSize[size])}>{book.subject.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

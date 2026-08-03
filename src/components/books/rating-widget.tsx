"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Props {
  bookId: string;
  rating: number;
  ratingCount: number;
}

export function RatingWidget({ bookId, rating, ratingCount }: Props) {
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [currentRating, setCurrentRating] = useState(rating);
  const [count, setCount] = useState(ratingCount);

  async function rate(value: number) {
    try {
      const res = await api<{ rating: number; ratingCount: number; userRating: number }>("/api/rate", {
        method: "POST",
        body: JSON.stringify({ bookId, rating: value }),
      });
      setCurrentRating(res.rating);
      setCount(res.ratingCount);
      setSubmitted(true);
      toast.success(`Rated ${value} stars!`);
    } catch {
      toast.error("Please sign in to rate books");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = (hover || submitted) && star <= (hover || Math.round(currentRating));
          return (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => rate(star)}
              className="rounded-md p-0.5 transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40"
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="text-sm">
        <span className="font-semibold">{currentRating.toFixed(1)}</span>
        <span className="text-muted-foreground"> ({count.toLocaleString()})</span>
      </div>
      {submitted && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">Thanks for rating!</span>
      )}
    </div>
  );
}

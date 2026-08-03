"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  count,
  size = 14,
  showCount = true,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const isHalf = i === full && half;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={cn(filled || isHalf ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40")}
            />
          );
        })}
      </div>
      <span className="text-xs font-medium text-foreground/80">{rating.toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

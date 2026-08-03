"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: string;
  className?: string;
}

/**
 * Animated counter that counts up from 0 to the numeric part of `value`.
 * Handles values like "36+", "12", "6-12", "12K+".
 * Uses direct DOM manipulation to avoid setState-in-effect lint issues.
 */
export function AnimatedCounter({ value, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current || started.current) return;
    started.current = true;

    // Extract the numeric portion
    const match = value.match(/^(\d+)(.*)$/);
    if (!match) {
      if (ref.current) ref.current.textContent = value;
      return;
    }

    const target = parseInt(match[1], 10);
    const suffix = match[2] || "";
    const duration = 1200;
    const start = performance.now();
    const el = ref.current;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      if (el) el.textContent = `${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return <span ref={ref} className={className}>0</span>;
}

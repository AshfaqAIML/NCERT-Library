"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";

/**
 * Shows a celebratory toast when the user has an active reading streak.
 * Appears once per session on the home page.
 */
export function StreakNotification() {
  const user = useStore((s) => s.user);
  const go = useStore((s) => s.go);
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const dismissed = sessionStorage.getItem("streak-dismissed");
    if (dismissed) return;

    api<{ avgStreak: number; longestStreak: number }>("/api/reading-goals")
      .then((d) => {
        if (d.avgStreak > 0) {
          setStreak(d.avgStreak);
          setTimeout(() => setShow(true), 1500);
        }
      })
      .catch(() => {});
  }, [user]);

  function dismiss() {
    setShow(false);
    sessionStorage.setItem("streak-dismissed", "1");
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-3 shadow-lift backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Flame className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {streak}-day reading streak! 🔥
              </p>
              <p className="text-[11px] text-muted-foreground">Keep the momentum going</p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 shrink-0 rounded-full" onClick={() => { go("profile"); dismiss(); }}>
              View <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
            <button onClick={dismiss} className="rounded-full p-1 text-muted-foreground hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

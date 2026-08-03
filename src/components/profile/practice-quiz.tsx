"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2, XCircle, RotateCcw, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MCQ } from "@/lib/ai";

interface QuizResponse {
  mcqs: MCQ[];
  sourceBooks: { title: string; subject: string; percent: number }[];
}

export function PracticeQuiz() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const { data, isLoading, refetch } = useQuery<QuizResponse>({
    queryKey: ["quiz-from-history"],
    queryFn: () => api("/api/ai/quiz-from-history", { method: "POST", body: JSON.stringify({ count: 5 }) }),
    enabled: started,
  });

  const mcqs = data?.mcqs ?? [];
  const score = Object.entries(selected).filter(([i, ans]) => mcqs[Number(i)]?.answer === ans).length;

  function start() {
    setStarted(true);
    setCurrent(0);
    setSelected({});
    setShowResults(false);
    refetch();
  }

  function restart() {
    setStarted(false);
    setShowResults(false);
    setSelected({});
  }

  if (!started) {
    return (
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/[0.06] via-card to-card p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <Brain className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-xl font-bold">Practice Quiz</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Generate a personalized quiz from the NCERT books you've been reading. Tests your understanding of concepts you've recently studied.
        </p>
        <Button className="mt-6 rounded-full" onClick={start}>
          <Brain className="mr-2 h-4 w-4" /> Generate Quiz
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground">Generating quiz from your reading history…</p>
      </div>
    );
  }

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Trophy className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold">{score} / {mcqs.length}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {score === mcqs.length ? "Perfect score! 🎉" : score >= mcqs.length * 0.6 ? "Great job! Keep it up." : "Keep practicing — you'll get there!"}
        </p>
        {/* Review answers */}
        <div className="mt-6 space-y-2 text-left">
          {mcqs.map((m, i) => (
            <div key={i} className="rounded-lg border border-border/50 p-3">
              <div className="flex items-start gap-2">
                {selected[i] === m.answer ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{m.question}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {selected[i] !== undefined ? `Your answer: ${m.options[selected[i]]}` : "Not answered"} · Correct: {m.options[m.answer]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-6 rounded-full" onClick={restart}>
          <RotateCcw className="mr-2 h-4 w-4" /> New Quiz
        </Button>
      </motion.div>
    );
  }

  if (mcqs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">Could not generate quiz. Try reading more books first.</p>
        <Button className="mt-4" variant="outline" onClick={restart}>Back</Button>
      </div>
    );
  }

  const m = mcqs[current];
  const progress = ((current + 1) / mcqs.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Question {current + 1} of {mcqs.length}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Source books */}
      {data?.sourceBooks && (
        <div className="flex flex-wrap gap-1.5">
          {data.sourceBooks.slice(0, 3).map((b, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">
              <BookOpen className="mr-1 h-2.5 w-2.5" /> {b.title.slice(0, 25)}…
            </Badge>
          ))}
        </div>
      )}

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
        >
          <p className="mb-4 font-serif text-lg font-semibold">{m.question}</p>
          <div className="space-y-2">
            {m.options.map((opt, j) => {
              const sel = selected[current];
              const showState = sel !== undefined;
              return (
                <button
                  key={j}
                  onClick={() => setSelected({ ...selected, [current]: j })}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                    showState && j === m.answer ? "border-emerald-500 bg-emerald-500/10" : showState && j === sel ? "border-rose-500 bg-rose-500/10" : "border-border/60 hover:bg-accent/60"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    showState && j === m.answer ? "bg-emerald-500 text-white" : showState && j === sel ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + j)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {selected[current] !== undefined && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 rounded-lg bg-muted/60 p-3"
            >
              <p className="text-xs"><span className="font-semibold">Explanation: </span>{m.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex justify-between">
        <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          Previous
        </Button>
        {current < mcqs.length - 1 ? (
          <Button disabled={selected[current] === undefined} onClick={() => setCurrent((c) => c + 1)}>
            Next
          </Button>
        ) : (
          <Button disabled={selected[current] === undefined} onClick={() => setShowResults(true)}>
            <Trophy className="mr-2 h-4 w-4" /> See Results
          </Button>
        )}
      </div>
    </div>
  );
}

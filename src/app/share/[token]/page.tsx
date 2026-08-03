"use client";

import { use } from "react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Sparkles, Quote, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useState } from "react";

interface SharedHighlight {
  text: string;
  color: string;
  bookTitle: string | null;
  subject?: string;
  subjectColor?: string;
  classNum?: number;
  page?: number;
  bookId?: string;
  sharedAt?: string;
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <ShareContent params={params} />
    </QueryClientProvider>
  );
}

function ShareContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const go = useStore((s) => s.go);
  const openBook = useStore((s) => s.openBook);

  const { data: highlight, isLoading, error } = useQuery<SharedHighlight>({
    queryKey: ["share", token],
    queryFn: () => api(`/api/share/${token}`),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-500/[0.04] to-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !highlight) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-500/[0.04] to-background px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <Quote className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="font-serif text-2xl font-bold">Highlight not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This share link may have expired or is invalid.</p>
        <Button className="mt-6" onClick={() => window.location.href = "/"}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to NCERT Library
        </Button>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    amber: "bg-amber-400/20 border-amber-400/40",
    emerald: "bg-emerald-400/20 border-emerald-400/40",
    rose: "bg-rose-400/20 border-rose-400/40",
    violet: "bg-violet-400/20 border-violet-400/40",
    sky: "bg-sky-400/20 border-sky-400/40",
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-500/[0.04] via-background to-background">
      {/* Background flour */}
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <button onClick={() => window.location.href = "/"} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> NCERT Library for IAS
          </button>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="mr-1 h-3 w-3" /> Shared Highlight
          </Badge>
        </motion.div>

        {/* Highlight card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "relative overflow-hidden rounded-3xl border-2 p-8 shadow-lift",
            colorMap[highlight.color] || colorMap.amber,
          )}
        >
          <Quote className="absolute right-4 top-4 h-12 w-12 opacity-10" />
          <div className="relative">
            <blockquote className="font-serif text-lg leading-relaxed text-foreground/90 sm:text-xl">
              "{highlight.text}"
            </blockquote>

            {highlight.bookTitle && (
              <div className="mt-6 border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</p>
                <div className="mt-1 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{highlight.bookTitle}</span>
                  {highlight.subject && (
                    <Badge variant="outline" className="text-[10px]">{highlight.subject}</Badge>
                  )}
                  {highlight.classNum && (
                    <Badge variant="outline" className="text-[10px]">Class {highlight.classNum}</Badge>
                  )}
                  {highlight.page && (
                    <span className="text-xs text-muted-foreground">p. {highlight.page}</span>
                  )}
                </div>
              </div>
            )}

            {highlight.sharedAt && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Shared {new Date(highlight.sharedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          {highlight.bookId && (
            <Button
              className="rounded-full"
              onClick={() => {
                openBook(highlight.bookId!, "reader");
                window.location.href = "/";
              }}
            >
              <BookOpen className="mr-2 h-4 w-4" /> Read this book
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "NCERT Highlight", text: highlight.text, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share again
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => window.location.href = "/"}
          >
            Explore the library
          </Button>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-soft"
        >
          <p className="font-serif text-lg font-semibold">Want to highlight like this?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Join the NCERT Library for IAS — read, highlight, take notes and let AI help you master every page.
          </p>
          <Button className="mt-4 rounded-full" onClick={() => window.location.href = "/"}>
            <Sparkles className="mr-2 h-4 w-4" /> Start reading free
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, Download, Bookmark, Share2, Eye, Star, Clock,
  FileText, Calendar, Building2, Tag, ChevronRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCover } from "@/components/books/book-cover";
import { RatingStars } from "@/components/books/rating-stars";
import { RatingWidget } from "@/components/books/rating-widget";
import { ReviewsSection } from "@/components/books/reviews-section";
import { BookCard, subjectBadgeClass } from "@/components/books/book-card";
import { useBook } from "@/hooks/use-books";
import { useStore } from "@/lib/store";
import { formatBytes, formatNumber, api } from "@/lib/api-client";
import { toast } from "sonner";
import type { BookT } from "@/lib/types";

export function BookDetailsView() {
  const bookId = useStore((s) => s.bookId);
  const go = useStore((s) => s.go);
  const openBook = useStore((s) => s.openBook);
  const pushRecent = useStore((s) => s.pushRecent);
  const { data: book, isLoading } = useBook(bookId);

  if (isLoading || !book) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const chapters: { title: string; page: number }[] = book.chapters ? JSON.parse(book.chapters) : [];

  async function handleDownload() {
    try {
      await api(`/api/books/${book!.id}/download`, { method: "POST" });
    } catch { /* ignore for guests */ }
    const a = document.createElement("a");
    a.href = book!.pdfUrl;
    a.download = `${book!.slug}.pdf`;
    a.click();
    toast.success("Download started", { description: book!.title });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        onClick={() => go("library")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to library
      </button>

      <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:gap-12">
        {/* Cover + actions */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <BookCover book={book} size="lg" className="shadow-lift" />
            <div className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </motion.div>

          <div className="space-y-2">
            <Button
              size="lg"
              className="h-12 w-full rounded-xl"
              onClick={() => {
                pushRecent(book.id);
                openBook(book.id, "reader");
              }}
            >
              <BookOpen className="h-4 w-4" /> Read online
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {book.allowDownload ? (
                <Button variant="outline" className="h-10 rounded-xl" onClick={handleDownload}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              ) : (
                <Button variant="outline" className="h-10 rounded-xl opacity-60" disabled title="Download not permitted for this edition">
                  <Download className="h-4 w-4" /> Restricted
                </Button>
              )}
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => toast.info("Bookmarked — find it in your profile")}>
                <Bookmark className="h-4 w-4" /> Save
              </Button>
            </div>
            <Button variant="ghost" className="h-10 w-full rounded-xl text-muted-foreground" onClick={() => navigator.share?.({ title: book.title, url: location.href }).catch(() => toast.info("Link copied to clipboard"))}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {book.subject && (
              <Badge className={subjectBadgeClass(book.subject.color)}>{book.subject.name}</Badge>
            )}
            <Badge variant="outline">Class {book.classNum}</Badge>
            <Badge variant="outline">{book.bookType === "OLD" ? "Old NCERT" : "New NCERT"}</Badge>
            {book.language && <Badge variant="outline">{book.language.name}</Badge>}
            {book.trending && (
              <Badge className="bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300">
                <span className="mr-1 h-1.5 w-1.5 animate-soft-pulse rounded-full bg-rose-500" /> Trending
              </Badge>
            )}
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{book.title}</h1>
          {book.author && <p className="mt-2 text-lg text-muted-foreground">by {book.author}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-5">
            <RatingWidget bookId={book.id} rating={book.rating} ratingCount={book.ratingCount} />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" /> {formatNumber(book.viewCount)} reads
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Download className="h-4 w-4" /> {formatNumber(book.downloadCount)} downloads
            </span>
          </div>

          <Separator className="my-6" />

          {/* Quick AI teaser */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">AI study companion</p>
              <p className="text-xs text-muted-foreground">Open the reader to summarise, explain, generate MCQs & flashcards.</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => { pushRecent(book.id); openBook(book.id, "reader"); }}>
              Open reader
            </Button>
          </div>

          <Tabs defaultValue="about">
            <TabsList className="bg-muted/60">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              {chapters.length > 0 && <TabsTrigger value="contents">Contents</TabsTrigger>}
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-4">
              <p className="text-pretty leading-relaxed text-foreground/85">{book.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={FileText} label="Pages" value={String(book.pages)} />
                <Stat icon={Tag} label="File size" value={formatBytes(book.fileSizeKb)} />
                <Stat icon={Clock} label="Read time" value={`~${Math.max(10, Math.round(book.pages * 1.5))} min`} />
                <Stat icon={Star} label="Rating" value={book.rating.toFixed(1)} />
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <dl className="divide-y divide-border/60 rounded-2xl border border-border/60">
                <DetailRow icon={Building2} label="Publisher" value={book.publisher || "NCERT"} />
                <DetailRow icon={Calendar} label="Published" value={book.publishedYear ? String(book.publishedYear) : "—"} />
                <DetailRow icon={Tag} label="Edition" value={book.edition || "—"} />
                <DetailRow icon={FileText} label="Pages" value={String(book.pages)} />
                <DetailRow icon={Tag} label="ISBN" value={book.isbn || "—"} />
                <DetailRow icon={Tag} label="Language" value={book.language?.name || "English"} />
              </dl>
            </TabsContent>

            {chapters.length > 0 && (
              <TabsContent value="contents" className="mt-4">
                <ol className="space-y-1">
                  {chapters.map((c, i) => (
                    <li key={i}>
                      <button
                        onClick={() => {
                          pushRecent(book.id);
                          useStore.setState({ readerPage: c.page });
                          openBook(book.id, "reader");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium">{c.title}</span>
                        <span className="text-xs text-muted-foreground">p. {c.page}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            )}

            <TabsContent value="reviews" className="mt-4">
              <ReviewsSection bookId={book.id} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Related */}
      {book.related && book.related.length > 0 && (
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Keep reading</p>
              <h2 className="font-serif text-xl font-bold">Related books</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {book.related.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <Icon className="mb-1.5 h-4 w-4 text-muted-foreground" />
      <p className="font-serif text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Search, ArrowRight, Sparkles, BookOpen, TrendingUp, Clock, Star,
  Library, ShieldCheck, GraduationCap, BookMarked, BarChart3,
} from "lucide-react";
import { useBook } from "@/hooks/use-books";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useBooksSection, useStats, useSubjects, useRecommendations } from "@/hooks/use-books";
import { formatNumber } from "@/lib/api-client";
import { BookCard } from "@/components/books/book-card";
import { subjectBadgeClass } from "@/components/books/book-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { STATS_HERO, BENEFITS, TESTIMONIALS } from "@/lib/constants";
import * as Icons from "lucide-react";

export function HomeView() {
  const go = useStore((s) => s.go);
  const setFilters = useStore((s) => s.setFilters);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const recentlyOpened = useStore((s) => s.recentlyOpened);

  const { data: stats } = useStats();
  const { data: subjects } = useSubjects();
  const { data: featured } = useBooksSection("featured", 6);
  const { data: trending } = useBooksSection("trending", 12);
  const { data: recent } = useBooksSection("recent", 6);
  const { data: recs } = useRecommendations();

  return (
    <div>
      <Hero stats={stats} />

      {/* Featured subjects */}
      <Section
        eyebrow="Explore by subject"
        title="Twelve subjects, one syllabus"
        subtitle="From ancient history to modern economics — every NCERT subject mapped to the UPSC framework."
        action={<Button variant="ghost" size="sm" onClick={() => go("library")}>View all <ArrowRight className="h-4 w-4" /></Button>}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {subjects?.slice(0, 12).map((s, i) => {
            const Icon = (Icons as any)[s.icon || "BookOpen"] || BookOpen;
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                onClick={() => { setFilters({ subject: s.slug }); go("library"); }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lift"
              >
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-10 translate-x-10 rounded-full bg-primary/5 blur-2xl transition-all group-hover:scale-150 group-hover:bg-primary/10" />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-110 ${subjectBadgeClass(s.color)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${subjectBadgeClass(s.color)}`}>
                      {s.bookCount}
                    </span>
                  </div>
                  <p className="font-serif text-sm font-semibold leading-tight">{s.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.bookCount} {s.bookCount === 1 ? "book" : "books"}</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-400">
                    Explore <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Section>

      {/* Trending marquee */}
      {trending && trending.length > 0 && (
        <section className="border-y border-border/40 bg-muted/20 py-5">
          <div className="mb-3 flex items-center gap-2 px-4 sm:px-6">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trending now</span>
          </div>
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee gap-4 px-4 sm:px-6">
              {[...trending, ...trending].map((b, i) => (
                <button
                  key={`${b.id}-${i}`}
                  onClick={() => useStore.getState().openBook(b.id, "book")}
                  className="group flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 text-left transition-colors hover:border-border"
                >
                  <div className={`h-12 w-9 shrink-0 rounded-md bg-gradient-to-br ${b.coverGradient} ring-1 ring-black/10`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.subject?.name} · Cl {b.classNum}</p>
                  </div>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
          </div>
        </section>
      )}

      {/* Popular / Featured */}
      <Section
        eyebrow="Hand-picked"
        title="Featured reads"
        subtitle="The most-read NCERT titles chosen by thousands of aspirants this week."
        action={<Button variant="ghost" size="sm" onClick={() => go("library")}>Browse library <ArrowRight className="h-4 w-4" /></Button>}
      >
        {/* Continue reading strip */}
        {recentlyOpened.length > 0 && (
          <div className="mb-6 flex items-center gap-3 overflow-x-auto scroll-elegant rounded-2xl border border-border/50 bg-card/40 p-3">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Continue
            </span>
            {recentlyOpened.slice(0, 6).map((id) => (
              <RecentBookChip key={id} bookId={id} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {featured?.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
        </div>
      </Section>

      {/* Recently added */}
      <Section
        eyebrow="Fresh off the press"
        title="Recently added"
        subtitle="New editions and classic titles freshly catalogued for your prep."
      >
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recent?.map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
        </div>
      </Section>

      {/* Recommended for you */}
      {recs && recs.recommendations.length > 0 && (
        <Section
          eyebrow="Personalized"
          title="Recommended for you"
          subtitle={recs.reason === "personalized" ? "Based on your reading history and highlights." : "Popular with UPSC aspirants right now."}
        >
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recs.recommendations.slice(0, 6).map((b, i) => <BookCard key={b.id} book={b} index={i} />)}
          </div>
        </Section>
      )}

      {/* Benefits */}
      <Benefits />

      {/* Stats band */}
      <StatsBand stats={stats} />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <CtaBand onSearch={() => setCommandOpen(true)} />
    </div>
  );
}

function Hero({ stats }: { stats: any }) {
  const go = useStore((s) => s.go);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const setFilters = useStore((s) => s.setFilters);

  return (
    <section className="relative overflow-hidden">
      {/* Background flourish — animated gradient mesh */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/[0.06] via-background to-background" />
      <div className="absolute inset-0 -z-10 paper-grain opacity-60" />
      <div className="absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute -right-32 top-20 -z-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
      <div className="absolute left-1/2 top-40 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-400/[0.06] blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "2s" }} />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium shadow-soft backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>AI-powered reading for UPSC & IAS aspirants</span>
            <Badge variant="secondary" className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-300">New</Badge>
          </motion.div>

          <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Your complete{" "}
            <span className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-sheen">
              NCERT library
            </span>{" "}
            for IAS preparation
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Read every NCERT book online, highlight the lines that matter, take notes,
            and let AI summarise chapters and generate MCQs — all in one elegant place.
          </p>

          {/* Big search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <button
              onClick={() => setCommandOpen(true)}
              className="group flex h-14 w-full items-center gap-3 rounded-2xl border border-border/70 bg-card px-5 text-left shadow-soft transition-all hover:border-emerald-500/40 hover:shadow-lift"
            >
              <Search className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-emerald-500" />
              <span className="flex-1 text-base text-muted-foreground">Search “Indian Constitution”, “monsoons”, “Akbar”…</span>
              <kbd className="hidden shrink-0 rounded border border-border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline">⌘ K</kbd>
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Popular:</span>
              {["History", "Polity", "Geography", "Old NCERT"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setFilters({ q: t }); go("library"); }}
                  className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground"
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 rounded-full px-6" onClick={() => go("library")}>
              <BookOpen className="h-4 w-4" /> Browse the library
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full px-6" onClick={() => go("library")}>
              <Sparkles className="h-4 w-4" /> Explore books
            </Button>
          </div>

          {/* Hero stats */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS_HERO.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur transition-all hover:border-emerald-500/30 hover:shadow-soft"
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-400/5 blur-xl transition-opacity group-hover:opacity-100" />
                <AnimatedCounter value={s.value} className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Section({
  eyebrow, title, subtitle, action, children,
}: {
  eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
          )}
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Benefits() {
  return (
    <section className="border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Why NCERT for UPSC</p>
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Built for the way aspirants actually study</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            NCERT books form the foundation of every topper's strategy. We make them delightful to read.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => {
            const Icon = (Icons as any)[b.icon] || Sparkles;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsBand({ stats }: { stats: any }) {
  const items = [
    { label: "Books catalogued", value: stats?.books ?? 36, icon: Library },
    { label: "Total downloads", value: stats?.totalDownloads ?? 0, icon: BookOpen },
    { label: "Pages viewed", value: stats?.totalViews ?? 0, icon: BarChart3 },
    { label: "Subjects covered", value: stats?.subjects ?? 12, icon: GraduationCap },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/30 p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <it.icon className="absolute right-4 top-4 h-8 w-8 text-primary/15" />
            <AnimatedCounter value={formatNumber(it.value)} className="font-serif text-3xl font-bold" />
            <p className="mt-1 text-sm text-muted-foreground">{it.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Loved by aspirants</p>
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">From beginners to toppers</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative flex flex-col rounded-2xl border border-border/50 bg-card p-6 shadow-soft"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="flex-1 text-pretty font-serif text-[15px] leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white`}>
                  {t.avatar}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ onSearch }: { onSearch: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-8 text-white shadow-lift sm:p-12">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <ShieldCheck className="mb-4 h-10 w-10" />
          <h2 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
            Start your UPSC journey with the right foundation
          </h2>
          <p className="mt-3 text-pretty text-emerald-50/90 sm:text-lg">
            Create a free account to sync your highlights, bookmarks and reading progress across every device.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" className="h-12 rounded-full bg-white px-6 text-emerald-700 hover:bg-emerald-50" onClick={onSearch}>
              <Search className="h-4 w-4" /> Find your first book
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10" onClick={() => useStore.getState().go("auth")}>
              <BookMarked className="h-4 w-4" /> Create free account
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Small chip showing a recently opened book for the "Continue reading" strip. */
function RecentBookChip({ bookId }: { bookId: string }) {
  const { data: book } = useBook(bookId);
  const openBook = useStore((s) => s.openBook);
  if (!book) return null;
  return (
    <button
      onClick={() => openBook(bookId, "reader")}
      className="group flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs transition-all hover:border-emerald-500/40 hover:bg-accent/40"
    >
      <div className={`h-6 w-4 rounded-sm bg-gradient-to-br ${book.coverGradient}`} />
      <span className="max-w-[100px] truncate font-medium">{book.title}</span>
    </button>
  );
}

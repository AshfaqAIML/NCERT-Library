"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, LayoutGrid, RotateCcw, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookGrid } from "@/components/books/book-grid";
import { useBooks, useSubjects } from "@/hooks/use-books";
import { useStore } from "@/lib/store";
import { CLASSES, LANGUAGES } from "@/lib/constants";
import type { BookType, SortKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest first" },
  { value: "downloads", label: "Most downloaded" },
  { value: "title", label: "A → Z" },
];

export function LibraryView() {
  const { filters, setFilters, resetFilters } = useStore();
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Reset to page 1 whenever the active filters change (adjust state during render)
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setPage(1);
  }

  const { data, isLoading, isFetching } = useBooks(filters, page, 24);
  const { data: subjects } = useSubjects();

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.classNum !== "all") n++;
    if (filters.language !== "all") n++;
    if (filters.subject !== "all") n++;
    if (filters.bookType !== "all") n++;
    if (filters.q) n++;
    return n;
  }, [filters]);

  const FilterPanel = (
    <div className="space-y-6">
      <FilterGroup title="Class">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filters.classNum === "all"} onClick={() => setFilters({ classNum: "all" })}>All</FilterChip>
          {CLASSES.map((c) => (
            <FilterChip key={c} active={filters.classNum === c} onClick={() => setFilters({ classNum: c })}>
              {c}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Subject">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filters.subject === "all"} onClick={() => setFilters({ subject: "all" })}>All</FilterChip>
          {subjects?.map((s) => (
            <FilterChip key={s.id} active={filters.subject === s.slug} onClick={() => setFilters({ subject: s.slug })}>
              {s.name}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Language">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filters.language === "all"} onClick={() => setFilters({ language: "all" })}>All</FilterChip>
          {LANGUAGES.map((l) => (
            <FilterChip key={l.code} active={filters.language === l.code} onClick={() => setFilters({ language: l.code })}>
              {l.name}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Book type">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filters.bookType === "all"} onClick={() => setFilters({ bookType: "all" })}>All</FilterChip>
          <FilterChip active={filters.bookType === "NEW"} onClick={() => setFilters({ bookType: "NEW" })}>New NCERT</FilterChip>
          <FilterChip active={filters.bookType === "OLD"} onClick={() => setFilters({ bookType: "OLD" })}>Old NCERT</FilterChip>
        </div>
      </FilterGroup>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/[0.05] via-card to-card p-6 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">The Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} NCERT titles` : "Loading…"} · curated for UPSC & IAS aspirants
          </p>
          </div>
        <div className="flex items-center gap-2">
            <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v as SortKey })}>
              <SelectTrigger className="h-9 w-[160px] rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          {/* Mobile filter trigger */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-full lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px]">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{FilterPanel}</div>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      </div>

      {/* Active filter chips (visible row) */}
      {activeFilterCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {filters.q && (
            <ActiveChip label={`“${filters.q}”`} onClear={() => setFilters({ q: "" })} />
          )}
          {filters.classNum !== "all" && (
            <ActiveChip label={`Class ${filters.classNum}`} onClear={() => setFilters({ classNum: "all" })} />
          )}
          {filters.subject !== "all" && (
            <ActiveChip label={subjects?.find((s) => s.slug === filters.subject)?.name || filters.subject} onClear={() => setFilters({ subject: "all" })} />
          )}
          {filters.language !== "all" && (
            <ActiveChip label={LANGUAGES.find((l) => l.code === filters.language)?.name || filters.language} onClear={() => setFilters({ language: "all" })} />
          )}
          {filters.bookType !== "all" && (
            <ActiveChip label={filters.bookType === "NEW" ? "New NCERT" : "Old NCERT"} onClear={() => setFilters({ bookType: "all" })} />
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/50 bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Filters</h2>
            </div>
            {FilterPanel}
          </div>
        </aside>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {isFetching && !data ? (
            <BookGrid books={[]} loading />
          ) : (
            <>
              <BookGrid books={data?.items ?? []} loading={isLoading} />
              {data && data.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page {page} of {data.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full"
                    disabled={page >= data.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {data && data.items.length === 0 && (
                <div className="mt-10 text-center">
                  <Button variant="outline" onClick={resetFilters}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium">
      {label}
      <button onClick={onClear} className="ml-0.5 rounded-full p-0.5 hover:bg-background">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

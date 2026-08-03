"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Folder, Sparkles, CornerDownLeft, Clock } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";
import { useSearch } from "@/hooks/use-books";
import type { BookT } from "@/lib/types";

export function CommandPalette() {
  const open = useStore((s) => s.commandOpen);
  const setOpen = useStore((s) => s.setCommandOpen);
  const go = useStore((s) => s.go);
  const openBook = useStore((s) => s.openBook);
  const pushRecent = useStore((s) => s.pushRecent);
  const setFilters = useStore((s) => s.setFilters);
  const recent = useStore((s) => s.recentlyOpened);
  const [q, setQ] = useState("");

  const { data } = useSearch(q);

  // Reset query whenever the palette is closed/reopened
  const handleOpenChange = (v: boolean) => {
    if (!v) setQ("");
    setOpen(v);
  };

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  function selectBook(book: BookT) {
    pushRecent(book.id);
    openBook(book.id, "book");
    setOpen(false);
  }

  const books: BookT[] = data?.books ?? [];

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput placeholder="Search books, subjects, topics…" value={q} onValueChange={setQ} />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No results found. Try another keyword.</CommandEmpty>

        {q.trim().length <= 1 && recent.length > 0 && (
          <CommandGroup heading="Recently opened">
            {recent.slice(0, 5).map((id) => (
              <CommandItem key={id} value={`recent-${id}`} onSelect={() => { openBook(id, "book"); setOpen(false); }}>
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Recently opened book</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {data?.subjects && data.subjects.length > 0 && (
          <CommandGroup heading="Subjects">
            {data.subjects.map((s: { name: string; slug: string }) => (
              <CommandItem
                key={s.slug}
                value={`subject-${s.slug}`}
                onSelect={() => { setFilters({ subject: s.slug }); go("library"); setOpen(false); }}
              >
                <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                {s.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {books.length > 0 && (
          <CommandGroup heading="Books">
            {books.map((b) => (
              <CommandItem key={b.id} value={b.title} onSelect={() => selectBook(b)}>
                <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{b.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {b.subject?.name} · Class {b.classNum}
                  </span>
                </div>
                <CornerDownLeft className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {q.trim().length <= 1 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick actions">
              <CommandItem onSelect={() => { go("library"); setOpen(false); }}>
                <Search className="mr-2 h-4 w-4" /> Browse the full library
              </CommandItem>
              <CommandItem onSelect={() => { setFilters({ subject: "history" }); go("library"); setOpen(false); }}>
                <BookOpen className="mr-2 h-4 w-4" /> Jump to History
              </CommandItem>
              <CommandItem onSelect={() => { go("admin"); setOpen(false); }}>
                <Sparkles className="mr-2 h-4 w-4" /> Open admin dashboard
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

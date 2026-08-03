"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenText, Library, Search, Menu, X, User, LogOut, LayoutDashboard,
  Sparkles, BookMarked, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { label: "Home", view: "home" as const, icon: BookOpenText },
  { label: "Library", view: "library" as const, icon: Library },
];

export function Header() {
  const { view, go, setCommandOpen, mobileNavOpen, setMobileNavOpen, user, setUser, setAuthTab } = useStore();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      setUser(null);
      go("home");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => go("home")}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="NCERT Library for IAS — home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
            <BookOpenText className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-background" />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-serif text-[15px] font-bold tracking-tight">NCERT Library</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">for IAS</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                view === item.view ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              {view === item.view && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="group ml-auto flex h-10 flex-1 max-w-md items-center gap-2.5 rounded-full border border-border/70 bg-background/60 px-4 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-background"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search books, subjects, topics…</span>
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:inline-flex"
            onClick={() => go("admin")}
            aria-label="Admin"
            title="Admin panel"
          >
            <LayoutDashboard className="h-[18px] w-[18px]" />
          </Button>
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-full pl-1 pr-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold uppercase text-white">
                    {(user.name || user.email)[0]}
                  </span>
                  <span className="hidden max-w-[80px] truncate text-sm font-medium sm:inline">{user.name || "Account"}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("profile")}>
                  <User className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => useStore.setState({ profileTab: "bookmarks" })}>
                  <BookMarked className="mr-2 h-4 w-4" /> Bookmarks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("admin")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCommandOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" /> AI Assistant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} disabled={signingOut} className="text-rose-600 focus:text-rose-700">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="h-9 rounded-full"
              onClick={() => {
                setAuthTab("login");
                go("auth");
              }}
            >
              Sign in
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Menu"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/60 bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {NAV.map((item) => (
                <button
                  key={item.view}
                  onClick={() => go(item.view)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    view === item.view ? "bg-accent text-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ))}
              <button
                onClick={() => go("admin")}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <LayoutDashboard className="h-4 w-4" /> Admin
              </button>
              <button
                onClick={() => {
                  setCommandOpen(true);
                  setMobileNavOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

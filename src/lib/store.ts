import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookFilters, SessionUser, View } from "./types";

interface NavState {
  view: View;
  bookId: string | null;        // selected book for details/reader
  adminTab: string;
  profileTab: string;
  authTab: "login" | "register";

  // library filters
  filters: BookFilters;

  // reader options
  readerPage: number;

  // recently opened book ids (persisted)
  recentlyOpened: string[];

  // ui
  commandOpen: boolean;
  mobileNavOpen: boolean;

  // session (persisted, lightweight)
  user: SessionUser | null;

  // AI assistant
  aiOpen: boolean;
  aiContext: { bookTitle?: string; subject?: string; pageText?: string } | null;

  // actions
  go: (view: View) => void;
  setAiOpen: (v: boolean) => void;
  setAiContext: (c: { bookTitle?: string; subject?: string; pageText?: string } | null) => void;
  openBook: (bookId: string, view?: "book" | "reader") => void;
  setAdminTab: (t: string) => void;
  setProfileTab: (t: string) => void;
  setAuthTab: (t: "login" | "register") => void;
  setFilters: (f: Partial<BookFilters>) => void;
  resetFilters: () => void;
  setReaderPage: (p: number) => void;
  pushRecent: (bookId: string) => void;
  setCommandOpen: (v: boolean) => void;
  setMobileNavOpen: (v: boolean) => void;
  setUser: (u: SessionUser | null) => void;
}

const defaultFilters: BookFilters = {
  q: "",
  classNum: "all",
  language: "all",
  subject: "all",
  bookType: "all",
  sort: "popular",
};

export const useStore = create<NavState>()(
  persist(
    (set) => ({
      view: "home",
      bookId: null,
      adminTab: "dashboard",
      profileTab: "overview",
      authTab: "login",
      filters: defaultFilters,
      readerPage: 1,
      recentlyOpened: [],
      commandOpen: false,
      mobileNavOpen: false,
      user: null,
      aiOpen: false,
      aiContext: null,

      go: (view) => {
        set({ view, mobileNavOpen: false });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
      },
      openBook: (bookId, view = "book") => {
        set({ bookId, view, mobileNavOpen: false });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
      },
      setAdminTab: (adminTab) => set({ adminTab }),
      setProfileTab: (profileTab) => set({ profileTab }),
      setAuthTab: (authTab) => set({ authTab }),
      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: defaultFilters }),
      setReaderPage: (readerPage) => set({ readerPage }),
      pushRecent: (bookId) =>
        set((s) => ({
          recentlyOpened: [bookId, ...s.recentlyOpened.filter((b) => b !== bookId)].slice(0, 12),
        })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setUser: (user) => set({ user }),
      setAiOpen: (aiOpen) => set({ aiOpen }),
      setAiContext: (aiContext) => set({ aiContext }),
    }),
    {
      name: "ncert-ias-store",
      partialize: (s) => ({
        recentlyOpened: s.recentlyOpened,
        user: s.user,
        filters: s.filters,
        readerPage: s.readerPage,
      }),
    }
  )
);

// Convenience selector hook
export function useView() {
  return useStore((s) => s.view);
}

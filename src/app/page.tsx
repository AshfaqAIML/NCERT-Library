"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/layout/command-palette";
import { Providers } from "@/components/providers";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { HomeView } from "@/components/home/home-view";
import { LibraryView } from "@/components/library/library-view";
import { BookDetailsView } from "@/components/books/book-details-view";
import { ProfileView } from "@/components/profile/profile-view";
import { AdminView } from "@/components/admin/admin-view";
import { AuthView } from "@/components/auth/auth-view";
import { AiAssistantDock } from "@/components/ai/ai-assistant-dock";
import { StreakNotification } from "@/components/home/streak-notification";

// PDF.js uses browser-only APIs (DOMMatrix), so the reader must not be SSR'd.
const ReaderView = dynamic(() => import("@/components/reader/reader-view").then((m) => m.ReaderView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  ),
});

export default function Home() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  );
}

function AppShell() {
  const view = useStore((s) => s.view);
  const setUser = useStore((s) => s.setUser);

  // Hydrate session on mount
  useEffect(() => {
    api<{ user: null | { id: string; email: string; name: string | null; role: "USER" | "ADMIN"; avatar: string | null } }>("/api/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, [setUser]);

  // Reader view is a full-screen experience without the standard chrome
  const isReader = view === "reader";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!isReader && <Header />}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {view === "home" && <HomeView />}
            {view === "library" && <LibraryView />}
            {view === "book" && <BookDetailsView />}
            {view === "reader" && <ReaderView />}
            {view === "profile" && <ProfileView />}
            {view === "admin" && <AdminView />}
            {view === "auth" && <AuthView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isReader && <Footer />}
      <CommandPalette />
      {!isReader && <AiAssistantDock />}
      {view === "home" && <StreakNotification />}
    </div>
  );
}

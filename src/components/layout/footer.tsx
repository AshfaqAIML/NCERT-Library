"use client";

import { BookOpenText, Github, Twitter, Mail, Heart, ArrowUpRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { SUBJECTS_FOOTER } from "@/lib/constants";

export function Footer() {
  const go = useStore((s) => s.go);
  const setFilters = useStore((s) => s.setFilters);

  return (
    <footer className="mt-auto border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
                <BookOpenText className="h-5 w-5" />
              </span>
              <div className="leading-none">
                <p className="font-serif text-[15px] font-bold">NCERT Library</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">for IAS</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A premium, centralized library of NCERT books crafted for serious UPSC & IAS aspirants.
              Read online, highlight, bookmark, take notes and let AI help you master every page.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Twitter, Github, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="social link"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects</h4>
            <ul className="space-y-2 text-sm">
              {SUBJECTS_FOOTER.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <button
                    onClick={() => {
                      setFilters({ subject: s.slug });
                      go("library");
                    }}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => go("library")} className="text-muted-foreground hover:text-foreground">All Books</button></li>
              <li><button onClick={() => { setFilters({ bookType: "OLD" }); go("library"); }} className="text-muted-foreground hover:text-foreground">Old NCERT</button></li>
              <li><button onClick={() => { setFilters({ bookType: "NEW" }); go("library"); }} className="text-muted-foreground hover:text-foreground">New NCERT</button></li>
              <li><button onClick={() => { setFilters({ trending: undefined } as any); go("library"); }} className="text-muted-foreground hover:text-foreground">Trending</button></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => go("auth")} className="text-muted-foreground hover:text-foreground">Sign in</button></li>
              <li><button onClick={() => go("profile")} className="text-muted-foreground hover:text-foreground">My Library</button></li>
              <li><button onClick={() => go("admin")} className="text-muted-foreground hover:text-foreground">Admin</button></li>
              <li>
                <a href="#" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  Help center <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} NCERT Library for IAS. Built for aspirants, by aspirants.</p>
          <p className="inline-flex items-center gap-1.5">
            Crafted with <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> for UPSC preparation
          </p>
        </div>
      </div>
    </footer>
  );
}

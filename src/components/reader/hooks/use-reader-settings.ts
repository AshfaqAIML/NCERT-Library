"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { DEFAULT_SETTINGS, type ReaderSettingsT } from "../types";

const LOCAL_KEY = "nl-reader-settings";

/**
 * Loads + persists reader settings (server if authed, localStorage for guests).
 */
export function useReaderSettings(isAuthed: boolean) {
  const [settings, setSettings] = useState<ReaderSettingsT>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: ReaderSettingsT = DEFAULT_SETTINGS;
      try {
        if (isAuthed) {
          const s = await api<any>("/api/reader/settings");
          if (s) next = { ...DEFAULT_SETTINGS, ...s };
        } else if (typeof window !== "undefined") {
          const raw = localStorage.getItem(LOCAL_KEY);
          if (raw) next = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
      } catch {}
      if (!cancelled) { setSettings(next); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [isAuthed]);

  const update = useCallback((patch: Partial<ReaderSettingsT>) => {
    setSettings((cur) => {
      const next = { ...cur, ...patch };
      if (isAuthed) {
        api("/api/reader/settings", { method: "PUT", body: JSON.stringify(next) }).catch(() => {});
      } else if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, [isAuthed]);

  return { settings, update, loaded };
}

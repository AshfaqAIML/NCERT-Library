"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical next-themes hydration guard
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className="relative h-9 w-9 rounded-full"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        <Sun className={`h-[18px] w-[18px] transition-all ${isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0"}`} />
      ) : (
        <Sun className="h-[18px] w-[18px]" />
      )}
      {mounted && (
        <Moon className={`absolute h-[18px] w-[18px] transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
      )}
    </Button>
  );
}

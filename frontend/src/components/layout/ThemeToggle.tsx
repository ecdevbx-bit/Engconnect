"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

// ThemeToggle — flips between the light ("Wild Bloom") and dark themes via
// next-themes (which persists the choice and respects the OS default). Renders a
// stable placeholder until mounted to avoid a hydration mismatch.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // In a rAF callback (not the effect body) to stay clear of the
    // set-state-in-effect rule; client-only so there's no hydration mismatch.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Theme is only known on the client — until mounted, render exactly what the
  // server did (light-theme label + moon) so hydration matches.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2/60 text-body transition-colors hover:bg-surface-2 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Until mounted, show a neutral icon (matches SSR) to avoid a flash. */}
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

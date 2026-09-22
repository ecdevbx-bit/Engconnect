"use client";

import { useMemo, useSyncExternalStore } from "react";
import { exhaustedDifficulties, subscribeExhausted } from "@/lib/quotaPrompt";

// Reactive list of difficulties a free user has exhausted this session for the
// given game (lowercase keys, e.g. ["easy"]). Re-renders the moment a new one
// is hit. Session-only — resets on reload, then self-corrects as the user
// retries. Used to flag "done today" on the difficulty tabs.
export function useExhaustedDifficulties(game: string): string[] {
  // getSnapshot returns a value-stable string (primitives compare by value, so
  // useSyncExternalStore won't loop); we split it into an array via useMemo.
  const joined = useSyncExternalStore(
    subscribeExhausted,
    () => exhaustedDifficulties(game).join(","),
    () => "",
  );
  return useMemo(() => (joined ? joined.split(",") : []), [joined]);
}

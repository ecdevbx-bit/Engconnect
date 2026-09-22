"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

// Own-built feature flags (no Unleash). FlagsProvider fetches a key→enabled
// snapshot from the backend's public GET /api/flags once on mount and exposes
// it through FlagContext. Until the fetch resolves, flagsReady is false and the
// hooks fall back to their in-code default (fail-open) — so a slow or failed
// fetch never hides a shipped feature. Admin toggles take effect on next load.

type FlagState = {
  flagsReady: boolean;
  isEnabled: (feature: string) => boolean;
};

const FlagContext = createContext<FlagState | null>(null);

// Same base convention as src/lib/v3Game.ts: NEXT_PUBLIC_API_URL is the origin
// (no /api), and every backend route is under /api.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type FlagsEnvelope = { success?: boolean; message?: string; data?: Record<string, boolean> };

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/flags`, { cache: "no-store" });
        const env = (await res.json()) as FlagsEnvelope;
        if (!cancelled && res.ok && env?.data) setFlags(env.data);
      } catch {
        // Network/parse failure → leave flags null so the defaults win.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<FlagState>(
    () => ({
      flagsReady: flags !== null,
      isEnabled: (feature: string) => flags?.[feature] ?? false,
    }),
    [flags],
  );

  return createElement(FlagContext.Provider, { value }, children);
}

// We read FlagContext directly instead of a throwing useFlag(): useContext
// returns null when the provider is absent, so these hooks degrade to the
// default rather than crashing.
function useFlagWithDefault(feature: string, fallback: boolean): boolean {
  const ctx = useContext(FlagContext);
  // No provider, or the snapshot hasn't loaded yet → default (fail-open).
  if (!ctx || !ctx.flagsReady) return fallback;
  return ctx.isEnabled(feature);
}

export const FLAG_PRONUNCIATION = "englishconnection-pronunciation";

export function usePronunciationEnabled(): boolean {
  return useFlagWithDefault(FLAG_PRONUNCIATION, true);
}

export const FLAG_LANG_CAROUSEL = "englishconnection-lang-carousel";

export function useLangCarouselEnabled(): boolean {
  return useFlagWithDefault(FLAG_LANG_CAROUSEL, true);
}

export const FLAG_WORD_BANK = "englishconnection-word-bank";

// Defaults to false: the Word Bank ships dark, so if the flag snapshot is
// missing or unreachable it stays hidden rather than flashing into view.
export function useWordBankEnabled(): boolean {
  return useFlagWithDefault(FLAG_WORD_BANK, false);
}

export const FLAG_AI_PARTNER = "englishconnection-ai-partner";

// Defaults to false so the AI Partner stays CLOSED while it's being rebuilt:
// if the flag snapshot is slow, missing or unreachable the chat is still not
// reachable, and learners get the "we're upgrading" popup instead. Flip the
// englishconnection-ai-partner flag on to bring it back.
export function useAIPartnerEnabled(): boolean {
  return useFlagWithDefault(FLAG_AI_PARTNER, false);
}

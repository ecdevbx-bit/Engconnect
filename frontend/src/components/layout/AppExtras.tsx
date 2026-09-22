"use client";

import dynamic from "next/dynamic";
import { NextStep, NextStepProvider, type Tour } from "nextstepjs";

import { JUMBLE_TOUR, JUMBLE_TOUR_NAME, JUMBLE_TOUR_SEEN_KEY } from "@/components/jumbleWordsComponent/jumbleTour";
import {
  PRONUNCIATION_TOUR,
  PRONUNCIATION_TOUR_NAME,
  PRONUNCIATION_TOUR_SEEN_KEY,
} from "@/app/(app)/dashboard/pronunciation/pronunciationTour";
import { AI_PARTNER_TOUR, AI_PARTNER_TOUR_NAME, AI_PARTNER_TOUR_SEEN_KEY } from "@/components/game/aiPartnerTour";
import JumbleTourCard from "@/components/jumbleWordsComponent/JumbleTourCard";

// In-app-only layer, mounted by AppShell (dashboard + /v3 screens) instead of
// the root Providers, so the public pages (landing, /pro, /login…) don't
// download the tour engine or the celebration/upsell overlays at all.
// The overlays are code-split (next/dynamic) and fetched after hydration.
const LevelUpCelebrationRoot = dynamic(() => import("@/components/v3/LevelUpCelebrationRoot"), { ssr: false });
const BadgeCelebrationRoot = dynamic(() => import("@/components/badges/BadgeCelebrationRoot"), { ssr: false });
const GoPremiumRoot = dynamic(() => import("@/components/premium/GoPremiumRoot"), { ssr: false });
const TrialReminderRoot = dynamic(() => import("@/components/premium/TrialReminderRoot"), { ssr: false });
const AIPartnerGateRoot = dynamic(() => import("@/components/game/AIPartnerGateRoot"), { ssr: false });

// Every product walkthrough is registered on the single shared <NextStep>.
// startNextStep(name) picks the right one; the map below lets the shared
// onComplete/onSkip mark the matching "seen" flag so each tour only
// auto-launches once per browser.
// Lock the page while a walkthrough is open: disableInteraction on every step
// means even the spotlighted element can't be clicked, and clickThroughOverlay
// is off below so everything else is blocked too. Every step is informational
// (Next / Prev / Skip), so nothing needs page interaction to advance.
const ALL_TOURS: Tour[] = [...JUMBLE_TOUR, ...PRONUNCIATION_TOUR, ...AI_PARTNER_TOUR].map((t) => ({
  ...t,
  steps: t.steps.map((s) => ({ ...s, disableInteraction: true })),
}));
const TOUR_SEEN_KEYS: Record<string, string> = {
  [JUMBLE_TOUR_NAME]: JUMBLE_TOUR_SEEN_KEY,
  [PRONUNCIATION_TOUR_NAME]: PRONUNCIATION_TOUR_SEEN_KEY,
  [AI_PARTNER_TOUR_NAME]: AI_PARTNER_TOUR_SEEN_KEY,
};

function markTourSeen(tourName: string | null) {
  const key = tourName ? TOUR_SEEN_KEYS[tourName] : undefined;
  if (key && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // Storage may be unavailable (private mode); the tour just runs again next visit.
    }
  }
}

export default function AppExtras({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <NextStep
        steps={ALL_TOURS}
        cardComponent={JumbleTourCard}
        shadowRgb="11,14,20"
        shadowOpacity="0.78"
        displayArrow
        clickThroughOverlay={false}
        scrollToTop={false}
        // Disable nextstepjs's own smooth scroll-to-element (it caused a
        // jarring auto-slide when opening a tour). JumbleTourCard instead
        // brings genuinely off-screen targets in instantly (no slide).
        noInViewScroll
        onComplete={markTourSeen}
        onSkip={(_step, tourName) => markTourSeen(tourName)}
      >
        {children}
      </NextStep>
      {/* Level-up card — fires from any feature via triggerLevelUp. */}
      <LevelUpCelebrationRoot />
      {/* Badge award celebration — fires from enqueueBadgeCelebrations. */}
      <BadgeCelebrationRoot />
      {/* "Free daily quota reached → Go Pro" prompt. */}
      <GoPremiumRoot />
      {/* Free-trial nudge: shows only if an admin cancelled the trial. */}
      <TrialReminderRoot />
      {/* "AI Partner is being upgraded" popup — opened by blocked AI Partner links. */}
      <AIPartnerGateRoot />
    </NextStepProvider>
  );
}

"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { NextStep, NextStepProvider, type Tour } from "nextstepjs";
import { FlagsProvider } from "@/lib/featureFlags";
import { store } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { resetXP, syncFromBackend, setLevels } from "@/store/slices/xpSlice";
import { SessionProvider, useSession } from "@/lib/session";
import { v3FetchMyAttributes, v3FetchLevels } from "@/lib/v3Game";
import { setSessionId } from "@/lib/sessionId";
import { TooltipProvider } from "@/components/ui/tooltip";
import LevelUpCelebrationRoot from "@/components/v3/LevelUpCelebrationRoot";
import BadgeCelebrationRoot from "@/components/badges/BadgeCelebrationRoot";
import GoPremiumRoot from "@/components/premium/GoPremiumRoot";
import TrialReminderRoot from "@/components/premium/TrialReminderRoot";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import AIPartnerGateRoot from "@/components/game/AIPartnerGateRoot";
import { JUMBLE_TOUR, JUMBLE_TOUR_NAME, JUMBLE_TOUR_SEEN_KEY } from "@/components/jumbleWordsComponent/jumbleTour";
import {
  PRONUNCIATION_TOUR,
  PRONUNCIATION_TOUR_NAME,
  PRONUNCIATION_TOUR_SEEN_KEY,
} from "@/app/(app)/dashboard/pronunciation/pronunciationTour";
import {
  AI_PARTNER_TOUR,
  AI_PARTNER_TOUR_NAME,
  AI_PARTNER_TOUR_SEEN_KEY,
} from "@/components/game/aiPartnerTour";
import JumbleTourCard from "@/components/jumbleWordsComponent/JumbleTourCard";

// Every product walkthrough is registered on the single shared <NextStep>.
// startNextStep(name) picks the right one; the map below lets the shared
// onComplete/onSkip mark the matching "seen" flag so each tour only
// auto-launches once per browser.
// Lock the page while a walkthrough is open: disableInteraction on every step
// means even the spotlighted element can't be clicked, and clickThroughOverlay
// is off below so everything else is blocked too. Together they stop the user
// from switching difficulty tabs / practice steps mid-tour, on mobile and
// desktop. Every step is informational (Next / Prev / Skip), so nothing needs
// page interaction to advance.
const ALL_TOURS: Tour[] = [...JUMBLE_TOUR, ...PRONUNCIATION_TOUR, ...AI_PARTNER_TOUR].map((t) => ({
  ...t,
  steps: t.steps.map((s) => ({ ...s, disableInteraction: true })),
}));
const TOUR_SEEN_KEYS: Record<string, string> = {
  [JUMBLE_TOUR_NAME]: JUMBLE_TOUR_SEEN_KEY,
  [PRONUNCIATION_TOUR_NAME]: PRONUNCIATION_TOUR_SEEN_KEY,
  [AI_PARTNER_TOUR_NAME]: AI_PARTNER_TOUR_SEEN_KEY,
};

// V3StateSync pulls the *authoritative* hot-state attributes from
// /api/users/me/attributes on session load and mirrors them into
// Redux. The NextAuth session's totalXp/currentLevel are stale (set
// once at user creation in ecaiUser and never refreshed), so we don't
// trust them — we read directly from ecaiUserAttributes which the
// gameplay handler updates atomically on every solve.
function V3StateSync() {
  const dispatch = useAppDispatch();
  const session = useSession();
  const status = session.status;
  const accessToken = session.data?.user?.accessToken ?? "";
  const sessionId = session.data?.user?.sessionId ?? "";

  // Mirror the single-active-session id into the module store the API/WS
  // clients read when stamping X-Session-Id.
  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      dispatch(resetXP());
      return;
    }
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    v3FetchMyAttributes(accessToken)
      .then((attrs) => {
        if (cancelled) return;
        dispatch(
          syncFromBackend({
            totalXp: attrs.xp,
            currentLevel: attrs.currentLevel,
            combos: attrs.combos,
          }),
        );
      })
      .catch((err) => {
        console.error("V3StateSync: failed to load attributes", err);
      });
    // Levels are global, not per-user, but the fetch lives here for
    // convenience — runs once per session, same lifecycle as attrs.
    v3FetchLevels(accessToken)
      .then((levels) => {
        if (cancelled) return;
        dispatch(setLevels(levels));
      })
      .catch((err) => {
        console.error("V3StateSync: failed to load levels", err);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, status, accessToken]);

  return null;
}

function AuthRouter({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <V3StateSync />
      {children}
      {/* App-wide level-up card — fires from any feature via triggerLevelUp. */}
      <LevelUpCelebrationRoot />
      {/* App-wide badge award celebration — fires from enqueueBadgeCelebrations. */}
      <BadgeCelebrationRoot />
      {/* App-wide "free daily quota reached → Go Pro" prompt. */}
      <GoPremiumRoot />
      {/* App-wide free-trial nudge: shows only if an admin cancelled the trial. */}
      <TrialReminderRoot />
      {/* App-wide "install this as an app" nudge — signed in or not. Inside
          SessionProvider so it can re-offer just after a sign-in. */}
      <InstallAppPrompt />
      {/* App-wide "AI Partner is being upgraded" popup — opened by every
          blocked AI Partner link while its feature flag is off. */}
      <AIPartnerGateRoot />
    </SessionProvider>
  );
}

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Provider store={store}>
        <FlagsProvider>
        <TooltipProvider delayDuration={200}>
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
              <AuthRouter>{children}</AuthRouter>
            </NextStep>
          </NextStepProvider>
        </TooltipProvider>
      </FlagsProvider>
      </Provider>
    </ThemeProvider>
  );
}

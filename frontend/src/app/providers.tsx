"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { FlagsProvider } from "@/lib/featureFlags";
import { store } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { resetXP, syncFromBackend, setLevels } from "@/store/slices/xpSlice";
import { SessionProvider, useSession } from "@/lib/session";
import { v3FetchMyAttributes, v3FetchLevels } from "@/lib/v3Game";
import { setSessionId } from "@/lib/sessionId";
import { TooltipProvider } from "@/components/ui/tooltip";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";


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
      {/* App-wide "install this as an app" nudge — signed in or not. Inside
          SessionProvider so it can re-offer just after a sign-in. */}
      <InstallAppPrompt />
    </SessionProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Provider store={store}>
        <FlagsProvider>
        <TooltipProvider delayDuration={200}>
          <AuthRouter>{children}</AuthRouter>
        </TooltipProvider>
      </FlagsProvider>
      </Provider>
    </ThemeProvider>
  );
}

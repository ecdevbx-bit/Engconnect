"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";

import { useAIPartnerEnabled } from "@/lib/featureFlags";
import { triggerAIPartnerNotice } from "@/lib/aiPartnerGate";
import { v3FetchAIPartnerAccess } from "@/lib/v3Chat";

// One place every AI Partner entry point asks "may I open this?".
//
// `blocked` is the flag read (fails CLOSED — see useAIPartnerEnabled), and
// `guard` is a drop-in onClick for any <Link>/<a>/button that points at
// /dashboard/ai-partner: while blocked it cancels the navigation and pops the
// "we're upgrading" modal instead, so the chat is never reachable by clicking.
// It returns true when it swallowed the event, which lets imperative callers
// (router.push sites) bail out early.
export function useAIPartnerGate(): {
  blocked: boolean;
  checking: boolean;
  guard: (e?: { preventDefault: () => void; stopPropagation: () => void }) => boolean;
} {
  const globallyEnabled = useAIPartnerEnabled();
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;
  const [betaAccess, setBetaAccess] = useState<{
    accessToken: string;
    allowed: boolean;
  } | null>(null);

  useEffect(() => {
    if (globallyEnabled || !accessToken || betaAccess?.accessToken === accessToken) return;

    let cancelled = false;
    v3FetchAIPartnerAccess(accessToken)
      .then(({ enabled }) => {
        if (!cancelled) setBetaAccess({ accessToken, allowed: enabled });
      })
      .catch(() => {
        // An unavailable or malformed entitlement response must not expose the
        // beta route. The backend performs the same check independently.
        if (!cancelled) setBetaAccess({ accessToken, allowed: false });
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, betaAccess?.accessToken, globallyEnabled]);

  const betaAllowed =
    betaAccess && betaAccess.accessToken === accessToken ? betaAccess.allowed : null;
  const checking =
    !globallyEnabled && (status === "loading" || (Boolean(accessToken) && betaAllowed === null));
  const blocked = !globallyEnabled && betaAllowed !== true;

  const guard = useCallback(
    (e?: { preventDefault: () => void; stopPropagation: () => void }) => {
      if (!blocked) return false;
      e?.preventDefault();
      e?.stopPropagation();
      if (checking) return true;
      triggerAIPartnerNotice();
      return true;
    },
    [blocked, checking],
  );

  return { blocked, checking, guard };
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { v3FetchMyProfile } from "@/lib/v3Game";

// Fetches the signed-in user's Pro status from their profile (premiumUntil).
// isPro is computed in the fetch (Date.now can't run during render). Used by
// the premium page header + cards. A couple of consumers means a couple of
// /users/me GETs — negligible for this page.
export function useIsPro(): { isPro: boolean; premiumUntil: string | null } {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    v3FetchMyProfile(accessToken)
      .then((p) => {
        if (cancelled) return;
        const until = p.premiumUntil ?? null;
        setPremiumUntil(until);
        setIsPro(!!until && new Date(until).getTime() > Date.now());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { isPro, premiumUntil };
}

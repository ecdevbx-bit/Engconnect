"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { v3FetchMyBadges } from "@/lib/v3Game";
import { BadgeDeck } from "@/components/v3/BadgeDeck";

// MyBadges renders the badges the signed-in user has earned as the curved,
// fanned BadgeDeck carousel (the same component the leaderboard uses). Hides
// itself entirely when the user has none — no point in an empty placeholder.

export default function MyBadges({ desktopExpanded = false }: { desktopExpanded?: boolean }) {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";
  const [badges, setBadges] = useState<string[]>([]);
  // Starts true so the card shows a "Loading…" line instead of flashing the
  // "no badges → hide" branch before the fetch resolves. (Setting it inside
  // the effect would trip the set-state-in-effect lint rule.)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    v3FetchMyBadges(accessToken)
      .then((b) => {
        if (!cancelled) setBadges(b);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load badges");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!loading && badges.length === 0 && !error) return null;

  return (
    <div className="c-box rounded-2xl p-4 sm:p-6">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Badges
      </h3>

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="py-8 text-center text-sm text-red-600">{error}</p>}

      {!loading && !error && badges.length > 0 && (
        <>
          <p className="mt-1 hidden text-center text-xs text-muted-foreground md:block">
            Tap the stack to expand · use the arrows to browse your badges.
          </p>
          <BadgeDeck badges={badges} mobileExpanded desktopExpanded={desktopExpanded} />
        </>
      )}
    </div>
  );
}

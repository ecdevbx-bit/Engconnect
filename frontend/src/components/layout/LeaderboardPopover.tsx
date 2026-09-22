"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { useSession } from "@/lib/session";
import { v3FetchLeaderboard, avatarUrl, type V3LeaderboardEntry } from "@/lib/v3Game";

// LeaderboardPopover — opens from the navbar XP chip. Shows the user's
// rank highlighted + 4 above and 4 below + a link to the full page.
//
// Fetched on open (not on mount) so the navbar doesn't load this for
// users who never click it. Cached briefly via a ref so flipping it
// open + closed + open within a few seconds doesn't re-fetch.

const CACHE_TTL_MS = 30_000;

type CachedPayload = {
  fetchedAt: number;
  total: number;
  me: { rank: number; entries: V3LeaderboardEntry[] } | null;
};

export default function LeaderboardPopover({
  open,
  onClose,
  accessToken,
}: {
  open: boolean;
  onClose: () => void;
  accessToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<CachedPayload | null>(null);
  const [data, setData] = useState<CachedPayload | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!accessToken) {
      setError("Sign in to see the leaderboard.");
      return;
    }
    // Serve cached if fresh.
    const cached = cacheRef.current;
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setData(cached);
      return;
    }
    setLoading(true);
    setError(null);
    v3FetchLeaderboard(accessToken, { meRadius: 4 })
      .then((res) => {
        const payload: CachedPayload = {
          fetchedAt: Date.now(),
          total: res.total,
          me: res.me,
        };
        cacheRef.current = payload;
        setData(payload);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
      })
      .finally(() => setLoading(false));
  }, [open, accessToken]);

  // Close on outside click / Escape — same pattern as AccountDropdown.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Global leaderboard"
      // Same opaque + blur treatment as AccountDropdown — `.glass` alone
      // is too transparent for a popover menu.
      //
      // On phones the navbar chip sits mid-bar, so anchoring the 360px panel
      // to its right edge pushes it off-screen to the left. Below `sm` we pin
      // it centered just under the navbar (fixed, full-width minus a margin);
      // from `sm` up it returns to the right-aligned dropdown.
      className="fixed inset-x-3 top-[80px] z-50 w-auto overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-2 shadow-[0_20px_60px_rgba(0,0,0,0.55)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[360px]"
      style={{ animation: "popIn 0.15s ease-out both" }}
    >
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Trophy size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-heading">Global leaderboard</p>
          <p className="text-xs text-muted-foreground">
            {data ? `${data.total.toLocaleString()} players` : "—"}
          </p>
        </div>
        {data?.me && (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            Rank #{data.me.rank}
          </span>
        )}
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="py-2 max-h-[420px] overflow-y-auto">
        {loading && <p className="px-5 py-3 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="px-5 py-3 text-sm text-red-600">{error}</p>}
        {!loading && !error && data?.me && data.me.entries.length > 0 ? (
          data.me.entries.map((entry) => (
            <LeaderboardRow
              key={entry.sub}
              entry={entry}
              highlighted={entry.rank === data.me!.rank}
            />
          ))
        ) : !loading && !error ? (
          <p className="px-5 py-3 text-sm text-muted-foreground">
            Earn some XP to appear on the leaderboard.
          </p>
        ) : null}
      </div>

      <div className="h-px bg-white/[0.06]" />

      <Link
        href="/dashboard/leaderboard"
        onClick={onClose}
        className="block px-5 py-3 text-center text-sm font-semibold text-primary hover:bg-surface-2/40 transition-colors"
      >
        See full leaderboard →
      </Link>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function LeaderboardRow({
  entry,
  highlighted,
}: {
  entry: V3LeaderboardEntry;
  highlighted: boolean;
}) {
  const initials = entry.name
    ? entry.name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div
      className={`flex items-center gap-3 px-5 py-2 transition-colors ${
        highlighted
          ? "bg-primary/10"
          : "hover:bg-surface-2/40"
      }`}
    >
      <span className="w-7 text-xs font-mono text-muted-foreground tabular-nums">
        #{entry.rank}
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
        {(() => {
          const url = avatarUrl(entry.avatar, 56);
          if (!url) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={entry.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          );
        })() || (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[10px] font-bold text-[#0b0e14]">
            {initials}
          </span>
        )}
      </span>
      <p
        className={`flex-1 min-w-0 truncate text-sm ${
          highlighted ? "font-bold text-heading" : "font-medium text-body"
        }`}
      >
        {entry.name || "Anonymous"}
      </p>
      <span className={`text-xs font-semibold tabular-nums ${highlighted ? "text-primary" : "text-muted-foreground"}`}>
        {entry.value.toLocaleString()} XP
      </span>
    </div>
  );
}

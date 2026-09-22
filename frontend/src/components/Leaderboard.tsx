"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Flame, Calendar, ArrowUpRight } from "lucide-react";
import { useSession } from "@/lib/session";
import { useAppSelector } from "@/store/hooks";
import {
  v3FetchLeaderboard,
  v3FetchMyAttributes,
  avatarUrl,
  type V3LeaderboardEntry,
  type V3LeaderboardResponse,
  type V3LeaderboardMode,
  type V3LeaderboardMetric,
} from "@/lib/v3Game";
import MyBadges from "./MyBadges";
import { PlantArt, PlantArtDefs, plantStageForIndex } from "@/components/v3/plantArt";

// Full leaderboard page. The board area is responsive:
//   • Banner card at top: avatar + name + level + XP + rank pill.
//   • Badges card (shared <MyBadges/>, same component as the profile page).
//   • Mobile / tablet (<lg): a single column with an XP / Streak / Weekly
//     tab toggle — the active tab swaps the card below (Weekly is default).
//   • Desktop (lg+): the two-column layout — your XP/Streak standing on the
//     left with the weekly top-performers board pinned as a sidebar on the
//     right (Weekly is always visible there, so the toggle is XP / Streak).
//
// Auth: this page reads only via the access token, no admin gate. If the
// user isn't signed in (no token), it shows a "please sign in" stub
// rather than redirecting — keeps the URL bookmarkable.

const MODE_META: Record<V3LeaderboardMode, {
  label: string;
  unit: string;
  icon: React.ReactNode;
  bannerHint: (n: number) => string;
}> = {
  xp: {
    label: "XP",
    unit: "XP",
    icon: <Trophy size={14} />,
    bannerHint: (n) => `${n.toLocaleString()} XP`,
  },
  streak: {
    label: "Streak",
    unit: "solves",
    icon: <Flame size={14} />,
    bannerHint: (n) => `${n.toLocaleString()} solves`,
  },
};

// levelFromXP walks the catalog (already sorted by threshold ascending in
// Redux) and returns the highest level whose threshold this XP clears.
// Used to label each XP-mode leaderboard row — the wire entry only carries
// the raw value, not the level, so we derive it client-side.
function levelFromXP(xp: number, levels: { level: number; threshold: number }[]): number {
  let lvl = 1;
  for (const l of levels) {
    if (xp >= l.threshold) lvl = l.level;
    else break;
  }
  return lvl;
}

export default function LeaderboardPage() {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";
  const userName = session.data?.user?.name ?? "You";
  const userAvatar = session.data?.user?.avatar ?? "";
  const { totalXP, currentLevel, levels } = useAppSelector((s) => s.xp);

  const [mode, setMode] = useState<V3LeaderboardMetric>("weekly");
  // Per-mode cache so toggling between tabs doesn't re-fetch when we've
  // already loaded that mode this session.
  const [byMode, setByMode] = useState<Partial<Record<V3LeaderboardMode, V3LeaderboardResponse>>>({});
  // Weekly top 10 lives independently of the xp/streak toggle — the
  // sidebar always shows the current ISO week's XP earners.
  const [weeklyTop, setWeeklyTop] = useState<V3LeaderboardEntry[]>([]);
  const [weeklyLoaded, setWeeklyLoaded] = useState(false);
  const [activityStreak, setActivityStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Weekly has no per-user board fetch, so the profile banner piggybacks on
  // the all-time XP standing (rank + total XP) while the Weekly tab is active.
  const bannerMode: V3LeaderboardMode = mode === "weekly" ? "xp" : mode;
  const data = byMode[bannerMode] ?? null;

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    // Skip if we've already got this board in cache.
    if (byMode[bannerMode]) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Only `me`+radius is needed here; the weekly board fetch below covers
    // `top`. Dropping top here saves the backend a ZREVRANGE.
    v3FetchLeaderboard(accessToken, { mode: bannerMode, meRadius: 8 })
      .then((res) => {
        if (cancelled) return;
        setByMode((prev) => ({ ...prev, [bannerMode]: res }));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, bannerMode, byMode]);

  // Side fetch (my streak) runs once on mount — not mode-dependent, so we
  // don't re-trigger it on tab switch. (Badges now load inside <MyBadges/>.)
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    v3FetchMyAttributes(accessToken)
      .then((attrs) => {
        if (cancelled) return;
        if (attrs) setActivityStreak(attrs.activityStreak ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Weekly top 10 — independent of the xp/streak toggle. meRadius=0
  // because the sidebar only shows the leaderboard's top slice; we
  // don't need the caller's own rank on the weekly board here.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    v3FetchLeaderboard(accessToken, { mode: "weekly", top: 10, meRadius: 0 })
      .then((res) => {
        if (cancelled) return;
        setWeeklyTop(res.top ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setWeeklyTop([]);
      })
      .finally(() => {
        if (!cancelled) setWeeklyLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const bannerValue = bannerMode === "xp" ? totalXP : activityStreak;
  const meta = MODE_META[bannerMode];

  // Map a player's level → plant growth stage (1..10), the same mapping the
  // navbar/profile level chip uses, so a row shows a sapling that grows with
  // level rather than a "Lv N" pill.
  const stageForLevel = (lvl: number) => {
    const idx = levels.findIndex((l) => l.level === lvl);
    return plantStageForIndex(idx < 0 ? 0 : idx, levels.length);
  };

  const subtitle = useMemo(() => {
    if (!data) return "—";
    return `${data.total.toLocaleString()} players · ranked by ${meta.label.toLowerCase()}`;
  }, [data, meta.label]);

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-2xl font-bold text-heading mb-3">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Sign in to see where you stand.</p>
      </div>
    );
  }

  return (
    // overflow-x-hidden contains the fanned <MyBadges/> deck, whose outer
    // cards translate a few px past their card on narrow phones — without this
    // the whole page gains a horizontal scroll (and becomes pinch-zoomable),
    // unlike the game pages. Scoped here so the shared deck/profile are untouched.
    <div className="mx-auto max-w-6xl space-y-5 overflow-x-hidden">
      {/* ── Profile banner ──────────────────────────────────────────── */}
      <ProfileBanner
        name={userName}
        avatar={userAvatar}
        level={currentLevel}
        levelStage={stageForLevel(currentLevel)}
        valueLabel={meta.bannerHint(bannerValue)}
        rank={data?.me?.rank}
        total={data?.total ?? 0}
        subtitle={subtitle}
      />

      {/* ── Badges — same self-contained card the profile page uses, but
            rendered already-expanded here on every size (desktopExpanded). ── */}
      <MyBadges desktopExpanded />

      {/* ── Mobile / tablet (<lg): single column, tab-driven board ───── */}
      <div className="space-y-5 lg:hidden">
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === "weekly" ? (
          <WeeklyCard weeklyLoaded={weeklyLoaded} weeklyTop={weeklyTop} />
        ) : (
          <StandingCard
            cardMode={bannerMode}
            loading={loading}
            error={error}
            data={data}
            levels={levels}
            stageForLevel={stageForLevel}
          />
        )}
      </div>

      {/* ── Desktop (lg+): the previous two-column layout — your XP/Streak
            standing on the left, weekly top performers pinned as a sidebar
            on the right (always visible, so the toggle is XP / Streak). ── */}
      <div className="hidden space-y-5 lg:block">
        <StandingToggle mode={bannerMode} onChange={setMode} />
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <StandingCard
            cardMode={bannerMode}
            loading={loading}
            error={error}
            data={data}
            levels={levels}
            stageForLevel={stageForLevel}
          />
          <WeeklyCard weeklyLoaded={weeklyLoaded} weeklyTop={weeklyTop} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

// StandingCard — the "Your standing" board for an all-time mode (xp/streak).
// Shared by the mobile single-column flow and the desktop grid's left column.
function StandingCard({
  cardMode,
  loading,
  error,
  data,
  levels,
  stageForLevel,
}: {
  cardMode: V3LeaderboardMode;
  loading: boolean;
  error: string | null;
  data: V3LeaderboardResponse | null;
  levels: { level: number; threshold: number }[];
  stageForLevel: (lvl: number) => number;
}) {
  const meta = MODE_META[cardMode];
  return (
    <div className="c-box rounded-2xl p-6">
      <SectionHeader icon={meta.icon} title="Your standing" />
      {loading && <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>}
      {error && <p className="text-sm text-red-600 py-8 text-center">{error}</p>}
      {!loading && !error && data?.me && (
        <div className="space-y-1.5">
          {data.me.entries.map((entry) => {
            const lvl = cardMode === "xp" ? levelFromXP(entry.value, levels) : undefined;
            return (
              <LeaderboardRow
                key={entry.sub}
                rank={entry.rank}
                name={entry.name}
                avatar={entry.avatar}
                value={entry.value}
                unit={meta.unit}
                level={lvl}
                levelStage={lvl !== undefined ? stageForLevel(lvl) : undefined}
                highlighted={entry.rank === data.me!.rank}
              />
            );
          })}
        </div>
      )}
      {/* Free users aren't ranked on the board — show their estimated standing
          and a nudge to go Pro for the exact rank. */}
      {!loading && !error && !data?.me && data?.estimate && (
        <div className="space-y-3 py-1">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.03] p-4 text-center ring-1 ring-emerald-500/20">
            {data.estimate.band && (
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {data.estimate.band}
              </p>
            )}
            <p className="mt-1 text-sm text-body">
              Roughly{" "}
              <span className="font-bold text-heading">
                #{data.estimate.approxRankFrom.toLocaleString()}–{data.estimate.approxRankTo.toLocaleString()}
              </span>{" "}
              of {data.estimate.totalLearners.toLocaleString()} learners
            </p>
          </div>
          <Link
            href="/v3/premium"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#3f9d2c] py-2.5 text-sm font-bold text-white transition hover:brightness-105"
          >
            Go Pro to see your exact rank <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      )}
      {!loading && !error && !data?.me && !data?.estimate && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {cardMode === "xp"
            ? "Earn some XP to appear on the leaderboard."
            : "Solve your first round to land on the streak board."}
        </p>
      )}
    </div>
  );
}

// WeeklyCard — the weekly top-performers board (podium + ranks 4+). Used as
// the active card on mobile and as the desktop sidebar.
function WeeklyCard({
  weeklyLoaded,
  weeklyTop,
}: {
  weeklyLoaded: boolean;
  weeklyTop: V3LeaderboardEntry[];
}) {
  return (
    <div className="c-box rounded-2xl p-6">
      <SectionHeader icon={<Trophy size={14} />} title="Weekly top performers" />
      {!weeklyLoaded && (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
      )}
      {weeklyLoaded && weeklyTop.length > 0 && (
        <>
          {/* Top 3 get the podium highlight; ranks 4+ list below. */}
          <WeeklyPodium entries={weeklyTop.slice(0, 3)} />
          {weeklyTop.length > 3 && (
            <div className="mx-auto mt-4 max-w-2xl space-y-1.5">
              {weeklyTop.slice(3).map((entry) => (
                <LeaderboardRow
                  key={entry.sub}
                  rank={entry.rank}
                  name={entry.name}
                  avatar={entry.avatar}
                  value={entry.value}
                  unit="XP"
                  // Weekly value is XP earned this week, not cumulative, so it
                  // can't be mapped to a level — omit the Lv pill.
                  compact
                />
              ))}
            </div>
          )}
        </>
      )}
      {weeklyLoaded && weeklyTop.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">Nobody yet this week — be the first!</p>
      )}
    </div>
  );
}

// StandingToggle — the desktop XP / Streak switch. Weekly is omitted because
// the weekly board is always shown in the desktop sidebar.
function StandingToggle({
  mode,
  onChange,
}: {
  mode: V3LeaderboardMode;
  onChange: (m: V3LeaderboardMetric) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/[0.08] bg-surface-2/40 p-1">
      <TabButton active={mode === "xp"} onClick={() => onChange("xp")}>
        <Trophy size={14} className="mr-1.5" />
        XP
      </TabButton>
      <TabButton active={mode === "streak"} onClick={() => onChange("streak")}>
        <Flame size={14} className="mr-1.5" />
        Streak
      </TabButton>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: V3LeaderboardMetric;
  onChange: (m: V3LeaderboardMetric) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/[0.08] bg-surface-2/40 p-1">
      <TabButton active={mode === "xp"} onClick={() => onChange("xp")}>
        <Trophy size={14} className="mr-1.5" />
        XP
      </TabButton>
      <TabButton active={mode === "streak"} onClick={() => onChange("streak")}>
        <Flame size={14} className="mr-1.5" />
        Streak
      </TabButton>
      <TabButton active={mode === "weekly"} onClick={() => onChange("weekly")}>
        <Calendar size={14} className="mr-1.5" />
        Weekly
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${active
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:text-body"
        }`}
    >
      {children}
    </button>
  );
}

function ProfileBanner({
  name,
  avatar,
  level,
  levelStage,
  valueLabel,
  rank,
  total,
  subtitle,
}: {
  name: string;
  avatar?: string;
  level: number;
  levelStage: number;
  valueLabel: string;
  rank?: number;
  total: number;
  subtitle: string;
}) {
  const initials = name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const url = avatarUrl(avatar, 192);
  return (
    <div className="relative overflow-hidden rounded-2xl sm:border sm:border-[color:var(--border)] sm:bg-[var(--surface-1)]">
      {/* Plant-art gradient defs — rendered once in this always-mounted banner
          so every level sapling on the page resolves its fills. */}
      <PlantArtDefs />
      {/* Soft gradient banner — desktop only; mobile shows the bare avatar + name. */}
      <div className="hidden h-32 bg-gradient-to-br from-[#005da7]/25 via-[#2976c7]/12 to-transparent sm:block dark:from-[#f59e0b]/30 dark:via-[#f97316]/15 dark:to-[#0b0e14]" />

      <div className="flex items-end gap-5 px-6 sm:-mt-12 sm:pb-6">
        {/* Avatar */}
        <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full ring-4 ring-white dark:ring-[#0b0e14]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-2xl font-extrabold text-[#0b0e14]">{initials}</span>
          )}
        </span>

        <div className="min-w-0 flex-1 sm:pt-12">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-2xl font-extrabold text-heading">{name}</h1>
            <span className="shrink-0" title={`Level ${level}`} aria-label={`Level ${level}`}>
              <PlantArt stage={levelStage} className="h-7 w-7" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Global rank #{rank ?? "—"} of {total.toLocaleString()} · {subtitle}
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end pt-12 gap-1">
          <span className="rounded-full bg-primary/15 px-4 py-1.5 text-sm font-bold text-primary">
            Level {level}
          </span>
          <span className="text-xs font-semibold text-cyan tabular-nums">
            {valueLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <h2 className="text-sm font-bold uppercase tracking-widest text-heading">{title}</h2>
      {subtitle && <span className="ml-auto text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  );
}

function LeaderboardRow({
  rank,
  name,
  avatar,
  value,
  unit,
  level,
  levelStage,
  highlighted,
  compact,
}: {
  rank: number;
  name: string;
  avatar?: string;
  value: number;
  unit: string;
  level?: number;
  levelStage?: number;
  highlighted?: boolean;
  compact?: boolean;
}) {
  const initials = name
    ? name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  // Top three get medal coloring. Keeps the page lively without a separate component.
  const medal =
    rank === 1 ? "text-[#ffd700]" : rank === 2 ? "text-[#c0c0c0]" : rank === 3 ? "text-[#cd7f32]" : "text-muted-foreground";
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${highlighted
        ? "bg-primary/15 ring-1 ring-primary/40"
        : "hover:bg-surface-2/40"
        }`}
    >
      <span className={`w-8 text-sm font-bold tabular-nums ${medal}`}>#{rank}</span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
        {(() => {
          const url = avatarUrl(avatar, 72);
          if (!url) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          );
        })() || (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-xs font-bold text-[#0b0e14]">
              {initials}
            </span>
          )}
      </span>
      <div className="flex-1 flex justify-start gap-4 align-center min-w-0">
        <p
          className={`truncate ${highlighted
            ? "text-base font-bold text-heading"
            : compact
              ? "text-sm text-body"
              : "text-sm font-medium text-body"
            }`}
        >
          {name || "Anonymous"}
        </p>
        {levelStage !== undefined && (
          <span
            className="flex shrink-0 items-center"
            title={level !== undefined ? `Level ${level}` : undefined}
            aria-label={level !== undefined ? `Level ${level}` : undefined}
          >
            <PlantArt stage={levelStage} className="h-7 w-7" />
          </span>
        )}
      </div>

      <span
        className={`tabular-nums ${highlighted ? "text-sm font-bold text-primary" : "text-xs font-semibold text-muted-foreground"
          }`}
      >
        {value.toLocaleString()} {unit}
      </span>
    </div>
  );
}

// ─── Weekly podium ─────────────────────────────────────────────────────
// Top-3 highlight for the weekly board: a three-step podium with #1 raised
// in the centre (crowned), #2 left, #3 right. Ranks 4+ render as the normal
// compact rows beneath it.

const PODIUM: Record<1 | 2 | 3, { pillar: string; gradient: string; avatar: number; ring: string }> = {
  1: { pillar: "h-32", gradient: "from-[#f59e0b] to-[#f97316]", avatar: 54, ring: "border-[#ffd028]" },
  2: { pillar: "h-20", gradient: "from-[#b79fff] to-[#ab8eff]", avatar: 40, ring: "border-[#b79fff]" },
  3: { pillar: "h-16", gradient: "from-[#c8b4ff] to-[#8c64ff]", avatar: 40, ring: "border-[#c8b4ff]" },
};

function PodiumAvatar({ name, avatar, size, ring }: { name: string; avatar?: string; size: number; ring: string }) {
  const url = avatarUrl(avatar, size * 2);
  const initials = name
    ? name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${ring}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-xs font-bold text-[#0b0e14]">
          {initials}
        </span>
      )}
    </span>
  );
}

function PodiumColumn({ entry, position }: { entry: V3LeaderboardEntry; position: 1 | 2 | 3 }) {
  const cfg = PODIUM[position];
  return (
    <div className="flex w-[56px] flex-col items-center justify-end">
      <div className="relative mb-2 flex flex-col items-center">
        {position === 1 && (
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl leading-none">👑</span>
        )}
        <PodiumAvatar name={entry.name} avatar={entry.avatar} size={cfg.avatar} ring={cfg.ring} />
        <span className="mt-1.5 w-full truncate px-1 text-center text-xs font-semibold text-heading">
          {entry.name || "Anonymous"}
        </span>
      </div>
      <div className={`relative flex w-full flex-col items-center overflow-hidden rounded-t-xl bg-gradient-to-b pt-2 ${cfg.pillar} ${cfg.gradient}`}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        <span className="z-10 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
          {entry.value.toLocaleString()} XP
        </span>
        <span className="z-10 mt-auto mb-1.5 text-2xl font-black text-white/40">#{position}</span>
      </div>
    </div>
  );
}

function WeeklyPodium({ entries }: { entries: V3LeaderboardEntry[] }) {
  const [first, second, third] = entries;
  return (
    <div className="flex items-end justify-center gap-6 pt-6 pb-1">
      {second && <PodiumColumn entry={second} position={2} />}
      {first && <PodiumColumn entry={first} position={1} />}
      {third && <PodiumColumn entry={third} position={3} />}
    </div>
  );
}

// Image import retained so bundler keeps next/image in the chunk for
// future use; current avatars use <img>.
void Image;

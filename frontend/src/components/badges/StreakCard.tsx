"use client";

import { useId } from "react";

import { BadgeBrandMark } from "./BadgeBrandMark";

// StreakCard is the streak:N badge visual — a gradient card with the day count
// top-left and a big flame bottom-right (a brighter foreground flame over a
// softer themed "shadow" flame), with a continuous flicker. Fills its
// container, so the deck tile and a celebration both render it at their size.
//
// The colour PROGRESSES with the streak length, and the highest tiers use a
// black "night" variant (see STREAK_RAMP).

type StreakTheme = { from: string; to: string; shadow: string };

const NIGHT: StreakTheme = { from: "#1f2937", to: "#030712", shadow: "#4b5563" };

// Ascending bands: pick the last band whose `min` ≤ days. Five colour tiers as
// the streak climbs, then the black/night variant for the top tiers ("last
// cards"). Tune the `min` values to match the streak thresholds admins create.
const STREAK_RAMP: { min: number; theme: StreakTheme }[] = [
  { min: 0, theme: { from: "#3b82f6", to: "#2563eb", shadow: "#60a5fa" } }, // blue
  { min: 7, theme: { from: "#06b6d4", to: "#0e7490", shadow: "#22d3ee" } }, // cyan
  { min: 14, theme: { from: "#10b981", to: "#047857", shadow: "#34d399" } }, // emerald
  { min: 30, theme: { from: "#f59e0b", to: "#d97706", shadow: "#fbbf24" } }, // amber
  { min: 60, theme: { from: "#f97316", to: "#dc2626", shadow: "#fb923c" } }, // orange→red
  // Top tiers — the night/black variant.
  { min: 100, theme: NIGHT },
  { min: 150, theme: NIGHT },
  { min: 200, theme: NIGHT },
  { min: 300, theme: NIGHT },
  { min: 365, theme: NIGHT },
];

export function streakTheme(days: number): StreakTheme {
  let t = STREAK_RAMP[0].theme;
  for (const r of STREAK_RAMP) if (days >= r.min) t = r.theme;
  return t;
}

function FireSVG({ shadowColor }: { shadowColor?: string }) {
  const isShadow = !!shadowColor;
  // Unique gradient id per instance. With a hard-coded id, multiple StreakCards
  // on a page collide; when the first one lives in a display:none container
  // (e.g. the md:hidden mobile streak tile) its gradient can't act as a paint
  // server, so the foreground flame on the visible card renders unfilled.
  const gradId = `streakFire-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 640 640" className="h-full w-full" style={{ overflow: "visible" }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFF700" />
          <stop offset="100%" stopColor="#FF5A00" />
        </linearGradient>
      </defs>
      <path
        d="M256.5 37.6C265.8 29.8 279.5 30.1 288.4 38.5C300.7 50.1 311.7 62.9 322.3 75.9C335.8 92.4 352 114.2 367.6 140.1C372.8 133.3 377.6 127.3 381.8 122.2C382.9 120.9 384 119.5 385.1 118.1C393 108.3 402.8 96 415.9 96C429.3 96 438.7 107.9 446.7 118.1C448 119.8 449.3 121.4 450.6 122.9C460.9 135.3 474.6 153.2 488.3 175.3C515.5 219.2 543.9 281.7 543.9 351.9C543.9 475.6 443.6 575.9 319.9 575.9C196.2 575.9 96 475.7 96 352C96 260.9 137.1 182 176.5 127C196.4 99.3 216.2 77.1 231.1 61.9C239.3 53.5 247.6 45.2 256.6 37.7zM321.7 480C347 480 369.4 473 390.5 459C432.6 429.6 443.9 370.8 418.6 324.6C414.1 315.6 402.6 315 396.1 322.6L370.9 351.9C364.3 359.5 352.4 359.3 346.2 351.4C328.9 329.3 297.1 289 280.9 268.4C275.5 261.5 265.7 260.4 259.4 266.5C241.1 284.3 207.9 323.3 207.9 370.8C207.9 439.4 258.5 480 321.6 480z"
        fill={isShadow ? shadowColor : `url(#${gradId})`}
        opacity={isShadow ? 0.5 : 1}
      />
    </svg>
  );
}

export function StreakCard({ days, animate = true, compact = false }: { days: number; animate?: boolean; compact?: boolean }) {
  const theme = streakTheme(days);
  // 3-digit streaks need a slightly smaller number to fit the tile width.
  // `compact` shrinks the type so the card reads well in a small square tile.
  const numClass = compact ? "text-4xl" : days >= 100 ? "text-5xl" : "text-7xl";
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
    >
      {/* Brand stamp — skipped on the tiny compact dashboard tile. */}
      {!compact && <BadgeBrandMark />}

      {/* Day count + label */}
      <div className={compact ? "absolute left-3 top-3 z-10" : "absolute left-5 top-5 z-10"}>
        <div className={`font-extrabold leading-none tracking-tighter text-white ${numClass}`}>{days}</div>
        <div className={`mt-1 font-bold leading-tight text-white/90 ${compact ? "text-[11px]" : "text-lg"}`}>
          Streak
          <br />
          Days
        </div>
      </div>

      {/* Background "shadow" flame — softer, themed, slow float */}
      <div className={`pointer-events-none absolute -bottom-[22%] -right-[18%] h-[78%] w-[68%] ${animate ? "streak-shadow-flame" : ""}`}>
        <FireSVG shadowColor={theme.shadow} />
      </div>

      {/* Foreground flame — bright, flickering */}
      <div
        className="pointer-events-none absolute -bottom-[22%] -right-[12%] h-[88%] w-[78%]"
        style={{ filter: "drop-shadow(0 0 15px rgba(255,100,0,0.45))" }}
      >
        <div className={`h-full w-full ${animate ? "streak-flame" : ""}`}>
          <FireSVG />
        </div>
      </div>
    </div>
  );
}

import { Crown, Flame, Lock, Mic, Puzzle, Sparkles, Star, Trophy, type LucideIcon } from "lucide-react";

import { cssVars } from "./Wave";

// "Proof you're getting better" — XP ring, streak calendar, badge shelf and the
// weekly podium, drawn as small figures (example values, like the in-app
// previews they replace). Each one plays its build-up once when it scrolls into
// view (figureStyles `pg-*`); the resting state is the finished figure.

/* ── XP ring ─────────────────────────────────────────────────────────────── */
const XR = 50;
const XC = 2 * Math.PI * XR;
const XP_PCT = 0.64;

export function XpRing() {
  return (
    <div data-fig role="img" aria-label="XP ring: level 7, about two thirds of the way to level 8." className="relative grid h-32 w-32 place-items-center sm:h-40 sm:w-40">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="lp-xp-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary-1)" }} />
            <stop offset="100%" style={{ stopColor: "var(--primary-2)" }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={XR} className="fill-none stroke-heading/10" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={XR}
          className="pg-arc fill-none"
          stroke="url(#lp-xp-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={XC}
          style={cssVars({ "--c": `${XC}px`, "--off": `${XC * (1 - XP_PCT)}px` })}
        />
      </svg>
      <span className="relative flex flex-col items-center">
        <span className="lp-tag text-body">Level</span>
        <span className="lp-kinetic text-4xl font-bold leading-none text-heading sm:text-5xl">7</span>
      </span>
      <span
        className="pg-xp absolute -right-3 top-1 inline-flex sm:-right-2 sm:top-3 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground"
        style={{ background: "var(--pro-pill)" }}
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" /> +30
      </span>
    </div>
  );
}

/* ── Streak calendar ─────────────────────────────────────────────────────── */
// 5 weeks × 7 days; the last 14 days are a streak, earlier weeks are patchy.
// Values index the theme's heat ramp (globals.css --heat-0…4).
const DAYS = Array.from({ length: 35 }, (_, i) => {
  if (i >= 21) return 4;
  return [0, 2, 1, 0, 3, 0, 1, 2, 0, 0, 1, 3, 2, 0, 1, 0, 2, 0, 3, 1, 0][i];
});

export function StreakDots() {
  return (
    <div data-fig role="img" aria-label="Streak calendar: practice days over five weeks, ending in a 14-day streak." className="w-full max-w-[240px]">
      <div className="mb-2.5 flex justify-end">
        <span
          className="pg-xp inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground"
          style={{ background: "var(--pro-pill)" }}
        >
          <Flame className="h-3 w-3" aria-hidden="true" /> 14
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DAYS.map((v, i) => (
          <span
            key={i}
            className="pg-dot aspect-square rounded-[4px] sm:rounded-[6px]"
            style={{ ...cssVars({ "--i": i }), background: `var(--heat-${v})` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Badge shelf ─────────────────────────────────────────────────────────── */
const BADGES: { Icon: LucideIcon; color: string; locked?: boolean }[] = [
  { Icon: Flame, color: "var(--pink)" },
  { Icon: Mic, color: "var(--primary-2)" },
  { Icon: Puzzle, color: "var(--cyan)" },
  { Icon: Star, color: "var(--primary-1)" },
  { Icon: Crown, color: "var(--secondary-1)" },
  { Icon: Lock, color: "var(--surface-3)", locked: true },
];
const HEX = "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z";

export function BadgeShelf() {
  return (
    <div data-fig role="img" aria-label="Badges: five earned, one still locked." className="grid w-full max-w-[240px] grid-cols-3 gap-2 sm:gap-3">
      {BADGES.map(({ Icon, color, locked }, i) => (
        <span key={i} className="pg-badge relative grid aspect-square place-items-center" style={cssVars({ "--i": i })}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path
              d={HEX}
              style={{
                fill: locked ? "var(--surface-2)" : `color-mix(in srgb, ${color} 22%, transparent)`,
                stroke: locked ? "var(--border)" : color,
              }}
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
          <Icon className="relative h-5 w-5 sm:h-6 sm:w-6" style={{ color: locked ? "var(--body)" : color }} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/* ── Weekly podium ───────────────────────────────────────────────────────── */
const PODIUM = [
  { rank: 2, h: 72, you: true },
  { rank: 1, h: 104 },
  { rank: 3, h: 52 },
];

export function Podium() {
  return (
    <div data-fig role="img" aria-label="Weekly leaderboard podium: you are in second place." className="flex w-full max-w-[240px] items-end justify-center gap-1.5 sm:gap-2">
      {PODIUM.map((p, i) => (
        <div key={p.rank} className="flex flex-1 flex-col items-center gap-2">
          {p.rank === 1 ? (
            <Crown className="h-5 w-5 text-primary" aria-hidden="true" />
          ) : (
            <span className="h-5" aria-hidden="true" />
          )}
          <span
            className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold sm:h-10 sm:w-10 sm:text-xs ${
              p.you ? "border-transparent text-primary-foreground" : "border-border bg-surface-2 text-heading"
            }`}
            style={p.you ? { background: "var(--pro-pill)" } : undefined}
          >
            {p.you ? "You" : <Trophy className="h-4 w-4 text-body" aria-hidden="true" />}
          </span>
          <span
            className="pg-bar grid w-full place-items-start justify-center rounded-t-xl pt-2"
            style={{
              ...cssVars({ "--i": i }),
              height: p.h,
              background: p.you
                ? "color-mix(in srgb, var(--primary-2) 32%, transparent)"
                : "color-mix(in srgb, var(--heading) 8%, transparent)",
            }}
          >
            <span className="lp-kinetic text-lg font-bold text-heading">{p.rank}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

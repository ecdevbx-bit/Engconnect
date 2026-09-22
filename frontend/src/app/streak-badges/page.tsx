"use client";

// Standalone showcase of the animated streak (flame) badges. Layered fire
// SVG that grows hotter with the streak length — yellow (1-3) → orange
// (5-10) → red+core (12-18) → crimson with cyan core, aura & flares (21+).
// Click a badge (or the button) to toggle its earned/unearned state.
//
// Ported from the standalone HTML/JS demo: the flame artwork + CSS keyframes
// are kept; page chrome is React. The keyframes live in a scoped <style>.

import { useMemo, useState } from "react";

const STREAK_DAYS = [1, 2, 3, 5, 7, 10, 12, 15, 18, 21, 30, 35];

const FLAME_PATH =
  "M 50,85 C 20,85 10,65 15,45 C 20,25 35,15 45,5 C 40,15 45,20 55,25 C 60,15 75,5 90,10 C 80,20 85,30 95,35 C 85,40 90,55 85,70 C 80,85 70,85 50,85 Z";
const INNER_FLAME_PATH =
  "M 50,80 C 25,80 15,60 20,40 C 25,25 40,20 45,10 C 42,18 48,22 55,26 C 62,18 70,12 85,15 C 75,25 80,32 90,36 C 80,45 85,55 80,65 C 75,80 65,80 50,80 Z";
const CORE_PATH = "M 50,82 C 38,82 35,68 40,55 C 45,42 48,35 50,28 C 52,35 55,42 60,55 C 65,68 62,82 50,82 Z";
const FLARE_PATH_1 = "M 25,75 C 10,75 5,55 10,40 C 15,25 25,20 30,15 C 30,35 25,50 25,75 Z";
const FLARE_PATH_2 = "M 75,75 C 90,75 95,55 90,40 C 85,25 75,20 70,15 C 70,35 75,50 75,75 Z";

type TierStyle = {
  tier: 1 | 2 | 3 | 4;
  colorBg: string;
  colorInner: string;
  colorOutline: string;
  colorCore?: string;
  colorAura?: string;
  scaleBase: number;
  speedBg: string;
  speedInner: string;
  bgAnim: "flicker" | "flickerIntense";
  numSparkles: number;
};

function tierStyle(day: number): TierStyle {
  const tier = day >= 21 ? 4 : day >= 12 ? 3 : day >= 5 ? 2 : 1;
  const base = {
    1: { scaleBase: 0.75, speedBg: "3.5s", speedInner: "3s", numSparkles: 0 },
    2: { scaleBase: 0.95, speedBg: "2.5s", speedInner: "2s", numSparkles: 1 },
    3: { scaleBase: 1.15, speedBg: "1.5s", speedInner: "1.2s", numSparkles: 3 },
    4: { scaleBase: 1.35, speedBg: "0.8s", speedInner: "0.6s", numSparkles: 8 },
  }[tier];
  const bgAnim = tier === 4 ? "flickerIntense" : "flicker";
  if (tier === 1) return { tier, colorBg: "#fbbf24", colorInner: "#fef08a", colorOutline: "#d97706", bgAnim, ...base };
  if (tier === 2) return { tier, colorBg: "#f97316", colorInner: "#fbbf24", colorOutline: "#c2410c", bgAnim, ...base };
  if (tier === 3) return { tier, colorBg: "#ef4444", colorInner: "#f97316", colorCore: "#fef08a", colorOutline: "#b91c1c", bgAnim, ...base };
  return { tier, colorAura: "#9f1239", colorBg: "#dc2626", colorInner: "#f59e0b", colorCore: "#22d3ee", colorOutline: "#7f1d1d", bgAnim, ...base };
}

type Sparkle = { x: number; y: number; d: string; dur: number; delay: number };

// Deterministic PRNG so the sparkle positions are identical on the server
// and client render (Math.random would cause a hydration mismatch).
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildSparkles(t: TierStyle, day: number): Sparkle[] {
  const rng = seededRng(day * 2654435761);
  const out: Sparkle[] = [];
  for (let i = 0; i < t.numSparkles; i++) {
    const sx = t.tier >= 4 ? 10 + rng() * 80 : 35 + rng() * 30;
    const sy = t.tier >= 4 ? 10 + rng() * 70 : 25 + rng() * 45;
    const size = t.tier >= 4 ? 3 + rng() * 4 : 4;
    const dur = (t.tier >= 3 ? 0.6 : 1) + rng() * 1.5;
    const delay = rng() * 2;
    const d = `M ${sx},${sy - size} Q ${sx},${sy} ${sx + size},${sy} Q ${sx},${sy} ${sx},${sy + size} Q ${sx},${sy} ${sx - size},${sy} Q ${sx},${sy} ${sx},${sy - size} Z`;
    out.push({ x: sx, y: sy, d, dur, delay });
  }
  return out;
}

function StreakBadge({ day, unearned, delay, onClick }: { day: number; unearned: boolean; delay: number; onClick: () => void }) {
  const t = useMemo(() => tierStyle(day), [day]);
  const sparkles = useMemo(() => buildSparkles(t, day), [t, day]);
  const offset = 50 * (1 - t.scaleBase);
  const fontSize = day >= 100 ? 45 : 55;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}s` }}
      className={`badge-container flex flex-col items-center ${unearned ? "is-unearned" : ""}`}
    >
      <svg className="streak-badge" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g transform={`translate(${offset}, ${offset}) scale(${t.scaleBase})`}>
          {t.tier >= 4 && t.colorAura && (
            <path className="flame-bg" style={{ animation: `${t.bgAnim} ${t.speedBg} infinite alternate ease-in-out`, filter: "blur(6px)", transformOrigin: "center bottom" }} fill={t.colorAura} opacity="0.6" d={FLAME_PATH} />
          )}
          <path className="flame-bg" style={{ animation: `${t.bgAnim} ${t.speedBg} infinite alternate ease-in-out`, transformOrigin: "center bottom" }} fill={t.colorBg} d={FLAME_PATH} />
          <path className="flame-inner" style={{ animation: `flickerInner ${t.speedInner} infinite alternate ease-in-out`, transformOrigin: "center bottom" }} fill={t.colorInner} opacity="0.9" d={INNER_FLAME_PATH} />
          {t.tier >= 3 && t.colorCore && (
            <path className="core-flame" fill={t.colorCore} opacity="0.8" style={{ animation: `flickerInner ${t.speedInner} infinite alternate ease-in-out reverse`, transformOrigin: "center bottom" }} d={CORE_PATH} />
          )}
          {t.tier >= 4 && (
            <>
              <path className="flare" fill={t.colorBg} opacity="0.9" style={{ animation: `${t.bgAnim} 1.1s infinite alternate ease-in-out reverse`, transformOrigin: "25px 75px" }} d={FLARE_PATH_1} />
              <path className="flare" fill={t.colorBg} opacity="0.9" style={{ animation: `${t.bgAnim} 1.3s infinite alternate ease-in-out`, transformOrigin: "75px 75px" }} d={FLARE_PATH_2} />
            </>
          )}
        </g>

        {sparkles.map((s, i) => (
          <path key={i} className="sparkle" style={{ animation: `sparkleAnim ${s.dur}s linear infinite`, animationDelay: `${s.delay}s`, transformOrigin: `${s.x}px ${s.y}px` }} d={s.d} />
        ))}

        <g className="number-group">
          <text x="50" y="70" textAnchor="middle" className="badge-number-outline" stroke={t.colorOutline} style={{ fontSize: `${fontSize}px` }}>
            {day}
          </text>
          <text x="50" y="70" textAnchor="middle" className="badge-number" style={{ fontSize: `${fontSize}px` }}>
            {day}
          </text>
        </g>
      </svg>

      <div className="mt-2 text-center">
        <p className="badge-text-title text-lg font-medium leading-tight text-gray-800">{day}-Day</p>
        <p className="badge-text-subtitle text-sm font-medium text-gray-500">Streak</p>
      </div>
    </button>
  );
}

const STREAK_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600&display=swap');

.streak-badge { width: 120px; height: 150px; overflow: visible; transition: filter 0.4s ease; }

.badge-number {
  font-family: 'Fredoka', sans-serif; font-weight: 600; fill: #000000; stroke: #ffffff;
  stroke-width: 8px; paint-order: stroke fill; stroke-linejoin: round;
}
.badge-number-outline {
  font-family: 'Fredoka', sans-serif; font-weight: 600; fill: none;
  stroke-width: 14px; paint-order: stroke fill; stroke-linejoin: round;
}

@keyframes flicker {
  0% { transform: scale(1) rotate(0deg); }
  20% { transform: scale(1.02, 0.98) rotate(1deg); }
  40% { transform: scale(0.98, 1.05) rotate(-1deg); }
  60% { transform: scale(1.03, 0.96) rotate(2deg); }
  80% { transform: scale(0.97, 1.02) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes flickerInner {
  0% { transform: scale(0.95) translate(0, 5px); }
  33% { transform: scale(1.05) translate(-2px, 0); }
  66% { transform: scale(0.9) translate(2px, -2px); }
  100% { transform: scale(0.95) translate(0, 5px); }
}
@keyframes flickerIntense {
  0% { transform: scale(1) rotate(0deg) skewX(0deg); }
  25% { transform: scale(1.05, 0.95) rotate(4deg) skewX(3deg); }
  50% { transform: scale(0.95, 1.1) rotate(-4deg) skewX(-3deg); }
  75% { transform: scale(1.08, 0.92) rotate(5deg) skewX(2deg); }
  100% { transform: scale(1) rotate(0deg) skewX(0deg); }
}
@keyframes floatNum { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes sparkleAnim {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1) rotate(90deg); opacity: 1; }
  100% { transform: scale(0) rotate(180deg); opacity: 0; }
}
@keyframes popIn { to { opacity: 1; transform: scale(1); } }

.badge-container {
  background: none; border: none; padding: 0; cursor: pointer;
  opacity: 0; transform: scale(0.5);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.badge-container:not(.is-unearned):hover {
  transform: translateY(-5px) scale(1.05);
  filter: drop-shadow(0 10px 15px rgba(245, 158, 11, 0.3));
}
.number-group { animation: floatNum 4s ease-in-out infinite; }
.sparkle { fill: #ffffff; opacity: 0; }

/* Unearned overrides */
.is-unearned .streak-badge { filter: grayscale(100%) brightness(0.85) opacity(0.6); }
.is-unearned .badge-text-title { color: #9ca3af; }
.is-unearned .badge-text-subtitle { color: #d1d5db; }
.is-unearned .flame-bg, .is-unearned .flame-inner, .is-unearned .core-flame,
.is-unearned .flare, .is-unearned .sparkle, .is-unearned .number-group {
  animation: none !important; transform: none !important;
}
.is-unearned .sparkle { opacity: 0 !important; }
`;

export default function StreakBadges() {
  const [unearned, setUnearned] = useState<Set<number>>(new Set());
  const allUnearned = unearned.size === STREAK_DAYS.length;

  const toggleBadge = (i: number) =>
    setUnearned((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const toggleAll = () =>
    setUnearned(allUnearned ? new Set() : new Set(STREAK_DAYS.map((_, i) => i)));

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-8 py-12">
      <style>{STREAK_CSS}</style>

      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold text-gray-800">Streak Badges</h1>
        <p className="mb-6 text-gray-500">Click a badge to toggle its status, or use the button below.</p>
        <button
          type="button"
          onClick={toggleAll}
          className={`rounded-full px-6 py-2 font-semibold text-white shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
            allUnearned ? "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          }`}
        >
          {allUnearned ? "Mark All as Earned" : "Mark All as Unearned"}
        </button>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-2 justify-items-center gap-8 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {STREAK_DAYS.map((day, i) => (
          <StreakBadge key={day} day={day} unearned={unearned.has(i)} delay={i * 0.1} onClick={() => toggleBadge(i)} />
        ))}
      </div>
    </div>
  );
}

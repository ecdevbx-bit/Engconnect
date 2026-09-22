"use client";

import { MessageCircle, Mic, Puzzle, Star, type LucideIcon } from "lucide-react";
import type { ComboGame } from "@/lib/badges";
import { BadgeBrandMark } from "./BadgeBrandMark";

// ComboCard is the combo:<game>:N badge visual — a gold-framed "reward" card
// (stars by tier · a floating game item showing ×N · a game-labelled footer),
// in a DISTINCT variant per game (jumble / pronunciation / ai-partner): each
// has its own inner tint, item colour, and icon. Fills its container.

type ComboTheme = {
  inner: [string, string]; // inner card dark gradient
  item: [string, string]; // floating item gradient
  Icon: LucideIcon;
  label: string;
  glow: string;
};

const COMBO_THEMES: Record<ComboGame, ComboTheme> = {
  jumble: { inner: ["#2d1b54", "#110a22"], item: ["#8b5cf6", "#6d28d9"], Icon: Puzzle, label: "Jumble", glow: "#a78bfa" },
  pronunciation: { inner: ["#0c2a4d", "#05121f"], item: ["#06b6d4", "#2563eb"], Icon: Mic, label: "Pronunciation", glow: "#22d3ee" },
  "ai-partner": { inner: ["#0c3b2e", "#03140f"], item: ["#10b981", "#047857"], Icon: MessageCircle, label: "AI Partner", glow: "#34d399" },
};

// Star tier from the combo count — more in a row, more stars (max 5).
const STAR_BANDS = [3, 5, 8, 12, 20];
function comboStars(n: number): number {
  let s = 0;
  for (const b of STAR_BANDS) if (n >= b) s++;
  return Math.max(1, s);
}

export function ComboCard({ game, count }: { game: ComboGame; count: number }) {
  const t = COMBO_THEMES[game] ?? COMBO_THEMES.jumble;
  const stars = comboStars(count);
  const Icon = t.Icon;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-700 p-[3px]">
      <div
        className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-[17px]"
        style={{ background: `linear-gradient(to bottom, ${t.inner[0]}, ${t.inner[1]})` }}
      >
        <BadgeBrandMark position="bottom-left" size="xs" />

        {/* Top light ray */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-3/4 -translate-x-1/2 rounded-b-full bg-gradient-to-b from-white/20 to-transparent blur-2xl" />

        {/* Stars */}
        <div className="z-10 mt-4 flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < stars ? "text-yellow-400 drop-shadow" : "text-white/10"}`}
              fill={i < stars ? "currentColor" : "none"}
              strokeWidth={i < stars ? 0 : 2}
            />
          ))}
        </div>

        {/* Central floating item */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="absolute -bottom-5 left-1/2 h-7 w-24 -translate-x-1/2 rounded-[100%] bg-black/40 blur-lg" />
          <div
            className="combo-float relative flex h-32 w-28 flex-col items-center justify-center rounded-2xl border border-white/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.5)]"
            style={{ background: `linear-gradient(135deg, ${t.item[0]}, ${t.item[1]})` }}
          >
            <Icon className="mb-1 h-12 w-12 text-white drop-shadow" strokeWidth={1.75} />
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-white/70">×</span>
              <span className="text-3xl font-black italic tracking-tighter text-white drop-shadow">{count}</span>
            </div>
          </div>
        </div>

        {/* Footer: game-labelled badge */}
        <div className="relative z-10 flex w-full flex-col items-center border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent px-3 pb-3 pt-5 backdrop-blur-md">
          <div className="absolute -top-3 right-3 flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur-xl">
            <Icon className="h-3.5 w-3.5" style={{ color: t.glow }} />
            <span className="tracking-wide">{t.label}</span>
          </div>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Combo</span>
        </div>

        {/* Frame shine sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="combo-shine absolute left-0 top-0 h-[200%] w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}

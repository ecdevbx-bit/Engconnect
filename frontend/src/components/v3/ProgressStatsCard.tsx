"use client";

import { Flame } from "lucide-react";
import { GoGraph } from "react-icons/go";

import { useAppSelector } from "@/store/hooks";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

// ProgressStatsCard — the shared "Progress" card used in the right rail of
// every v3 game page (Jumble, Pronunciation, AI Partner). Mirrors Jumble's
// original card: graph header, big animated SCORE, a level-progress bar
// (XP toward the next level), and a combo row with optional per-item dots.
//
// Level/XP/combo default to the shared Redux xp slice (kept fresh by Jumble &
// Pronunciation submits). AI Partner tracks its score locally and passes
// `override` with the live session values. `combo` is read per-`category`, so
// each game shows its own streak.
export function ProgressStatsCard({
  category,
  override,
  dots,
  xpGain,
  id,
  className,
  mobileCompact,
}: {
  category: string;
  override?: { xp?: number; currentLevel?: number; combo?: number };
  // Optional per-item progress dots (Jumble: round questions; Pronunciation:
  // session words). Omitted for continuous modes like AI Partner.
  dots?: { total: number; current: number };
  // Optional floating "+N XP" pop (Jumble fires this on each solve).
  xpGain?: { amount: number; quick: boolean } | null;
  id?: string;
  className?: string;
  // Phones-only lean layout: drops the header, big Score, and round dots (all
  // shown elsewhere on the Jumble screen — XP/Level in the navbar, round
  // progress in the journey stepper) and keeps just the level bar + combo.
  // The full card returns at md+. Other games leave this off.
  mobileCompact?: boolean;
}) {
  const { totalXP, currentLevel, combos, levels } = useAppSelector((s) => s.xp);

  const xp = override?.xp ?? totalXP;
  const level = override?.currentLevel ?? currentLevel;
  const combo = override?.combo ?? combos[category] ?? 0;
  const displayXP = useCountUp(xp);

  // Progress from this level's threshold to the next.
  const cur = levels.find((l) => l.level === level);
  const next = levels.find((l) => l.level === level + 1);
  const atMax = !next;
  const curThreshold = cur?.threshold ?? 0;
  const nextThreshold = next?.threshold ?? curThreshold;
  const range = Math.max(1, nextThreshold - curThreshold);
  const pct = atMax ? 100 : Math.min(100, Math.max(0, Math.round(((xp - curThreshold) / range) * 100)));
  const xpToNext = Math.max(0, nextThreshold - xp);

  return (
    <div
      id={id}
      className={cn(
        "relative c-box overflow-hidden rounded-2xl",
        mobileCompact ? "p-4 md:p-4" : "p-6",
        className,
      )}
    >
      {/* Phones-only lean layout: level + combo on one row, progress bar and
          XP-to-next below. Header, Score and round dots are dropped here. */}
      {mobileCompact && (
        <div className="md:hidden">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-heading">Level {level}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-pink">
              <Flame className={cn("h-3.5 w-3.5", combo >= 2 && "anim-flame")} />
              {combo}
              <span className="font-normal text-muted-foreground">combo</span>
            </span>
          </div>
          <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", xpGain && "anim-xp-bar-glow")}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#b79fff] to-[#ab8eff] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {atMax ? "Max level" : `${xpToNext.toLocaleString()} XP to Level ${level + 1}`}
          </div>
          {xpGain && (
            <span
              key={`compact-${xpGain.amount}-${dots?.current ?? 0}`}
              className="anim-xp-float pointer-events-none absolute bottom-2 right-3 text-sm font-bold text-cyan"
            >
              +{xpGain.amount} XP{xpGain.quick ? " ⚡" : ""}
            </span>
          )}
        </div>
      )}

      {/* Full card — desktop always; on phones only when not compact. */}
      <div className={cn(mobileCompact && "hidden md:block")}>
        <div className="flex items-center gap-2 font-semibold text-heading">
          <GoGraph className="text-xl text-primary" />
          Progress
        </div>

        <div className="relative flex flex-col items-center gap-0.5 py-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Score</div>
          <div className={cn("text-gradient text-3xl font-bold tabular-nums", xpGain && "anim-xp-pop")}>
            {displayXP.toLocaleString()} XP
          </div>
          {xpGain && (
            <span
              key={`${xpGain.amount}-${dots?.current ?? 0}`}
              className="anim-xp-float pointer-events-none absolute top-2 text-sm font-bold text-cyan"
            >
              +{xpGain.amount} XP{xpGain.quick ? " ⚡" : ""}
            </span>
          )}
        </div>

        {/* Level progress — how much XP until the next level. */}
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-heading">Level {level}</span>
            <span className="text-muted-foreground">
              {atMax ? "Max level" : `${xpToNext.toLocaleString()} XP to Level ${level + 1}`}
            </span>
          </div>
          <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", xpGain && "anim-xp-bar-glow")}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#b79fff] to-[#ab8eff] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2/50 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink">
            <Flame className={cn("h-4 w-4", combo >= 2 && "anim-flame")} />
            {combo}
            <span className="font-normal text-muted-foreground">combo</span>
          </span>
          {dots && dots.total > 0 && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: dots.total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    i < dots.current && "bg-gradient-to-br from-[#b79fff] to-[#ab8eff]",
                    i === dots.current && "bg-primary/30 ring-2 ring-primary/60",
                    i > dots.current && "bg-surface-3",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

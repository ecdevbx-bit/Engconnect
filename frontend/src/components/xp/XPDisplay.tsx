"use client";

import { LevelBadge } from "./LevelBadge";
import { xpToNextLevel } from "@/lib/xpLogic";
import { MAX_LEVEL } from "@/types";

interface XPDisplayProps {
  xp: number;
  level: number;
  compact?: boolean;
}

export function XPDisplay({ xp, level, compact = false }: XPDisplayProps) {
  const { next, progress } = xpToNextLevel(xp);
  const isMax = level >= MAX_LEVEL;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <LevelBadge level={level} />
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-2 text-cyan border border-white/[0.06]">
          <span>⚡</span>
          <span>{xp.toLocaleString()} XP</span>
        </span>
      </div>

      {!compact && (
        <>
          {/* Progress bar — dark glass style */}
          <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isMax ? (
            <p className="text-xs text-muted-foreground">Max level reached! 🏆</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {(next! - xp).toLocaleString()} XP to Level {level + 1}
            </p>
          )}
        </>
      )}
    </div>
  );
}

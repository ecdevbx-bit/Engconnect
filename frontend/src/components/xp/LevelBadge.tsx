"use client";

import { MAX_LEVEL, LEVEL_LABELS } from "@/types";

interface LevelBadgeProps {
  level: number;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-surface-2 text-primary border border-white/[0.06]",
  2: "bg-surface-2 text-cyan border border-white/[0.06]",
  3: "bg-surface-2 text-primary border border-white/[0.06]",
  4: "bg-surface-2 text-cyan border border-white/[0.06]",
  5: "bg-surface-2 text-primary border border-white/[0.06]",
  6: "bg-surface-2 text-cyan border border-white/[0.06]",
};

export function LevelBadge({ level }: LevelBadgeProps) {
  const label = LEVEL_LABELS[level] ?? "Starter";
  const isMax = level >= MAX_LEVEL;
  const colorClass = LEVEL_COLORS[level] ?? "bg-surface-2 text-primary border border-white/[0.06]";

  return (
    <span className={[
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
      isMax
        ? "bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-[#0b0e14] border-0"
        : colorClass,
    ].join(" ")}>
      Lv {level} — {label}
    </span>
  );
}

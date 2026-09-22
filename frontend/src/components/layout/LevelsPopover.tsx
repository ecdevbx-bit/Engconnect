"use client";

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { PlantArt, PlantArtDefs, plantStageForIndex, plantStageName } from "@/components/v3/plantArt";

// LevelsPopover — opens from the Level chip in the navbar. Shows every
// level with its title, icon, and XP threshold; the current level is
// highlighted, earned levels get a checkmark, locked levels are dimmed.
//
// XP and currentLevel come from Redux, so this popover is always in
// sync with whatever the rest of the app is showing (no separate fetch).

export default function LevelsPopover({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { totalXP, currentLevel, levels } = useAppSelector((s) => s.xp);
  const ref = useRef<HTMLDivElement>(null);

  // Same outside-click + Escape pattern as the other popovers.
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

  // Pre-compute the next-level XP remaining so the header can read like
  // a quick status line.
  const nextLevel = levels.find((l) => l.level > currentLevel);
  const xpToNext = nextLevel ? Math.max(0, nextLevel.threshold - totalXP) : 0;
  // Plant stage (and its botanical name) for the current + next levels.
  const currentIndex = levels.findIndex((l) => l.level === currentLevel);
  const currentStage = plantStageForIndex(currentIndex < 0 ? 0 : currentIndex, levels.length);
  const nextIndex = levels.findIndex((l) => l.level > currentLevel);
  const nextName = nextIndex >= 0 ? plantStageName(plantStageForIndex(nextIndex, levels.length)) : "";

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Levels"
      // Centered under the navbar on phones (the chip sits mid-bar so a
      // right-anchored panel runs off-screen); right-aligned dropdown from sm up.
      className="fixed inset-x-3 top-[80px] z-50 w-auto overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-2 shadow-[0_20px_60px_rgba(0,0,0,0.55)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[360px]"
      style={{ animation: "popIn 0.15s ease-out both" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <PlantArt stage={currentStage} className="h-12 w-12 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-heading">
            Level {currentLevel} — {plantStageName(currentStage)}
          </p>
          <p className="text-xs text-muted-foreground">
            {nextLevel
              ? `${xpToNext.toLocaleString()} XP to ${nextName}`
              : "Maximum level — you've earned it all."}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Shared gradient/filter defs for the plant art — rendered once. */}
      <PlantArtDefs />

      <div className="py-2 max-h-[440px] overflow-y-auto">
        {levels.map((def, i) => {
          const earned = def.level < currentLevel;
          const current = def.level === currentLevel;
          const locked = def.level > currentLevel;
          return (
            <LevelRow
              key={def.level}
              def={def}
              state={earned ? "earned" : current ? "current" : "locked"}
              locked={locked}
              stage={plantStageForIndex(i, levels.length)}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function LevelRow({
  def,
  state,
  locked,
  stage,
}: {
  def: { level: number; threshold: number; title: string; icon: string };
  state: "earned" | "current" | "locked";
  locked: boolean;
  stage: number;
}) {
  // Tint + opacity decide the row's mood. Earned = vibrant, current =
  // primary ring, locked = dimmed.
  const wrapper =
    state === "current"
      ? "bg-primary/15 ring-1 ring-primary/40"
      : state === "earned"
        ? "hover:bg-surface-2/40"
        : "opacity-55 hover:opacity-75";

  // Right-side level pill — replaces the old check / "You" indicators, tinted
  // by state so the current level still stands out.
  const pill =
    state === "current"
      ? "bg-primary text-[#0b0e14]"
      : state === "earned"
        ? "bg-cyan/15 text-cyan"
        : "bg-surface-3 text-muted-foreground";

  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${wrapper}`}>
      {/* Plant art grows with the level; locked levels are greyed out. */}
      <PlantArt
        stage={stage}
        className={`h-11 w-11 shrink-0 ${locked ? "opacity-50 grayscale" : ""}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${state === "current" ? "font-bold text-heading" : "font-semibold text-body"}`}>
          {plantStageName(stage)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {def.threshold === 0 ? "Earned at start" : `${def.threshold.toLocaleString()} XP`}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${pill}`}>
        LV {def.level}
      </span>
    </div>
  );
}

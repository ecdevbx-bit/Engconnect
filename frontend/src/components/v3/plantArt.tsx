"use client";

import type { ReactNode } from "react";

// Plant-art only growth stages (seed → ancient grove) — no hex background,
// no level banner. Lifted from the "Botanical Journey" badge set so the
// levels dropdown can show a tiny tree that grows with your level.
//
// Gradient/filter ids are prefixed `pa-` to avoid colliding with any other
// SVG defs in the app (this renders inside the always-mounted navbar).

// Shared viewBox framing just the plant within the original 100×120 art.
const VIEW_BOX = "6 14 88 88";

export const PLANT_STAGE_COUNT = 10;

// Display names for each growth stage (1..10), shown in the levels dropdown.
const PLANT_STAGE_NAMES = [
  "Dormant Seed",
  "First Sprout",
  "Strong Seedling",
  "Young Sapling",
  "Growing Tree",
  "Thriving Tree",
  "Blossom",
  "Harvest Time",
  "Mighty Oak",
  "Ancient Grove",
];

export function plantStageName(stage: number): string {
  return PLANT_STAGE_NAMES[Math.min(PLANT_STAGE_NAMES.length, Math.max(1, stage)) - 1];
}

// Map a level's position (0-based index among the sorted levels) to a growth
// stage (1..10), spread evenly so the first level is a seed and the last is
// the full grove regardless of how many levels exist.
export function plantStageForIndex(index: number, total: number): number {
  if (total <= 1) return PLANT_STAGE_COUNT;
  const t = index / (total - 1);
  return Math.min(PLANT_STAGE_COUNT, Math.max(1, Math.round(t * (PLANT_STAGE_COUNT - 1)) + 1));
}

const STAGES: ReactNode[] = [
  // 1 — Dormant Seed
  <g key="1">
    <path d="M25 80 Q 50 70 75 80 Q 80 90 50 92 Q 20 90 25 80 Z" fill="url(#pa-dirt)" />
    <circle cx="35" cy="85" r="1.5" fill="#A16207" />
    <circle cx="65" cy="83" r="2" fill="#A16207" />
    <ellipse cx="50" cy="72" rx="10" ry="14" fill="#8B4513" stroke="#451A03" strokeWidth="1.5" />
    <path d="M45 62 Q 50 60 55 64 Q 50 65 45 62 Z" fill="#D2691E" />
    <circle cx="53" cy="67" r="1.5" fill="#FEF3C7" opacity="0.6" />
  </g>,
  // 2 — First Sprout
  <g key="2">
    <path d="M25 80 Q 50 70 75 80 Q 80 90 50 92 Q 20 90 25 80 Z" fill="url(#pa-dirt)" />
    <path d="M50 85 Q 48 70 54 62" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M52 70 Q 40 65 38 75 Q 45 80 52 70" fill="url(#pa-leafLight)" />
    <path d="M54 62 Q 65 58 65 68 Q 58 72 54 62" fill="url(#pa-leafDark)" />
  </g>,
  // 3 — Strong Seedling
  <g key="3">
    <path d="M30 82 Q 50 75 70 82 Q 75 90 50 90 Q 25 90 30 82 Z" fill="url(#pa-dirt)" />
    <path d="M50 85 Q 52 65 48 50" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
    <path d="M51 75 Q 35 70 32 80 Q 42 85 51 75" fill="url(#pa-leafDark)" />
    <path d="M50 65 Q 68 60 70 70 Q 58 75 50 65" fill="url(#pa-leafLight)" />
    <path d="M49 55 Q 36 50 34 60 Q 42 63 49 55" fill="url(#pa-leafLight)" />
    <path d="M48 50 Q 60 42 62 50 Q 55 55 48 50" fill="url(#pa-leafDark)" />
  </g>,
  // 4 — Young Sapling
  <g key="4">
    <path d="M30 82 Q 50 75 70 82 Q 75 90 50 90 Q 25 90 30 82 Z" fill="url(#pa-dirt)" />
    <path d="M47 85 Q 49 65 50 50 L 52 50 Q 51 65 53 85 Z" fill="url(#pa-wood)" />
    <circle cx="50" cy="48" r="12" fill="url(#pa-leafDark)" />
    <circle cx="42" cy="55" r="10" fill="url(#pa-leafLight)" />
    <circle cx="58" cy="52" r="11" fill="url(#pa-leafLight)" />
    <circle cx="52" cy="42" r="9" fill="#4ADE80" />
  </g>,
  // 5 — Growing Tree
  <g key="5">
    <path d="M25 82 Q 50 72 75 82 Q 80 92 50 92 Q 20 92 25 82 Z" fill="url(#pa-dirt)" />
    <path d="M46 88 L 47 50 L 53 50 L 54 88 Z" fill="url(#pa-wood)" />
    <circle cx="50" cy="42" r="14" fill="url(#pa-leafDark)" />
    <circle cx="50" cy="40" r="11" fill="#4ADE80" />
  </g>,
  // 6 — Thriving Tree
  <g key="6">
    <path d="M20 85 Q 50 70 80 85 Q 85 92 50 95 Q 15 92 20 85 Z" fill="url(#pa-dirt)" />
    <path d="M44 88 C 45 70 47 50 47 50 L 53 50 C 53 50 55 70 56 88 Z" fill="url(#pa-wood)" />
    <circle cx="35" cy="55" r="16" fill="url(#pa-leafDark)" />
    <circle cx="65" cy="55" r="16" fill="url(#pa-leafDark)" />
    <circle cx="50" cy="40" r="20" fill="url(#pa-leafDark)" />
    <circle cx="35" cy="52" r="12" fill="url(#pa-leafLight)" />
    <circle cx="65" cy="52" r="12" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="37" r="15" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="33" r="10" fill="#4ADE80" />
  </g>,
  // 7 — Blossom
  <g key="7">
    <path d="M20 85 Q 50 70 80 85 Q 85 92 50 95 Q 15 92 20 85 Z" fill="url(#pa-dirt)" />
    <path d="M44 88 C 45 70 47 50 47 50 L 53 50 C 53 50 55 70 56 88 Z" fill="url(#pa-wood)" />
    <circle cx="35" cy="55" r="16" fill="url(#pa-leafDark)" />
    <circle cx="65" cy="55" r="16" fill="url(#pa-leafDark)" />
    <circle cx="50" cy="40" r="20" fill="url(#pa-leafDark)" />
    <circle cx="35" cy="52" r="12" fill="url(#pa-leafLight)" />
    <circle cx="65" cy="52" r="12" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="37" r="15" fill="url(#pa-leafLight)" />
    <g fill="#FBCFE8" stroke="#F472B6" strokeWidth="0.5">
      <circle cx="30" cy="50" r="3" />
      <circle cx="35" cy="45" r="3" />
      <circle cx="40" cy="55" r="3" />
      <circle cx="60" cy="48" r="3" />
      <circle cx="70" cy="52" r="3" />
      <circle cx="65" cy="42" r="3" />
      <circle cx="50" cy="30" r="3" />
      <circle cx="45" cy="35" r="3" />
      <circle cx="55" cy="38" r="3" />
    </g>
  </g>,
  // 8 — Harvest Time
  <g key="8">
    <path d="M20 85 Q 50 70 80 85 Q 85 92 50 95 Q 15 92 20 85 Z" fill="url(#pa-dirt)" />
    <path d="M44 88 C 45 70 47 50 47 50 L 53 50 C 53 50 55 70 56 88 Z" fill="url(#pa-wood)" />
    <circle cx="35" cy="55" r="16" fill="url(#pa-leafDark)" />
    <circle cx="65" cy="55" r="16" fill="url(#pa-leafDark)" />
    <circle cx="50" cy="40" r="20" fill="url(#pa-leafDark)" />
    <circle cx="35" cy="52" r="12" fill="url(#pa-leafLight)" />
    <circle cx="65" cy="52" r="12" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="37" r="15" fill="url(#pa-leafLight)" />
    <g stroke="#991B1B" strokeWidth="0.5">
      <circle cx="42" cy="55" r="3" fill="#EF4444" />
      <circle cx="58" cy="56" r="3" fill="#EF4444" />
      <circle cx="50" cy="46" r="3" fill="#EF4444" />
      <circle cx="32" cy="50" r="2.5" fill="#EF4444" />
      <circle cx="68" cy="48" r="2.5" fill="#EF4444" />
    </g>
  </g>,
  // 9 — Mighty Oak
  <g key="9">
    <path d="M15 85 Q 50 65 85 85 Q 90 95 50 98 Q 10 95 15 85 Z" fill="url(#pa-dirt)" />
    <path d="M42 90 C 44 70 46 55 46 55 L 54 55 C 54 55 56 70 58 90 Z" fill="url(#pa-wood)" />
    <path d="M46 70 Q 36 64 32 58" fill="none" stroke="url(#pa-wood)" strokeWidth="3" strokeLinecap="round" />
    <path d="M54 72 Q 64 66 68 60" fill="none" stroke="url(#pa-wood)" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 30 C 28 30 25 52 38 60 C 42 68 58 68 62 60 C 75 52 72 30 50 30 Z" fill="url(#pa-leafDark)" />
    <path d="M50 34 C 32 34 30 52 40 58 C 44 64 56 64 60 58 C 70 52 68 34 50 34 Z" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="40" r="14" fill="#4ADE80" />
  </g>,
  // 10 — Ancient Grove
  <g key="10">
    <path d="M10 82 Q 50 65 90 82 Q 95 90 50 95 Q 5 90 10 82 Z" fill="url(#pa-dirt)" />
    <path d="M39 88 C 40 74 42 62 42 62 L 46 62 C 46 62 46 74 47 88 Z" fill="url(#pa-wood)" />
    <path d="M55 88 C 55 74 56 62 56 62 L 60 62 C 60 62 61 74 62 88 Z" fill="url(#pa-wood)" />
    <circle cx="32" cy="52" r="15" fill="url(#pa-leafDark)" />
    <circle cx="68" cy="52" r="15" fill="url(#pa-leafDark)" />
    <circle cx="50" cy="40" r="18" fill="url(#pa-leafDark)" />
    <circle cx="32" cy="49" r="11" fill="url(#pa-leafLight)" />
    <circle cx="68" cy="49" r="11" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="37" r="13" fill="url(#pa-leafLight)" />
    <circle cx="50" cy="34" r="8" fill="#4ADE80" />
    <circle cx="20" cy="70" r="1.5" fill="#FEF08A" filter="url(#pa-glow)" />
    <circle cx="80" cy="75" r="1.5" fill="#FEF08A" filter="url(#pa-glow)" />
    <circle cx="50" cy="20" r="1.5" fill="#FEF08A" filter="url(#pa-glow)" />
  </g>,
];

// Render once per surface (e.g. at the top of the levels popover). All
// PlantArt instances reference these by id.
export function PlantArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        <linearGradient id="pa-dirt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id="pa-leafLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="pa-leafDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="pa-wood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <filter id="pa-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// One plant at a given growth stage (1..10). Just the plant — no frame.
export function PlantArt({ stage, className }: { stage: number; className?: string }) {
  const idx = Math.min(STAGES.length, Math.max(1, stage)) - 1;
  return (
    <svg viewBox={VIEW_BOX} className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      {STAGES[idx]}
    </svg>
  );
}

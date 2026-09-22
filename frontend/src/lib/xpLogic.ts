import { LEVEL_THRESHOLDS, MAX_LEVEL } from "@/types";

export function getLevelFromXP(xp: number): number {
  for (let l = MAX_LEVEL; l >= 1; l--) {
    if (xp >= LEVEL_THRESHOLDS[l]) return l;
  }
  return 1;
}

export function xpToNextLevel(xp: number): { next: number | null; current: number; progress: number } {
  const currentLevel = getLevelFromXP(xp);
  if (currentLevel >= MAX_LEVEL) {
    return { next: null, current: LEVEL_THRESHOLDS[MAX_LEVEL], progress: 100 };
  }
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel + 1];
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const range = nextThreshold - currentThreshold;
  const earned = xp - currentThreshold;
  const progress = Math.round((earned / range) * 100);
  return { next: nextThreshold, current: currentThreshold, progress };
}

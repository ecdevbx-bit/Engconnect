"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Zap } from "lucide-react";
import confetti from "canvas-confetti";

// SolveCelebration — brief overlay shown when a v3 feature credits XP.
// Lighter than LevelUpCelebration so it can fire on every reward
// without fatiguing the user.
//
// Shared by pronunciation (per-attempt high-tier) and AI Partner
// (per-milestone). Customize the title via the `headline` prop.

export function SolveCelebration({
  visible,
  xpEarned,
  headline = "Great job!",
  sublabel,
  onDone,
  durationMs = 1600,
}: {
  visible: boolean;
  xpEarned: number;
  headline?: string;
  sublabel?: string;
  onDone: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!visible) return;
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.45 },
      colors: ["#f59e0b", "#f97316", "#00e3fd", "#34d399"],
    });
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [visible, onDone, durationMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDone}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0e14]/40 backdrop-blur-[2px] cursor-pointer"
          role="dialog"
          aria-label={headline}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="relative flex flex-col items-center gap-3 rounded-3xl border border-primary/30 bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 px-10 py-8 shadow-[0_20px_60px_rgba(171,142,255,0.35)]"
          >
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [-12, 12, -12], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-primary"
                aria-hidden
              >
                <Sparkles className="h-6 w-6" />
              </motion.span>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                Reward
              </span>
              <motion.span
                animate={{ rotate: [12, -12, 12], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-primary"
                aria-hidden
              >
                <Sparkles className="h-6 w-6" />
              </motion.span>
            </div>

            <p className="font-display text-3xl font-bold text-heading">{headline}</p>

            {xpEarned > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" />
                +{xpEarned} XP
              </div>
            )}

            {sublabel && (
              <p className="max-w-xs text-center text-sm text-muted-foreground">{sublabel}</p>
            )}

            <p className="text-xs text-muted-foreground/70">Tap anywhere to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

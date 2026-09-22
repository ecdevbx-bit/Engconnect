"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";

import { badgeAccent, parseBadgeId } from "@/lib/badges";
import { BadgeArt } from "./BadgeArt";

// Full-screen celebration shown when a badge is first awarded. One generic
// frame themed per-badge by its accent (so "each badge has a different
// celebration"); the visual inside is whatever BadgeArt renders for the ID.
// Driven by the badge queue in xpSlice via BadgeCelebrationRoot.
export function BadgeCelebrationOverlay({
  id,
  onDone,
}: {
  id: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!id) return;
    const accent = badgeAccent(parseBadgeId(id));
    const burst = () =>
      confetti({
        particleCount: 90,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.45 },
        colors: accent.confetti,
        shapes: ["star", "circle"],
      });
    const t1 = setTimeout(burst, 120);
    const t2 = setTimeout(burst, 520);
    const auto = setTimeout(onDone, 5000); // auto-dismiss; user can also tap
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(auto);
    };
  }, [id, onDone]);

  const accent = id ? badgeAccent(parseBadgeId(id)) : null;

  return (
    <AnimatePresence>
      {id && accent && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <motion.div
            className="flex flex-col items-center gap-5"
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-xs font-bold uppercase tracking-[0.3em] text-white/70">
              Badge Earned
            </div>
            <div
              className="relative h-80 w-64 overflow-hidden rounded-3xl border-4 shadow-2xl"
              style={{ borderColor: accent.ring, boxShadow: `0 0 60px ${accent.ring}66` }}
            >
              <BadgeArt id={id} variant="full" />
            </div>
            <button
              type="button"
              onClick={onDone}
              className="rounded-full bg-white px-8 py-2.5 text-sm font-bold text-black shadow-lg transition hover:scale-105"
            >
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

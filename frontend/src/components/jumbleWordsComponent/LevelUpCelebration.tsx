"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { LEVEL_LABELS } from "@/types";
import { LevelCard } from "@/components/badges/LevelCard";

export default function LevelUpCelebration({
  level,
  onDone,
  userName,
}: {
  level: number | null;
  onDone: () => void;
  userName?: string;
}) {
  const [displayNum, setDisplayNum] = useState(0);
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: "#07020d",
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `englishconnection-level-${level}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Level ${level} on English Connection!`,
          text: `I just reached Level ${level} on English Connection!`,
          files: [file],
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } catch {
      // user cancelled share or capture failed — silent
    } finally {
      setSharing(false);
    }
  }, [level, sharing]);

  // Number counting animation
  useEffect(() => {
    if (level == null) { setDisplayNum(0); return; }
    const start = Math.max(1, level - 8);
    let current = start;
    setDisplayNum(start);
    let speed = 30;
    const tick = () => {
      current++;
      setDisplayNum(current);
      if (current < level) {
        if (level - current < 3) speed += 40;
        setTimeout(tick, speed);
      }
    };
    const delay = setTimeout(tick, 500);
    return () => clearTimeout(delay);
  }, [level]);

  const rankLabel = level != null ? (LEVEL_LABELS[level] ?? "Champion") : "";

  return (
    <AnimatePresence>
      {level != null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          role="dialog"
          aria-label={`Level up to ${level}`}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-[#07020d]/80 backdrop-blur-sm" />

          {/* Deep background glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute h-[80vw] w-[80vw] rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,211,0.25), rgba(7,2,13,0) 70%)" }}
          />

          {/* Explosive center glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="absolute h-[500px] w-[500px] rounded-full blur-2xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3), rgba(245,158,11,0.15), transparent 70%)" }}
          />

          {/* Pulsing shockwave rings */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.4, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute h-[300px] w-[300px] rounded-full border border-white/30 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
            className="absolute h-[300px] w-[300px] rounded-full border border-[#f59e0b]/20 pointer-events-none"
          />

          {/* Rotating light beams */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute pointer-events-none"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative w-[150vw] h-[150vw]"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 origin-left w-1/2 h-[30px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent blur-md"
                  style={{ transform: `rotate(${(360 / 8) * i}deg)` }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Floating sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 1.5,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                className="absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              >
                <svg width={10 + Math.random() * 14} height={10 + Math.random() * 14} viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C12 0 12 10 24 12C24 12 13 13 12 24C12 24 11 13 0 12C0 12 11 10 12 0Z" />
                </svg>
              </motion.div>
            ))}
          </div>

          {/* ── The Card (capture region for screenshot) ── */}
          <motion.div
            ref={captureRef}
            initial={{ opacity: 0, scale: 0.2, y: 100, rotateX: 45 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="relative z-10 rounded-[36px] p-4"
            style={{ perspective: 1200 }}
          >
            <LevelCard level={displayNum} rankLabel={rankLabel} userName={userName} interactive />
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 20 }}
            className="relative z-10 mt-8 flex items-center gap-3"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void handleShare(); }}
              disabled={sharing}
              aria-label="Share level up"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/25 text-white/70 transition-all hover:border-white/50 hover:text-white active:scale-95 disabled:opacity-50"
            >
              <Share2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDone(); }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-8 py-3 text-sm font-bold text-[#0b0e14] shadow-[0_4px_24px_rgba(249,115,22,0.45)] transition-all hover:brightness-110 hover:shadow-[0_6px_32px_rgba(249,115,22,0.6)] active:scale-95"
            >
              Next →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


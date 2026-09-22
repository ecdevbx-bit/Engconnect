"use client";

import { Rocket, Sparkles, Star } from "lucide-react";

import type { BadgeAccent } from "@/lib/badges";
import { BadgeBrandMark } from "./BadgeBrandMark";

// OnboardingBadge — the celebratory "Welcome Aboard" card a learner earns just
// for joining. The plain gradient + tiny glyph felt like a placeholder, so this
// gives the very first badge a real moment: a slow sunburst, drifting confetti
// and a glowing rocket medallion (you're "aboard" — the journey is launching).
// Renders at the deck tile size and, larger, in the award celebration (`full`).

// Fixed scatter (no Math.random) so SSR and client agree — no hydration drift.
const CONFETTI = [
  { top: "12%", left: "16%", c: 0, delay: "0s" },
  { top: "18%", left: "80%", c: 1, delay: "0.4s" },
  { top: "34%", left: "8%", c: 2, delay: "0.8s" },
  { top: "28%", left: "90%", c: 0, delay: "1.1s" },
  { top: "60%", left: "10%", c: 1, delay: "0.2s" },
  { top: "68%", left: "86%", c: 2, delay: "0.9s" },
  { top: "82%", left: "26%", c: 0, delay: "0.6s" },
  { top: "86%", left: "70%", c: 1, delay: "1.3s" },
];

export function OnboardingBadge({
  full,
  accent,
  title,
  subtitle,
}: {
  full: boolean;
  accent: BadgeAccent;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-4 text-center"
      style={{ background: `linear-gradient(150deg, ${accent.from}, ${accent.to})` }}
    >
      {/* Rotating sunburst rays (spin lives on the inner div so it doesn't fight
          the centering translate on the wrapper). Masked to fade out at the edges. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[170%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <div
          className="h-full w-full opacity-25"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.6) 0deg 9deg, transparent 9deg 18deg)",
            animation: "spin 20s linear infinite",
            WebkitMaskImage: "radial-gradient(circle, #000 0%, #000 36%, transparent 70%)",
            maskImage: "radial-gradient(circle, #000 0%, #000 36%, transparent 70%)",
          }}
        />
      </div>

      {/* Soft top glow */}
      <div
        className="pointer-events-none absolute -top-1/4 left-1/2 aspect-square w-[140%] -translate-x-1/2 rounded-full opacity-40 blur-2xl"
        style={{ background: accent.ring }}
        aria-hidden
      />

      {/* Confetti */}
      {CONFETTI.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 animate-bounce rounded-[1px]"
          style={{
            top: p.top,
            left: p.left,
            background: accent.confetti[p.c % accent.confetti.length],
            animationDelay: p.delay,
            animationDuration: "2.4s",
          }}
          aria-hidden
        />
      ))}

      {/* Rocket medallion */}
      <div
        className={`relative flex aspect-square items-center justify-center rounded-full border border-white/40 bg-white/15 shadow-[inset_0_2px_12px_rgba(255,255,255,0.45),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm ${
          full ? "w-40" : "w-24"
        }`}
      >
        <Rocket className={`text-white drop-shadow ${full ? "h-20 w-20" : "h-11 w-11"}`} strokeWidth={1.75} />
        <Sparkles className="absolute -right-1 -top-1 h-5 w-5 animate-pulse text-white drop-shadow" />
        <Star
          className="absolute -bottom-1 -left-1 h-4 w-4 animate-pulse text-white/90 drop-shadow"
          style={{ animationDelay: "0.6s" }}
          fill="currentColor"
        />
      </div>

      {/* Title + subtitle */}
      <div
        className={`relative font-extrabold uppercase tracking-wider text-white drop-shadow ${
          full ? "mt-4 text-2xl" : "mt-3 text-[12px]"
        }`}
      >
        {title}
      </div>
      {full && <div className="relative mt-1 text-sm text-white/85">{subtitle}</div>}

      <BadgeBrandMark size={full ? "md" : "sm"} />
    </div>
  );
}

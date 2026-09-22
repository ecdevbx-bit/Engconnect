"use client";

import { useEffect, useState } from "react";

/**
 * SpeedTimer — a depleting countdown ring shown per question (Streaks & Speed
 * bundle). Restarts whenever `resetKey` changes; freezes when `paused`.
 */
export default function SpeedTimer({
  duration,
  resetKey,
  paused = false,
}: {
  duration: number;
  resetKey: number | string;
  paused?: boolean;
}) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    setRemaining(duration);
    if (paused) return;
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(duration - (Date.now() - start) / 1000, 0);
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [duration, resetKey, paused]);

  const pct = remaining / duration;
  const R = 16;
  const C = 2 * Math.PI * R;
  const color = pct > 0.5 ? "#00e3fd" : pct > 0.2 ? "#ab8eff" : "#ff6c95";

  return (
    <div className="relative h-11 w-11 shrink-0" title="Answer fast for a speed streak">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-100 ease-linear"
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}

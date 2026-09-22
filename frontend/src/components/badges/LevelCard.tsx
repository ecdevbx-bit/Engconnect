"use client";

import { useCallback, useRef, useState } from "react";
import { LEVEL_LABELS } from "@/types";

// LevelCard is the holographic "LEVEL UP" card — the single source of truth for
// the level visual. It's used full-size + interactive (mouse tilt) in the
// level-up celebration, and scaled-down + static as the lvl:N badge in the
// deck, so the two always match. Base size is 320×440; callers scale it.
//
// rankLabel defaults to the same LEVEL_LABELS lookup the celebration uses;
// userName defaults to "Player" when not supplied (e.g. in the deck).
export function LevelCard({
  level,
  rankLabel,
  userName,
  interactive = false,
}: {
  level: number;
  rankLabel?: string;
  userName?: string;
  interactive?: boolean;
}) {
  const label = rankLabel ?? LEVEL_LABELS[level] ?? "Champion";
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      setMouse({ x: mx, y: my });
      setRot({
        x: ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -12,
        y: ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 12,
      });
    },
    [interactive],
  );

  const onLeave = useCallback(() => {
    setHovering(false);
    setRot({ x: 0, y: 0 });
    setMouse({ x: 50, y: 50 });
  }, []);

  return (
    <div style={{ perspective: 1200 }}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => interactive && setHovering(true)}
        onMouseLeave={onLeave}
        className="relative h-[440px] w-[320px]"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transition: hovering ? "none" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* Shadow */}
        <div
          className="absolute inset-[-10px] rounded-[36px] bg-black/40 blur-xl"
          style={{
            transform: `translateZ(-20px) translate(${rot.y * -0.5}px, ${rot.x * 0.5}px)`,
            opacity: hovering ? 0.8 : 0.4,
            transition: "opacity 0.3s",
          }}
        />

        {/* Outer border gradient */}
        <div className="absolute inset-0 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#f59e0b] via-white to-[#f97316] p-[3px] shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_10px_40px_rgba(0,0,0,0.5)]">
          <div
            className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[29px] bg-white p-7"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Holographic iridescent layer */}
            <div
              className="absolute inset-0 opacity-70 mix-blend-color-burn"
              style={{
                background: `
                  radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.9) 0%, transparent 40%),
                  linear-gradient(115deg, rgba(245,158,11,0.3) 0%, rgba(0,255,255,0.3) 25%, rgba(255,255,0,0.3) 50%, rgba(0,255,255,0.3) 75%, rgba(245,158,11,0.3) 100%)
                `,
                backgroundSize: "200% 200%",
                backgroundPosition: `${mouse.x}% ${mouse.y}%`,
                transition: "background-position 0.1s",
              }}
            />

            {/* Topo pattern */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-color-burn" aria-hidden>
              <defs>
                <pattern id="levelcard-topo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                  <path d="M-20 60 Q 30 10 60 60 T 140 60" fill="none" stroke="currentColor" strokeWidth="0.75" />
                  <path d="M-20 40 Q 30 -10 60 40 T 140 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M-20 80 Q 30 30 60 80 T 140 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 4" />
                  <circle cx="60" cy="60" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#levelcard-topo)" />
            </svg>

            {/* Top section */}
            <div
              className="relative z-10 flex w-full items-center justify-between border-b-[2.5px] border-black px-2 pb-3"
              style={{ transform: "translateZ(15px)" }}
            >
              <span className="text-lg font-black text-black">↑</span>
              <h1
                className="text-3xl font-black uppercase tracking-[0.25em] text-black"
                style={{ fontFamily: "var(--font-display), Impact, sans-serif", textShadow: "0 2px 10px rgba(255,255,255,0.8)" }}
              >
                Level Up
              </h1>
              <span className="text-lg font-black text-black">↑</span>
            </div>

            {/* Middle section */}
            <div className="relative z-10 flex flex-grow flex-col items-center justify-center py-2" style={{ transform: "translateZ(30px)" }}>
              {/* Rank badge */}
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/40 px-3 py-1 shadow-sm backdrop-blur-md">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-black">{label}</span>
              </div>

              {/* Tech accents + number */}
              <div className="relative flex w-full flex-grow items-center justify-center">
                <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-60">
                  <span className="text-lg font-black leading-none text-black">»</span>
                  <br />
                  <span className="text-lg font-black leading-none text-black">»</span>
                </div>

                <span
                  className="text-[110px] font-black leading-none tracking-tighter text-black"
                  style={{
                    fontFamily: "var(--font-display), Impact, sans-serif",
                    filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12)) drop-shadow(0 2px 0 rgba(255,255,255,1))",
                  }}
                >
                  {level}
                </span>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 rotate-180 opacity-60">
                  <span className="text-lg font-black leading-none text-black">»</span>
                  <br />
                  <span className="text-lg font-black leading-none text-black">»</span>
                </div>
              </div>

              {/* Info strip */}
              <div className="w-full border-t-[1.5px] border-black/20 px-1 pt-2">
                <div className="flex items-end justify-between">
                  <div className="text-left">
                    <span className="block text-[7px] font-bold tracking-[0.2em] text-black/50">AUTHORIZED USER</span>
                    <span className="block max-w-[140px] truncate text-[12px] font-black uppercase tracking-wider text-black">
                      {userName || "Player"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[7px] font-bold tracking-[0.2em] text-black/50">STATUS</span>
                    <span className="font-mono text-[11px] font-bold text-black">Achieved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div
              className="relative z-10 flex w-full items-end justify-between border-t-[2.5px] border-black px-2 pt-3"
              style={{ transform: "translateZ(15px)" }}
            >
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" width={10} height={10} className="h-2.5 w-2.5" />
                <div className="border-[1.5px] border-black bg-white/50 px-1.5 py-[2px]">
                  <span className="text-[7px] font-bold tracking-widest text-black">ENGLISH CONNECTION</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-black" viewBox="0 0 24 24" fill="currentColor" style={{ animation: "spin 6s linear infinite" }}>
                  <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" />
                </svg>
                {/* Barcode */}
                <div className="flex h-5 items-center gap-[1.5px] bg-black pl-2 pr-1">
                  <div className="h-4 w-[1.5px] bg-white" />
                  <div className="h-4 w-[3px] bg-white" />
                  <div className="h-4 w-[1px] bg-white" />
                  <div className="h-4 w-[4px] bg-white" />
                  <div className="h-4 w-[1.5px] bg-white" />
                  <div className="h-4 w-[2px] bg-white" />
                </div>
              </div>
            </div>

            {/* Specular glare sweep (interactive) */}
            <div
              className="pointer-events-none absolute inset-0 z-50 mix-blend-overlay"
              style={{
                background: `linear-gradient(105deg, transparent 20%, transparent 25%, rgba(255,255,255,0.9) 45%, rgba(255,255,255,0.9) 55%, transparent 75%, transparent 80%)`,
                backgroundSize: "250% 250%",
                backgroundPosition: hovering ? `${mouse.x}% ${mouse.y}%` : "200% 200%",
                opacity: hovering ? 1 : 0,
                transition: "opacity 0.3s, background-position 0.1s",
              }}
            />

            {/* Auto-shimmer when not hovering */}
            {!hovering && (
              <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden mix-blend-overlay">
                <div
                  className="absolute inset-0 -skew-x-12 bg-gradient-to-tr from-transparent via-white/50 to-transparent"
                  style={{ animation: "levelup-shimmer 3s infinite ease-in-out" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

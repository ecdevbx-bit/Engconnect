"use client";

// TEMPORARY showcase route — the "Botanical Journey" badge inspector.
// A grid of SVG growth badges (Lvl 1 → MAX) with toggles to inspect each
// layer (background / level banner / plant art) and the earned vs unearned
// state. Self-contained; delete when done reviewing.

import { useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";

type ThemeKey = "amethyst" | "bronze" | "silver" | "gold";

const THEMES: Record<ThemeKey, { outer: string; inner: string; banner: string; bannerDark: string; bannerStroke: string; text: string }> = {
  amethyst: { outer: "hexOuter", inner: "hexInner", banner: "bannerGrad", bannerDark: "#3B0764", bannerStroke: "#581C87", text: "#FAF5FF" },
  bronze: { outer: "hexOuter-bronze", inner: "hexInner-bronze", banner: "bannerGrad-bronze", bannerDark: "#9A3412", bannerStroke: "#7C2D12", text: "#431407" },
  silver: { outer: "hexOuter-silver", inner: "hexInner-silver", banner: "bannerGrad-silver", bannerDark: "#475569", bannerStroke: "#334155", text: "#0F172A" },
  gold: { outer: "hexOuter-gold", inner: "hexInner-gold", banner: "bannerGrad-gold", bannerDark: "#B45309", bannerStroke: "#92400E", text: "#78350F" },
};

function HexBg({ theme }: { theme: ThemeKey }) {
  const t = THEMES[theme];
  return (
    <g className="badge-bg">
      <path d="M50 2L91 26V76L50 100L9 76V26L50 2Z" fill={`url(#${t.outer})`} filter="url(#dropShadow)" />
      <path d="M50 6L87 28V74L50 96L13 74V28L50 6Z" fill={`url(#${t.inner})`} filter="url(#innerShadow)" />
    </g>
  );
}

function StarBg() {
  return (
    <g className="badge-bg">
      <path d="M50 0 L66 14 L87 14 L94 34 L82 50 L94 66 L87 86 L66 86 L50 100 L34 86 L13 86 L6 66 L18 50 L6 34 L13 14 L34 14 Z" fill="url(#hexOuter-gold)" filter="url(#dropShadow)" />
      <path d="M50 4 L64 17 L83 17 L89 35 L78 50 L89 65 L83 83 L64 83 L50 96 L36 83 L17 83 L11 65 L22 50 L11 35 L17 17 L36 17 Z" fill="url(#hexInner-gold)" filter="url(#innerShadow)" />
    </g>
  );
}

function LevelBanner({ theme, label }: { theme: ThemeKey; label: string }) {
  const t = THEMES[theme];
  return (
    <g className="badge-level">
      <path d="M8 92 L92 92 L84 108 L16 108 Z" fill={t.bannerDark} />
      <path d="M6 90 L94 90 L86 106 L14 106 Z" fill={`url(#${t.banner})`} stroke={t.bannerStroke} strokeWidth={1.5} />
      <path d="M6 90 L 0 98 L 10 98 Z" fill={t.bannerStroke} />
      <path d="M94 90 L 100 98 L 90 98 Z" fill={t.bannerStroke} />
      <text x="50" y="102" fontFamily="'Nunito', sans-serif" fontSize="13" fontWeight="900" fill={t.text} textAnchor="middle" letterSpacing="1.5">
        {label}
      </text>
    </g>
  );
}

type Badge = { label: string; title: string; date: string; theme: ThemeKey; star?: boolean; plant: ReactNode };

const BADGES: Badge[] = [
  {
    label: "LVL 1", title: "Dormant Seed", date: "JAN 12, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M25 80 Q 50 70 75 80 Q 80 90 50 92 Q 20 90 25 80 Z" fill="url(#dirtGrad)" />
        <circle cx="35" cy="85" r="1.5" fill="#A16207" />
        <circle cx="65" cy="83" r="2" fill="#A16207" />
        <ellipse cx="50" cy="72" rx="10" ry="14" fill="#8B4513" stroke="#451A03" strokeWidth="1.5" />
        <path d="M45 62 Q 50 60 55 64 Q 50 65 45 62 Z" fill="#D2691E" />
        <circle cx="53" cy="67" r="1.5" fill="#FEF3C7" opacity="0.6" />
      </g>
    ),
  },
  {
    label: "LVL 2", title: "First Sprout", date: "FEB 04, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M25 80 Q 50 70 75 80 Q 80 90 50 92 Q 20 90 25 80 Z" fill="url(#dirtGrad)" />
        <path d="M50 85 Q 48 70 54 62" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M52 70 Q 40 65 38 75 Q 45 80 52 70" fill="url(#leafLight)" />
        <path d="M38 75 Q 45 78 52 70" fill="none" stroke="#16A34A" strokeWidth="1" />
        <path d="M54 62 Q 65 58 65 68 Q 58 72 54 62" fill="url(#leafDark)" />
        <path d="M65 68 Q 58 70 54 62" fill="none" stroke="#15803D" strokeWidth="1" />
      </g>
    ),
  },
  {
    label: "LVL 3", title: "Strong Seedling", date: "MAR 15, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M30 82 Q 50 75 70 82 Q 75 90 50 90 Q 25 90 30 82 Z" fill="url(#dirtGrad)" />
        <path d="M50 85 Q 52 65 48 50" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        <path d="M51 75 Q 35 70 32 80 Q 42 85 51 75" fill="url(#leafDark)" />
        <path d="M50 65 Q 68 60 70 70 Q 58 75 50 65" fill="url(#leafLight)" />
        <path d="M49 55 Q 36 50 34 60 Q 42 63 49 55" fill="url(#leafLight)" />
        <path d="M48 50 Q 60 42 62 50 Q 55 55 48 50" fill="url(#leafDark)" />
        <circle cx="65" cy="65" r="1.5" fill="#60A5FA" opacity="0.8" />
      </g>
    ),
  },
  {
    label: "LVL 4", title: "Young Sapling", date: "APR 22, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M30 82 Q 50 75 70 82 Q 75 90 50 90 Q 25 90 30 82 Z" fill="url(#dirtGrad)" />
        <path d="M47 85 Q 49 65 50 50 L 52 50 Q 51 65 53 85 Z" fill="url(#woodGrad)" />
        <path d="M50 60 Q 42 55 40 50" fill="none" stroke="url(#woodGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M51 68 Q 60 60 62 55" fill="none" stroke="url(#woodGrad)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="48" r="12" fill="url(#leafDark)" />
        <circle cx="42" cy="55" r="10" fill="url(#leafLight)" />
        <circle cx="58" cy="52" r="11" fill="url(#leafLight)" />
        <circle cx="52" cy="42" r="9" fill="#4ADE80" />
      </g>
    ),
  },
  {
    label: "LVL 5", title: "Growing Tree", date: "MAY 01, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M25 82 Q 50 72 75 82 Q 80 92 50 92 Q 20 92 25 82 Z" fill="url(#dirtGrad)" />
        <path d="M46 88 L 47 50 L 53 50 L 54 88 Z" fill="url(#woodGrad)" />
        <path d="M48 85 L 48 55" stroke="#451A03" strokeWidth="0.5" fill="none" />
        <path d="M52 80 L 52 60" stroke="#451A03" strokeWidth="0.5" fill="none" />
        <path d="M50 65 Q 35 65 30 55 Q 35 40 50 45 Q 65 40 70 55 Q 65 65 50 65" fill="url(#leafDark)" />
        <path d="M50 60 Q 38 60 35 52 Q 38 42 50 46 Q 62 42 65 52 Q 62 60 50 60" fill="url(#leafLight)" />
        <circle cx="50" cy="42" r="14" fill="url(#leafDark)" />
        <circle cx="50" cy="40" r="11" fill="#4ADE80" />
      </g>
    ),
  },
  {
    label: "LVL 6", title: "Thriving Tree", date: "MAY 20, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M20 85 Q 50 70 80 85 Q 85 92 50 95 Q 15 92 20 85 Z" fill="url(#dirtGrad)" />
        <path d="M45 88 Q 40 92 35 90" fill="none" stroke="url(#woodGrad)" strokeWidth="2" />
        <path d="M55 88 Q 62 90 65 85" fill="none" stroke="url(#woodGrad)" strokeWidth="2" />
        <path d="M44 88 C 45 70 47 50 47 50 L 53 50 C 53 50 55 70 56 88 Z" fill="url(#woodGrad)" />
        <circle cx="35" cy="55" r="16" fill="url(#leafDark)" />
        <circle cx="65" cy="55" r="16" fill="url(#leafDark)" />
        <circle cx="50" cy="40" r="20" fill="url(#leafDark)" />
        <circle cx="35" cy="52" r="12" fill="url(#leafLight)" />
        <circle cx="65" cy="52" r="12" fill="url(#leafLight)" />
        <circle cx="50" cy="37" r="15" fill="url(#leafLight)" />
        <circle cx="50" cy="33" r="10" fill="#4ADE80" />
      </g>
    ),
  },
  {
    label: "LVL 7", title: "Blossom", date: "JUN 11, 2026", theme: "amethyst",
    plant: (
      <g className="badge-plant">
        <path d="M20 85 Q 50 70 80 85 Q 85 92 50 95 Q 15 92 20 85 Z" fill="url(#dirtGrad)" />
        <path d="M44 88 C 45 70 47 50 47 50 L 53 50 C 53 50 55 70 56 88 Z" fill="url(#woodGrad)" />
        <circle cx="35" cy="55" r="16" fill="url(#leafDark)" />
        <circle cx="65" cy="55" r="16" fill="url(#leafDark)" />
        <circle cx="50" cy="40" r="20" fill="url(#leafDark)" />
        <circle cx="35" cy="52" r="12" fill="url(#leafLight)" />
        <circle cx="65" cy="52" r="12" fill="url(#leafLight)" />
        <circle cx="50" cy="37" r="15" fill="url(#leafLight)" />
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
      </g>
    ),
  },
  {
    label: "LVL 8", title: "Harvest Time", date: "JUL 08, 2026", theme: "bronze",
    plant: (
      <g className="badge-plant">
        <path d="M20 85 Q 50 70 80 85 Q 85 92 50 95 Q 15 92 20 85 Z" fill="url(#dirtGrad)" />
        <path d="M44 88 C 45 70 47 50 47 50 L 53 50 C 53 50 55 70 56 88 Z" fill="url(#woodGrad)" />
        <circle cx="35" cy="55" r="16" fill="url(#leafDark)" />
        <circle cx="65" cy="55" r="16" fill="url(#leafDark)" />
        <circle cx="50" cy="40" r="20" fill="url(#leafDark)" />
        <circle cx="35" cy="52" r="12" fill="url(#leafLight)" />
        <circle cx="65" cy="52" r="12" fill="url(#leafLight)" />
        <circle cx="50" cy="37" r="15" fill="url(#leafLight)" />
        <g stroke="#991B1B" strokeWidth="0.5">
          <circle cx="42" cy="55" r="3" fill="#EF4444" />
          <circle cx="58" cy="56" r="3" fill="#EF4444" />
          <circle cx="50" cy="46" r="3" fill="#EF4444" />
          <circle cx="32" cy="50" r="2.5" fill="#EF4444" />
          <circle cx="68" cy="48" r="2.5" fill="#EF4444" />
        </g>
      </g>
    ),
  },
  {
    label: "LVL 9", title: "Mighty Oak", date: "AUG 25, 2026", theme: "silver",
    plant: (
      <g className="badge-plant">
        <path d="M15 85 Q 50 65 85 85 Q 90 95 50 98 Q 10 95 15 85 Z" fill="url(#dirtGrad)" />
        <path d="M42 90 C 44 70 46 55 46 55 L 54 55 C 54 55 56 70 58 90 Z" fill="url(#woodGrad)" />
        <path d="M46 70 Q 36 64 32 58" fill="none" stroke="url(#woodGrad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M54 72 Q 64 66 68 60" fill="none" stroke="url(#woodGrad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 30 C 28 30 25 52 38 60 C 42 68 58 68 62 60 C 75 52 72 30 50 30 Z" fill="url(#leafDark)" />
        <path d="M50 34 C 32 34 30 52 40 58 C 44 64 56 64 60 58 C 70 52 68 34 50 34 Z" fill="url(#leafLight)" />
        <circle cx="50" cy="40" r="14" fill="#4ADE80" />
      </g>
    ),
  },
  {
    label: "MAX", title: "Ancient Grove", date: "SEP 30, 2026", theme: "gold", star: true,
    plant: (
      <g className="badge-plant">
        <path d="M10 82 Q 50 65 90 82 Q 95 90 50 95 Q 5 90 10 82 Z" fill="url(#dirtGrad)" />
        <path d="M39 88 C 40 74 42 62 42 62 L 46 62 C 46 62 46 74 47 88 Z" fill="url(#woodGrad)" />
        <path d="M55 88 C 55 74 56 62 56 62 L 60 62 C 60 62 61 74 62 88 Z" fill="url(#woodGrad)" />
        <circle cx="32" cy="52" r="15" fill="url(#leafDark)" />
        <circle cx="68" cy="52" r="15" fill="url(#leafDark)" />
        <circle cx="50" cy="40" r="18" fill="url(#leafDark)" />
        <circle cx="32" cy="49" r="11" fill="url(#leafLight)" />
        <circle cx="68" cy="49" r="11" fill="url(#leafLight)" />
        <circle cx="50" cy="37" r="13" fill="url(#leafLight)" />
        <circle cx="50" cy="34" r="8" fill="#4ADE80" />
        <circle cx="20" cy="70" r="1.5" fill="#FEF08A" filter="url(#glow)" />
        <circle cx="80" cy="75" r="1.5" fill="#FEF08A" filter="url(#glow)" />
        <circle cx="50" cy="20" r="1.5" fill="#FEF08A" filter="url(#glow)" />
      </g>
    ),
  },
];

function Defs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        {/* Amethyst (1-7) */}
        <linearGradient id="hexInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E8FF" />
          <stop offset="50%" stopColor="#D8B4FE" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id="hexOuter" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
        <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>

        {/* Bronze (8) */}
        <linearGradient id="hexInner-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEDD5" />
          <stop offset="50%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="hexOuter-bronze" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>
        <linearGradient id="bannerGrad-bronze" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>

        {/* Silver (9) */}
        <linearGradient id="hexInner-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="hexOuter-silver" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="bannerGrad-silver" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Gold (MAX) */}
        <linearGradient id="hexInner-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="50%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="hexOuter-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="bannerGrad-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Shared botanical fills */}
        <linearGradient id="dirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id="leafLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="leafDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>

        {/* Filters */}
        <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
        </filter>
        <filter id="innerShadow">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="#000000" floodOpacity="0.3" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
        <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{label}</span>
    </label>
  );
}

export default function BadgeInspector() {
  const [earned, setEarned] = useState(true);
  const [showBg, setShowBg] = useState(true);
  const [showLevel, setShowLevel] = useState(true);
  const [showPlant, setShowPlant] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      <Defs />

      {/* Sticky control panel */}
      <div className="sticky top-0 z-50 mb-10 w-full border-b border-slate-200 bg-white/90 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Badge Inspector
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-3 border-r border-slate-300 pr-4">
              <span className="text-sm font-semibold text-slate-600">Unearned</span>
              <Switch checked={earned} onCheckedChange={setEarned} aria-label="Toggle earned state" />
              <span className="text-sm font-semibold text-emerald-600">Earned</span>
            </div>
            <div className="flex items-center gap-4">
              <Toggle checked={showBg} onChange={setShowBg} label="Background" />
              <Toggle checked={showLevel} onChange={setShowLevel} label="Level Banner" />
              <Toggle checked={showPlant} onChange={setShowPlant} label="Plant Art" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl px-6">
        <header className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-800 md:text-5xl">Botanical Journey</h1>
          <p className="mx-auto max-w-2xl text-slate-500">
            Toggle the components above to inspect the anatomy of each badge. See the progress from a tiny seed to an
            ancient grove.
          </p>
        </header>

        <div className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {BADGES.map((b) => (
            <div key={b.label + b.title} className={`flex w-full flex-col items-center ${b.star ? "sm:col-span-3 md:col-span-4 lg:col-span-1" : ""}`}>
              <svg
                className={`overflow-visible transition-all duration-300 ${b.star ? "h-36 w-32" : "h-32 w-28"} ${earned ? "" : "opacity-40 grayscale"}`}
                viewBox="0 0 100 120"
                xmlns="http://www.w3.org/2000/svg"
              >
                {showBg && (b.star ? <StarBg /> : <HexBg theme={b.theme} />)}
                {showPlant && b.plant}
                {showLevel && <LevelBanner theme={b.theme} label={b.label} />}
              </svg>
              <h3 className={`mt-5 text-center text-sm font-extrabold transition-colors ${b.star ? "uppercase tracking-wide" : ""} ${earned ? "text-slate-800" : "text-slate-400"}`}>
                {b.title}
              </h3>
              <p className={`mt-1 text-xs font-bold transition-opacity ${earned ? "text-slate-400" : "text-slate-300 opacity-0"}`}>
                {b.date}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

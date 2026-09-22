"use client";

// Standalone showcase of the animated "squarical" XP medal artwork (SVG only).
// Rounded-rect plates with native SVG <animate> tags: a floating emblem, a
// pulsing glow, a sweeping glass reflection, and a marching dashed track.
//
// Rendered as React JSX (SVG <animate>/<animateTransform> elements run via
// SMIL) — no string generator, no app logic (sound / toasts / slider /
// customizer / copy / download) from the original sandbox. Elements centered.

import { useState, type ReactNode } from "react";

type Tier = {
  name: string;
  bgStart: string;
  bgEnd: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  metal: string[];
};

const TIERS: Record<string, Tier> = {
  copper: { name: "Rustic Copper", bgStart: "#2A1313", bgEnd: "#0F0505", primary: "#E11D48", secondary: "#FDA4AF", accent: "#FFE4E6", glow: "#E11D48", metal: ["#9F1239", "#FB7185", "#9F1239"] },
  bronze: { name: "Antique Bronze", bgStart: "#2A1A05", bgEnd: "#0F0800", primary: "#D97706", secondary: "#FDBA74", accent: "#FFEDD5", glow: "#D97706", metal: ["#78350F", "#FBBF24", "#78350F"] },
  silver: { name: "Reflective Chrome", bgStart: "#1E293B", bgEnd: "#020617", primary: "#94A3B8", secondary: "#F1F5F9", accent: "#FFFFFF", glow: "#94A3B8", metal: ["#475569", "#E2E8F0", "#475569"] },
  gold: { name: "Satin Royal Gold", bgStart: "#3F2C00", bgEnd: "#140E00", primary: "#EAB308", secondary: "#FEF08A", accent: "#FFFFFF", glow: "#EAB308", metal: ["#854D0E", "#FDE047", "#854D0E"] },
  emerald: { name: "Imperial Jade", bgStart: "#064E3B", bgEnd: "#022C22", primary: "#10B981", secondary: "#6EE7B7", accent: "#A7F3D0", glow: "#10B981", metal: ["#047857", "#34D399", "#047857"] },
  platinum: { name: "Holographic Teal", bgStart: "#0D3B3F", bgEnd: "#041E20", primary: "#14B8A6", secondary: "#99F6E4", accent: "#CCFBF1", glow: "#14B8A6", metal: ["#0F766E", "#5EEAD4", "#0F766E"] },
  amethyst: { name: "Vibrant Amethyst", bgStart: "#2E1065", bgEnd: "#170536", primary: "#A855F7", secondary: "#D8B4FE", accent: "#F3E8FF", glow: "#A855F7", metal: ["#6B21A8", "#C084FC", "#6B21A8"] },
  ruby: { name: "Molten Ruby", bgStart: "#4C0519", bgEnd: "#25010B", primary: "#F43F5E", secondary: "#FDA4AF", accent: "#FFE4E6", glow: "#F43F5E", metal: ["#9F1239", "#FB7185", "#9F1239"] },
  cosmic: { name: "Nebula Constellation", bgStart: "#3B0764", bgEnd: "#0F052D", primary: "#EC4899", secondary: "#F472B6", accent: "#FDF2F8", glow: "#EC4899", metal: ["#86198F", "#F472B6", "#86198F"] },
  locked: { name: "Dark Steel", bgStart: "#0F172A", bgEnd: "#020617", primary: "#334155", secondary: "#64748B", accent: "#94A3B8", glow: "#000000", metal: ["#1E293B", "#475569", "#1E293B"] },
};

const PREMIUM_EMBLEMS: Record<string, (color: string) => ReactNode> = {
  ruler: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="1,3" opacity="0.4" />
      <g transform="rotate(-15 20 20)">
        <rect x="4" y="13" width="32" height="12" rx="1.5" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="5.5" y="14.5" width="29" height="9" fill="#020617" opacity="0.85" />
        <line x1="8" y1="13" x2="8" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="16" y1="13" x2="16" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="24" y1="13" x2="24" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="32" y1="13" x2="32" y2="18" stroke={color} strokeWidth="1.5" />
      </g>
    </g>
  ),
  gears: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <g style={{ transformOrigin: "20px 20px" }}>
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="15s" repeatCount="indefinite" />
        <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="3" />
        <circle cx="20" cy="20" r="5" fill="#020617" stroke={color} strokeWidth="1.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path key={angle} d="M 18,6 L 22,6 L 23,11 L 17,11 Z" fill={color} transform={`rotate(${angle} 20 20)`} />
        ))}
      </g>
    </g>
  ),
  lightning: (color) => (
    <g transform="translate(20, 54) scale(1.15)">
      <g>
        <animateTransform attributeName="transform" type="scale" values="1; 1.05; 1" dur="2s" repeatCount="indefinite" additive="sum" />
        <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="bevel" />
        <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill={color} opacity="0.3" />
        <path d="M21.5 4 L11 20.5 L19.5 20.5 L15.5 35 L28.5 17 L18.5 17 Z" fill="#FFFFFF" opacity="0.95" />
      </g>
    </g>
  ),
  target: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="1.8" />
      <circle cx="20" cy="20" r="11" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3,2">
        <animateTransform attributeName="transform" type="rotate" from="360 20 20" to="0 20 20" dur="10s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="20" r="5" fill={color} />
      <line x1="20" y1="1" x2="20" y2="6" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="34" x2="20" y2="39" stroke={color} strokeWidth="1.5" />
      <line x1="1" y1="20" x2="6" y2="20" stroke={color} strokeWidth="1.5" />
      <line x1="34" y1="20" x2="39" y2="20" stroke={color} strokeWidth="1.5" />
    </g>
  ),
  shield: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <path d="M6 6 C16 4, 24 4, 34 6 C34 18, 30 28, 20 36 C10 28, 6 18, 6 6 Z" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M9 8 C17 6.5, 23 6.5, 31 8 C31 17, 28 26, 20 33 C12 26, 9 17, 9 8 Z" fill={color} opacity="0.35" />
      <polygon points="20,11 26,17 20,23 14,17" fill="none" stroke={color} strokeWidth="1.5" />
    </g>
  ),
  compass: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="2.5" />
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 20 20; 45 20 20; 15 20 20; 90 20 20; 0 20 20" dur="8s" repeatCount="indefinite" />
        <polygon points="20,5 24,20 20,17" fill={color} />
        <polygon points="20,5 16,20 20,17" fill="#FFFFFF" opacity="0.75" />
        <polygon points="20,35 24,20 20,23" fill="#020617" stroke={color} strokeWidth="0.5" />
      </g>
      <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" stroke={color} strokeWidth="1" />
    </g>
  ),
  flame: (color) => (
    <g transform="translate(20, 53) scale(1.15)">
      <g>
        <animateTransform attributeName="transform" type="scale" values="1; 1.05; 1" dur="1.5s" repeatCount="indefinite" additive="sum" />
        <path d="M20 2 C20 2, 6 16, 6 27 C6 34, 12 39, 20 39 C28 39, 34 34, 34 27 C34 16, 20 2, 20 2 Z" fill="none" stroke={color} strokeWidth="2.5" />
        <path d="M20 8 C20 8, 9 20, 9 27 C9 32, 14 36, 20 36 C26 36, 31 32, 31 27 C31 20, 20 8, 20 8 Z" fill={color} opacity="0.5" />
        <path d="M20 16 C20 16, 13 23, 13 27 C13 30, 16 33, 20 33 C24 33, 27 30, 27 27 C27 23, 20 16, 20 16 Z" fill="#FFFFFF" opacity="0.9" />
      </g>
    </g>
  ),
  moon: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <path d="M12 20 C12 29, 19 36, 28 36 C31.5 36, 34.8 34.8, 37.5 32.5 C26.5 32.5 17.5 24 17.5 13 C17.5 10, 18.8 7.2 21 5 C15.5 8, 12 13.5, 12 20 Z" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M12 20 C12 29, 19 36, 28 36 C31.5 36, 34.8 34.8, 37.5 32.5 C26.5 32.5 17.5 24 17.5 13 C17.5 10, 18.8 7.2 21 5 C15.5 8, 12 13.5, 12 20 Z" fill={color} opacity="0.35" />
      <polygon points="31,8 33,12 37,12 34,14 35,18 31,16">
        <animate attributeName="opacity" values="0.2; 1; 0.2" dur="3s" repeatCount="indefinite" />
      </polygon>
    </g>
  ),
  crown: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <polygon points="6,31 34,31 34,17 27,24 20,9 13,24 6,17" fill="none" stroke={color} strokeWidth="2.5" />
      <polygon points="6,31 34,31 34,17 27,24 20,9 13,24 6,17" fill={color} opacity="0.4" />
      <rect x="10" y="27" width="20" height="4" rx="1" fill="#020617" stroke={color} strokeWidth="1.5" />
    </g>
  ),
  trophy: (color) => (
    <g transform="translate(20, 55) scale(1.15)">
      <path d="M 9,13 C 4,13 4,21 9,21" fill="none" stroke={color} strokeWidth="2" />
      <path d="M 31,13 C 36,13 36,21 31,21" fill="none" stroke={color} strokeWidth="2" />
      <path d="M 9,9 L 31,9 L 29,23 C 27,28 13,28 11,23 Z" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M 9,9 L 31,9 L 29,23 C 27,28 13,28 11,23 Z" fill={color} opacity="0.35" />
      <line x1="20" y1="25" x2="20" y2="31" stroke={color} strokeWidth="4" />
      <rect x="12" y="31" width="16" height="4" rx="1.5" fill="#020617" stroke={color} strokeWidth="2" />
      <polygon points="20,12 21.5,15 25,15.5 22.5,18 23,21.5 20,20 17,21.5 17.5,18 15,15.5 18.5,15" fill="#FFFFFF">
        <animate attributeName="opacity" values="0.4; 1; 0.4" dur="2s" repeatCount="indefinite" />
      </polygon>
    </g>
  ),
  rocket: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="1s" repeatCount="indefinite" />
        <path d="M 16,30 L 20,38 L 24,30 Z" fill="#EF4444">
          <animate attributeName="opacity" values="0.5; 1; 0.5" dur="0.2s" repeatCount="indefinite" />
        </path>
        <path d="M 20,4 C 20,4 28,10 28,24 L 28,30 L 12,30 L 12,24 C 12,10 20,4 20,4 Z" fill="none" stroke={color} strokeWidth="2.5" />
        <path d="M 20,4 C 20,4 28,10 28,24 L 28,30 L 12,30 L 12,24 C 12,10 20,4 20,4 Z" fill={color} opacity="0.4" />
        <circle cx="20" cy="18" r="4" fill="#FFFFFF" stroke={color} strokeWidth="1.5" />
      </g>
    </g>
  ),
  diamond: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <polygon points="20,4 36,16 20,36 4,16" fill="none" stroke={color} strokeWidth="2.5" />
      <polygon points="20,4 36,16 20,36 4,16" fill={color} opacity="0.3" />
      <line x1="20" y1="4" x2="20" y2="36" stroke={color} strokeWidth="1" />
      <line x1="4" y1="16" x2="36" y2="16" stroke={color} strokeWidth="1" />
      <polygon points="20,4 28,16 20,16" fill="#FFFFFF" opacity="0.4">
        <animate attributeName="opacity" values="0; 0.8; 0" dur="3s" repeatCount="indefinite" />
      </polygon>
    </g>
  ),
  infinity: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <path d="M13 25 C6 18, 6 32, 13 25 C20 18, 20 32, 27 25 C34 18, 34 32, 27 25 C20 18, 20 32, 13 25 Z" fill="none" stroke={color} strokeWidth="3" />
      <path d="M13 25 C6 18, 6 32, 13 25 C20 18, 20 32, 27 25 C34 18, 34 32, 27 25 C20 18, 20 32, 13 25 Z" fill={color} opacity="0.35" />
      <circle cx="13" cy="25" r="2" fill="#FFFFFF">
        <animate attributeName="r" values="1.5; 3; 1.5" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="27" cy="25" r="2" fill="#FFFFFF">
        <animate attributeName="r" values="3; 1.5; 3" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  ),
  sun: (color) => (
    <g transform="translate(20, 56) scale(1.15)">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="20s" repeatCount="indefinite" />
        <circle cx="20" cy="20" r="9" fill="none" stroke={color} strokeWidth="3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path key={angle} d="M 20,3 L 22,10 L 18,10 Z" fill={color} transform={`rotate(${angle} 20 20)`} />
        ))}
      </g>
    </g>
  ),
};

type Milestone = { id: string; xp: number; name: string; tier: string; icon: string; desc: string; tag: string };

const XP_MILESTONES: Milestone[] = [
  { id: "xp10", xp: 10, name: "Architect Rule", tier: "copper", icon: "ruler", desc: "Precision mapping for basic concepts.", tag: "10 XP" },
  { id: "xp25", xp: 25, name: "Active Gears", tier: "copper", icon: "gears", desc: "Starting the engine of learning.", tag: "25 XP" },
  { id: "xp50", xp: 50, name: "Spark Streak", tier: "bronze", icon: "lightning", desc: "Building early momentum sparks.", tag: "50 XP" },
  { id: "xp100", xp: 100, name: "Bullseye Core", tier: "bronze", icon: "target", desc: "Hitting your first major targets.", tag: "100 XP" },
  { id: "xp200", xp: 200, name: "Shield Array", tier: "silver", icon: "shield", desc: "Defending your knowledge base.", tag: "200 XP" },
  { id: "xp400", xp: 400, name: "Map Pathfinder", tier: "silver", icon: "compass", desc: "Charting intermediate territories.", tag: "400 XP" },
  { id: "xp700", xp: 700, name: "High Volts", tier: "silver", icon: "lightning", desc: "Sustaining high energy inputs.", tag: "700 XP" },
  { id: "xp1000", xp: 1000, name: "Bronze Hearth", tier: "gold", icon: "flame", desc: "Igniting the passion for mastery.", tag: "1000 XP" },
  { id: "xp1500", xp: 1500, name: "Crescent Crest", tier: "gold", icon: "moon", desc: "Completing full lunar cycles of work.", tag: "1500 XP" },
  { id: "xp2000", xp: 2000, name: "Sovereign Crown", tier: "gold", icon: "crown", desc: "Establishing total dominion over basics.", tag: "2000 XP" },
  { id: "xp2500", xp: 2500, name: "Blazing Star", tier: "emerald", icon: "flame", desc: "Achieving a brilliant 2500 XP streak.", tag: "2500 XP" },
  { id: "xp3000", xp: 3000, name: "Apex Triumph", tier: "emerald", icon: "trophy", desc: "Taking the podium for high effort.", tag: "3000 XP" },
  { id: "xp3500", xp: 3500, name: "Astral Orbit", tier: "platinum", icon: "rocket", desc: "Escaping standard gravity restraints.", tag: "3500 XP" },
  { id: "xp4000", xp: 4000, name: "Prism Matrix", tier: "platinum", icon: "diamond", desc: "Crystallizing advanced knowledge.", tag: "4000 XP" },
  { id: "xp4500", xp: 4500, name: "Infinite Nexus", tier: "amethyst", icon: "infinity", desc: "Entering continuous learning loops.", tag: "4500 XP" },
  { id: "xp10000", xp: 10000, name: "Solar Supernova", tier: "cosmic", icon: "sun", desc: "The ultimate solar 10,000 XP flare.", tag: "10,000 XP" },
];

function ForgeBadge({
  xp,
  name,
  tier,
  iconKey,
  isLocked,
  shadowBlur = 4,
  borderWidth = 3.5,
  customTitle = "",
}: {
  xp: number;
  name: string;
  tier: string;
  iconKey: string;
  isLocked: boolean;
  shadowBlur?: number;
  borderWidth?: number;
  customTitle?: string;
}) {
  const theme = isLocked ? TIERS.locked : TIERS[tier];
  const title = customTitle || name || `XP ${xp}`;
  const uid = `${tier}_${isLocked ? "l" : "e"}_${xp}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 150"
      className="h-full w-full transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-110"
    >
      <defs>
        <linearGradient id={`bg_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.bgStart} />
          <stop offset="100%" stopColor={theme.bgEnd} />
        </linearGradient>
        <linearGradient id={`border_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          {theme.metal.map((c, i) => (
            <stop key={i} offset={`${(i / (theme.metal.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`gloss_${uid}`} x1="-50%" y1="-50%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
          <animate attributeName="x1" values="-50%; 150%" dur="3s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0%; 200%" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y1" values="-50%; 150%" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y2" values="0%; 200%" dur="3s" repeatCount="indefinite" />
        </linearGradient>
        <filter id={`glow_${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation={shadowBlur} floodColor={theme.glow} floodOpacity="0.8">
            {!isLocked && (
              <animate attributeName="stdDeviation" values={`${shadowBlur}; ${shadowBlur + 4}; ${shadowBlur}`} dur="2s" repeatCount="indefinite" />
            )}
          </feDropShadow>
        </filter>
      </defs>

      {/* Base plate */}
      <rect x="12" y="15" width="96" height="120" rx="24" fill={`url(#bg_${uid})`} stroke={`url(#border_${uid})`} strokeWidth={borderWidth} filter={`url(#glow_${uid})`} />

      {/* Inner track */}
      {isLocked ? (
        <rect x="18" y="21" width="84" height="108" rx="18" fill="none" stroke={theme.primary} strokeWidth="1" opacity="0.3" />
      ) : (
        <rect x="18" y="21" width="84" height="108" rx="18" fill="none" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.6">
          <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Header pill */}
      <rect x="24" y="26" width="72" height="20" rx="10" fill="#000000" opacity="0.4" />
      <rect x="24" y="26" width="72" height="20" rx="10" fill="none" stroke={`url(#border_${uid})`} strokeWidth="1.5" />
      <text x="60" y="40" fontFamily="-apple-system, system-ui, sans-serif" fontSize="9" fontWeight="900" letterSpacing="1" fill={theme.accent} textAnchor="middle">
        {title.toUpperCase()}
      </text>

      {/* Floating emblem */}
      <g>
        {!isLocked && (
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite" />
        )}
        {isLocked ? (
          <g transform="translate(46, 68) scale(1.35)" opacity="0.6">
            <path d="M 12,15 L 12,18" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" />
            <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke={theme.accent} strokeWidth="2" />
            <path d="M 7,10 L 7,6 C 7,3.5 9,2 12,2 C 15,2 17,3.5 17,6 L 17,10" fill="none" stroke={theme.accent} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ) : (
          (PREMIUM_EMBLEMS[iconKey] ?? PREMIUM_EMBLEMS.flame)(theme.secondary)
        )}
      </g>

      {/* Sweeping gloss */}
      <rect x="12" y="15" width="96" height="120" rx="24" fill={`url(#gloss_${uid})`} style={{ pointerEvents: "none" }} />
    </svg>
  );
}

export default function BadgeForge() {
  const [locked, setLocked] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050508] px-6 py-12 font-sans text-slate-200">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-teal-600/10 blur-[120px]" />

      {/* Everything centered */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center">
        <header className="mb-10 flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Squarical UI Forge</h1>
          <p className="max-w-xl text-sm text-slate-400">
            Animated rounded-plate XP medals — floating emblems, pulsing glow, and a sweeping glass shine across every tier.
          </p>
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 text-xs font-black">
            <button onClick={() => setLocked(false)} className={`rounded-xl px-4 py-2 transition-colors ${!locked ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}>
              Earned
            </button>
            <button onClick={() => setLocked(true)} className={`rounded-xl px-4 py-2 transition-colors ${locked ? "bg-rose-500 text-white" : "text-slate-400 hover:text-white"}`}>
              Locked
            </button>
          </div>
        </header>

        <div className="grid w-full grid-cols-2 justify-items-center gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {XP_MILESTONES.map((badge) => (
            <div key={badge.id} className="group flex w-full flex-col items-center gap-3 rounded-3xl border border-white/5 bg-black/40 p-5 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/5">
              <div className="flex h-40 w-32 items-center justify-center">
                <ForgeBadge xp={badge.xp} name={badge.name} tier={badge.tier} iconKey={badge.icon} isLocked={locked} customTitle={badge.tag} />
              </div>
              <div className="text-center">
                <h4 className="text-[11px] font-black leading-tight tracking-tight text-white">{badge.name}</h4>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {badge.tier} • {badge.xp} XP
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

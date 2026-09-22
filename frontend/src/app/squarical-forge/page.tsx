"use client";

// TEMPORARY showcase route — "Squarical UI Forge".
// A self-contained sandbox for the animated squarical XP-milestone badges:
// a showcase grid with an XP slider + earned/locked toggle, plus a builder
// tab to customize colour / motif / shadow and copy or download the raw
// animated SVG. Self-contained; delete when done reviewing.
//
// Port notes vs. the original sandbox:
//  - No ReactDOM mounting — Next renders the page.
//  - The emblems are SVG-STRING generators (not JSX) so they actually embed
//    inside the generated markup. In the original they returned React
//    elements interpolated into a template string (→ "[object Object]"),
//    so no emblem ever rendered inside the badge.

import { useState } from "react";

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

type Milestone = {
  id: string;
  xp: number;
  name: string;
  tier: string;
  icon: string;
  desc: string;
  tag: string;
};

type LockMode = "dynamic" | "earned" | "unearned";

// Ultra-premium tier definitions with vibrant neon contrasts
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

// Intricate internal graphics designed for floating animation. Each returns a
// raw SVG-markup string so it can be embedded into the generated badge markup.
const PREMIUM_EMBLEMS: Record<string, (color: string) => string> = {
  ruler: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="0.5" stroke-dasharray="1,3" opacity="0.4" />
    <g transform="rotate(-15 20 20)">
      <rect x="4" y="13" width="32" height="12" rx="1.5" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="5.5" y="14.5" width="29" height="9" fill="#020617" opacity="0.85" />
      <line x1="8" y1="13" x2="8" y2="18" stroke="${color}" stroke-width="1.5" />
      <line x1="16" y1="13" x2="16" y2="18" stroke="${color}" stroke-width="1.5" />
      <line x1="24" y1="13" x2="24" y2="18" stroke="${color}" stroke-width="1.5" />
      <line x1="32" y1="13" x2="32" y2="18" stroke="${color}" stroke-width="1.5" />
    </g>
  </g>`,
  gears: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <g style="transform-origin: 20px 20px">
      <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="15s" repeatCount="indefinite" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="${color}" stroke-width="3" />
      <circle cx="20" cy="20" r="5" fill="#020617" stroke="${color}" stroke-width="1.5" />
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => `<path d="M 18,6 L 22,6 L 23,11 L 17,11 Z" fill="${color}" transform="rotate(${angle} 20 20)" />`).join("")}
    </g>
  </g>`,
  lightning: (color) => `<g transform="translate(20, 54) scale(1.15)">
    <g>
      <animateTransform attributeName="transform" type="scale" values="1; 1.05; 1" dur="2s" repeatCount="indefinite" additive="sum" />
      <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="bevel" />
      <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill="${color}" opacity="0.3" />
      <path d="M21.5 4 L11 20.5 L19.5 20.5 L15.5 35 L28.5 17 L18.5 17 Z" fill="#FFFFFF" opacity="0.95" />
    </g>
  </g>`,
  target: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="1.8" />
    <circle cx="20" cy="20" r="11" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3,2">
      <animateTransform attributeName="transform" type="rotate" from="360 20 20" to="0 20 20" dur="10s" repeatCount="indefinite" />
    </circle>
    <circle cx="20" cy="20" r="5" fill="${color}" />
    <line x1="20" y1="1" x2="20" y2="6" stroke="${color}" stroke-width="1.5" />
    <line x1="20" y1="34" x2="20" y2="39" stroke="${color}" stroke-width="1.5" />
    <line x1="1" y1="20" x2="6" y2="20" stroke="${color}" stroke-width="1.5" />
    <line x1="34" y1="20" x2="39" y2="20" stroke="${color}" stroke-width="1.5" />
  </g>`,
  shield: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <path d="M6 6 C16 4, 24 4, 34 6 C34 18, 30 28, 20 36 C10 28, 6 18, 6 6 Z" fill="none" stroke="${color}" stroke-width="2.5" />
    <path d="M9 8 C17 6.5, 23 6.5, 31 8 C31 17, 28 26, 20 33 C12 26, 9 17, 9 8 Z" fill="${color}" opacity="0.35" />
    <polygon points="20,11 26,17 20,23 14,17" fill="none" stroke="${color}" stroke-width="1.5" />
  </g>`,
  compass: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="2.5" />
    <g>
      <animateTransform attributeName="transform" type="rotate" values="0 20 20; 45 20 20; 15 20 20; 90 20 20; 0 20 20" dur="8s" repeatCount="indefinite" />
      <polygon points="20,5 24,20 20,17" fill="${color}" />
      <polygon points="20,5 16,20 20,17" fill="#FFFFFF" opacity="0.75" />
      <polygon points="20,35 24,20 20,23" fill="#020617" stroke="${color}" stroke-width="0.5" />
    </g>
    <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" stroke="${color}" stroke-width="1" />
  </g>`,
  flame: (color) => `<g transform="translate(20, 53) scale(1.15)">
    <g>
      <animateTransform attributeName="transform" type="scale" values="1; 1.05; 1" dur="1.5s" repeatCount="indefinite" additive="sum" />
      <path d="M20 2 C20 2, 6 16, 6 27 C6 34, 12 39, 20 39 C28 39, 34 34, 34 27 C34 16, 20 2, 20 2 Z" fill="none" stroke="${color}" stroke-width="2.5" />
      <path d="M20 8 C20 8, 9 20, 9 27 C9 32, 14 36, 20 36 C26 36, 31 32, 31 27 C31 20, 20 8, 20 8 Z" fill="${color}" opacity="0.5" />
      <path d="M20 16 C20 16, 13 23, 13 27 C13 30, 16 33, 20 33 C24 33, 27 30, 27 27 C27 23, 20 16, 20 16 Z" fill="#FFFFFF" opacity="0.9" />
    </g>
  </g>`,
  moon: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <path d="M12 20 C12 29, 19 36, 28 36 C31.5 36, 34.8 34.8, 37.5 32.5 C26.5 32.5 17.5 24 17.5 13 C17.5 10, 18.8 7.2 21 5 C15.5 8, 12 13.5, 12 20 Z" fill="none" stroke="${color}" stroke-width="2.5" />
    <path d="M12 20 C12 29, 19 36, 28 36 C31.5 36, 34.8 34.8, 37.5 32.5 C26.5 32.5 17.5 24 17.5 13 C17.5 10, 18.8 7.2 21 5 C15.5 8, 12 13.5, 12 20 Z" fill="${color}" opacity="0.35" />
    <polygon points="31,8 33,12 37,12 34,14 35,18 31,16">
      <animate attributeName="opacity" values="0.2; 1; 0.2" dur="3s" repeatCount="indefinite" />
    </polygon>
  </g>`,
  crown: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <polygon points="6,31 34,31 34,17 27,24 20,9 13,24 6,17" fill="none" stroke="${color}" stroke-width="2.5" />
    <polygon points="6,31 34,31 34,17 27,24 20,9 13,24 6,17" fill="${color}" opacity="0.4" />
    <rect x="10" y="27" width="20" height="4" rx="1" fill="#020617" stroke="${color}" stroke-width="1.5" />
  </g>`,
  trophy: (color) => `<g transform="translate(20, 55) scale(1.15)">
    <path d="M 9,13 C 4,13 4,21 9,21" fill="none" stroke="${color}" stroke-width="2" />
    <path d="M 31,13 C 36,13 36,21 31,21" fill="none" stroke="${color}" stroke-width="2" />
    <path d="M 9,9 L 31,9 L 29,23 C 27,28 13,28 11,23 Z" fill="none" stroke="${color}" stroke-width="2.5" />
    <path d="M 9,9 L 31,9 L 29,23 C 27,28 13,28 11,23 Z" fill="${color}" opacity="0.35" />
    <line x1="20" y1="25" x2="20" y2="31" stroke="${color}" stroke-width="4" />
    <rect x="12" y="31" width="16" height="4" rx="1.5" fill="#020617" stroke="${color}" stroke-width="2" />
    <polygon points="20,12 21.5,15 25,15.5 22.5,18 23,21.5 20,20 17,21.5 17.5,18 15,15.5 18.5,15" fill="#FFFFFF">
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="2s" repeatCount="indefinite" />
    </polygon>
  </g>`,
  rocket: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="1s" repeatCount="indefinite" />
      <path d="M 16,30 L 20,38 L 24,30 Z" fill="#EF4444">
        <animate attributeName="opacity" values="0.5; 1; 0.5" dur="0.2s" repeatCount="indefinite" />
      </path>
      <path d="M 20,4 C 20,4 28,10 28,24 L 28,30 L 12,30 L 12,24 C 12,10 20,4 20,4 Z" fill="none" stroke="${color}" stroke-width="2.5" />
      <path d="M 20,4 C 20,4 28,10 28,24 L 28,30 L 12,30 L 12,24 C 12,10 20,4 20,4 Z" fill="${color}" opacity="0.4" />
      <circle cx="20" cy="18" r="4" fill="#FFFFFF" stroke="${color}" stroke-width="1.5" />
    </g>
  </g>`,
  diamond: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <polygon points="20,4 36,16 20,36 4,16" fill="none" stroke="${color}" stroke-width="2.5" />
    <polygon points="20,4 36,16 20,36 4,16" fill="${color}" opacity="0.3" />
    <line x1="20" y1="4" x2="20" y2="36" stroke="${color}" stroke-width="1" />
    <line x1="4" y1="16" x2="36" y2="16" stroke="${color}" stroke-width="1" />
    <polygon points="20,4 28,16 20,16" fill="#FFFFFF" opacity="0.4">
      <animate attributeName="opacity" values="0; 0.8; 0" dur="3s" repeatCount="indefinite" />
    </polygon>
  </g>`,
  infinity: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <path d="M13 25 C6 18, 6 32, 13 25 C20 18, 20 32, 27 25 C34 18, 34 32, 27 25 C20 18, 20 32, 13 25 Z" fill="none" stroke="${color}" stroke-width="3" />
    <path d="M13 25 C6 18, 6 32, 13 25 C20 18, 20 32, 27 25 C34 18, 34 32, 27 25 C20 18, 20 32, 13 25 Z" fill="${color}" opacity="0.35" />
    <circle cx="13" cy="25" r="2" fill="#FFFFFF">
      <animate attributeName="r" values="1.5; 3; 1.5" dur="1s" repeatCount="indefinite" />
    </circle>
    <circle cx="27" cy="25" r="2" fill="#FFFFFF">
      <animate attributeName="r" values="3; 1.5; 3" dur="1s" repeatCount="indefinite" />
    </circle>
  </g>`,
  sun: (color) => `<g transform="translate(20, 56) scale(1.15)">
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="20s" repeatCount="indefinite" />
      <circle cx="20" cy="20" r="9" fill="none" stroke="${color}" stroke-width="3" />
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => `<path d="M 20,3 L 22,10 L 18,10 Z" fill="${color}" transform="rotate(${angle} 20 20)" />`).join("")}
    </g>
  </g>`,
};

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

const playSoundFeedback = (soundType: "unlock" | "interact") => {
  try {
    const AudioCtor: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    if (soundType === "unlock") {
      [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.35);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch {
    /* audio is best-effort */
  }
};

type SvgOpts = {
  headerText: string;
  tierKey: string;
  iconKey: string;
  isLocked: boolean;
  shadowBlur: number;
  borderWidth: number;
  customTitle?: string;
};

// Generates the raw SVG. Incorporates squarical rounded corners and native
// <animate> tags so the badge animates on its own without JS.
const generatePureSVGMarkup = ({ headerText, tierKey, iconKey, isLocked, shadowBlur, borderWidth, customTitle }: SvgOpts): string => {
  const theme = isLocked ? TIERS.locked : TIERS[tierKey] ?? TIERS.locked;
  const title = customTitle || headerText;
  const iconColor = theme.secondary;
  const id = `svg_${tierKey}_${isLocked ? "l" : "e"}_${Math.random().toString(36).substr(2, 5)}`;

  const metalStops = theme.metal
    .map((c, i) => `<stop offset="${(i / (theme.metal.length - 1)) * 100}%" stop-color="${c}" />`)
    .join("");

  const emblem = PREMIUM_EMBLEMS[iconKey] ? PREMIUM_EMBLEMS[iconKey](iconColor) : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" width="100%" height="100%">
  <defs>
    <!-- Deep Body Gradient -->
    <linearGradient id="bg_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgStart}" />
      <stop offset="100%" stop-color="${theme.bgEnd}" />
    </linearGradient>

    <!-- Metallic Border Gradient -->
    <linearGradient id="border_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      ${metalStops}
    </linearGradient>

    <!-- Glass Reflection Gradient with native SVG sweep animation -->
    <linearGradient id="gloss_${id}" x1="-50%" y1="-50%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FFF" stop-opacity="0" />
      <stop offset="50%" stop-color="#FFF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#FFF" stop-opacity="0" />
      <animate attributeName="x1" values="-50%; 150%" dur="3s" repeatCount="indefinite" />
      <animate attributeName="x2" values="0%; 200%" dur="3s" repeatCount="indefinite" />
      <animate attributeName="y1" values="-50%; 150%" dur="3s" repeatCount="indefinite" />
      <animate attributeName="y2" values="0%; 200%" dur="3s" repeatCount="indefinite" />
    </linearGradient>

    <!-- Glow DropShadow -->
    <filter id="glow_${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="${shadowBlur}" flood-color="${theme.glow}" flood-opacity="0.8">
        ${!isLocked ? `<animate attributeName="stdDeviation" values="${shadowBlur}; ${shadowBlur + 4}; ${shadowBlur}" dur="2s" repeatCount="indefinite" />` : ""}
      </feDropShadow>
    </filter>
  </defs>

  <!-- Base Squarical Plate (Rounded Rectangle) -->
  <rect x="12" y="15" width="96" height="120" rx="24" fill="url(#bg_${id})" stroke="url(#border_${id})" stroke-width="${borderWidth}" filter="url(#glow_${id})" />

  <!-- Inner Animated High-Tech Track -->
  ${
    !isLocked
      ? `<rect x="18" y="21" width="84" height="108" rx="18" fill="none" stroke="${theme.primary}" stroke-width="1" stroke-dasharray="8 8" opacity="0.6">
    <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="2s" repeatCount="indefinite" />
  </rect>`
      : `<rect x="18" y="21" width="84" height="108" rx="18" fill="none" stroke="${theme.primary}" stroke-width="1" opacity="0.3" />`
  }

  <!-- Header Pill Background -->
  <rect x="24" y="26" width="72" height="20" rx="10" fill="#000000" opacity="0.4" />
  <rect x="24" y="26" width="72" height="20" rx="10" fill="none" stroke="url(#border_${id})" stroke-width="1.5" />

  <!-- Crisp Typography -->
  <text x="60" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="9" font-weight="900" letter-spacing="1" fill="${theme.accent}" text-anchor="middle">
    ${title.toUpperCase()}
  </text>

  <!-- Core Graphic Emblem (Floating Logic included via <animateTransform>) -->
  <g>
    ${!isLocked ? `<animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite" />` : ""}
    ${
      isLocked
        ? `<g transform="translate(46, 68) scale(1.35)" opacity="0.6">
        <path d="M 12,15 L 12,18" stroke="${theme.accent}" stroke-width="1.5" stroke-linecap="round" />
        <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="${theme.accent}" stroke-width="2" />
        <path d="M 7,10 L 7,6 C 7,3.5 9,2 12,2 C 15,2 17,3.5 17,6 L 17,10" fill="none" stroke="${theme.accent}" stroke-width="1.8" stroke-linecap="round" />
      </g>`
        : emblem
    }
  </g>

  <!-- Sweeping Glass Overlay Reflection -->
  <rect x="12" y="15" width="96" height="120" rx="24" fill="url(#gloss_${id})" style="pointer-events: none;" />
</svg>`;
};

type BadgeProps = {
  xp: number;
  name: string;
  tier: string;
  iconKey: string;
  isLocked: boolean;
  shadowBlur?: number;
  borderWidth?: number;
  customTitle?: string;
};

// Wraps the raw SVG generator inside React via dangerouslySetInnerHTML so the
// native <animate> tags play flawlessly.
const RenderInteractiveBadge = ({ xp, name, tier, iconKey, isLocked, shadowBlur = 4, borderWidth = 3.5, customTitle = "" }: BadgeProps) => {
  const markup = generatePureSVGMarkup({
    headerText: name || `XP ${xp}`,
    tierKey: tier,
    iconKey,
    isLocked,
    shadowBlur,
    borderWidth,
    customTitle,
  });
  return (
    <div
      className="relative group w-full h-full transform transition-transform duration-500 hover:scale-110 hover:-translate-y-2 cursor-pointer"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
};

export default function SquaricalForgePage() {
  const [globalLock, setGlobalLock] = useState<LockMode>("dynamic");
  const [userXP, setUserXP] = useState(2500);
  const [selectedBadge, setSelectedBadge] = useState<Milestone>(XP_MILESTONES[10]);
  const [activeTab, setActiveTab] = useState<"showcase" | "builder">("showcase");
  const [soundEnabled] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  // Customizer State
  const [cText, setCText] = useState("XP 5000");
  const [cXP, setCXP] = useState(5000);
  const [cTheme, setCTheme] = useState("gold");
  const [cIcon, setCIcon] = useState("flame");
  const [cShadow] = useState(6);
  const [cBorder] = useState(3.5);
  const [cLocked, setCLocked] = useState(false);

  const triggerAudio = (type: "unlock" | "interact") => soundEnabled && playSoundFeedback(type);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const isBadgeLocked = (badge: Milestone) => {
    if (globalLock === "earned") return false;
    if (globalLock === "unearned") return true;
    return userXP < badge.xp;
  };

  const executeCopy = (markup: string) => {
    try {
      const el = document.createElement("textarea");
      el.value = markup;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("✨ SVG copied to Clipboard!");
      triggerAudio("unlock");
    } catch {
      showToast("Copy failed.");
    }
  };

  const executeDownload = (markup: string, filename: string) => {
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("💾 SVG Downloaded!");
    triggerAudio("unlock");
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans selection:bg-rose-500 selection:text-white pb-20 overflow-x-hidden">
      {/* Immersive Ambient Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Modern Glass Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-[1px] shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <div className="w-full h-full bg-[#0a0a0f] rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Squarical UI Forge</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium SVG Achievements</p>
            </div>
          </div>
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
            {(["showcase", "builder"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  triggerAudio("interact");
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 capitalize ${
                  activeTab === tab ? "bg-white/10 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {toastMsg && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div className="bg-[#0a0a0f]/90 backdrop-blur-xl border border-rose-500/50 text-rose-200 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.2)] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <p className="text-xs font-black tracking-wider">{toastMsg}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
        {activeTab === "showcase" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Glassmorphic Progress Tracker */}
              <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Live Demo Engine</h3>
                    <p className="text-3xl font-black text-white tracking-tighter mt-1">
                      {userXP.toLocaleString()} <span className="text-rose-500">XP</span>
                    </p>
                  </div>
                  <div className="flex bg-[#050508] p-1 rounded-xl border border-white/5">
                    {(["dynamic", "earned", "unearned"] as const).map((lockMode) => (
                      <button
                        key={lockMode}
                        onClick={() => {
                          setGlobalLock(lockMode);
                          triggerAudio("interact");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                          globalLock === lockMode ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {lockMode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative pt-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="10"
                    value={userXP}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      const newlyUnlocked = XP_MILESTONES.find((m) => m.xp > userXP && m.xp <= v);
                      setUserXP(v);
                      if (newlyUnlocked) {
                        triggerAudio("unlock");
                        showToast(`🎉 Unlocked: ${newlyUnlocked.name}!`);
                      }
                    }}
                    className="w-full h-3 bg-black rounded-full appearance-none cursor-pointer border border-white/10"
                    style={{ background: `linear-gradient(to right, #F43F5E ${(userXP / 10000) * 100}%, #000 0%)` }}
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-widest">
                    <button onClick={() => setUserXP(0)}>0 XP</button>
                    <button onClick={() => setUserXP(1000)}>1K</button>
                    <button onClick={() => setUserXP(3000)}>3K</button>
                    <button onClick={() => setUserXP(10000)}>10K (Max)</button>
                  </div>
                </div>
              </section>

              {/* Grid System */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {XP_MILESTONES.map((badge) => {
                  const locked = isBadgeLocked(badge);
                  const active = selectedBadge.id === badge.id;
                  return (
                    <div
                      key={badge.id}
                      onClick={() => {
                        setSelectedBadge(badge);
                        triggerAudio("interact");
                      }}
                      className={`relative p-5 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-between min-h-[220px] bg-black/40 backdrop-blur-md ${
                        active ? "border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.15)] scale-[1.02]" : "border-white/5 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="w-24 h-32 flex items-center justify-center pointer-events-none">
                        <RenderInteractiveBadge
                          xp={badge.xp}
                          name={badge.name}
                          tier={badge.tier}
                          iconKey={badge.icon}
                          isLocked={locked}
                          shadowBlur={active ? 8 : 4}
                          borderWidth={3}
                          customTitle={badge.tag}
                        />
                      </div>
                      <div className="text-center mt-3 pointer-events-none">
                        <h4 className="text-[11px] font-black text-white tracking-tight leading-tight">{badge.name}</h4>
                        <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mt-1">{badge.xp} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Exporter */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm sticky top-28">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black tracking-widest text-rose-400 uppercase">Export Output</h3>
                  <span className="text-[8px] bg-white/10 px-2 py-1 rounded-md font-bold tracking-widest uppercase">Live Vector</span>
                </div>

                <div className="bg-black/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center shadow-inner">
                  <div className="w-48 h-56">
                    <RenderInteractiveBadge
                      xp={selectedBadge.xp}
                      name={selectedBadge.name}
                      tier={selectedBadge.tier}
                      iconKey={selectedBadge.icon}
                      isLocked={isBadgeLocked(selectedBadge)}
                      shadowBlur={8}
                      borderWidth={3.5}
                      customTitle={selectedBadge.tag}
                    />
                  </div>
                  <h2 className="text-lg font-black text-white mt-5 text-center">{selectedBadge.name}</h2>
                  <p className="text-xs font-bold text-slate-400 text-center mt-2 px-2">&quot;{selectedBadge.desc}&quot;</p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        executeCopy(generatePureSVGMarkup({ headerText: selectedBadge.tag, tierKey: selectedBadge.tier, iconKey: selectedBadge.icon, isLocked: false, shadowBlur: 6, borderWidth: 3, customTitle: selectedBadge.tag }))
                      }
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    >
                      Copy Active
                    </button>
                    <button
                      onClick={() =>
                        executeCopy(generatePureSVGMarkup({ headerText: selectedBadge.tag, tierKey: selectedBadge.tier, iconKey: selectedBadge.icon, isLocked: true, shadowBlur: 6, borderWidth: 3, customTitle: selectedBadge.tag }))
                      }
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Copy Locked
                    </button>
                  </div>
                  <details className="mt-2 bg-black/40 rounded-xl border border-white/5">
                    <summary className="text-[10px] font-bold tracking-widest uppercase text-slate-400 p-4 cursor-pointer outline-none">Show Source Code</summary>
                    <pre className="text-[9px] text-rose-300 p-4 pt-0 overflow-x-auto max-h-48 font-mono">
                      {generatePureSVGMarkup({ headerText: selectedBadge.tag, tierKey: selectedBadge.tier, iconKey: selectedBadge.icon, isLocked: isBadgeLocked(selectedBadge), shadowBlur: 6, borderWidth: 3, customTitle: selectedBadge.tag })}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl font-black text-white">Laboratory Customizer</h2>
              <p className="text-xs text-slate-400 mt-1 mb-8">Design an animated squarical milestone and export directly.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pill Title</label>
                  <input
                    type="text"
                    value={cText}
                    onChange={(e) => setCText(e.target.value)}
                    maxLength={12}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Level</label>
                  <input
                    type="number"
                    value={cXP}
                    onChange={(e) => setCXP(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Color Identity</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-black p-2 rounded-2xl border border-white/5">
                    {Object.keys(TIERS)
                      .filter((k) => k !== "locked")
                      .map((key) => (
                        <button
                          key={key}
                          onClick={() => setCTheme(key)}
                          className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            cTheme === key ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vector Motif</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-black p-2 rounded-2xl border border-white/5">
                    {Object.keys(PREMIUM_EMBLEMS).map((key) => (
                      <button
                        key={key}
                        onClick={() => setCIcon(key)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          cIcon === key ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 flex items-center justify-between bg-black p-4 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-white">Preview Locked Variant</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={cLocked} onChange={(e) => setCLocked(e.target.checked)} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm sticky top-28">
                <h3 className="text-xs font-black tracking-widest text-rose-400 uppercase mb-6">Generated Render</h3>

                <div className="bg-black/50 border border-white/5 rounded-3xl p-6 flex justify-center shadow-inner">
                  <div className="w-48 h-56">
                    <RenderInteractiveBadge xp={cXP} name={cText} tier={cTheme} iconKey={cIcon} isLocked={cLocked} shadowBlur={cShadow} borderWidth={cBorder} customTitle={cText} />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => executeCopy(generatePureSVGMarkup({ headerText: cText, tierKey: cTheme, iconKey: cIcon, isLocked: cLocked, shadowBlur: cShadow, borderWidth: cBorder, customTitle: cText }))}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  >
                    Copy Source Markup
                  </button>
                  <button
                    onClick={() =>
                      executeDownload(
                        generatePureSVGMarkup({ headerText: cText, tierKey: cTheme, iconKey: cIcon, isLocked: cLocked, shadowBlur: cShadow, borderWidth: cBorder, customTitle: cText }),
                        `badge_${cText.replace(/\s+/g, "_")}.svg`,
                      )
                    }
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Download .SVG File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

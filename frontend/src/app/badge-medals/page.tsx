"use client";

// Standalone showcase of the metallic "XP Medal" badge artwork (SVG only —
// no sound / toasts / slider / search / customizer / export logic from the
// original sandbox). Just the badge graphics across every tier + milestone,
// with a simple earned/locked toggle to preview both states.

import { useState, type ReactNode } from "react";

type Tier = {
  name: string;
  headerBgStart: string;
  headerBgEnd: string;
  bodyBgStart: string;
  bodyBgEnd: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  metalStops: string[];
  text: string;
};

const TIERS: Record<string, Tier> = {
  copper: { name: "Rustic Copper", headerBgStart: "#FFE4E6", headerBgEnd: "#FECDD3", bodyBgStart: "#4C1D1D", bodyBgEnd: "#1A0505", primary: "#E11D48", secondary: "#FDA4AF", accent: "#FFE4E6", glow: "rgba(225, 29, 72, 0.5)", metalStops: ["#F43F5E", "#BE123C", "#9F1239", "#FB7185"], text: "#9F1239" },
  bronze: { name: "Antique Bronze", headerBgStart: "#FFEDD5", headerBgEnd: "#FED7AA", bodyBgStart: "#451A03", bodyBgEnd: "#170A00", primary: "#D97706", secondary: "#FDBA74", accent: "#FFEDD5", glow: "rgba(217, 119, 6, 0.55)", metalStops: ["#F59E0B", "#B45309", "#78350F", "#FBBF24"], text: "#78350F" },
  silver: { name: "Reflective Chrome", headerBgStart: "#F1F5F9", headerBgEnd: "#E2E8F0", bodyBgStart: "#1E293B", bodyBgEnd: "#0F172A", primary: "#94A3B8", secondary: "#CBD5E1", accent: "#FFFFFF", glow: "rgba(148, 163, 184, 0.45)", text: "#334155", metalStops: ["#CBD5E1", "#64748B", "#475569", "#F1F5F9"] },
  gold: { name: "Satin Royal Gold", headerBgStart: "#FEF08A", headerBgEnd: "#FDE047", bodyBgStart: "#422006", bodyBgEnd: "#1C0D02", primary: "#EAB308", secondary: "#FEF08A", accent: "#FFFFFF", glow: "rgba(234, 179, 8, 0.65)", text: "#854D0E", metalStops: ["#FACC15", "#CA8A04", "#854D0E", "#FEF08A"] },
  emerald: { name: "Imperial Jade", headerBgStart: "#DCFCE7", headerBgEnd: "#BBF7D0", bodyBgStart: "#064E3B", bodyBgEnd: "#022C22", primary: "#10B981", secondary: "#6EE7B7", accent: "#A7F3D0", glow: "rgba(16, 185, 129, 0.6)", text: "#065F46", metalStops: ["#34D399", "#047857", "#064E3B", "#D1FAE5"] },
  platinum: { name: "Holographic Teal", headerBgStart: "#CCFBF1", headerBgEnd: "#99F6E4", bodyBgStart: "#115E59", bodyBgEnd: "#042F2E", primary: "#14B8A6", secondary: "#5EEAD4", accent: "#CCFBF1", glow: "rgba(20, 184, 166, 0.6)", text: "#0F766E", metalStops: ["#2DD4BF", "#0F766E", "#115E59", "#E6FFFA"] },
  amethyst: { name: "Vibrant Amethyst", headerBgStart: "#F3E8FF", headerBgEnd: "#E9D5FF", bodyBgStart: "#4C1D95", bodyBgEnd: "#2D0B5A", primary: "#A855F7", secondary: "#D8B4FE", accent: "#F3E8FF", glow: "rgba(168, 85, 247, 0.6)", text: "#6B21A8", metalStops: ["#C084FC", "#7E22CE", "#581C87", "#FAE8FF"] },
  ruby: { name: "Molten Ruby Crimson", headerBgStart: "#FFE4E6", headerBgEnd: "#FECDD3", bodyBgStart: "#881337", bodyBgEnd: "#4C0519", primary: "#F43F5E", secondary: "#FDA4AF", accent: "#FFE4E6", glow: "rgba(244, 63, 94, 0.65)", text: "#9F1239", metalStops: ["#FB7185", "#E11D48", "#9F1239", "#FFF1F2"] },
  cosmic: { name: "Nebula Constellation", headerBgStart: "#FCE7F3", headerBgEnd: "#FBCFE8", bodyBgStart: "#2E1065", bodyBgEnd: "#0F052D", primary: "#EC4899", secondary: "#F472B6", accent: "#FDF2F8", glow: "rgba(236, 72, 153, 0.7)", text: "#9D174D", metalStops: ["#F472B6", "#C026D3", "#4C1D95", "#FDF2F8"] },
  locked: { name: "Dark Steel plate", headerBgStart: "#334155", headerBgEnd: "#1E293B", bodyBgStart: "#111827", bodyBgEnd: "#030712", primary: "#475569", secondary: "#64748B", accent: "#94A3B8", glow: "rgba(148, 163, 184, 0.1)", text: "#64748B", metalStops: ["#475569", "#334155", "#1E293B", "#94A3B8"] },
};

// Core achievement emblems, centred for the 120×140 badge viewBox (y≈82).
const PREMIUM_EMBLEMS: Record<string, (color: string) => ReactNode> = {
  ruler: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="1,3" opacity="0.4" />
      <line x1="2" y1="20" x2="38" y2="20" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="20" y1="2" x2="20" y2="38" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <g transform="rotate(-15 20 20)">
        <rect x="4" y="14" width="32" height="12" rx="1.5" fill="rgba(0,0,0,0.4)" />
        <rect x="4" y="13" width="32" height="12" rx="1.5" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="5.5" y="14.5" width="29" height="9" fill="#1E293B" opacity="0.85" />
        <line x1="8" y1="13" x2="8" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="13" x2="12" y2="16" stroke={color} strokeWidth="1" />
        <line x1="16" y1="13" x2="16" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="20" y1="13" x2="20" y2="16" stroke={color} strokeWidth="1" />
        <line x1="24" y1="13" x2="24" y2="18" stroke={color} strokeWidth="1.5" />
        <line x1="28" y1="13" x2="28" y2="16" stroke={color} strokeWidth="1" />
        <line x1="32" y1="13" x2="32" y2="18" stroke={color} strokeWidth="1.5" />
        <circle cx="20" cy="20" r="1.5" fill={color} />
      </g>
    </g>
  ),
  gears: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
      <g className="animate-spin" style={{ transformOrigin: "20px 20px", animationDuration: "24s" }}>
        <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="3" />
        <circle cx="20" cy="20" r="5" fill="#0F172A" stroke={color} strokeWidth="1.5" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <path key={angle} d="M 18,6 L 22,6 L 23,11 L 17,11 Z" fill={color} transform={`rotate(${angle} 20 20)`} />
        ))}
      </g>
      <g transform="translate(6, 24) scale(0.6)" className="animate-spin" style={{ transformOrigin: "20px 20px", animationDuration: "12s", animationDirection: "reverse" }}>
        <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="3" />
        <circle cx="20" cy="20" r="4" fill="#0F172A" stroke={color} strokeWidth="1" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <rect key={angle} x="18" y="6" width="4" height="5" rx="1" fill={color} transform={`rotate(${angle} 20 20)`} />
        ))}
      </g>
    </g>
  ),
  lightning: (color) => (
    <g transform="translate(18, 51) scale(1.15)">
      <path d="M 12,20 C 12,12 28,12 28,20 C 28,28 12,28 12,20" fill="none" stroke={color} strokeWidth="0.75" strokeDasharray="3,3" className="animate-pulse" />
      <circle cx="20" cy="20" r="17" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <g>
        <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill="rgba(0,0,0,0.3)" transform="translate(1, 1)" />
        <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="bevel" />
        <path d="M22 2 L9 21 L18 21 L14 38 L31 16 L20 16 Z" fill={color} opacity="0.3" />
        <path d="M21.5 4 L11 20.5 L19.5 20.5 L15.5 35 L28.5 17 L18.5 17 Z" fill="#FFFFFF" opacity="0.95" />
      </g>
    </g>
  ),
  target: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="20" cy="20" r="11" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4,2" />
      <circle cx="20" cy="20" r="6" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="20" cy="20" r="2.5" fill={color} />
      <line x1="20" y1="1" x2="20" y2="7" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="33" x2="20" y2="39" stroke={color} strokeWidth="1.5" />
      <line x1="1" y1="20" x2="7" y2="20" stroke={color} strokeWidth="1.5" />
      <line x1="33" y1="20" x2="39" y2="20" stroke={color} strokeWidth="1.5" />
      <path d="M 6,6 L 3,6 L 3,3 L 6,3" fill="none" stroke={color} strokeWidth="1" />
      <path d="M 34,6 L 37,6 L 37,3 L 34,3" fill="none" stroke={color} strokeWidth="1" />
      <path d="M 6,34 L 3,34 L 3,37 L 6,37" fill="none" stroke={color} strokeWidth="1" />
      <path d="M 34,34 L 37,34 L 37,37 L 34,37" fill="none" stroke={color} strokeWidth="1" />
    </g>
  ),
  shield: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <path d="M6 6 C16 4, 24 4, 34 6 C34 18, 30 28, 20 36 C10 28, 6 18, 6 6 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M9 8 C17 6.5, 23 6.5, 31 8 C31 17, 28 26, 20 33 C12 26, 9 17, 9 8 Z" fill={color} opacity="0.3" />
      <polygon points="20,11 26,17 20,23 14,17" fill="none" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="8" x2="20" y2="32" stroke={color} strokeWidth="1" />
      <line x1="8" y1="17" x2="32" y2="17" stroke={color} strokeWidth="1" />
    </g>
  ),
  compass: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="20" cy="20" r="13" fill="none" stroke={color} strokeWidth="0.75" opacity="0.4" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line key={angle} x1="20" y1="4" x2="20" y2="6.5" stroke={color} strokeWidth="1" transform={`rotate(${angle} 20 20)`} />
      ))}
      <g transform="rotate(40 20 20)">
        <polygon points="20,5 24,20 20,17" fill={color} stroke={color} strokeWidth="0.5" />
        <polygon points="20,5 16,20 20,17" fill="#FFFFFF" opacity="0.7" stroke={color} strokeWidth="0.5" />
        <polygon points="20,35 24,20 20,23" fill="#1E293B" stroke={color} strokeWidth="0.5" />
        <polygon points="20,35 16,20 20,23" fill="none" stroke={color} strokeWidth="0.5" />
      </g>
      <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" stroke={color} strokeWidth="1.5" />
    </g>
  ),
  flame: (color) => (
    <g transform="translate(18, 48) scale(1.15)">
      <circle cx="12" cy="30" r="1.5" fill={color} className="animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "2s" }} />
      <circle cx="28" cy="28" r="1" fill={color} className="animate-bounce" style={{ animationDelay: "0.6s", animationDuration: "1.5s" }} />
      <circle cx="20" cy="34" r="2" fill={color} />
      <path d="M20 2 C20 2, 6 16, 6 27 C6 34, 12 39, 20 39 C28 39, 34 34, 34 27 C34 16, 20 2, 20 2 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 8 C20 8, 9 20, 9 27 C9 32, 14 36, 20 36 C26 36, 31 32, 31 27 C31 20, 20 8, 20 8 Z" fill={color} opacity="0.5" />
      <path d="M20 16 C20 16, 13 23, 13 27 C13 30, 16 33, 20 33 C24 33, 27 30, 27 27 C27 23, 20 16, 20 16 Z" fill="#FFFFFF" opacity="0.9" />
    </g>
  ),
  moon: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <ellipse cx="20" cy="20" rx="17" ry="6" fill="none" stroke={color} strokeWidth="0.75" strokeDasharray="3,1" transform="rotate(-15 20 20)" opacity="0.5" />
      <g>
        <path d="M12 20 C12 29, 19 36, 28 36 C31.5 36, 34.8 34.8, 37.5 32.5 C26.5 32.5 17.5 24 17.5 13 C17.5 10, 18.8 7.2 21 5 C15.5 8, 12 13.5, 12 20 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M12 20 C12 29, 19 36, 28 36 C31.5 36, 34.8 34.8, 37.5 32.5 C26.5 32.5 17.5 24 17.5 13 C17.5 10, 18.8 7.2 21 5 C15.5 8, 12 13.5, 12 20 Z" fill={color} opacity="0.35" />
        <polygon points="31,8 33,12 37,12 34,14 35,18 31,16 27,18 28,14 25,12 29,12" fill="#FFFFFF" opacity="0.9" />
        <circle cx="18" cy="24" r="1.5" fill="none" stroke={color} strokeWidth="1" />
        <circle cx="24" cy="30" r="2" fill="none" stroke={color} strokeWidth="0.75" />
        <circle cx="15" cy="18" r="1" fill={color} opacity="0.6" />
      </g>
    </g>
  ),
  crown: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="5" r="2.5" fill="#FFFFFF" stroke={color} strokeWidth="1" />
      <circle cx="6" cy="14" r="1.5" fill={color} />
      <circle cx="34" cy="14" r="1.5" fill={color} />
      <polygon points="6,31 34,31 34,17 27,24 20,9 13,24 6,17" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="6,31 34,31 34,17 27,24 20,9 13,24 6,17" fill={color} opacity="0.4" />
      <rect x="10" y="27" width="20" height="4" rx="1" fill="#1E293B" stroke={color} strokeWidth="1.5" />
      <circle cx="15" cy="29" r="1" fill="#FFFFFF" />
      <circle cx="20" cy="29" r="1.2" fill={color} />
      <circle cx="25" cy="29" r="1" fill="#FFFFFF" />
    </g>
  ),
  trophy: (color) => (
    <g transform="translate(18, 51) scale(1.15)">
      <path d="M 6,15 C 6,28 14,31 20,31 C 26,31 34,28 34,15" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2,3" opacity="0.6" />
      <g>
        <path d="M 9,13 C 4,13 4,21 9,21" fill="none" stroke={color} strokeWidth="2" />
        <path d="M 31,13 C 36,13 36,21 31,21" fill="none" stroke={color} strokeWidth="2" />
        <path d="M 9,9 L 31,9 L 29,23 C 27,28 13,28 11,23 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 9,9 L 31,9 L 29,23 C 27,28 13,28 11,23 Z" fill={color} opacity="0.35" />
        <line x1="20" y1="25" x2="20" y2="31" stroke={color} strokeWidth="4" />
        <rect x="12" y="31" width="16" height="4" rx="1.5" fill="#0F172A" stroke={color} strokeWidth="2" />
        <polygon points="20,12 21.5,15 25,15.5 22.5,18 23,21.5 20,20 17,21.5 17.5,18 15,15.5 18.5,15" fill="#FFFFFF" opacity="0.9" />
      </g>
    </g>
  ),
  rocket: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <path d="M 4,4 L 10,10" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <path d="M 36,4 L 30,10" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <g>
        <path d="M 16,30 L 20,38 L 24,30 Z" fill="#EF4444" className="animate-pulse" />
        <path d="M 20,4 C 20,4 28,10 28,24 L 28,30 L 12,30 L 12,24 C 12,10 20,4 20,4 Z" fill="none" stroke={color} strokeWidth="2.5" />
        <path d="M 20,4 C 20,4 28,10 28,24 L 28,30 L 12,30 L 12,24 C 12,10 20,4 20,4 Z" fill={color} opacity="0.4" />
        <path d="M 12,22 L 6,30 L 12,30 Z" fill="#0F172A" stroke={color} strokeWidth="1.5" />
        <path d="M 28,22 L 34,30 L 28,30 Z" fill="#0F172A" stroke={color} strokeWidth="1.5" />
        <circle cx="20" cy="18" r="4" fill="#FFFFFF" stroke={color} strokeWidth="1.5" />
      </g>
    </g>
  ),
  diamond: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <polygon points="20,4 36,16 20,36 4,16" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="20,4 36,16 20,36 4,16" fill={color} opacity="0.3" />
      <line x1="20" y1="4" x2="20" y2="36" stroke={color} strokeWidth="1" />
      <line x1="4" y1="16" x2="36" y2="16" stroke={color} strokeWidth="1" />
      <polygon points="20,4 28,16 20,16" fill="#FFFFFF" opacity="0.4" />
      <polygon points="20,4 12,16 20,16" fill="#FFFFFF" opacity="0.2" />
      <polygon points="20,36 28,16 20,16" fill="#FFFFFF" opacity="0.1" />
      <polygon points="20,36 12,16 20,16" fill="#FFFFFF" opacity="0.3" />
    </g>
  ),
  infinity: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="20" r="17" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="1,5" opacity="0.5" />
      <path d="M13 25 C6 18, 6 32, 13 25 C20 18, 20 32, 27 25 C34 18, 34 32, 27 25 C20 18, 20 32, 13 25 Z" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M13 25 C6 18, 6 32, 13 25 C20 18, 20 32, 27 25 C34 18, 34 32, 27 25 C20 18, 20 32, 13 25 Z" fill={color} opacity="0.35" />
      <circle cx="13" cy="25" r="2" fill="#FFFFFF" />
      <circle cx="27" cy="25" r="2" fill="#FFFFFF" />
    </g>
  ),
  sun: (color) => (
    <g transform="translate(18, 52) scale(1.15)">
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="0.75" strokeDasharray="3,2" opacity="0.6" />
      <circle cx="20" cy="20" r="9" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="20" cy="20" r="6" fill="#FFFFFF" stroke={color} strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} d="M 20,3 L 22,10 L 18,10 Z" fill={color} transform={`rotate(${angle} 20 20)`} />
      ))}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
        <line key={angle} x1="20" y1="5" x2="20" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${angle} 20 20)`} />
      ))}
    </g>
  ),
};

type Milestone = { id: string; xp: number; name: string; tier: string; icon: string; tag: string };

const XP_MILESTONES: Milestone[] = [
  { id: "xp10", xp: 10, name: "Architect Rule", tier: "copper", icon: "ruler", tag: "10 XP" },
  { id: "xp25", xp: 25, name: "Active Gears", tier: "copper", icon: "gears", tag: "25 XP" },
  { id: "xp50", xp: 50, name: "Spark Streak", tier: "bronze", icon: "lightning", tag: "50 XP" },
  { id: "xp100", xp: 100, name: "Bullseye Core", tier: "bronze", icon: "target", tag: "100 XP" },
  { id: "xp200", xp: 200, name: "Shield Array", tier: "silver", icon: "shield", tag: "200 XP" },
  { id: "xp400", xp: 400, name: "Map Pathfinder", tier: "silver", icon: "compass", tag: "400 XP" },
  { id: "xp700", xp: 700, name: "High Volts", tier: "silver", icon: "lightning", tag: "700 XP" },
  { id: "xp1000", xp: 1000, name: "Bronze Hearth", tier: "gold", icon: "flame", tag: "1000 XP" },
  { id: "xp1500", xp: 1500, name: "Crescent Crest", tier: "gold", icon: "moon", tag: "1500 XP" },
  { id: "xp2000", xp: 2000, name: "Sovereign Crown", tier: "gold", icon: "crown", tag: "2000 XP" },
  { id: "xp2500", xp: 2500, name: "Blazing Star", tier: "emerald", icon: "flame", tag: "2500 XP" },
  { id: "xp3000", xp: 3000, name: "Apex Triumph", tier: "emerald", icon: "trophy", tag: "3000 XP" },
  { id: "xp3500", xp: 3500, name: "Astral Orbit", tier: "platinum", icon: "rocket", tag: "3500 XP" },
  { id: "xp4000", xp: 4000, name: "Prism Matrix", tier: "platinum", icon: "diamond", tag: "4000 XP" },
  { id: "xp4500", xp: 4500, name: "Infinite Nexus", tier: "amethyst", icon: "infinity", tag: "4500 XP" },
  { id: "xp10000", xp: 10000, name: "Solar Supernova", tier: "cosmic", icon: "sun", tag: "10000 XP" },
];

function MedalBadge({
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
  const displayTitle = customTitle || name || `XP ${xp}`;
  const uid = `g_${tier}_${isLocked ? "locked" : "earned"}_${xp}`;

  return (
    <div className="group relative h-full w-full select-none overflow-visible">
      <div
        className="absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${theme.glow} 0%, rgba(0,0,0,0) 70%)` }}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 140"
        className="h-full w-full transform transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-105"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`bodyGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.bodyBgStart} />
            <stop offset="40%" stopColor={theme.bodyBgStart} />
            <stop offset="100%" stopColor={theme.bodyBgEnd} />
          </linearGradient>
          <linearGradient id={`headerGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.headerBgStart} />
            <stop offset="100%" stopColor={theme.headerBgEnd} />
          </linearGradient>
          <linearGradient id={`glossGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`metalStrokeGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {theme.metalStops.map((color, idx) => {
              const offset = (idx / (theme.metalStops.length - 1)) * 100;
              return <stop key={idx} offset={`${offset}%`} stopColor={color} />;
            })}
          </linearGradient>
          <filter id={`glow_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation={shadowBlur} floodColor={theme.glow} floodOpacity="0.95" />
          </filter>
        </defs>

        <path
          d="M 28,12 L 92,12 L 108,28 L 108,112 L 92,128 L 28,128 L 12,112 L 12,28 Z"
          fill={`url(#bodyGrad_${uid})`}
          stroke={`url(#metalStrokeGrad_${uid})`}
          strokeWidth={borderWidth}
          strokeLinejoin="round"
          filter={`url(#glow_${uid})`}
        />

        <circle cx="60" cy="82" r="32" fill="none" stroke={theme.primary} strokeWidth="0.75" strokeDasharray="3,1.5" opacity="0.2" className="animate-spin" style={{ transformOrigin: "60px 82px", animationDuration: "30s" }} />
        <circle cx="60" cy="82" r="24" fill="none" stroke={theme.primary} strokeWidth="0.5" opacity="0.12" />

        <path
          d="M 30,16 L 90,16 L 104,30 L 104,110 L 90,124 L 30,124 L 16,110 L 16,30 Z"
          fill="none"
          stroke={theme.accent}
          strokeWidth="1.2"
          strokeOpacity="0.45"
        />

        <circle cx="22" cy="22" r="1.5" fill={`url(#metalStrokeGrad_${uid})`} />
        <circle cx="98" cy="22" r="1.5" fill={`url(#metalStrokeGrad_${uid})`} />
        <circle cx="98" cy="118" r="1.5" fill={`url(#metalStrokeGrad_${uid})`} />
        <circle cx="22" cy="118" r="1.5" fill={`url(#metalStrokeGrad_${uid})`} />

        <path
          d="M 28,12 L 92,12 L 108,28 L 108,40 L 12,40 L 12,28 Z"
          fill={`url(#headerGrad_${uid})`}
          stroke={`url(#metalStrokeGrad_${uid})`}
          strokeWidth="1.5"
        />
        <line x1="12" y1="40" x2="108" y2="40" stroke={`url(#metalStrokeGrad_${uid})`} strokeWidth="2" />

        <text
          x="60"
          y="30.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9.5"
          fontWeight="900"
          letterSpacing="1.5"
          fill={theme.text}
          textAnchor="middle"
        >
          {displayTitle.toUpperCase()}
        </text>

        <path d="M 28,12 L 92,12 L 108,28 L 108,70 L 12,105 L 12,28 Z" fill={`url(#glossGrad_${uid})`} />

        {isLocked ? (
          <g transform="translate(46, 66) scale(1.35)" opacity="0.8">
            <path d="M 12,15 L 12,18" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" />
            <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke={theme.accent} strokeWidth="2" />
            <path d="M 7,10 L 7,6 C 7,3.5 9,2 12,2 C 15,2 17,3.5 17,6 L 17,10" fill="none" stroke={theme.accent} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ) : (
          <g>{(PREMIUM_EMBLEMS[iconKey] ?? PREMIUM_EMBLEMS.flame)(theme.secondary)}</g>
        )}
      </svg>
    </div>
  );
}

export default function BadgeMedals() {
  const [locked, setLocked] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 font-sans text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col items-center gap-4 text-center">
          <h1 className="bg-gradient-to-r from-rose-400 via-amber-400 to-teal-400 bg-clip-text text-3xl font-black uppercase tracking-tight text-transparent sm:text-4xl">
            XP Medal Forge
          </h1>
          <p className="max-w-xl text-sm text-slate-400">
            Metallic milestone badges across every tier — from 10 XP up to a 10,000 XP solar supernova.
          </p>
          <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900 p-1 text-xs font-black">
            <button
              onClick={() => setLocked(false)}
              className={`rounded-xl px-4 py-2 transition-colors ${!locked ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
            >
              Earned
            </button>
            <button
              onClick={() => setLocked(true)}
              className={`rounded-xl px-4 py-2 transition-colors ${locked ? "bg-rose-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              Locked
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {XP_MILESTONES.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center gap-3 rounded-3xl border border-slate-900 bg-slate-900/20 p-5">
              <div className="flex h-32 w-28 items-center justify-center">
                <MedalBadge
                  xp={badge.xp}
                  name={badge.name}
                  tier={badge.tier}
                  iconKey={badge.icon}
                  isLocked={locked}
                  customTitle={badge.tag}
                />
              </div>
              <div className="text-center">
                <h4 className="text-[11px] font-black leading-none tracking-tight text-slate-200">{badge.name}</h4>
                <p className="mt-1 text-[8px] font-extrabold uppercase tracking-widest text-slate-500">
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

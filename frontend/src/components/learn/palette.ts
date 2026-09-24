import type { CSSProperties } from "react";

import type { Role, Tone } from "@/content/learn/types";

// Colours for the lesson visuals. Role hues are mid-tones used ONLY as tints,
// borders and shapes — text on them is always the theme's heading colour — so
// one set reads well on both the dark and the light theme.
export const ROLE: Record<Role, { label: string; color: string }> = {
  subject: { label: "Subject", color: "#0ea5e9" },
  verb: { label: "Verb", color: "#f97316" },
  helper: { label: "Helper", color: "#8b5cf6" },
  object: { label: "Object", color: "#10b981" },
  time: { label: "Time", color: "#eab308" },
  place: { label: "Place", color: "#ec4899" },
  complement: { label: "Detail", color: "#14b8a6" },
  question: { label: "Question word", color: "#6366f1" },
  negative: { label: "Not", color: "#ef4444" },
  link: { label: "Link", color: "#64748b" },
  other: { label: "Extra", color: "#a8a29e" },
};

// Tones may use theme tokens (primary flips orange ↔ blue with the theme).
export const TONE: Record<Tone, string> = {
  primary: "var(--primary)",
  green: "#10b981",
  blue: "#0ea5e9",
  violet: "#8b5cf6",
  pink: "var(--pink)",
  muted: "color-mix(in oklab, var(--body) 70%, transparent)",
};

/** Tinted chip surface: soft fill + stronger border of the same hue. */
export function tint(color: string, fill = 16, border = 55): CSSProperties {
  return {
    backgroundColor: `color-mix(in oklab, ${color} ${fill}%, transparent)`,
    borderColor: `color-mix(in oklab, ${color} ${border}%, transparent)`,
  };
}

/** Like `tint`, but opaque (painted over the card surface) — for labels that sit on lines. */
export function solidTint(color: string, fill = 16, border = 55): CSSProperties {
  const mix = `color-mix(in oklab, ${color} ${fill}%, transparent)`;
  return {
    background: `linear-gradient(${mix}, ${mix}) var(--surface-1)`,
    borderColor: `color-mix(in oklab, ${color} ${border}%, transparent)`,
  };
}

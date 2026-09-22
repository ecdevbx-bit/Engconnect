import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  BookOpen,
  Puzzle,
  MessageCircle,
  BookText,
  Languages,
  Mic,
  Feather,
  Globe2,
  Crown,
  Star,
  Trophy,
  Award,
  Flame,
  Zap,
  Rocket,
  HelpCircle,
} from "lucide-react";

// Level definitions used to live here as a hardcoded constant. Now
// they're admin-editable via /v3/admin/levels and live on the backend's
// LevelsCatalog. This file just exposes:
//
//   - LevelDefinition shape used in Redux / props
//   - LEVEL_ICONS: the allow-list of icon names + their lucide
//     components. Must match settingsstore.go's allowedLevelIcons.
//   - DEFAULT_LEVEL_DEFINITIONS: pre-load fallback so the popover
//     doesn't flicker between first paint and the /levels fetch.
//   - iconForName(name): name → component, with a safe fallback.

export type LevelDefinition = {
  level: number;
  threshold: number; // XP needed to reach this level
  title: string;
  icon: string; // lucide component name (see LEVEL_ICONS)
};

// Icon name → lucide component. Adding an icon: add to this map AND
// to backend's allowedLevelIcons (settingsstore.go).
export const LEVEL_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  BookOpen,
  Puzzle,
  MessageCircle,
  BookText,
  Languages,
  Mic,
  Feather,
  Globe2,
  Crown,
  Star,
  Trophy,
  Award,
  Flame,
  Zap,
  Rocket,
};

// LEVEL_ICON_NAMES is the canonical list of icon names admins can pick
// from. Keep in alphabetical order so the admin dropdown is stable.
export const LEVEL_ICON_NAMES = Object.keys(LEVEL_ICONS).sort();

export function iconForName(name: string): LucideIcon {
  return LEVEL_ICONS[name] ?? HelpCircle;
}

// Fallback used until the /levels fetch finishes. Mirrors the backend's
// DefaultLevels in settingsstore.go so a fresh deploy with no saved
// levels still renders correctly.
export const DEFAULT_LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, threshold: 0, title: "Hello World", icon: "Sparkles" },
  { level: 2, threshold: 100, title: "Word Collector", icon: "BookOpen" },
  { level: 3, threshold: 250, title: "Sentence Builder", icon: "Puzzle" },
  { level: 4, threshold: 500, title: "Conversationalist", icon: "MessageCircle" },
  { level: 5, threshold: 850, title: "Storyteller", icon: "BookText" },
  { level: 6, threshold: 1300, title: "Linguist", icon: "Languages" },
  { level: 7, threshold: 1900, title: "Orator", icon: "Mic" },
  { level: 8, threshold: 2700, title: "Wordsmith", icon: "Feather" },
  { level: 9, threshold: 3700, title: "Polyglot", icon: "Globe2" },
  { level: 10, threshold: 5000, title: "Eloquent", icon: "Crown" },
];

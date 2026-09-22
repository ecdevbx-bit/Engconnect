// Navigation is config-driven — the account dropdown renders from this array.
// Adding a destination is a one-line data change, not a layout edit.

import type { LucideIcon } from "lucide-react";
import { User, Puzzle, Sparkles, Activity, Shield, Award, Star, Mic, MessageCircle, Trophy, LayoutDashboard, LifeBuoy, Link2, ToggleRight, KeyRound, LayoutGrid } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

// Rows in the account dropdown — each self-explains. The primary
// destinations (Dashboard, Jumble, Pronunciation, AI Partner, Leaderboard)
// are intentionally NOT here: they live in the navbar tabs (md+) and the
// bottom-nav island (mobile), so the dropdown keeps only account-scoped
// links to avoid duplication.
export const accountMenu: NavItem[] = [
  {
    id: "profile",
    label: "My Profile",
    href: "/dashboard/profile",
    icon: User,
    description: "View and edit your profile",
  },
  {
    id: "activity",
    label: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
    description: "Review your recent sessions",
  },
  {
    id: "support",
    label: "Support & Feedback",
    href: "/support",
    icon: LifeBuoy,
    description: "Share feedback or reach us",
  },
];

/** Admin-only rows in the account dropdown. Rendered only when user.isAdmin is true. */
export const adminMenu: NavItem[] = [
  {
    id: "admin-home",
    label: "Admin home",
    href: "/v3/admin",
    icon: LayoutGrid,
    description: "Every admin tool in one place",
  },
  {
    id: "admin-keys",
    label: "Gemini Keys",
    href: "/v3/admin/keys",
    icon: KeyRound,
    description: "Which API keys are live, cooling down or exhausted",
  },
  {
    id: "admin-problems",
    label: "Manage Problems",
    href: "/v3/admin/problems",
    icon: Shield,
    description: "Add and reorder v3 questions",
  },
  {
    id: "admin-badges",
    label: "Manage Badges",
    href: "/v3/admin/badges",
    icon: Award,
    description: "Define XP and streak badges",
  },
  {
    id: "admin-levels",
    label: "Manage Levels",
    href: "/v3/admin/levels",
    icon: Star,
    description: "Edit the level ladder and XP thresholds",
  },
  {
    id: "admin-ai-partner",
    label: "AI Partner Rewards",
    href: "/v3/admin/ai-partner",
    icon: MessageCircle,
    description: "Tune the speech-time XP rule for AI Partner",
  },
  {
    id: "admin-pronunciation",
    label: "Pronunciation Timings",
    href: "/v3/admin/pronunciation",
    icon: Mic,
    description: "Set countdown and per-difficulty record durations",
  },
  {
    id: "admin-jumble",
    label: "Jumble Settings",
    href: "/v3/admin/jumble",
    icon: Puzzle,
    description: "Tune the progressive set-completion bonus XP",
  },
  {
    id: "admin-pro-trials",
    label: "Pro Trials",
    href: "/v3/admin/pro-trials",
    icon: Sparkles,
    description: "Approve free-trial testers and set the launch date",
  },
  {
    id: "admin-pro-invite",
    label: "Pro Link",
    href: "/v3/admin/pro-invite",
    icon: Link2,
    description: "The fixed /pro link that makes every signup a Pro user",
  },
  {
    id: "admin-feature-flags",
    label: "Feature Flags",
    href: "/v3/admin/feature-flags",
    icon: ToggleRight,
    description: "Toggle features on or off across the platform",
  },
];

/**
 * Primary destinations for the app-style bottom navigation bar shown on
 * small screens (mirrors the navbar's NavTabs subset). Short labels keep the
 * five-up bar readable on narrow phones.
 */
export const primaryNav: NavItem[] = [
  { id: "dashboard", label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { id: "jumble", label: "Jumble", href: "/dashboard/jumble", icon: Puzzle },
  { id: "ai-partner", label: "Speak", href: "/dashboard/ai-partner", icon: Sparkles },
  { id: "pronunciation", label: "Pronounce", href: "/dashboard/pronunciation", icon: Mic },
  { id: "leaderboard", label: "Ranks", href: "/dashboard/leaderboard", icon: Trophy },
];

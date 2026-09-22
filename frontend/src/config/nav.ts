// Navigation is config-driven — the account dropdown renders from this array.
// Adding a destination is a one-line data change, not a layout edit.

import type { ComponentType } from "react";
import { KaiIcon } from "@/components/layout/navIcons";
import { User, Puzzle, House, Speech, Activity, Shield, Award, Star, Mic, MessageCircle, Trophy, Link2, ToggleRight, KeyRound, LayoutGrid, Inbox, BadgeCheck, BookOpen } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
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
    id: "admin-pro-applications",
    label: "Pro applications",
    href: "/v3/admin/pro-trials",
    icon: BadgeCheck,
    description: "Approve or decline learners who applied for Pro",
  },
  {
    id: "admin-support",
    label: "Support inbox",
    href: "/v3/admin/support",
    icon: Inbox,
    description: "Problems reported by learners",
  },
  {
    id: "admin-wiki",
    label: "Wiki & memory",
    href: "/v3/admin/wiki",
    icon: BookOpen,
    description: "Product wiki, status, decisions and knowledge graph",
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
  { id: "dashboard", label: "Home", href: "/dashboard", icon: House },
  { id: "jumble", label: "Jumble", href: "/dashboard/jumble", icon: Puzzle },
  { id: "ai-partner", label: "K.AI", href: "/dashboard/ai-partner", icon: KaiIcon },
  { id: "pronunciation", label: "Pronounce", href: "/dashboard/pronunciation", icon: Speech },
  { id: "leaderboard", label: "Ranks", href: "/dashboard/leaderboard", icon: Trophy },
];

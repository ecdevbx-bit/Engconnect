// Navigation is config-driven — the account dropdown renders from this array.
// Adding a destination is a one-line data change, not a layout edit.

import type { ComponentType } from "react";
import { KaiIcon } from "@/components/layout/navIcons";
import { User, Puzzle, House, Blocks, Activity, Shield, Award, Star, Mic, MessageCircle, Trophy, Link2, ToggleRight, KeyRound, LayoutGrid, Inbox, BadgeCheck, BookOpen, GraduationCap } from "lucide-react";

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

/** Account-dropdown row for the Learn library — shown only while it's visible
 *  (admin switch ON, or to admins); see hooks/useLearnVisible.ts. */
export const learnMenuItem: NavItem = {
  id: "learn",
  label: "Learn",
  href: "/learn",
  icon: GraduationCap,
  description: "Free grammar lessons with pictures and examples",
};

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
 * Primary destinations — the phone tab bar (BottomNav) and the desktop navbar
 * tabs (NavTabs) both read this list, so the names are the same everywhere.
 * Short plain words (D-071): they stay readable at the larger type size on a
 * 360 px phone. K.AI ("Talk") sits in the middle as the raised button.
 */
export const primaryNav: NavItem[] = [
  { id: "dashboard", label: "Home", href: "/dashboard", icon: House, description: "Home" },
  { id: "jumble", label: "Words", href: "/dashboard/jumble", icon: Blocks, description: "Jumble Words" },
  { id: "ai-partner", label: "Talk", href: "/dashboard/ai-partner", icon: KaiIcon, description: "Talk to K.AI" },
  { id: "pronunciation", label: "Speak", href: "/dashboard/pronunciation", icon: Mic, description: "Pronunciation" },
  { id: "leaderboard", label: "Ranks", href: "/dashboard/leaderboard", icon: Trophy, description: "Leaderboard" },
];

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, type LucideIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import { useLearnVisible } from "@/hooks/useLearnVisible";

// Primary in-app destinations shown as a pill switcher in the navbar. These
// mirror a curated subset of the account-menu nav (see config/nav.ts); the
// dropdown remains the full list. Dashboard and Leaderboard render as
// icon-only tabs; the activities (Jumble/Pronunciation/AI Partner) keep text.
type NavTab = { id: string; label: string; href: string; icon?: LucideIcon };

const NAV_TABS: NavTab[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "jumble", label: "Jumble", href: "/dashboard/jumble" },
  { id: "pronunciation", label: "Pronunciation", href: "/dashboard/pronunciation" },
  { id: "ai-partner", label: "AI Partner", href: "/dashboard/ai-partner" },
  { id: "leaderboard", label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  // Learn library — only while visible (admin switch, useLearnVisible).
  { id: "learn", label: "Learn", href: "/learn" },
  // Desktop-only Premium CTA. Lives here (not in config/nav.ts:primaryNav) so
  // it shows in the navbar tabs without also appearing in the mobile bottom
  // nav island. Text tab (no icon) so it reads clearly as the upsell.
  { id: "premium", label: "Pro", href: "/v3/premium" },
];

export default function NavTabs() {
  const pathname = usePathname() ?? "";
  // AI Partner is flag-gated while it's being rebuilt: the tab stays visible
  // (it doubles as the announcement) but the click opens the "upgrading" popup
  // instead of navigating.
  const { guard } = useAIPartnerGate();
  const learnVisible = useLearnVisible();
  const tabs = learnVisible ? NAV_TABS : NAV_TABS.filter((t) => t.id !== "learn");
  // Most-specific match wins so /dashboard/jumble highlights Jumble rather
  // than Dashboard (whose href is a prefix of every other tab). Falls back to
  // no active tab on routes that aren't in the set (e.g. /dashboard/profile).
  const active =
    [...tabs]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? "";

  return (
    <Tabs value={active} className="hidden md:block">
      <TabsList className="h-auto gap-1 rounded-full border border-white/[0.06] bg-surface-2/40 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <TabsTrigger
              key={t.id}
              value={t.id}
              asChild
              className="flex-none rounded-full px-4 py-3.5 text-sm font-semibold text-body hover:text-heading dark:text-body dark:hover:text-heading data-[state=active]:bg-primary data-[state=active]:text-[#0b0e14] dark:data-[state=active]:bg-primary dark:data-[state=active]:text-[#0b0e14]"
            >
              <Link
                href={t.href}
                onClick={t.id === "ai-partner" ? guard : undefined}
                aria-label={Icon ? t.label : undefined}
                title={Icon ? t.label : undefined}
              >
                {Icon ? <Icon className="h-4 w-4" /> : t.label}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Crown } from "lucide-react";

import { primaryNav, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import { useLearnVisible } from "@/hooks/useLearnVisible";

// Desktop navbar tabs (md+). Same names and icons as the phone tab bar
// (config/nav.ts primaryNav) plus Learn (while visible) and Pro, so a learner
// who switches devices sees one app (D-071).
const EXTRA_TABS: NavItem[] = [
  { id: "learn", label: "Learn", href: "/learn", icon: GraduationCap },
  { id: "premium", label: "Pro", href: "/v3/premium", icon: Crown },
];

export default function NavTabs() {
  const pathname = usePathname() ?? "";
  // AI Partner is flag-gated while it's being rebuilt: the tab stays visible
  // but the click opens the "upgrading" popup instead of navigating.
  const { guard } = useAIPartnerGate();
  const learnVisible = useLearnVisible();
  const tabs = [...primaryNav, ...EXTRA_TABS.filter((t) => t.id !== "learn" || learnVisible)];
  // Most-specific match wins so /dashboard/jumble highlights Words rather
  // than Home (whose href is a prefix of every other tab).
  const active =
    [...tabs]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? "";

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                onClick={t.id === "ai-partner" ? guard : undefined}
                aria-current={isActive ? "page" : undefined}
                title={t.description}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-[15px] font-bold transition-colors lg:px-4",
                  "outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-brand-soft text-primary"
                    : "text-body hover:bg-surface-2 hover:text-heading",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

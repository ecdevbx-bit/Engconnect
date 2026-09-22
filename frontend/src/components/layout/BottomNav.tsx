"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/lib/session";
import { fromSessionUser } from "@/lib/displayUser";
import { primaryNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";

/**
 * BottomNav — app-style tab bar for small screens (md:hidden; the navbar's
 * NavTabs cover md+). Frosted-glass island with four tabs and a raised centre
 * button for K.AI (AI Partner), the app's main speaking practice.
 * Authenticated users only. Plain links + CSS transitions — no JS animation.
 */
export default function BottomNav() {
  const session = useSession();
  const pathname = usePathname() ?? "";
  // AI Partner is flag-gated while it's being rebuilt — the tap opens the
  // "upgrading" popup instead of navigating.
  const { guard } = useAIPartnerGate();

  const user = fromSessionUser(session.data?.user);
  if (!user?.uid || user.emailVerified !== true) return null;

  // Most-specific match wins so /dashboard/jumble highlights Jumble, not Home.
  const active =
    [...primaryNav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? "";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[calc(0.6rem+env(safe-area-inset-bottom))] z-30 md:hidden"
      style={{ touchAction: "manipulation" }}
    >
      <div className="mx-auto flex max-w-md items-end rounded-[26px] border border-white/[0.12] bg-surface-1/70 px-1.5 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {primaryNav.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === active;
          const onClick = t.id === "ai-partner" ? guard : undefined;

          if (t.id === "ai-partner") {
            return (
              <Link
                key={t.id}
                href={t.href}
                onClick={onClick}
                aria-label={`${t.label} with K.AI`}
                aria-current={isActive ? "page" : undefined}
                className="group flex flex-1 flex-col items-center gap-1 outline-none"
              >
                <span
                  className={cn(
                    "-mt-7 flex h-14 w-14 items-center justify-center rounded-full text-white ring-4 ring-background transition-transform duration-150 group-active:scale-95 group-focus-visible:ring-primary",
                    isActive
                      ? "shadow-[0_6px_20px_rgba(249,115,22,0.55)]"
                      : "shadow-[0_6px_16px_rgba(0,0,0,0.35)]",
                  )}
                  style={{ background: "var(--pro-pill)" }}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <span className={cn("text-[11px] leading-none", isActive ? "font-bold text-heading" : "font-semibold text-body")}>
                  {t.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={t.id}
              href={t.href}
              onClick={onClick}
              aria-current={isActive ? "page" : undefined}
              className="group flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200 group-active:scale-95",
                  isActive ? "bg-primary/15 text-primary" : "text-body group-hover:text-heading",
                )}
              >
                <Icon className="h-[22px] w-[22px]" />
              </span>
              <span className={cn("text-[11px] leading-none", isActive ? "font-bold text-heading" : "font-medium text-body")}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

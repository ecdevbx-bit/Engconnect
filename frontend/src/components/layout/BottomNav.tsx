"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/lib/session";
import { fromSessionUser } from "@/lib/displayUser";
import { primaryNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";

/**
 * BottomNav — the phone tab bar (md:hidden; NavTabs covers md+).
 * A solid bar pinned to the bottom edge (D-071): labels always visible, 56 px
 * tall tabs, and a raised centre button for K.AI ("Talk"), the main speaking
 * practice. Authenticated users only. Plain links + CSS — no JS animation.
 */
export default function BottomNav() {
  const session = useSession();
  const pathname = usePathname() ?? "";
  // AI Partner is flag-gated while it's being rebuilt — the tap opens the
  // "upgrading" popup instead of navigating.
  const { guard } = useAIPartnerGate();

  const user = fromSessionUser(session.data?.user);
  if (!user?.uid || user.emailVerified !== true) return null;

  // Most-specific match wins so /dashboard/jumble highlights Words, not Home.
  const active =
    [...primaryNav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? "";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
      style={{ touchAction: "manipulation" }}
    >
      <div className="mx-auto flex max-w-md items-end px-1 pt-1.5 pb-1.5">
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
                aria-label="Talk to K.AI"
                aria-current={isActive ? "page" : undefined}
                className="group flex flex-1 flex-col items-center gap-1 outline-none"
              >
                <span
                  className={cn(
                    "-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-surface-1 transition-transform duration-150 group-active:scale-95 group-focus-visible:ring-heading",
                    isActive ? "shadow-[0_6px_18px_rgba(255,122,26,0.45)]" : "shadow-raised",
                  )}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <span className={cn("text-[13px] leading-none", isActive ? "font-extrabold text-primary" : "font-bold text-muted-foreground")}>
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
              className="group flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 group-active:scale-95",
                  isActive ? "bg-brand-soft text-primary" : "text-muted-foreground group-hover:text-heading",
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className={cn("text-[13px] leading-none", isActive ? "font-extrabold text-primary" : "font-bold text-muted-foreground")}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

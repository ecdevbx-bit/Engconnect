"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useEffect, useRef, useState } from "react";

import { fromSessionUser } from "@/lib/displayUser";
import { primaryNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";

/**
 * BottomNav — app-style fixed bottom navigation for small screens.
 * Complements the navbar's NavTabs (which is `hidden md:block`); this bar is
 * `md:hidden`, so exactly one primary switcher is visible at any width.
 * Only renders for authenticated users, matching NavTabs.
 *
 * One full-width floating pill holds all tabs (icon over label). The active tab
 * is marked by a small circular orange highlight that (a) glides on route
 * change and (b) can be dragged: swipe across the bar and the highlight follows
 * your finger, snapping to the nearest tab and navigating there on release.
 */
export default function BottomNav() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  // AI Partner ("Speak") is flag-gated while it's being rebuilt — both the tap
  // and the swipe-to-navigate below open the "upgrading" popup instead.
  const { guard } = useAIPartnerGate();

  const user = fromSessionUser(session.data?.user);
  const isAuthenticated = !!user?.uid && user.emailVerified === true;

  // Most-specific match wins so /dashboard/jumble highlights Jumble rather
  // than Home (whose href is a prefix of every other tab).
  const active =
    [...primaryNav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? "";
  const activeIndex = primaryNav.findIndex((t) => t.id === active);

  // Drag state — `dragIndex` is a fractional index while swiping so the highlight
  // tracks the finger. On release it's snapped to the chosen tab and HELD there
  // (not cleared), so the highlight stays on the dragged-to tab while the route
  // navigates — the effect below releases it once activeIndex catches up, so it
  // never flicks back to the previous tab. null = idle (follows activeIndex).
  const rowRef = useRef<HTMLDivElement>(null);
  const downRef = useRef(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Fractional index (0..count-1) for a clientX, centred on each tab slot.
  const indexFromClientX = (clientX: number): number | null => {
    const el = rowRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return null;
    const raw = ((clientX - rect.left) / rect.width) * primaryNav.length - 0.5;
    return Math.max(0, Math.min(primaryNav.length - 1, raw));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    downRef.current = true;
    draggingRef.current = false;
    startXRef.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!downRef.current) return;
    if (!draggingRef.current) {
      // Only treat as a swipe past a small threshold so taps still go through
      // the Link (down + up on the same tab → normal click navigation).
      if (Math.abs(e.clientX - startXRef.current) < 6) return;
      draggingRef.current = true;
      rowRef.current?.setPointerCapture(e.pointerId);
    }
    const idx = indexFromClientX(e.clientX);
    if (idx !== null) setDragIndex(idx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    downRef.current = false;
    if (!draggingRef.current) return; // a tap — let the Link handle it
    draggingRef.current = false;
    const idx = indexFromClientX(e.clientX);
    if (idx === null) {
      setDragIndex(null);
      return;
    }
    const targetIndex = Math.round(idx);
    const target = primaryNav[targetIndex];
    if (target?.id === "ai-partner" && guard()) {
      setDragIndex(null);
      return;
    }
    if (target && target.id !== active) {
      // Keep the highlight pinned to the tab we dragged to; it's released only
      // once the route catches up (see the effect), which avoids the flick-back.
      setDragIndex(targetIndex);
      router.push(target.href);
    } else {
      setDragIndex(null);
    }
  };

  const onPointerCancel = () => {
    downRef.current = false;
    draggingRef.current = false;
    setDragIndex(null);
  };

  // Once the route reaches the dragged-to tab, drop the manual hold so the
  // highlight tracks activeIndex again. It already sits on the new activeIndex,
  // so this is visually a no-op (no flick). Skipped mid-swipe.
  useEffect(() => {
    if (!draggingRef.current) setDragIndex(null);
  }, [activeIndex]);

  if (!isAuthenticated) return null;

  const displayIndex = dragIndex ?? (activeIndex >= 0 ? activeIndex : null);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 md:hidden"
    >
      <div className="glass rounded-full border border-white/[0.06] px-1 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
        <div
          ref={rowRef}
          className="relative flex select-none items-stretch"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {/* Sliding circular highlight — one tab-slot wide, translated by
              displayIndex*100% of its own width to land on the target icon.
              Transition is dropped while dragging so it tracks the finger 1:1. */}
          {displayIndex !== null && (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 top-0 z-0",
                dragIndex === null && "transition-transform duration-300 ease-out",
              )}
              style={{
                width: `${100 / primaryNav.length}%`,
                transform: `translateX(${displayIndex * 100}%)`,
              }}
            >
              <span
                className="mx-auto block h-9 w-9 rounded-full shadow-[0_4px_12px_rgba(41,118,199,0.45)] dark:shadow-[0_4px_12px_rgba(249,115,22,0.45)]"
                style={{ background: "var(--pro-pill)" }}
              />
            </span>
          )}

          {primaryNav.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <Link
                key={t.id}
                href={t.href}
                onClick={t.id === "ai-partner" ? guard : undefined}
                aria-label={t.label}
                aria-current={isActive ? "page" : undefined}
                draggable={false}
                className="group relative z-10 flex flex-1 flex-col items-center gap-0.5"
              >
                <span className="flex h-9 w-9 items-center justify-center">
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-white dark:text-[#0b0e14]" : "text-body group-hover:text-heading",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none transition-colors",
                    isActive ? "font-bold text-heading" : "font-medium text-body group-hover:text-heading",
                  )}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

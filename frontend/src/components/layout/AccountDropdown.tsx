"use client";

import Link from "next/link";
// Plain <img> for the same reason as AccountChip / Profile / etc. —
// avoids the next/image remote-host configuration dance for DiceBear
// (and any future avatar provider).
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { DisplayUser } from "@/lib/displayUser";

import { accountMenu, adminMenu } from "@/config/nav";

/**
 * AccountDropdown — the rich account menu (Layout.md §7).
 * Three regions: identity header, icon+label+description rows, destructive footer.
 */
export default function AccountDropdown({
  user,
  initials,
  anchorRef,
  onClose,
  onSignOut,
}: {
  user: DisplayUser;
  initials: string;
  anchorRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  // Fixed viewport position computed from the trigger, so the portaled menu
  // lines up under it (right-aligned) like the old absolute placement did.
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      // Ignore clicks on the trigger — it toggles the menu itself, so an
      // outside-close here would fight the toggle.
      if (
        ref.current &&
        !ref.current.contains(t) &&
        !anchorRef.current?.contains(t)
      ) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, anchorRef]);

  // Position the portaled menu under the trigger (right-aligned). Recompute on
  // resize/scroll; the navbar is sticky so the trigger keeps its viewport spot.
  useEffect(() => {
    function place() {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      setPos({ top: r.bottom + 12, right: Math.max(8, window.innerWidth - r.right) });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Account menu"
      // Portaled to <body> with a high z so it's never trapped behind the
      // navbar's backdrop-filter stacking context (z-30) or page cards.
      className="fixed z-[100] w-[320px] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/[0.08] bg-surface-2 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
      style={{
        top: pos?.top ?? 0,
        right: pos?.right ?? 16,
        maxHeight: pos ? `calc(100vh - ${pos.top + 16}px)` : undefined,
        visibility: pos ? "visible" : "hidden",
        animation: "popIn 0.15s ease-out both",
      }}
    >
      {/* 1 — identity header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt="Avatar"
              width={44}
              height={44}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-sm font-bold text-[#0b0e14]">
              {initials}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading">
            {user.displayName ?? "User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* 2 — item rows (config-driven) */}
      <div className="py-2">
        {accountMenu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              role="menuitem"
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-2/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Theme toggle — mobile only; on desktop it lives in the top nav. */}
      <div className="md:hidden">
        <div className="h-px bg-white/[0.06]" />
        <button
          type="button"
          role="menuitem"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-surface-2/60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading">
              {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
            </p>
            <p className="truncate text-xs text-muted-foreground">Switch appearance</p>
          </div>
        </button>
      </div>

      {/* 2b — admin section, only rendered for admins. Visually distinct
          from the regular rows (amber accent) so it's clear it's a
          privileged surface. */}
      {user.isAdmin && adminMenu.length > 0 && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <div className="py-2">
            <p className="px-5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            {adminMenu.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-2/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-heading">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="h-px bg-white/[0.06]" />

      {/* 3 — destructive footer */}
      <button
        type="button"
        role="menuitem"
        onClick={onSignOut}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-pink/[0.07]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink/10 text-pink">
          <LogOut size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold text-heading">Sign out</p>
          <p className="text-xs text-muted-foreground">Sign out of your account</p>
        </div>
      </button>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

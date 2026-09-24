"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import type { NavTrack } from "./navTypes";
import { ProMark } from "./ProMark";

// W3Schools-style lesson tree (desktop sidebar and the mobile drawer). Client
// only because it highlights the current page; it receives titles and paths,
// never lesson content.
export function LearnNav({ tracks, onNavigate }: { tracks: NavTrack[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the current lesson visible inside the scrollable sidebar/drawer —
  // only that box scrolls, never the page.
  useEffect(() => {
    const el = activeRef.current;
    const box = el?.closest<HTMLElement>("[data-learn-scroll]");
    if (!el || !box) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = Math.max(0, top - box.clientHeight / 3);
    }
  }, [pathname]);

  return (
    <nav aria-label="Lessons" className="space-y-6">
      {tracks.map((t) => {
        const trackActive = pathname === t.href;
        return (
          <div key={t.id}>
            <Link
              href={t.href}
              onClick={onNavigate}
              aria-current={trackActive ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center justify-between gap-2 rounded-lg px-2 text-xs font-extrabold uppercase tracking-wider transition-colors",
                trackActive ? "bg-primary/10 text-heading" : "text-muted-foreground hover:text-heading",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.accent }} aria-hidden />
                {t.title}
              </span>
              <span className="font-bold normal-case tracking-normal opacity-80">{t.level}</span>
            </Link>
            <ul className="ml-3 mt-1 border-l border-border">
              {t.lessons.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      ref={active ? activeRef : undefined}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-ml-px flex min-h-11 items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-sm leading-snug transition-colors lg:min-h-9",
                        active
                          ? "border-primary bg-primary/10 font-semibold text-heading"
                          : "border-transparent text-body hover:border-muted-foreground/50 hover:text-heading",
                      )}
                    >
                      <span className="min-w-0 flex-1">{l.title}</span>
                      {l.pro && <ProMark locked={l.locked} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

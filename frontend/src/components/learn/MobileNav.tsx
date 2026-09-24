"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

import { LearnNav } from "./LearnNav";
import { LearnSearch } from "./LearnSearch";
import type { NavTrack, SearchItem } from "./navTypes";

// Phone/tablet lesson menu: a button in the header opens a left drawer with
// search + the lesson tree. Portalled to <body> because the sticky header's
// backdrop blur would otherwise trap a fixed-position child inside it.
export function MobileNav({ tracks, items }: { tracks: NavTrack[]; items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const panel = panelRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Keep Tab inside the drawer while it is open.
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>("a[href], button, input");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // The drawer is hidden from lg up; close it so the scroll lock can't stick.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = prevOverflow;
      button?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="learn-drawer"
        className="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-heading hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
        <span className="sr-only">Open the lessons menu</span>
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/55" onClick={close} aria-hidden />
            <div
              ref={panelRef}
              id="learn-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Lessons"
              className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col border-r border-border bg-background shadow-2xl"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
                <span className="font-display text-base font-bold text-heading">Lessons</span>
                <button
                  type="button"
                  onClick={close}
                  data-autofocus
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-heading hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Close the lessons menu</span>
                </button>
              </div>
              <div className="shrink-0 border-b border-border p-3">
                <LearnSearch items={items} onNavigate={close} />
              </div>
              <div data-learn-scroll className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                <LearnNav tracks={tracks} onNavigate={close} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { groupBadgesByStat, parseBadgeId } from "@/lib/badges";
import { BadgeArt } from "@/components/badges/BadgeArt";

// Interactive badge deck — a fanned card stack that opens on click into a
// 5-up carousel you can cycle through infinitely. React port of the standalone
// showcase: the visual states live in globals.css (.badge-deck-container and
// the `pos-*` classes); here we just toggle `open` and compute each card's
// position class from the current centre index.

function positionClass(offset: number): string {
  switch (offset) {
    case -2:
      return "pos-1";
    case -1:
      return "pos-2";
    case 0:
      return "pos-3";
    case 1:
      return "pos-4";
    case 2:
      return "pos-5";
    default:
      return offset < -2 ? "pos-hidden-left" : "pos-hidden-right";
  }
}

export function BadgeDeck({
  badges,
  mobileExpanded = false,
  desktopExpanded = false,
}: {
  badges: string[];
  /** Render already-expanded on phones (no tap needed). Used by the profile. */
  mobileExpanded?: boolean;
  /** Render already-expanded on tablet/desktop too, in a compact tag-less fan
      (CSS: .desktop-expanded). Leaderboard-only — keeps the deck open instead of
      the tap-to-open stack. */
  desktopExpanded?: boolean;
}) {
  // Collapse same-stat badges into one representative card + a count, so the
  // deck shows one xp / streak / level / per-game-combo card with a "×N" badge
  // rather than a card per threshold.
  const groups = useMemo(() => groupBadgesByStat(badges), [badges]);
  // desktopExpanded (leaderboard) renders already-open on every size; mobileExpanded
  // (profile) renders open on phones only. Otherwise it's a collapsed, tap-to-open
  // stack.
  const [isOpen, setIsOpen] = useState(
    () =>
      desktopExpanded ||
      (mobileExpanded && typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches),
  );
  // Start centred on the same card the closed stack highlights (the 3rd, i.e.
  // index 2) so opening doesn't jump.
  const [currentIndex, setCurrentIndex] = useState(() => Math.min(2, Math.max(0, groups.length - 1)));

  if (groups.length === 0) return null;

  const n = groups.length;
  const total = badges.length;
  const half = Math.floor(n / 2);

  const cardClass = (i: number): string => {
    if (!isOpen) return "badge-card border-4 border-white";
    let offset = i - currentIndex;
    if (offset > half) offset -= n;
    if (offset < -half) offset += n;
    return `badge-card border-4 border-white ${positionClass(offset)}`;
  };

  const prev = () => setCurrentIndex((c) => (c - 1 + n) % n);
  const next = () => setCurrentIndex((c) => (c + 1) % n);

  return (
    <div
      className={`badge-deck-container ${isOpen ? "open" : ""} ${mobileExpanded ? "mobile-expanded" : ""} ${desktopExpanded ? "desktop-expanded" : ""}`}
      style={{ cursor: isOpen ? "default" : "pointer" }}
      onClick={() => {
        if (!isOpen) setIsOpen(true);
      }}
    >
      {/* Floating tags */}
      <div className="floating-tag tag-left border border-primary/30 text-primary">
        {total} {total === 1 ? "badge" : "badges"}
      </div>
      <div className="floating-tag tag-right border border-cyan/30 text-cyan">
        {groups[currentIndex] ? parseBadgeId(groups[currentIndex].id).category : "collection"}
      </div>

      {/* Controls */}
      <button
        type="button"
        className="nav-arrow left-arrow"
        aria-label="Previous badge"
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) prev();
        }}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        className="nav-arrow right-arrow"
        aria-label="Next badge"
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) next();
        }}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <button
        type="button"
        className="close-btn"
        aria-label="Close stack"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      >
        <X className="h-5 w-5" />
      </button>

      <div className="cards-wrapper">
        {groups.map((g, i) => (
          <div key={g.id} className={cardClass(i)}>
            <BadgeArt id={g.id} variant="deck" />
            {g.count > 1 && <CountBadge n={g.count} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// CountBadge — the "×N" chip on a grouped card (bottom-right), shown when the
// user owns more than one badge in that stat family.
function CountBadge({ n }: { n: number }) {
  return (
    <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-20">
      <div className="flex items-center justify-center rounded-full border border-white/40 bg-black/55 px-3 py-1 text-white shadow-[0_4px_16px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <span className="text-xl font-black leading-none tracking-tight">×{n}</span>
      </div>
    </div>
  );
}

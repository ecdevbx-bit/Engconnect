"use client";

import { Award, Flame, MessageCircle, Mic, Puzzle, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { useSession } from "@/lib/session";

import {
  badgeAccent,
  badgeSubtitle,
  badgeTitle,
  parseBadgeId,
  type ParsedBadge,
} from "@/lib/badges";
import { fromSessionUser } from "@/lib/displayUser";
import { LevelCard } from "@/components/badges/LevelCard";
import { StreakCard } from "@/components/badges/StreakCard";
import { ComboCard } from "@/components/badges/ComboCard";
import { OnboardingBadge } from "@/components/badges/OnboardingBadge";
import { BadgeBrandMark } from "@/components/badges/BadgeBrandMark";

// BadgeArt renders the visual for a badge ID. It's the single seam every
// surface goes through — the profile/leaderboard deck (variant="deck") and the
// award celebration (variant="full"). Per-category glyph + accent gradient give
// each badge family its own look; richer per-badge SVG art can replace the
// branches here later without touching callers.

// Module-scope so we never "create a component during render" (the dynamic
// `const Glyph = ...` pattern trips the react compiler lint).
function CategoryGlyph({ b, className }: { b: ParsedBadge; className?: string }) {
  switch (b.category) {
    case "xp":
      return <Zap className={className} strokeWidth={1.75} />;
    case "lvl":
      return <Star className={className} strokeWidth={1.75} />;
    case "streak":
      return <Flame className={className} strokeWidth={1.75} />;
    case "combo":
      if (b.game === "pronunciation") return <Mic className={className} strokeWidth={1.75} />;
      if (b.game === "ai-partner") return <MessageCircle className={className} strokeWidth={1.75} />;
      return <Puzzle className={className} strokeWidth={1.75} />;
    case "progset":
      return <Trophy className={className} strokeWidth={1.75} />;
    case "onboarding":
      return <Sparkles className={className} strokeWidth={1.75} />;
    default:
      return <Award className={className} strokeWidth={1.75} />;
  }
}

// The big central token — a compact form of the value (the full label sits
// under it). Onboarding has no number, so the glyph carries it alone.
function centerToken(b: ParsedBadge): string | null {
  switch (b.category) {
    case "xp":
      return b.value.toLocaleString();
    case "lvl":
      return String(b.value);
    case "streak":
      return `${b.value}d`;
    case "combo":
      return `×${b.value}`;
    default:
      // progset is a single-event badge — the glyph + title carry it alone.
      return null;
  }
}

export function BadgeArt({ id, variant = "deck" }: { id: string; variant?: "deck" | "full" }) {
  const b = parseBadgeId(id);
  const accent = badgeAccent(b);
  const token = centerToken(b);
  const full = variant === "full";
  // The signed-in user's first name, so a level badge renders the exact same
  // card as the level-up celebration (real name) instead of "Player".
  const session = useSession();
  const firstName = fromSessionUser(session.data?.user)?.displayName?.split(" ")[0];

  // Level badges render the SAME holographic card as the level-up celebration
  // (shared LevelCard), scaled to fit. Deck tile is 220×280; the card's natural
  // size is 320×440, so 280/440 contains it; full size renders 1:1.
  if (b.category === "lvl") {
    const scale = full ? 1 : 280 / 440;
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#07020d]">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
          <LevelCard level={b.value} userName={firstName} />
        </div>
      </div>
    );
  }

  // Streak badges render the flame card, themed by streak length (the highest
  // tiers go black). Fills the tile/celebration box.
  if (b.category === "streak") {
    return <StreakCard days={b.value} />;
  }

  // Combo badges render the gold-framed reward card, in a distinct variant per
  // game (jumble / pronunciation / ai-partner).
  if (b.category === "combo") {
    return <ComboCard game={b.game ?? "jumble"} count={b.value} />;
  }

  // Onboarding ("Welcome Aboard") gets its own celebratory illustration.
  if (b.category === "onboarding") {
    return (
      <OnboardingBadge full={full} accent={accent} title={badgeTitle(id)} subtitle={badgeSubtitle(id)} />
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden p-4 text-center"
      style={{ background: `linear-gradient(140deg, ${accent.from}, ${accent.to})` }}
    >
      <BadgeBrandMark size={full ? "md" : "sm"} />
      {/* soft glow blob */}
      <div
        className="pointer-events-none absolute -top-1/4 left-1/2 aspect-square w-[140%] -translate-x-1/2 rounded-full opacity-40 blur-2xl"
        style={{ background: accent.ring }}
        aria-hidden
      />
      <CategoryGlyph
        b={b}
        className={`relative ${full ? "h-20 w-20" : "h-9 w-9"} text-white drop-shadow`}
      />
      {token && (
        <div className={`relative font-black leading-none text-white ${full ? "text-6xl" : "text-2xl"}`}>
          {token}
        </div>
      )}
      <div
        className={`relative font-extrabold uppercase tracking-wider text-white ${
          full ? "mt-1 text-xl" : "text-[11px]"
        }`}
      >
        {badgeTitle(id)}
      </div>
      {full && <div className="relative mt-1 text-sm text-white/80">{badgeSubtitle(id)}</div>}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/session";

import { useAppSelector } from "@/store/hooks";
import { fromSessionUser } from "@/lib/displayUser";
import { PlantArt, PlantArtDefs, plantStageForIndex } from "@/components/v3/plantArt";
import AccountChip from "./AccountChip";
import SupportMenu from "@/components/support/SupportMenu";
import { ThemeToggle } from "./ThemeToggle";
import NavTabs from "./NavTabs";
import LeaderboardPopover from "./LeaderboardPopover";
import LevelsPopover from "./LevelsPopover";

// Navbar XP / level always come from the Redux xpSlice — the V3StateSync
// component in providers.tsx mirrors the NextAuth session into Redux and
// gameplay submits keep it fresh.

/**
 * Navbar — the global top bar (Layout.md §6.1).
 * Sticky, full-width, glass, z-30. Brand left · empty center · XP chips + AccountChip right.
 */
export default function Navbar() {
  const session = useSession();
  const { totalXP, currentLevel, levels } = useAppSelector((state) => state.xp);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);

  const user = fromSessionUser(session.data?.user);
  const isAuthenticated = !!user?.uid && user.emailVerified === true;
  // The PRO badge is a status mark, so only Pro members get it.
  const isPro = isAuthenticated && session.data?.user?.isPro === true;
  const accessToken = session.data?.user?.accessToken ?? "";

  // Growth stage (1..10) for the user's current level — drives the little
  // plant in the level chip so it visibly grows as they level up.
  const currentIndex = levels.findIndex((l) => l.level === currentLevel);
  const currentStage = plantStageForIndex(currentIndex < 0 ? 0 : currentIndex, levels.length);

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface-1/95 backdrop-blur-sm md:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-4 md:gap-6 md:px-6 lg:px-8">

        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="English Connection — home">
          <Image
            src="/logo.svg"
            alt=""
            width={44}
            height={44}
            className="h-9 w-auto"
          />
          <span className="hidden font-display text-[17px] font-extrabold tracking-tight text-heading xl:block">
            English Connection
          </span>
          {/* PRO badge — next to the logo mark, for Pro members only. */}
          {isPro && (
            <span
              className="rounded-full px-2 py-1 text-[12px] font-black leading-none tracking-wide text-white"
              style={{ background: "var(--pro-pill)" }}
            >
              PRO
            </span>
          )}
        </Link>

        {/* Primary in-app nav — desktop tabs, authenticated users only */}
        {isAuthenticated && <NavTabs />}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              {/* XP chip — opens the leaderboard popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLeaderboardOpen((o) => !o)}
                  aria-label="Open global leaderboard"
                  aria-expanded={leaderboardOpen}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[14px] font-extrabold text-heading transition-colors hover:bg-surface-3"
                >
                  <Zap className="h-4 w-4 text-primary" />
                  {totalXP.toLocaleString()} XP
                </button>
                <LeaderboardPopover
                  open={leaderboardOpen}
                  onClose={() => setLeaderboardOpen(false)}
                  accessToken={accessToken}
                />
              </div>
              {/* Level chip — clickable, opens the levels overview popover. */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLevelsOpen((o) => !o)}
                  aria-label="Open levels overview"
                  aria-expanded={levelsOpen}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[14px] font-extrabold text-heading transition-colors hover:bg-surface-3"
                >
                  <PlantArt stage={currentStage} className="h-5 w-5 shrink-0" />
                  <span className="md:hidden">L{currentLevel}</span>
                  <span className="hidden md:inline">Level {currentLevel}</span>
                </button>
                <LevelsPopover open={levelsOpen} onClose={() => setLevelsOpen(false)} />
              </div>

              {/* Shared plant-art gradient/filter defs — rendered once here in
                  the always-mounted navbar so the level-chip plant stays
                  coloured even when the levels popover is closed. */}
              <PlantArtDefs />
            </div>
          )}
          {/* Desktop toggle; on mobile it lives in the account menu instead. */}
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
          {/* "Something wrong?" support dropdown — phone + desktop. */}
          <SupportMenu />
          <AccountChip />
        </div>
      </div>
    </header>
  );
}

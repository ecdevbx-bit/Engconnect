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
  const accessToken = session.data?.user?.accessToken ?? "";

  // Growth stage (1..10) for the user's current level — drives the little
  // plant in the level chip so it visibly grows as they level up.
  const currentIndex = levels.findIndex((l) => l.level === currentLevel);
  const currentStage = plantStageForIndex(currentIndex < 0 ? 0 : currentIndex, levels.length);

  return (
    <header className="glass sticky top-0 z-30 h-14 border-b border-white/[0.06] md:h-[76px]">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 md:gap-6 md:px-6 lg:px-8">

        {/* Primary in-app nav — pill tabs, authenticated users only */}
        {isAuthenticated && <NavTabs />}

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="English Connection"
            width={44}
            height={44}
            className="h-9 w-auto sm:h-6"
          />
          {/* PRO badge — sits right next to the logo mark. */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black leading-none tracking-tight text-white drop-shadow-sm lg:hidden"
            style={{ background: "var(--pro-pill)" }}
          >
            PRO
          </span>
          <span className="hidden text-sm font-bold text-heading sm:block">
            English Connection
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              {/* XP chip — opens the leaderboard popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLeaderboardOpen((o) => !o)}
                  aria-label="Open global leaderboard"
                  aria-expanded={leaderboardOpen}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-cyan transition-colors hover:bg-surface-2"
                >
                  <Zap className="hidden h-3.5 w-3.5 md:block" />
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-2"
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
          <AccountChip />
        </div>
      </div>
    </header>
  );
}

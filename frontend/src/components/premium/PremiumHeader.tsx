"use client";

import { Crown } from "lucide-react";
import { useIsPro } from "@/hooks/useIsPro";

// Header for /v3/premium. For Pro members it drops the upsell copy and instead
// states their plan status + when it's active until. For free users it's the
// "Unlock the full experience" pitch.
export default function PremiumHeader() {
  const { isPro, premiumUntil } = useIsPro();

  const untilLabel = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  if (isPro) {
    return (
      <header className="text-center">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Crown className="h-4 w-4" /> You&apos;re Pro
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-heading sm:text-4xl">You&apos;re all set</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body">
          Your Pro plan is active
          {untilLabel ? (
            <>
              {" "}until <span className="font-semibold text-heading">{untilLabel}</span>
            </>
          ) : null}{" "}
          — unlimited sentences, daily practice with K.AI, the full leaderboard, and priority support. Everything below is yours.
        </p>
      </header>
    );
  }

  return (
    <header className="text-center">
      <p className="text-sm font-semibold text-primary">English Connection Pro</p>
      <h1 className="mt-2 text-3xl font-extrabold text-heading sm:text-4xl">Unlock the full experience</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body">
        Free gets you started. Pro removes the limits — more sentences, more daily practice with K.AI, and the full leaderboard.
      </p>
    </header>
  );
}

"use client";

import { Crown } from "lucide-react";
import { useIsPro } from "@/hooks/useIsPro";

// Header for /v3/premium: one line each. Pro members see when their plan ends;
// free users see the pitch (the cards below carry the detail).
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
        {untilLabel && (
          <h1 className="mt-2 text-3xl font-extrabold text-heading sm:text-4xl">Active until {untilLabel}</h1>
        )}
      </header>
    );
  }

  return (
    <header className="text-center">
      <p className="text-sm font-semibold text-primary">English Connection Pro</p>
      <h1 className="mt-2 text-3xl font-extrabold text-heading sm:text-4xl">Practise without limits</h1>
    </header>
  );
}

"use client";

import { useState, type ComponentType, type CSSProperties, type MouseEvent } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import {
  JumbleScene,
  PronunciationScene,
  AiPartnerScene,
  LeaderboardScene,
} from "@/components/dashboard/TrainingShowcaseCards";
import { useIsPro } from "@/hooks/useIsPro";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import TrialModal from "./TrialModal";

// Pro feature cards for /v3/premium (and reused, one at a time, in the
// quota-reached Go-Pro modal). Each card is a thin white frame around a scene
// panel: the dashboard's training showcase SCENE (static — hovered=false pauses
// every animation) washed with the matching per-feature TINT var, title + free
// baseline over the tint, and the Pro upgrade in the white space below.
type Scene = ComponentType<{ hovered: boolean }>;

export type ProFeature = {
  key: string;
  name: string;
  Scene: Scene;
  free: string; // free-tier baseline
  pro: string; // what Pro unlocks
  accent: string; // circular button colour
  tint: string; // per-feature wash (dashboard tint var; light+dark aware)
  route: string; // where a Pro member goes on click — the live game/section
};

export const PRO_FEATURES: ProFeature[] = [
  {
    key: "jumble",
    name: "Jumble Words",
    Scene: JumbleScene,
    free: "18 sentences daily",
    pro: "4,500 sentences",
    accent: "bg-amber-600 group-hover:bg-amber-700",
    tint: "var(--tint-jumble)",
    route: "/dashboard/jumble",
  },
  {
    key: "pronunciation",
    name: "Pronunciation",
    Scene: PronunciationScene,
    free: "3 sentences daily",
    pro: "1,500 sentences",
    accent: "bg-violet-600 group-hover:bg-violet-700",
    tint: "var(--tint-pron)",
    route: "/dashboard/pronunciation",
  },
  {
    key: "ai",
    name: "AI Partner",
    Scene: AiPartnerScene,
    free: "20 min / week",
    pro: "20 min / day",
    accent: "bg-emerald-600 group-hover:bg-emerald-700",
    tint: "var(--tint-ai)",
    route: "/dashboard/ai-partner",
  },
  {
    key: "leaderboard",
    name: "Leaderboard",
    Scene: LeaderboardScene,
    free: "Top 10 only",
    pro: "See your exact rank",
    accent: "bg-cyan-600 group-hover:bg-cyan-700",
    tint: "var(--tint-lead)",
    route: "/dashboard/leaderboard",
  },
];

// proFeatureByKey looks up a single feature (e.g. for the quota modal).
export function proFeatureByKey(key: string): ProFeature | undefined {
  return PRO_FEATURES.find((f) => f.key === key);
}

// ProFeatureCard renders ONE feature card. `href` defaults to the in-page
// anchor; Pro members pass the game route, the quota modal passes "/v3/premium".
// When `onClick` is set (free users on /v3/premium) the card opens the trial
// modal instead of navigating. External (http) links open in a new tab.
export function ProFeatureCard({
  f,
  href = "#",
  style,
  ariaLabel,
  onClick,
}: {
  f: ProFeature;
  href?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  onClick?: (e: MouseEvent) => void;
}) {
  const Scene = f.Scene;
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={ariaLabel ?? `${f.name} — unlock Pro`}
      className="pro-card group block rounded-[1.75rem] bg-white p-2.5 shadow-[0_18px_50px_-22px_rgba(0,0,0,0.45)] ring-1 ring-black/[0.04] transition-transform duration-300 hover:-translate-y-1.5 dark:bg-[#14171c] dark:ring-white/[0.06]"
      style={style}
    >
      <div className="relative h-[168px] overflow-hidden rounded-[1.45rem]">
        {/* Scene (static) on the right, washed with the feature tint */}
        <Scene hovered={false} />
        <div className="pointer-events-none absolute inset-0" style={{ background: f.tint }} />

        {/* PRO badge, top-right */}
        <span className="absolute right-4 top-4 z-10 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-gray-900 shadow-sm">
          PRO
        </span>

        {/* Title + free baseline overlaid in the left space, over the tint */}
        <div className="relative z-10 max-w-[62%] p-5">
          <h3 className="text-2xl font-extrabold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            {f.name}
          </h3>
          <p className="mt-1.5 text-sm font-medium text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
            Free · {f.free}
          </p>
        </div>
      </div>

      {/* Pro description sits in the white space below the panel */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-3.5">
        <div className="rounded-full bg-gray-50 px-4 py-2.5 ring-1 ring-black/[0.05] dark:bg-white/[0.06] dark:ring-white/[0.08]">
          <span className="block whitespace-nowrap text-[13px] font-extrabold text-gray-900 dark:text-white">
            Pro · {f.pro}
          </span>
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-md transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${f.accent}`}
        >
          <ArrowUpRight size={18} strokeWidth={2.5} />
        </span>
      </div>
    </a>
  );
}

// Everything Pro unlocks beyond the per-feature limits — mirrors the perks in
// the mobile Go-Pro sheet.
const PRO_PERKS = [
  "No daily quota — practise unlimited",
  "Full leaderboard & your exact rank",
  "WhatsApp & priority support",
  "Every game fully unlocked",
];

export default function ProFeatureCards() {
  const { isPro } = useIsPro();
  // Pro members' AI Partner card would navigate straight into the chat — the
  // guard cancels that and pops the "we're upgrading" modal while it's gated.
  const { guard: aiPartnerGuard } = useAIPartnerGate();
  const [trialOpen, setTrialOpen] = useState(false);
  const openTrial = (e: MouseEvent) => {
    e.preventDefault();
    setTrialOpen(true);
  };
  return (
    <section className="mt-10">
      {/* One common card wrapping the four feature cards, the other perks, and
          the final Go-Pro call to action. */}
      <div className="rounded-[2rem] border border-black/[0.06] bg-black/[0.015] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PRO_FEATURES.map((f, i) => (
            <ProFeatureCard
              key={f.key}
              f={f}
              // Pro members already own everything — send them straight to the
              // game/section; free users open the free-trial modal.
              href={isPro ? f.route : "#"}
              onClick={isPro ? (f.key === "ai" ? aiPartnerGuard : undefined) : openTrial}
              ariaLabel={isPro ? `Open ${f.name}` : `${f.name} — start your free trial`}
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <div className="mt-6 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
          <p className="text-sm font-bold text-heading">Every Pro plan also includes</p>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-body">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {perk}
              </li>
            ))}
          </ul>
        </div>

        {isPro ? (
          <button
            disabled
            className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-black/[0.06] py-3.5 text-base font-bold text-muted-foreground dark:bg-white/[0.06]"
          >
            <Check className="h-5 w-5" strokeWidth={2.5} /> You&apos;re Pro
          </button>
        ) : (
          <button
            onClick={() => setTrialOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f9d2c] py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-105"
          >
            Go Pro — it&apos;s free right now <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <TrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />

      <style>{`
        @keyframes proRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pro-card { animation: proRise .5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .pro-card { animation: none !important; } }
      `}</style>
    </section>
  );
}

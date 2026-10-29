"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { Puzzle, Sparkles, Mic, ArrowUpRight } from "lucide-react";

import { fromSessionUser } from "@/lib/displayUser";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";

import WeeklyActivityChart from "@/components/v3/WeeklyActivityChart";
import ActivityHeatmap, { computeStreak } from "@/components/v3/ActivityHeatmap";
import { StreakCard } from "@/components/badges/StreakCard";
import {
  TrainingShowcaseCards,
  TrainingShowcaseCarousel,
} from "@/components/dashboard/TrainingShowcaseCards";
import { ActivityStatsCarousel } from "@/components/dashboard/ActivityStatsCarousel";
import LearnHomeCard from "@/components/dashboard/LearnHomeCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  v3FetchMyActivity,
  v3FetchMyAttributes,
  v3FetchMyProfile,
  type V3Activity,
  type V3UserAttributes,
} from "@/lib/v3Game";

export default function DashboardPage() {
  const session = useSession();
  // AI Partner is flag-gated while it's being rebuilt — the hero CTA opens the
  // "upgrading" popup instead of the chat.
  const { guard: aiPartnerGuard } = useAIPartnerGate();
  const accessToken = session.data?.user?.accessToken ?? "";

  const user = fromSessionUser(session.data?.user);
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  const [rows, setRows] = useState<V3Activity[]>([]);
  const [attrs, setAttrs] = useState<V3UserAttributes | null>(null);
  // Paying-user flag for the status card. Derived from premiumUntil (ISO) on
  // the profile; absent/past = free.
  const [isPro, setIsPro] = useState(false);
  // The Pro expiry (ISO) to surface on the upsell card; null for free users.
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  // Starts true so the first paint shows full-height skeletons instead of the
  // empty-state layout — otherwise the chart/heatmap/weekly sections pop in
  // once data arrives and shove the page around. (Flipping it off lives in the
  // async .finally below to stay clear of the set-state-in-effect rule.)
  const [loading, setLoading] = useState(true);

  // Login streak (same calc the heatmap uses) — drives the hero's streak tile.
  const streak = useMemo(() => computeStreak(rows), [rows]);


  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([
      v3FetchMyActivity(accessToken, 200).catch(() => [] as V3Activity[]),
      v3FetchMyAttributes(accessToken).catch(() => null),
      v3FetchMyProfile(accessToken).catch(() => null),
    ])
      .then(([a, at, profile]) => {
        if (!cancelled) {
          setRows(a);
          setAttrs(at);
          const until = profile?.premiumUntil ?? null;
          setPremiumUntil(until);
          setIsPro(!!until && new Date(until).getTime() > Date.now());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accessToken]);

  return (
    <div className="space-y-5 md:space-y-8">
      {/* ── Top section: welcome + activity ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        {/* Welcome hero — mobile: text + square streak tile side by side; md+:
            the original stacked text/CTA column (unchanged). */}
        <div className="relative overflow-hidden rounded-2xl c-box px-6 py-4 md:p-8 flex flex-row items-center justify-between gap-4 min-h-0 md:min-h-[220px] md:flex-col md:items-stretch md:justify-between md:gap-0">
          {/* Just the name — level and XP are in the navbar, the drills below. */}
          <h1 className="min-w-0 text-3xl font-extrabold text-heading">Hi, {firstName}</h1>

          {/* Mobile-only streak tile — square, fitted to the hero's right edge */}
          {streak > 0 && (
            <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] md:hidden">
              <StreakCard days={streak} animate={false} compact />
            </div>
          )}

          {/* CTAs — hidden on mobile (the carousel below is the entry point) */}
          <div className="mt-6 hidden flex-wrap gap-3 md:flex">
            <Link
              href="/dashboard/jumble"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-[#0b0e14] transition-colors hover:bg-primary-1"
            >
              <Puzzle className="h-4 w-4" />
              Play Jumble Words
            </Link>
            <Link
              href="/dashboard/ai-partner"
              onClick={aiPartnerGuard}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface-2/60 px-5 py-2.5 text-sm font-semibold text-heading transition-colors hover:bg-surface-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Partner
            </Link>
          </div>

          {/* Decorative gradient */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-[80px]"
            style={{ background: "radial-gradient(circle, var(--primary-1), transparent 70%)" }}
          />
        </div>

        {/* Activity card (right column) — skeleton while loading so the chart
            doesn't pop in and resize the row once data arrives. */}
        {loading ? (
          <div className="hidden lg:block">
            <WeeklyChartSkeleton />
          </div>
        ) : rows.length > 0 ? (
          <div className="hidden lg:block">
            <WeeklyActivityChart rows={rows} attributes={attrs} isPro={isPro} />
          </div>
        ) : null}
      </div>

      {/* ── Trainings section ── */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-heading">Practice</h2>

        {/* Tablet + desktop (md and up) — illustrated, blue-frosted grid */}
        <TrainingShowcaseCards />

        {/* Mobile (< md) — same cards in a swipe row, the next one peeking */}
        <TrainingShowcaseCarousel />
      </section>

      {/* ── Learn library (free lessons) — only while the admin switch shows it ── */}
      <LearnHomeCard />

      {/* ── Go Pro (mobile only, free users) — phones have no "Pro" navbar tab,
          so the home screen carries the way to buy or apply for Pro. Waits for
          the profile so Pro members never see it flash. ── */}
      {!loading && !isPro && session.data?.user?.isPro !== true && (
        <section className="md:hidden">
          <PremiumUpsellCard isPro={false} premiumUntil={null} />
        </section>
      )}

      {/* ── Your Activities (mobile only, < md) — Monthly (heatmap) + Weekly
          (this-week chart) stats in an infinite carousel with a toggle. On
          md+ these render standalone below instead. ── */}
      {(loading || rows.length > 0) && (
        <section className="md:hidden">
          <ActivityStatsCarousel rows={rows} attributes={attrs} loading={loading} isPro={isPro} />
        </section>
      )}

      {/* ── Activity heatmap (md+ only) + Premium upsell beside it. Mobile shows
          the heatmap in "Your Activities" and the Pro card above. ── */}
      <section className="hidden gap-6 md:grid lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {loading ? (
            <HeatmapSkeleton />
          ) : rows.length > 0 ? (
            <ActivityHeatmap rows={rows} />
          ) : (
            <div className="c-box flex h-full min-h-[180px] items-center justify-center rounded-2xl p-6 text-center text-sm text-body">
              Your last 3 months of activity will show up here.
            </div>
          )}
        </div>
        <PremiumUpsellCard isPro={isPro} premiumUntil={premiumUntil} />
      </section>

      {/* ── Weekly chart (tablet only — mobile shows it in the Your Activities
          carousel, desktop has it in the top-right) ── */}
      {loading ? (
        <section className="hidden md:block lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <WeeklyChartSkeleton />
        </section>
      ) : rows.length > 0 ? (
        <section className="hidden md:block lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-heading">This Week</h2>
            <Link href="/dashboard/activity" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <WeeklyActivityChart rows={rows} attributes={attrs} isPro={isPro} />
        </section>
      ) : null}
    </div>
  );
}

// Skeleton matching WeeklyActivityChart's footprint exactly (mobile: PRO bar
// stacked over an h-80 chart; desktop: 200px PRO card beside a 600px chart,
// both h-80) so swapping in the real chart causes no layout shift.
function WeeklyChartSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 lg:h-80 lg:w-auto lg:flex-row lg:gap-4">
      <Skeleton className="h-[52px] w-full rounded-2xl lg:hidden" />
      <Skeleton className="hidden w-[200px] shrink-0 rounded-[22px] lg:block" />
      <Skeleton className="h-56 w-full rounded-[22px] lg:h-80 lg:w-[600px]" />
    </div>
  );
}

// Skeleton roughly matching ActivityHeatmap's card height so the section
// below it doesn't jump when the real grid loads in.
function HeatmapSkeleton() {
  return (
    <div className="c-box rounded-2xl px-6 py-4 md:p-6">
      <Skeleton className="mb-4 h-4 w-56" />
      <Skeleton className="h-[108px] w-full rounded-md md:h-[132px]" />
    </div>
  );
}

// PremiumUpsellCard — full green card with a white arrow button embedded
// top-right and the headline Pro benefits. Links to /v3/premium. For paying
// users it reads "Pro Unlocked" and shows the Pro-until date instead of the
// upsell headline. Theme-aware: green, text and button shift between modes.
function PremiumUpsellCard({
  isPro,
  premiumUntil,
}: {
  isPro: boolean;
  premiumUntil: string | null;
}) {
  const benefits = [
    { icon: Puzzle, value: "4,500", label: "Jumble Words sentences" },
    { icon: Mic, value: "1,500", label: "Pronunciation sentences" },
    { icon: Sparkles, value: "20 min/day", label: "with K.AI" },
  ];
  const untilLabel = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  return (
    <Link
      href="/v3/premium"
      aria-label={isPro ? "Pro — view your plan" : "Go Pro — unlock everything"}
      className="group block h-full transition-transform hover:scale-[1.01]"
    >
      <div className="relative flex h-full min-h-[180px] flex-col overflow-hidden rounded-2xl bg-[#8ce16a] p-6 dark:bg-[#3f9d2c]">
        {/* White CTA button embedded in the top-right corner, on the green. */}
        <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-neutral-900 shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:bg-[#f1f1f1]">
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
        </span>

        <h3 className="pr-16 text-4xl font-bold tracking-tight md:text-5xl text-[#15240c] dark:text-[#0f1f08]">
          {isPro ? "Pro Unlocked" : "Unlock Pro"}
        </h3>
        {isPro && untilLabel && (
          <p className="mt-2 text-sm font-bold text-[#15240c]/80 dark:text-[#06140a]/85">
            Pro until {untilLabel}
          </p>
        )}

        <ul className="mt-auto flex flex-col gap-2.5 pt-5 text-[#15240c] dark:text-[#06140a]">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <li key={b.label} className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/40 dark:bg-white/25">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13px] leading-tight">
                  <span className="font-extrabold">{b.value}</span> {b.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Link>
  );
}

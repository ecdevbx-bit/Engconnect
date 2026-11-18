"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ArrowRight, Blocks, Check, Crown, Flame, GraduationCap, Mic, Shield, Trophy, Zap } from "lucide-react";

import { useSession } from "@/lib/session";
import { fromSessionUser } from "@/lib/displayUser";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import { useLearnVisible } from "@/hooks/useLearnVisible";
import { useAppSelector } from "@/store/hooks";
import { KaiIcon } from "@/components/layout/navIcons";
import { computeStreak } from "@/components/v3/ActivityHeatmap";
import { StatRing, minutesLabel } from "@/components/ui/stat-ring";
import { cn } from "@/lib/utils";
import { v3FetchMyActivity, v3FetchMyProfile, type V3Activity } from "@/lib/v3Game";
import { v3FetchAIUsage, type V3AIUsage } from "@/lib/v3Chat";

/**
 * Home (D-071) — pictures and numbers, very few words (owner: "like
 * Duolingo… there's so much text"). Today ring + one big button, practice
 * tiles (icon + name), progress as icon-numbers, a short Pro card.
 */

type PracticeId = "jumble" | "pronunciation" | "ai-partner";

type Practice = {
  id: PracticeId;
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  tile: string;
  cta: string;
};

const PRACTICES: Record<PracticeId, Practice> = {
  "ai-partner": {
    id: "ai-partner",
    title: "Talk to K.AI",
    href: "/dashboard/ai-partner",
    icon: KaiIcon,
    tile: "bg-kai-soft text-kai",
    cta: "Talk to K.AI",
  },
  pronunciation: {
    id: "pronunciation",
    title: "Pronunciation",
    href: "/dashboard/pronunciation",
    icon: Mic,
    tile: "bg-speak-soft text-speak",
    cta: "Speak",
  },
  jumble: {
    id: "jumble",
    title: "Jumble Words",
    href: "/dashboard/jumble",
    icon: Blocks,
    tile: "bg-words-soft text-words",
    cta: "Play Words",
  },
};

// Order in which "Today" suggests the next practice: the easiest warm-up first.
const GOAL_ORDER: PracticeId[] = ["jumble", "pronunciation", "ai-partner"];

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function DashboardPage() {
  const session = useSession();
  // AI Partner is flag-gated while it's being rebuilt — links open the
  // "upgrading" popup instead of the chat.
  const { guard: aiPartnerGuard } = useAIPartnerGate();
  const learnVisible = useLearnVisible();
  const accessToken = session.data?.user?.accessToken ?? "";
  const { totalXP, currentLevel, levels } = useAppSelector((s) => s.xp);

  const user = fromSessionUser(session.data?.user);
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  const [rows, setRows] = useState<V3Activity[]>([]);
  const [usage, setUsage] = useState<V3AIUsage | null>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [proActive, setProActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([
      v3FetchMyActivity(accessToken, 200).catch(() => [] as V3Activity[]),
      v3FetchMyProfile(accessToken).catch(() => null),
      v3FetchAIUsage(accessToken).catch(() => null),
    ])
      .then(([a, profile, u]) => {
        if (cancelled) return;
        setRows(a);
        setUsage(u);
        const until = profile?.premiumUntil ?? null;
        setPremiumUntil(until);
        setProActive(!!until && new Date(until).getTime() > Date.now());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accessToken]);

  const isPro = session.data?.user?.isPro === true || proActive;

  const streak = useMemo(() => computeStreak(rows), [rows]);
  const doneToday = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (isToday(r.timestamp)) s.add(r.category);
    return s;
  }, [rows]);
  const doneCount = GOAL_ORDER.filter((id) => doneToday.has(id)).length;
  const next = PRACTICES[GOAL_ORDER.find((id) => !doneToday.has(id)) ?? "ai-partner"];

  // Level progress.
  const sorted = [...levels].sort((a, b) => a.threshold - b.threshold);
  const cur = sorted.find((l) => l.level === currentLevel) ?? sorted[0];
  const nxt = sorted.find((l) => l.threshold > (cur?.threshold ?? 0));
  const levelPct = nxt && cur
    ? Math.min(100, Math.max(0, ((totalXP - cur.threshold) / (nxt.threshold - cur.threshold)) * 100))
    : 100;

  // This week's days (Mon..Sun) with any activity.
  const week = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const active = new Set(rows.map((r) => new Date(r.timestamp).toDateString()));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        label: d.toLocaleDateString("en-IN", { weekday: "narrow" }),
        name: d.toLocaleDateString("en-IN", { weekday: "long" }),
        active: active.has(d.toDateString()),
        today: d.toDateString() === now.toDateString(),
      };
    });
  }, [rows]);

  // K.AI minutes left in the current window (free: week, Pro: day).
  const kaiMins = usage && usage.capSeconds > 0 ? minutesLabel(usage.remainingSeconds) : null;
  const kaiFrac = usage && usage.capSeconds > 0 ? usage.remainingSeconds / usage.capSeconds : 1;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 md:space-y-6">
      {/* Greeting + streak */}
      <header className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-[28px] font-extrabold leading-tight text-heading md:text-4xl">
          Hi, {firstName}
        </h1>
        <Link
          href="/dashboard/activity"
          aria-label={`${streak} day streak — see your progress`}
          className={cn(
            "ec-press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 font-display text-[18px] font-extrabold",
            streak > 0 ? "bg-brand-soft text-primary" : "bg-surface-2 text-muted-foreground",
          )}
        >
          <Flame className="h-5 w-5" />
          {streak}
        </Link>
      </header>

      <div className="grid gap-5 md:gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Today */}
        <section aria-label="Today's goal" className="ec-card flex flex-col gap-5 p-5 md:p-6">
          <div className="flex items-center gap-5">
            <StatRing
              value={loading ? 0 : doneCount / 3}
              label={loading ? "" : `${doneCount}/3`}
              size={84}
              stroke={9}
              ariaLabel={`${doneCount} of 3 practices done today`}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-extrabold text-heading">Today</h2>
              <ul className="mt-2 flex gap-2" aria-label="Today's practices">
                {GOAL_ORDER.map((id) => {
                  const p = PRACTICES[id];
                  const done = doneToday.has(id);
                  return (
                    <li
                      key={id}
                      title={p.title}
                      className={cn(
                        "relative grid h-11 w-11 place-items-center rounded-full",
                        done ? "bg-good text-white dark:text-[#06140a]" : p.tile,
                      )}
                    >
                      {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <p.icon className="h-5 w-5" />}
                      <span className="sr-only">{p.title}: {done ? "done" : "not done yet"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <Link
            href={next.href}
            onClick={next.id === "ai-partner" ? aiPartnerGuard : undefined}
            className="ec-press mt-auto inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-[18px] font-extrabold text-primary-foreground shadow-[0_6px_18px_rgba(232,93,12,0.25)] hover:bg-primary/90"
          >
            <next.icon className="h-6 w-6" />
            {doneCount === 3 ? "Keep going" : next.cta}
          </Link>
        </section>

        {/* Progress — icons and numbers */}
        <Link
          href="/dashboard/activity"
          aria-label="Your progress — open details"
          className="ec-card ec-press flex flex-col gap-5 p-5 transition-colors hover:bg-surface-2/50 md:p-6"
        >
          <div className="grid grid-cols-3 gap-2.5">
            <Stat icon={Shield} tone="text-primary" value={`${currentLevel}`} label="Level" />
            <Stat icon={Zap} tone="text-words" value={compact(totalXP)} label="XP" />
            <Stat icon={Flame} tone="text-primary" value={`${streak}`} label="Days" />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[14px] font-bold">
              <span className="text-heading">Level {currentLevel}</span>
              {nxt && (
                <span className="tabular-nums text-muted-foreground">
                  {totalXP.toLocaleString("en-IN")} / {nxt.threshold.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelPct)} aria-label="Progress to next level">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${levelPct}%` }} />
            </div>
          </div>

          <ol className="grid grid-cols-7 gap-1.5" aria-label="This week">
            {week.map((d, i) => (
              <li key={i} className="flex justify-center">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full text-[13px] font-extrabold",
                    d.active
                      ? "bg-primary text-primary-foreground"
                      : d.today
                        ? "border-2 border-primary text-primary"
                        : "bg-surface-2 text-muted-foreground",
                  )}
                  aria-label={`${d.name}${d.active ? ": practised" : ""}`}
                >
                  {d.active ? <Flame className="h-4 w-4" /> : d.label}
                </span>
              </li>
            ))}
          </ol>
        </Link>
      </div>

      {/* Practice tiles — icon + name only */}
      <section aria-label="Practice" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Tile
          href={PRACTICES["ai-partner"].href}
          onClick={aiPartnerGuard}
          icon={KaiIcon}
          tile={PRACTICES["ai-partner"].tile}
          title="Talk to K.AI"
          done={doneToday.has("ai-partner")}
          wide
          extra={
            kaiMins ? (
              <StatRing
                value={kaiFrac}
                label={kaiMins.label}
                unit={kaiMins.unit}
                size={68}
                stroke={7}
                color="var(--kai)"
                ariaLabel={`${kaiMins.label} ${kaiMins.unit === "min" ? "minutes" : "seconds"} left ${usage?.pro ? "today" : "this week"}`}
              />
            ) : null
          }
        />
        <Tile href={PRACTICES.pronunciation.href} icon={Mic} tile={PRACTICES.pronunciation.tile} title="Speak" done={doneToday.has("pronunciation")} />
        <Tile href={PRACTICES.jumble.href} icon={Blocks} tile={PRACTICES.jumble.tile} title="Words" done={doneToday.has("jumble")} />
        {learnVisible && <Tile href="/learn" icon={GraduationCap} tile="bg-learn-soft text-learn" title="Learn" />}
        <Tile href="/dashboard/leaderboard" icon={Trophy} tile="bg-brand-soft text-primary" title="Ranks" className="md:hidden" />
      </section>

      {/* Pro */}
      {!loading && (
        <Link
          href="/v3/premium"
          className="ec-press group flex items-center gap-4 rounded-[22px] p-4 text-primary-foreground md:p-5"
          style={{ background: "var(--pro-card)" }}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Crown className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1 font-display text-[19px] font-extrabold leading-tight">
            {isPro ? "Pro" : "Go Pro"}
            {isPro && premiumUntil && (
              <span className="ml-2 text-[15px] font-bold opacity-90">
                till {new Date(premiumUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </span>
          <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function compact(n: number): string {
  if (n >= 100000) return `${Math.round(n / 1000)}k`;
  if (n >= 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-IN");
}

function Stat({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 px-2 py-3">
      <Icon className={cn("h-6 w-6", tone)} />
      <span className="font-display text-[22px] font-extrabold leading-none text-heading tabular-nums">{value}</span>
      <span className="text-[13px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

function Tile({
  href,
  onClick,
  icon: Icon,
  tile,
  title,
  done,
  wide,
  extra,
  className,
}: {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  icon: ComponentType<{ className?: string }>;
  tile: string;
  title: string;
  done?: boolean;
  wide?: boolean;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "ec-card ec-press relative flex min-h-[120px] items-center gap-4 p-4 transition-colors hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        wide ? "col-span-2" : "flex-col justify-center text-center",
        className,
      )}
    >
      <span className={cn("relative grid shrink-0 place-items-center rounded-2xl", wide ? "h-16 w-16" : "h-14 w-14", tile)}>
        <Icon className={wide ? "h-8 w-8" : "h-7 w-7"} />
        {done && (
          <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-good text-white ring-2 ring-surface-1 dark:text-[#06140a]" aria-label="Done today">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={cn("font-display font-extrabold text-heading", wide ? "flex-1 text-[20px]" : "text-[17px]")}>
        {title}
      </span>
      {extra}
    </Link>
  );
}

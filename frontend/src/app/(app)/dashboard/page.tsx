"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ArrowRight, Blocks, Check, ChevronRight, Crown, Flame, GraduationCap, Mic, Trophy } from "lucide-react";

import { useSession } from "@/lib/session";
import { fromSessionUser } from "@/lib/displayUser";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import { useLearnVisible } from "@/hooks/useLearnVisible";
import { useAppSelector } from "@/store/hooks";
import { KaiIcon } from "@/components/layout/navIcons";
import { computeStreak } from "@/components/v3/ActivityHeatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  v3FetchMyActivity,
  v3FetchMyProfile,
  type V3Activity,
} from "@/lib/v3Game";

/**
 * Home (D-071). One clear next step first ("Today" card with a daily goal of
 * the three practices), then the practices as a plain list, then progress and
 * Pro. The heatmap and weekly chart live on /dashboard/activity.
 */

type PracticeId = "jumble" | "pronunciation" | "ai-partner";

type Practice = {
  id: PracticeId;
  title: string;
  line: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  tile: string; // soft tile classes
  cta: string; // the Today button label when this is next
};

const PRACTICES: Practice[] = [
  {
    id: "ai-partner",
    title: "Talk to K.AI",
    line: "Speak about anything. K.AI answers and gently fixes your English.",
    href: "/dashboard/ai-partner",
    icon: KaiIcon,
    tile: "bg-kai-soft text-kai",
    cta: "Start talking",
  },
  {
    id: "pronunciation",
    title: "Pronunciation",
    line: "Say a sentence and see how each word sounded.",
    href: "/dashboard/pronunciation",
    icon: Mic,
    tile: "bg-speak-soft text-speak",
    cta: "Practise speaking",
  },
  {
    id: "jumble",
    title: "Jumble Words",
    line: "Put the words in the right order to make a sentence.",
    href: "/dashboard/jumble",
    icon: Blocks,
    tile: "bg-words-soft text-words",
    cta: "Play Jumble Words",
  },
];

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
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([
      v3FetchMyActivity(accessToken, 200).catch(() => [] as V3Activity[]),
      v3FetchMyProfile(accessToken).catch(() => null),
    ])
      .then(([a, profile]) => {
        if (cancelled) return;
        setRows(a);
        setPremiumUntil(profile?.premiumUntil ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accessToken]);

  const isPro =
    session.data?.user?.isPro === true ||
    (!!premiumUntil && new Date(premiumUntil).getTime() > Date.now());

  const streak = useMemo(() => computeStreak(rows), [rows]);
  const doneToday = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (isToday(r.timestamp)) s.add(r.category);
    return s;
  }, [rows]);
  const doneCount = GOAL_ORDER.filter((id) => doneToday.has(id)).length;
  const nextId = GOAL_ORDER.find((id) => !doneToday.has(id)) ?? "ai-partner";
  const next = PRACTICES.find((p) => p.id === nextId)!;

  // Level progress for the progress card.
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
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const active = new Set(rows.map((r) => new Date(r.timestamp).toDateString()));
    return days.map((d) => ({
      label: d.toLocaleDateString("en-IN", { weekday: "narrow" }),
      active: active.has(d.toDateString()),
      today: d.toDateString() === now.toDateString(),
      future: d > now,
    }));
  }, [rows]);

  const goalLine =
    doneCount === 0
      ? "Do all three practices today. Start with an easy one."
      : doneCount === 3
        ? "All three done today. Well done! Keep going if you like."
        : `${doneCount} of 3 done. Next: ${next.title}.`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Greeting + streak */}
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-extrabold leading-tight text-heading md:text-4xl">
            Hi, {firstName}
          </h1>
          <p className="mt-0.5 text-[15px] text-muted-foreground md:text-base">
            A few minutes of English every day goes a long way.
          </p>
        </div>
        {streak > 0 && (
          <Link
            href="/dashboard/activity"
            aria-label={`${streak} day streak — see your progress`}
            className="ec-press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-4 font-display text-[17px] font-extrabold text-primary"
          >
            <Flame className="h-5 w-5" />
            {streak}
          </Link>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Today */}
        <section aria-labelledby="today-title" className="ec-card flex flex-col gap-5 p-5 md:p-6">
          <div className="flex items-center gap-4">
            <GoalRing done={doneCount} loading={loading} />
            <div className="min-w-0">
              <h2 id="today-title" className="text-xl font-extrabold text-heading">Today&apos;s goal</h2>
              {loading ? (
                <Skeleton className="mt-2 h-4 w-48" />
              ) : (
                <p className="mt-0.5 text-[15px] leading-snug text-body">{goalLine}</p>
              )}
            </div>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Today's practices">
            {GOAL_ORDER.map((id) => {
              const p = PRACTICES.find((x) => x.id === id)!;
              const done = doneToday.has(id);
              return (
                <li
                  key={id}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-bold",
                    done ? "bg-good-soft text-good" : "bg-surface-2 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <p.icon className="h-4 w-4" />}
                  {p.title.replace("Talk to ", "")}
                  <span className="sr-only">{done ? "done" : "not done yet"}</span>
                </li>
              );
            })}
          </ul>

          <Link
            href={next.href}
            onClick={next.id === "ai-partner" ? aiPartnerGuard : undefined}
            className="ec-press mt-auto inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-[17px] font-extrabold text-primary-foreground shadow-[0_6px_18px_rgba(232,93,12,0.25)] hover:bg-primary/90"
          >
            <next.icon className="h-5 w-5" />
            {next.cta}
          </Link>
        </section>

        {/* Progress */}
        <section aria-labelledby="progress-title" className="ec-card flex flex-col gap-5 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="progress-title" className="text-xl font-extrabold text-heading">Your progress</h2>
            <Link href="/dashboard/activity" className="inline-flex h-10 items-center gap-1 rounded-full px-2 text-[15px] font-bold text-primary hover:underline">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat value={`${currentLevel}`} label="Level" />
            <Stat value={totalXP.toLocaleString("en-IN")} label="XP" />
            <Stat value={`${streak}`} label={streak === 1 ? "Day streak" : "Days streak"} />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2 text-[14px]">
              <span className="font-bold text-heading">{cur?.title ?? `Level ${currentLevel}`}</span>
              {nxt && (
                <span className="text-muted-foreground tabular-nums">
                  {Math.max(0, nxt.threshold - totalXP).toLocaleString("en-IN")} XP to level {nxt.level}
                </span>
              )}
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelPct)} aria-label="Progress to next level">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${levelPct}%` }} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[14px] font-bold text-heading">This week</p>
            <ol className="grid grid-cols-7 gap-1.5">
              {week.map((d, i) => (
                <li key={i} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold",
                      d.active
                        ? "bg-primary text-primary-foreground"
                        : d.today
                          ? "border-2 border-primary text-primary"
                          : "bg-surface-2 text-muted-foreground",
                      d.future && !d.active && "opacity-60",
                    )}
                    aria-label={`${d.label}${d.active ? ", practised" : ""}`}
                  >
                    {d.active ? <Check className="h-4 w-4" strokeWidth={3} /> : d.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* Practice list */}
      <section aria-labelledby="practice-title" className="space-y-3">
        <h2 id="practice-title" className="text-xl font-extrabold text-heading">Practice</h2>
        <ul className="ec-card divide-y divide-border overflow-hidden">
          {PRACTICES.map((p) => (
            <li key={p.id}>
              <PracticeRow
                href={p.href}
                onClick={p.id === "ai-partner" ? aiPartnerGuard : undefined}
                icon={p.icon}
                tile={p.tile}
                title={p.title}
                line={p.line}
                done={doneToday.has(p.id)}
              />
            </li>
          ))}
          {learnVisible && (
            <li>
              <PracticeRow
                href="/learn"
                icon={GraduationCap}
                tile="bg-learn-soft text-learn"
                title="Learn"
                line="Short grammar lessons with pictures."
              />
            </li>
          )}
          <li className="md:hidden">
            <PracticeRow
              href="/dashboard/leaderboard"
              icon={Trophy}
              tile="bg-brand-soft text-primary"
              title="Ranks"
              line="See how you compare with other learners."
            />
          </li>
        </ul>
      </section>

      {/* Pro */}
      {!loading && <ProCard isPro={isPro} premiumUntil={premiumUntil} />}
    </div>
  );
}

function GoalRing({ done, loading }: { done: number; loading: boolean }) {
  const pct = loading ? 0 : (done / 3) * 100;
  return (
    <div
      className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${pct}%, var(--surface-2) 0)` }}
      role="img"
      aria-label={`${done} of 3 practices done today`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-1 font-display text-[16px] font-extrabold text-heading">
        {loading ? "" : `${done}/3`}
      </span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-3">
      <p className="font-display text-[22px] font-extrabold leading-tight text-heading tabular-nums">{value}</p>
      <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function PracticeRow({
  href,
  onClick,
  icon: Icon,
  tile,
  title,
  line,
  done,
}: {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  icon: ComponentType<{ className?: string }>;
  tile: string;
  title: string;
  line: string;
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex min-h-[76px] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none md:px-5"
    >
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", tile)}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-[17px] font-bold text-heading">{title}</span>
          {done && (
            <span className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2 py-0.5 text-[12px] font-bold text-good">
              <Check className="h-3 w-3" strokeWidth={3} /> Today
            </span>
          )}
        </span>
        <span className="block text-[14px] leading-snug text-muted-foreground">{line}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ProCard({ isPro, premiumUntil }: { isPro: boolean; premiumUntil: string | null }) {
  const until = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  return (
    <Link
      href="/v3/premium"
      className="ec-press group relative flex items-center gap-4 overflow-hidden rounded-[22px] p-5 text-primary-foreground md:p-6"
      style={{ background: "var(--pro-card)" }}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
        <Crown className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[19px] font-extrabold leading-tight">
          {isPro ? "You're on Pro" : "Go Pro"}
        </span>
        <span className="block text-[14px] font-semibold opacity-90">
          {isPro
            ? until
              ? `Unlimited practice until ${until}`
              : "Unlimited practice"
            : "Unlimited practice, 20 min a day with K.AI, and K.AI remembers you."}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

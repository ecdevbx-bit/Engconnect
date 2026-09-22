import type { ReactNode } from "react";
import {
  Flame,
  Trophy,
  Zap,
  Star,
  Puzzle,
  Award,
  Sparkles,
  Lightbulb,
  Mic,
  Volume2,
  Check,
  X,
  Crown,
} from "lucide-react";
import { StreakCard } from "@/components/badges/StreakCard";
import { DUMMY_AVATARS as AVATARS } from "@/lib/dummyAvatars";

// PlatformInsights — a marketing carousel that previews the REAL in-app
// experience (profile, XP & levels, streaks, leaderboard, activity, badges,
// Jumble Words, Pronunciation Coach) with dummy data. Each card mirrors the
// layout/colours of its production counterpart and carries a one-line
// description. Runs as an infinite CSS marquee (compositor-only transform,
// pauses on hover/focus); with reduced motion it becomes a plain, manually
// scrollable row. A Server Component: all of it is plain HTML (only the reused
// StreakCard is a client island). Nothing here is wired to live data.

type Slide = { key: string; title: string; desc: string; width?: "wide"; render: () => ReactNode };

const SLIDES: Slide[] = [
  { key: "profile", title: "Your profile", desc: "Level, stats and rank at a glance.", render: () => <ProfileBody /> },
  { key: "xp", title: "XP & levels", desc: "Earn XP and level up as you learn.", render: () => <XpBody /> },
  { key: "streak", title: "Daily streaks", desc: "Practise daily, keep the flame alive.", render: () => <StreakBody /> },
  { key: "leaderboard", title: "Leaderboard", desc: "Compete on weekly & all-time boards.", render: () => <LeaderboardBody /> },
  { key: "activity", title: "Activity", desc: "Every day of practice, mapped.", render: () => <ActivityBody /> },
  { key: "week", title: "This week", desc: "Your daily progress this week.", width: "wide", render: () => <ThisWeekBody /> },
  { key: "badges", title: "Badges", desc: "Collect badges as you hit milestones.", render: () => <BadgesBody /> },
  { key: "jumble", title: "Jumble Words", desc: "Rebuild sentences with smart hints.", render: () => <JumbleBody /> },
  { key: "pronunciation", title: "Pronunciation Coach", desc: "Speak and get instant feedback.", render: () => <PronunciationBody /> },
];

export default function PlatformInsights() {
  // Continuous, seamless horizontal marquee. The set is rendered twice and the
  // track translates exactly -50% on a linear loop, so it slides forever without
  // a jump. Spacing lives on each card's right margin (not flex gap) so the
  // half-width offset lands precisely on a card boundary. Reduced motion is pure
  // CSS: the animation stops, the copy is hidden and the row scrolls by hand.
  return (
    <div className="insights-marquee group relative">
      <style>{MARQUEE_CSS}</style>
      <div className="insights-marquee-track flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
        {[...SLIDES, ...SLIDES].map((s, i) => (
          <InsightCard key={`${s.key}-${i}`} slide={s} ariaHidden={i >= SLIDES.length} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ slide, ariaHidden }: { slide: Slide; ariaHidden?: boolean }) {
  const w = slide.width === "wide" ? "w-[440px] sm:w-[520px]" : "w-[280px] sm:w-[320px]";
  return (
    <div aria-hidden={ariaHidden} className={`insights-card mr-4 shrink-0 ${w}`}>
      <div className="lp-glass flex h-[440px] flex-col overflow-hidden rounded-3xl p-6">
        <h3 className="text-base font-bold text-heading">{slide.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{slide.desc}</p>
        <div className="mt-4 min-h-0 flex-1">{slide.render()}</div>
      </div>
    </div>
  );
}

const MARQUEE_CSS = `
@keyframes insights-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.insights-marquee {
  overflow: hidden;
  /* Edges fade out via a mask (theme-agnostic — no colour overlay). */
  -webkit-mask-image: linear-gradient(to right, transparent, #000 40px, #000 calc(100% - 40px), transparent);
  mask-image: linear-gradient(to right, transparent, #000 40px, #000 calc(100% - 40px), transparent);
}
.insights-marquee-track {
  animation: insights-marquee 48s linear infinite;
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .insights-marquee { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
  .insights-marquee-track { animation: none; will-change: auto; }
  .insights-card[aria-hidden="true"] { display: none; }
}
`;

function Avatar({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
  );
}

// ── Profile ──────────────────────────────────────────────────────────────
function ProfileBody() {
  const stats = [
    { v: "248", l: "Lessons" },
    { v: "14", l: "Streak" },
    { v: "92%", l: "Accuracy" },
    { v: "31", l: "Badges" },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
          <Avatar src={AVATARS[3]} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-heading">Rohan T.</p>
          <p className="text-xs font-semibold text-primary">Level 7 · Fluent</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.l} className="rounded-xl bg-surface-2/50 px-3 py-3 text-center">
            <div className="text-lg font-bold text-heading">{s.v}</div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2/60 px-2.5 py-1 font-semibold text-heading">
          <Trophy className="h-3 w-3 text-primary" /> Rank #4
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2/60 px-2.5 py-1 font-semibold text-heading">
          <Flame className="h-3 w-3 text-pink" /> 14-day
        </span>
      </div>
    </div>
  );
}

// ── XP & levels (mirrors ProgressStatsCard) ─────────────────────────────────
function XpBody() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</div>
        <div className="text-gradient text-3xl font-bold tabular-nums">
          12,480 XP
        </div>
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-cyan">
          <Zap className="h-3.5 w-3.5" /> +320 XP today
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-heading">Level 7 · Fluent</span>
          <span className="text-muted-foreground">1,520 XP to Lv 8</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-gradient-to-r from-[#b79fff] to-[#ab8eff]" style={{ width: "64%" }} />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 rounded-xl bg-surface-2/50 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink">
          <Flame className="h-4 w-4" /> 5 <span className="font-normal text-muted-foreground">combo</span>
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i < 4
                  ? "bg-gradient-to-br from-[#b79fff] to-[#ab8eff]"
                  : i === 4
                    ? "bg-primary/30 ring-2 ring-primary/60"
                    : "bg-surface-3"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Daily streak (reuses the real StreakCard, compact) ──────────────────────
const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
function StreakBody() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl">
        <StreakCard days={14} compact animate={false} />
      </div>
      <div className="flex items-center justify-between">
        {WEEK.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-muted-foreground">{d}</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                i < 5 ? "bg-gradient-to-br from-[#f59e0b] to-[#f97316]" : "bg-surface-3"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leaderboard (mirrors the real WeeklyCard: crowned podium + ranks 4+) ─────
function LeaderboardBody() {
  return (
    <div className="flex h-full flex-col">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
        Weekly · XP
      </span>
      {/* Top-3 podium — #1 raised and crowned in the centre. */}
      <div className="flex items-end justify-center gap-4 pt-6">
        <PodiumCol rank={2} name="Diya P." xp={21340} avatar={AVATARS[1]} />
        <PodiumCol rank={1} name="Aarav S." xp={24820} avatar={AVATARS[0]} />
        <PodiumCol rank={3} name="Mehul K." xp={19980} avatar={AVATARS[2]} />
      </div>
      {/* Ranks 4+ list below. */}
      <div className="mt-auto space-y-1 pt-3">
        <LbRow rank={4} name="You" xp={12480} me avatar={AVATARS[3]} />
        <LbRow rank={5} name="Sneha M." xp={11200} avatar={AVATARS[4]} />
      </div>
    </div>
  );
}

const PODIUM_CFG: Record<1 | 2 | 3, { avatar: number; border: string; pillar: string }> = {
  1: { avatar: 54, border: "border-[#ffd028]", pillar: "h-28 from-[#f59e0b] to-[#f97316]" },
  2: { avatar: 40, border: "border-[#b79fff]", pillar: "h-20 from-[#b79fff] to-[#ab8eff]" },
  3: { avatar: 40, border: "border-[#c8b4ff]", pillar: "h-16 from-[#c8b4ff] to-[#8c64ff]" },
};

function PodiumCol({ rank, name, xp, avatar }: { rank: 1 | 2 | 3; name: string; xp: number; avatar: string }) {
  const c = PODIUM_CFG[rank];
  return (
    <div className="flex w-[56px] flex-col items-center justify-end">
      <div className="relative mb-2 flex flex-col items-center">
        {rank === 1 && (
          <Crown
            className="absolute -top-6 left-1/2 h-5 w-5 -translate-x-1/2 fill-current text-amber-500"
            aria-hidden="true"
          />
        )}
        <span
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${c.border}`}
          style={{ width: c.avatar, height: c.avatar }}
        >
          <Avatar src={avatar} />
        </span>
        <span className="mt-1.5 w-full truncate px-1 text-center text-xs font-semibold text-heading">{name}</span>
      </div>
      <div className={`relative flex w-full flex-col items-center overflow-hidden rounded-t-xl bg-gradient-to-b pt-2 ${c.pillar}`}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        <span className="z-10 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
          {(xp / 1000).toFixed(1)}k
        </span>
        <span className="z-10 mt-auto mb-1.5 text-2xl font-black text-white/40">#{rank}</span>
      </div>
    </div>
  );
}

function LbRow({ rank, name, xp, me, avatar }: { rank: number; name: string; xp: number; me?: boolean; avatar: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 ${me ? "bg-primary/15 ring-1 ring-primary/40" : ""}`}>
      <span className="w-5 text-center text-xs font-bold tabular-nums text-muted-foreground">#{rank}</span>
      <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
        <Avatar src={avatar} />
      </span>
      <span className={`flex-1 truncate text-sm ${me ? "font-bold text-heading" : "font-medium text-body"}`}>{name}</span>
      <span className={`tabular-nums text-xs font-semibold ${me ? "text-primary" : "text-muted-foreground"}`}>
        {(xp / 1000).toFixed(1)}k
      </span>
    </div>
  );
}

// ── Activity heatmap (mirrors ActivityHeatmap) ──────────────────────────────
// Theme-aware heatmap ramp (amber on dark, blue on light) from globals.css.
const HEAT = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];
const HEAT_WEEKS = 13;
function heatLevel(i: number): number {
  const v = (i * 31 + (i % 7) * 13) % 11;
  if (v <= 1) return 0;
  if (v < 4) return 1;
  if (v < 7) return 2;
  if (v < 9) return 3;
  return 4;
}

function ActivityBody() {
  // Deterministic pattern: this is a Server Component (the whole marquee ships
  // as plain HTML, no hydration), so no per-visit randomising.
  const levels = Array.from({ length: HEAT_WEEKS * 7 }, (_, i) => heatLevel(i));
  const total = levels.reduce((a, l) => a + l * 2, 0);

  return (
    <div className="flex h-full flex-col">
      <p className="text-sm font-semibold text-heading">{total} activities in 3 months</p>
      <div className="mt-4 flex gap-1 overflow-hidden">
        {Array.from({ length: HEAT_WEEKS }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, d) => (
              <span key={d} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: HEAT[levels[w * 7 + d] ?? 0] }} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {HEAT.map((c, i) => (
          <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── This week (mirrors the dashboard WeeklyActivityChart — per-game stacked
// bars + a labelled legend) ─────────────────────────────────────────────────
const WEEK_SEGMENTS = [
  { key: "jumble", label: "Jumble Words", color: "#7c3aed", Icon: Puzzle },
  { key: "pron", label: "Pronunciation", color: "#a78bfa", Icon: Mic },
  { key: "ai", label: "AI Partner", color: "#c4b5fd", Icon: Sparkles },
] as const;

const WEEK_DATA = [
  { day: "Mon", jumble: 40, pron: 20, ai: 15 },
  { day: "Tue", jumble: 15, pron: 30, ai: 10 },
  { day: "Wed", jumble: 50, pron: 25, ai: 30 },
  { day: "Thu", jumble: 0, pron: 0, ai: 0 },
  { day: "Fri", jumble: 25, pron: 15, ai: 35 },
  { day: "Sat", jumble: 45, pron: 30, ai: 20 },
  { day: "Sun", jumble: 0, pron: 0, ai: 0 },
];

const WEEK_MAX = Math.max(1, ...WEEK_DATA.map((d) => d.jumble + d.pron + d.ai));

function ThisWeekBody() {
  return (
    <div className="flex h-full flex-col gap-3">
      {/* Per-game stacked bars */}
      <div className="flex flex-1 gap-1.5 rounded-[18px] bg-surface-2/70 p-3">
        {WEEK_DATA.map((d) => {
          const total = d.jumble + d.pron + d.ai;
          const done = total > 0;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div className={`flex flex-col items-center gap-1.5 rounded-full px-1.5 py-1.5 ${done ? "bg-heading/[0.06]" : ""}`}>
                <span className={`text-[10px] font-bold ${done ? "text-heading" : "text-muted-foreground"}`}>{d.day}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-green-700 text-white" : "bg-surface-3 text-transparent"}`}>
                  <Check className="h-3 w-3" strokeWidth={3.5} />
                </span>
              </div>
              <div className="flex w-full flex-1 items-end justify-center">
                {total > 0 ? (
                  <div
                    className="flex w-[55%] flex-col-reverse overflow-hidden rounded-lg"
                    style={{ height: `${Math.max(12, (total / WEEK_MAX) * 100)}%` }}
                  >
                    {WEEK_SEGMENTS.map((seg) => {
                      const v = d[seg.key];
                      if (!v) return null;
                      return <div key={seg.key} className="w-full" style={{ flex: v, backgroundColor: seg.color }} />;
                    })}
                  </div>
                ) : (
                  <div className="mb-1 h-[3px] w-[80%] rounded-full bg-surface-3" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend — labels each section, like the original chart. */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {WEEK_SEGMENTS.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <seg.Icon className="h-3.5 w-3.5" style={{ color: seg.color }} />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Badges (mirrors the badge categories / accents) ─────────────────────────
const BADGES = [
  { Icon: Zap, label: "10K XP", grad: "from-[#f59e0b] to-[#f97316]" },
  { Icon: Flame, label: "30-day", grad: "from-[#ef4444] to-[#f97316]" },
  { Icon: Star, label: "Level 7", grad: "from-[#a855f7] to-[#7c3aed]" },
  { Icon: Puzzle, label: "Combo ×20", grad: "from-[#8b5cf6] to-[#6366f1]" },
  { Icon: Award, label: "Full set", grad: "from-[#22c55e] to-[#ef4444]" },
  { Icon: Sparkles, label: "Welcome", grad: "from-[#22c55e] to-[#16a34a]" },
];

function BadgesBody() {
  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 grid-cols-3 gap-2">
        {BADGES.map((b) => (
          <div key={b.label} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-surface-2/40 px-1 py-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${b.grad} text-white shadow`}>
              <b.Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-center text-[10px] font-semibold text-heading">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">31 earned · 8 to go</p>
    </div>
  );
}

// ── Jumble Words (mirrors tiles + smart hint coach) ─────────────────────────
const JUMBLE_TILES = ["always", "She", "coffee", "drinks", "morning", "in", "the"];
function JumbleBody() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1.5">
        {JUMBLE_TILES.map((t, i) => (
          <span key={i} className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-heading">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lightbulb className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Coach hint</p>
          <p className="mt-0.5 text-xs leading-relaxed text-body">
            Sentences open with a capital — try starting with{" "}
            <span className="font-semibold text-heading">&ldquo;She&rdquo;</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Pronunciation Agent (mirrors FeedbackStep) ──────────────────────────────
function MiniRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" style={{ stroke: "var(--surface-3)" }} strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          style={{ stroke: "var(--primary-2)" }}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-heading">{pct}%</span>
    </div>
  );
}

const PRON_WORDS: { w: string; status: "ok" | "bad" | "meh" }[] = [
  { w: "I", status: "ok" },
  { w: "understand", status: "ok" },
  { w: "what", status: "meh" },
  { w: "she", status: "bad" },
  { w: "sketched", status: "bad" },
];

function PronunciationBody() {
  const chip = (s: "ok" | "bad" | "meh") =>
    s === "ok"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : s === "bad"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <MiniRing pct={89} />
        <div className="text-sm leading-tight">
          <span className="font-bold text-heading">Beautiful</span>
          <span className="block font-mono text-xs text-muted-foreground">B.YOO·tih·Fuhl</span>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
            <Volume2 className="h-3 w-3" /> Tap to hear
          </span>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-medium text-heading">Word breakdown</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {PRON_WORDS.map((p) => (
          <span key={p.w} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${chip(p.status)}`}>
            {p.status === "ok" ? <Check className="h-3 w-3" /> : p.status === "bad" ? <X className="h-3 w-3" /> : null}
            {p.w}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-start gap-2 rounded-xl bg-surface-2/40 px-3 py-2.5">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-heading">Slow down.</span> Clarity beats speed.
        </p>
      </div>
    </div>
  );
}

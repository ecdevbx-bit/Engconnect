"use client";

import { useMemo } from "react";
import { Check, Puzzle, Mic, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { V3Activity, V3UserAttributes } from "@/lib/v3Game";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const SEGMENTS = [
  { key: "jumble", label: "Jumble Words", color: "#7c3aed", icon: Puzzle },
  { key: "pronunciation", label: "Pronunciation", color: "#a78bfa", icon: Mic },
  { key: "ai-partner", label: "AI Partner", color: "#c4b5fd", icon: Sparkles },
] as const;

type Bucket = {
  // Per-category XP earned that day (not problem counts) — drives the
  // stacked-bar segments.
  jumble: number;
  pronunciation: number;
  "ai-partner": number;
  total: number; // count of activities that day (shown as "sessions")
  xp: number; // total XP that day — drives the bar height
  date: Date;
};

function weekData(rows: V3Activity[]) {
  const now = new Date();
  const dow = now.getDay();
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dow === 0 ? -6 : 1 - dow));
  mon.setHours(0, 0, 0, 0);

  const b: Bucket[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return { jumble: 0, pronunciation: 0, "ai-partner": 0, total: 0, xp: 0, date: d };
  });
  const act = Array(7).fill(false) as boolean[];

  for (const r of rows) {
    const t = new Date(r.timestamp).getTime();
    if (!Number.isFinite(t)) continue;
    const i = Math.floor((t - mon.getTime()) / 86_400_000);
    if (i < 0 || i > 6) continue;
    const c = r.category as keyof Bucket;
    // Accumulate XP per category (not a problem count) so the bar reflects
    // XP earned. `total` still tracks the session count for the label.
    if (c === "jumble" || c === "pronunciation" || c === "ai-partner") b[i][c] += r.xpEarned;
    b[i].total++;
    b[i].xp += r.xpEarned;
    act[i] = true;
  }
  return { buckets: b, max: Math.max(1, ...b.map((x) => x.xp)), active: act };
}

interface Props {
  rows: V3Activity[];
  attributes?: V3UserAttributes | null;
  // Whether to show the status card alongside the chart. On by default
  // (Dashboard); the Activity page passes false so only the weekly chart
  // renders there.
  showProCard?: boolean;
  // True only for paying users — controls the status-card label so free users
  // are never labelled "PRO" (or, wrongly, "free").
  isPro?: boolean;
}

export default function WeeklyActivityChart({ rows, attributes, showProCard = true, isPro = false }: Props) {
  const { buckets, max, active } = useMemo(() => weekData(rows), [rows]);
  const today = useMemo(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; }, []);

  const level = attributes?.currentLevel ?? 0;
  const totalSessions = rows.length;
  const streak = attributes?.activityStreak ?? 0;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3",
        showProCard && "lg:h-80 lg:w-auto lg:flex-row lg:gap-4",
      )}
    >
      {showProCard && (
        <>
          {/* ── Desktop: left gradient card ── */}
          <div
            className="relative hidden w-[200px] shrink-0 flex-col items-center overflow-hidden rounded-[22px] lg:flex"
            style={{ background: "var(--pro-card)" }}
          >
            <div className="absolute inset-0" style={{
              background: [
                "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 40%, transparent 55%)",
                "radial-gradient(ellipse at 35% 20%, rgba(255,255,255,0.30) 0%, transparent 50%)",
              ].join(", "),
            }} />

            {/* Concentric glow circles */}
            <div className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2">
              <div className="h-[160px] w-[160px] rounded-full border border-white/[0.12]" />
            </div>
            <div className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2">
              <div className="h-[110px] w-[110px] rounded-full border border-white/[0.18]" />
            </div>
            <div className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2">
              <div className="h-[70px] w-[70px] rounded-full bg-white/[0.10]" />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center pt-10 pb-5 px-4">
              <p className="text-[36px] font-black leading-none tracking-tight text-white drop-shadow-sm">
                {isPro ? "PRO" : "Student"}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-white/50">
                {isPro ? "student" : "member"}
              </p>

              <div className="mt-auto flex flex-col gap-3 w-full">
                <StatRow icon="⚡" value={level} label="level" />
                <StatRow icon="📋" value={totalSessions} label="sessions" />
                <StatRow icon="🔥" value={streak} label="day streak" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Chart (row 2 on mobile) ── */}
      <div
        className={cn(
          "flex h-56 w-full gap-[6px] rounded-[22px] border border-border bg-surface-2 p-3 lg:p-4 lg:h-80 dark:border-transparent dark:bg-[#111316]",
          showProCard && "shrink-0 lg:h-auto lg:w-[600px] lg:flex-1",
        )}
      >
        {DAYS.map((d, i) => {
          const bucket = buckets[i];
          const dateStr = bucket.date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });

          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-3 lg:gap-5">
              {/* Day label + checkmark pill */}
              <div className={`flex flex-col items-center gap-2 rounded-full px-2 py-2 lg:gap-4 lg:px-3 lg:py-3 ${i === today ? "bg-black/[0.04] dark:bg-white/[0.06]" : ""}`}>
                <span
                  className={`text-[11px] font-bold ${i === today ? "text-heading dark:text-white" : "text-muted-foreground dark:text-[#4a4d58]"}`}
                >
                  {d}
                </span>
                <div
                  className={`flex p-1 items-center justify-center rounded-full border-[2px] border-transparent lg:p-2 ${
                    active[i]
                      ? "bg-emerald-600 text-white dark:bg-green-800"
                      : "bg-black/[0.06] text-transparent dark:bg-[#2a2d36]"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3.5} />
                </div>
              </div>

              {/* Bar with tooltip */}
              <div className="flex flex-1 w-full items-end justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex w-[50%] items-end justify-center cursor-pointer lg:w-[65%]" style={{ height: "100%" }}>
                      {bucket.xp > 0 ? (
                        <div
                          className="flex w-full flex-col-reverse overflow-hidden rounded-lg transition-all hover:brightness-110"
                          style={{ height: `${Math.max(12, (bucket.xp / max) * 100)}%` }}
                        >
                          {SEGMENTS.map((seg) => {
                            const xp = bucket[seg.key as keyof Bucket] as number;
                            if (xp === 0) return null;
                            return (
                              <div
                                key={seg.key}
                                className="w-full"
                                style={{ flex: xp, backgroundColor: seg.color }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mb-1 h-[3px] w-[80%] rounded-full bg-black/10 dark:bg-[#1e2028]" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="w-[200px] rounded-xl border border-white/[0.08] bg-surface-2 p-0 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                  >
                    <div className="px-3.5 pt-3 pb-2">
                      <p className="text-[11px] font-medium text-muted-foreground">{dateStr}</p>
                      <p className="mt-0.5 text-sm font-bold text-heading">
                        {bucket.total === 0
                          ? "No activity"
                          : `${bucket.total} ${bucket.total === 1 ? "session" : "sessions"}`}
                      </p>
                      {bucket.xp > 0 && (
                        <p className="mt-0.5 text-xs font-semibold text-primary">+{bucket.xp} XP</p>
                      )}
                    </div>
                    {bucket.xp > 0 && (
                      <>
                        <div className="h-px bg-white/[0.06]" />
                        <div className="px-3.5 py-2 space-y-1.5">
                          {SEGMENTS.map((seg) => {
                            const xp = bucket[seg.key as keyof Bucket] as number;
                            if (xp === 0) return null;
                            const Icon = seg.icon;
                            return (
                              <div key={seg.key} className="flex items-center gap-2">
                                <span
                                  className="flex h-5 w-5 items-center justify-center rounded-md"
                                  style={{ backgroundColor: seg.color + "30" }}
                                >
                                  <Icon className="h-3 w-3" style={{ color: seg.color }} />
                                </span>
                                <span className="flex-1 text-[11px] text-body">{seg.label}</span>
                                <span className="text-[11px] font-bold text-heading">{xp} XP</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatRow({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.18] text-[12px]">
        {icon}
      </span>
      <span className="text-[12px] leading-none text-white/80">
        <span className="font-bold text-white">{value}</span>{" "}{label}
      </span>
    </div>
  );
}

"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { V3Activity } from "@/lib/v3Game";
import { StreakCard } from "@/components/badges/StreakCard";

// GitHub-style contribution heatmap that renders ~3 months of activity.
// Each cell = one day, colored by how many activities happened that day.

const DAYS_PER_WEEK = 7;
const NUM_WEEKS = 13;
const TOTAL_DAYS = NUM_WEEKS * DAYS_PER_WEEK;

// Theme-aware via CSS vars (defined in globals.css): amber ramp on dark, blue
// ramp on light. Inline styles read these so the grid recolours with the theme.
const LEVELS: Record<number, string> = {
  0: "var(--heat-0)",
  1: "var(--heat-1)",
  2: "var(--heat-2)",
  3: "var(--heat-3)",
  4: "var(--heat-4)",
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function levelFor(count: number): number {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function buildGrid(rows: V3Activity[]) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - TOTAL_DAYS + 1);
  startDate.setHours(0, 0, 0, 0);

  // day-of-week offset: start on a Monday
  const dow = startDate.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  startDate.setDate(startDate.getDate() + mondayOffset);

  const startMs = startDate.getTime();
  const dayMs = 86_400_000;

  const counts = new Map<string, number>();
  for (const r of rows) {
    const d = r.timestamp.slice(0, 10);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  const weeks: { date: string; count: number; level: number; future: boolean }[][] = [];
  const monthMarkers: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;

  const totalWeeks = NUM_WEEKS + 1;
  for (let w = 0; w < totalWeeks; w++) {
    const week: typeof weeks[number] = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const ms = startMs + (w * 7 + d) * dayMs;
      const dt = new Date(ms);
      const iso = dt.toISOString().slice(0, 10);
      const count = counts.get(iso) ?? 0;
      const future = dt.getTime() > today.getTime();
      week.push({ date: iso, count, level: future ? -1 : levelFor(count), future });

      if (d === 0) {
        const m = dt.getMonth();
        if (m !== lastMonth) {
          monthMarkers.push({ label: MONTH_LABELS[m], weekIdx: w });
          lastMonth = m;
        }
      }
    }
    weeks.push(week);
  }

  // Current login streak — the trailing run of consecutive active days, using
  // the SAME per-day data the grid renders (so the streak lines up exactly with
  // the gaps you see). A single day with no activity breaks it; today is
  // allowed to still be empty (the day isn't over) without breaking it.
  const pastDays = weeks.flat().filter((d) => !d.future);
  let streak = 0;
  for (let i = pastDays.length - 1; i >= 0; i--) {
    if (pastDays[i].count > 0) {
      streak++;
    } else if (i === pastDays.length - 1) {
      continue; // today hasn't been logged yet — don't break the streak
    } else {
      break;
    }
  }

  return { weeks, monthMarkers, streak };
}

// Current login streak (trailing run of active days) — exported so the
// dashboard hero can show the same number without duplicating the day logic.
export function computeStreak(rows: V3Activity[]): number {
  return buildGrid(rows).streak;
}

interface Props {
  rows: V3Activity[];
}

// True below the md breakpoint (< 768px). Drives the compact mobile sizing of
// the grid; desktop keeps the original dimensions. Mirrors the matchMedia
// pattern used by useHasHover in the training cards.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export default function ActivityHeatmap({ rows }: Props) {
  const { weeks, monthMarkers, streak } = useMemo(() => buildGrid(rows), [rows]);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  const totalActivities = useMemo(
    () => rows.length,
    [rows],
  );

  const handleEnter = useCallback(
    (e: React.MouseEvent, day: { date: string; count: number; future: boolean }) => {
      if (day.future) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const dt = new Date(day.date + "T00:00:00");
      const formatted = dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        date: formatted,
        count: day.count,
      });
    },
    [],
  );

  const handleLeave = useCallback(() => setTooltip(null), []);

  // Mobile (< md) renders a more compact grid — smaller cells and tighter
  // vertical row gaps. Desktop keeps the original roomier sizing untouched.
  const isMobile = useIsMobile();
  const CELL = isMobile ? 13 : 17;
  const GAP = isMobile ? 2 : 3;
  const ROW_GAP = isMobile ? 4 : 9;

  const gridW = weeks.length * (CELL + GAP) - GAP;

  return (
    <div className="c-box flex h-full items-start gap-4 rounded-2xl px-6 py-4 md:p-6">
      {/* Left column — title + heatmap. flex-1 so the streak badge can sit
          inline on the right instead of pushing the grid down. */}
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-sm font-bold text-heading md:mb-4">
          {totalActivities} activities in the last 3 months
        </h3>

        <div className="overflow-x-auto">
        <div style={{ minWidth: gridW + 8 }}>
          {/* Month labels */}
          <div className="relative mb-1 h-3 md:mb-1.5 md:h-4" style={{ width: gridW }}>
            {monthMarkers.map((m) => (
              <span
                key={`${m.label}-${m.weekIdx}`}
                className="absolute text-[10px] font-medium text-muted-foreground"
                style={{ left: m.weekIdx * (CELL + GAP) }}
              >
                {m.label}
              </span>
            ))}
          </div>

          
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: ROW_GAP }}>
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={(e) => handleEnter(e, day)}
                    onMouseLeave={handleLeave}
                    className="cursor-pointer rounded-[3px] transition-transform hover:scale-110"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: day.future
                        ? "transparent"
                        : LEVELS[day.level] ?? LEVELS[0],
                    }}
                    aria-label={`${day.date}: ${day.count} activities`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-muted-foreground md:mt-3">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((l) => (
                <div
                  key={l}
                  className="rounded-[3px]"
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: LEVELS[l],
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
          </div>
        </div>
      </div>

      {/* Right column — streak badge, inline (top-aligned) with the heatmap,
          taller so the "Streak Days" label is never clipped. Hidden on mobile
          (< md), where it's shown instead inside the dashboard welcome hero. */}
      {streak > 0 && (
        <div className="hidden w-48 shrink-0 self-stretch overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] md:block">
          {/* Static here (dashboard) — the flicker stays on the badge deck and
              celebrations, just not on this always-on-screen card. */}
          <StreakCard days={streak} animate={false} />
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-[#1c2028] px-3 py-2 text-xs font-medium text-heading shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-bold">
            {tooltip.count === 0 ? "No activities" : `${tooltip.count} ${tooltip.count === 1 ? "activity" : "activities"}`}
          </span>
          {" on "}
          {tooltip.date}
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-[#1c2028]" />
        </div>
      )}
    </div>
  );
}

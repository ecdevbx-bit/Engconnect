"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { Activity, Puzzle, BookOpen } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import WeeklyActivityChart from "@/components/v3/WeeklyActivityChart";
import ActivityHeatmap from "@/components/v3/ActivityHeatmap";
import { v3FetchMyActivity, type V3Activity } from "@/lib/v3Game";

// bucketActivity sorts rows into three calendar buckets. Boundaries
// use the user's local midnight so "today" feels right — a solve at
// 11:59pm yesterday lands in "Last 7 days", not "Today".
//
// Today    = same calendar date as now
// Last 7   = 1..7 days ago (not including today)
// Older    = > 7 days ago
function bucketActivity(rows: V3Activity[]): {
  today: V3Activity[];
  lastWeek: V3Activity[];
  older: V3Activity[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const today: V3Activity[] = [];
  const lastWeek: V3Activity[] = [];
  const older: V3Activity[] = [];

  for (const row of rows) {
    const ts = new Date(row.timestamp).getTime();
    if (!Number.isFinite(ts)) {
      older.push(row);
      continue;
    }
    if (ts >= todayStart) today.push(row);
    else if (ts >= weekAgoStart) lastWeek.push(row);
    else older.push(row);
  }
  return { today, lastWeek, older };
}

export default function ActivityPage() {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";
  const [rows, setRows] = useState<V3Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    v3FetchMyActivity(accessToken, 200)
      .then((activityData) => {
        if (!cancelled) setRows(activityData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load activity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Activity History"
        description="Your last 20 practice sessions and the XP you earned."
        icon={<Activity className="h-5 w-5" />}
      />

      {loading && (
        <div className="c-box rounded-xl p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      )}

      {error && (
        <div className="c-box rounded-xl p-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="c-box rounded-xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No activity yet — solve a Jumble or two to start filling this up.
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="lg:w-1/2">
              <ActivityHeatmap rows={rows} />
            </div>
            <div className="min-w-0 lg:w-1/2">
              <WeeklyActivityChart rows={rows} showProCard={false} />
            </div>
          </div>
          <ActivityList rows={rows} />
        </>
      )}
    </>
  );
}

// Display caps per bucket. Today is expandable; the other two cap at
// the default. If we ever want to make them expandable too, the bucket
// component already takes the expanded flag — just plumb it through.
const DEFAULT_PER_BUCKET = 7;
const TODAY_MAX_EXPANDED = 100;

function ActivityList({ rows }: { rows: V3Activity[] }) {
  // Bucket on render only. Cheap (≤200 rows by backend clamp) and
  // re-runs only when the row list itself changes.
  const buckets = useMemo(() => bucketActivity(rows), [rows]);
  const [todayExpanded, setTodayExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <ActivityBucket
        title="Today"
        rows={buckets.today}
        cap={todayExpanded ? TODAY_MAX_EXPANDED : DEFAULT_PER_BUCKET}
        expandable
        expanded={todayExpanded}
        onToggleExpand={() => setTodayExpanded((v) => !v)}
      />
      <ActivityBucket title="Last 7 days" rows={buckets.lastWeek} cap={DEFAULT_PER_BUCKET} />
      <ActivityBucket title="Older" rows={buckets.older} cap={DEFAULT_PER_BUCKET} />
    </div>
  );
}

function ActivityBucket({
  title,
  rows,
  cap,
  expandable,
  expanded,
  onToggleExpand,
}: {
  title: string;
  rows: V3Activity[];
  cap: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  if (rows.length === 0) return null;
  const visible = rows.slice(0, cap);
  const hidden = rows.length - visible.length;

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground/70 normal-case tracking-normal">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </span>
      </h2>
      <div className="c-box rounded-xl divide-y divide-white/[0.06]">
        {visible.map((row) => (
          <ActivityRow key={row.timestamp + row.problemOrder} row={row} />
        ))}
      </div>
      {expandable && (hidden > 0 || expanded) && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            {expanded
              ? `Show fewer (${DEFAULT_PER_BUCKET})`
              : `Show ${Math.min(hidden, TODAY_MAX_EXPANDED - DEFAULT_PER_BUCKET)} more`}
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ row }: { row: V3Activity }) {
  const Icon = iconForCategory(row.category);
  const diffColor = diffColorFor(row.difficulty);

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-heading">
          Solved a <span className={`font-bold ${diffColor}`}>{row.difficulty}</span>{" "}
          {labelForCategory(row.category)} problem
        </p>
        <p className="text-xs text-muted-foreground">{formatTimeAgo(row.timestamp)}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
        +{row.xpEarned} XP
      </span>
    </div>
  );
}

// ─── Small helpers ──────────────────────────────────────────────────────

function iconForCategory(category: string) {
  switch (category) {
    case "jumble":
      return Puzzle;
    case "pronunciation":
      return BookOpen;
    default:
      return Activity;
  }
}

function labelForCategory(category: string): string {
  switch (category) {
    case "jumble":
      return "Jumble Words";
    case "pronunciation":
      return "Pronunciation";
    default:
      return category;
  }
}

function diffColorFor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "hard":
      return "text-pink-400";
    default:
      return "text-body";
  }
}

// formatTimeAgo — short relative-time string. Avoids pulling in a
// dependency for what amounts to a handful of cases. Falls back to a
// fixed date string for anything older than a day.
function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return iso;
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  // Anything older than a week — show the date in the user's locale.
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

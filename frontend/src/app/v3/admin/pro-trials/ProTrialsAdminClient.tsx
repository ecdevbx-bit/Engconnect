"use client";

import { useState, useTransition } from "react";
import { Check, Ban, Loader2, MessageSquare } from "lucide-react";

import {
  approveTrialAction,
  cancelTrialAction,
  saveTrialSettingsAction,
  type ProTrialListResponse,
  type ProTrialSettings,
} from "./actions";

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

// A <input type="date"> only accepts "YYYY-MM-DD". The backend also understands
// the literal "none" (revert to per-user durations), which the picker can't
// represent — so it renders blank and the note below spells the state out.
// Tolerates undefined so an admin panel served against an older backend (no
// endsOn in the payload) degrades to "cleared" instead of throwing.
const isYMD = (v: string | undefined) => /^\d{4}-\d{2}-\d{2}$/.test((v ?? "").trim());

const PILL: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

type ActionResult = { ok: boolean; message?: string; data?: ProTrialListResponse };

export default function ProTrialsAdminClient({ initial }: { initial: ProTrialListResponse }) {
  const [data, setData] = useState(initial);
  const [settings, setSettings] = useState<ProTrialSettings>(initial.settings);
  const [msg, setMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  // Open on the queue that needs a decision.
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "cancelled">(() =>
    initial.applications.some((a) => a.status === "pending") ? "pending" : "all",
  );
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.data) {
        setData(res.data);
        setSettings(res.data.settings);
      }
      setMsg(res.message ?? (res.ok ? "Saved" : "Something went wrong"));
    });

  const atCap = data.approvedCount >= (data.settings.maxApprovals || 0);

  return (
    <div className="space-y-8">
      {/* Trial settings */}
      <section className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-5">
        <h2 className="text-lg font-bold text-heading">Trial settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every approved user&apos;s trial ends at the end of the program end date below (IST,
          inclusive) — the same date for everyone, whatever day they signed up. Push the date out to
          extend the trial for all of them at once; approving someone after it has passed gives them
          nothing, so move it first.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-heading">
            Program ends on
            <input
              type="date"
              value={isYMD(settings.endsOn) ? settings.endsOn : ""}
              onChange={(e) => setSettings((s) => ({ ...s, endsOn: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {isYMD(settings.endsOn)
                ? "Shared end date — Pro stays on through this whole day."
                : (settings.endsOn ?? "").trim().toLowerCase() === "none"
                  ? 'Set to "none" — trials run on the per-user duration instead.'
                  : "Cleared — the server falls back to its built-in end date."}
            </span>
          </label>
          <label className="text-sm font-semibold text-heading">
            Duration (days)
            <input
              type="number"
              min={1}
              max={60}
              value={settings.durationDays}
              onChange={(e) => setSettings((s) => ({ ...s, durationDays: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary disabled:opacity-50"
              disabled={isYMD(settings.endsOn)}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Legacy per-user length. Ignored while an end date is set.
            </span>
          </label>
          <label className="text-sm font-semibold text-heading">
            Max approvals
            <input
              type="number"
              min={0}
              value={settings.maxApprovals}
              onChange={(e) => setSettings((s) => ({ ...s, maxApprovals: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => run(() => saveTrialSettingsAction(settings))}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-[#0b0e14] transition hover:bg-primary-1 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save settings
          </button>
          <span className={`text-sm font-bold ${atCap ? "text-red-600" : "text-heading"}`}>
            Approved {data.approvedCount} / {data.settings.maxApprovals}
            {atCap ? " — cap reached" : ""}
          </span>
        </div>
      </section>

      {msg && <p className="text-sm font-medium text-primary">{msg}</p>}

      {/* Applications */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-heading">Applications ({data.applications.length})</h2>

        {/* Status filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "pending", "approved", "cancelled"] as const).map((f) => {
            const count =
              f === "all" ? data.applications.length : data.applications.filter((a) => a.status === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  active
                    ? "bg-primary text-[#0b0e14]"
                    : "border border-white/[0.1] text-muted-foreground hover:text-heading"
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        {(() => {
          const shown =
            filter === "all" ? data.applications : data.applications.filter((a) => a.status === filter);
          return data.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : shown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {filter} applications.</p>
          ) : (
            <ul className="space-y-3">
              {shown.map((app) => (
              <li key={app.sub} className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold text-heading">
                      {app.name || "—"}
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${PILL[app.status] ?? "bg-white/10 text-muted-foreground"}`}>
                        {app.status || "—"}
                      </span>
                      {app.isPro && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Pro now
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-sm text-heading">{app.phone || "no phone given"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Applied {fmtDate(app.appliedAt)} · {app.daysClaimed} Pro day{app.daysClaimed === 1 ? "" : "s"} used
                      {app.status === "approved" && app.expiresAt ? (
                        <> · expires {fmtDate(app.expiresAt)}</>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {app.status !== "approved" && (
                      <button
                        onClick={() => run(() => approveTrialAction(app.sub))}
                        disabled={pending || atCap}
                        title={atCap ? "Approval cap reached" : "Approve"}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#3f9d2c] px-4 py-2 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {/* "Don't approve": a pending application is declined (status
                        cancelled — the learner can apply again later). */}
                    {app.status === "pending" && (
                      <button
                        onClick={() => run(() => cancelTrialAction(app.sub))}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                      >
                        <Ban className="h-4 w-4" /> Don&apos;t approve
                      </button>
                    )}
                    {app.status === "approved" && (
                      <button
                        onClick={() => run(() => cancelTrialAction(app.sub))}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                      >
                        <Ban className="h-4 w-4" /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {app.feedback.length > 0 && (
                  <div className="mt-3 border-t border-white/[0.06] pt-3">
                    <button
                      onClick={() => setExpanded(expanded === app.sub ? null : app.sub)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {expanded === app.sub ? "Hide" : "Show"} {app.feedback.length} feedback
                    </button>
                    {expanded === app.sub && (
                      <ul className="mt-2 space-y-2">
                        {app.feedback
                          .slice()
                          .reverse()
                          .map((f, i) => (
                            <li key={i} className="rounded-xl bg-surface-2/60 px-3 py-2 text-sm text-body">
                              <span className="mr-2 text-xs font-semibold text-muted-foreground">{f.date}</span>
                              {f.text}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
            </ul>
          );
        })()}
      </section>
    </div>
  );
}

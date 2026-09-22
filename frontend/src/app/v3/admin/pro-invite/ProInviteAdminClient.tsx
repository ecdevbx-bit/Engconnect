"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import {
  saveProInviteSettingsAction,
  type ProInviteResponse,
  type ProInviteSettings,
} from "./actions";

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// <input type="date"> only speaks "YYYY-MM-DD". The backend also understands ""
// (inherit the Pro-trial cutoff) and "none" (rolling per-user window), neither of
// which the picker can represent — so it renders blank and the note below spells
// out which of the three states is actually in force.
const isYMD = (v: string | undefined) => /^\d{4}-\d{2}-\d{2}$/.test((v ?? "").trim());
const isNone = (v: string | undefined) => (v ?? "").trim().toLowerCase() === "none";

type ActionResult = { ok: boolean; message?: string; data?: ProInviteResponse };

export default function ProInviteAdminClient({
  initial,
  origin,
}: {
  initial: ProInviteResponse;
  // Absolute site origin ("https://…"), resolved from the request headers on the
  // server. The backend deliberately does not guess the public hostname, and
  // reading window.location here instead would either desync hydration or need a
  // setState-in-effect — so the server, which already knows the host, passes it in.
  origin: string;
}) {
  const [data, setData] = useState(initial);
  const [settings, setSettings] = useState<ProInviteSettings>(initial.settings);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const fullLink = `${origin}${data.path || "/pro"}`;
  const live = data.settings.active && !data.expired;

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.data) {
        setData(res.data);
        setSettings(res.data.settings);
      }
      setMsg(res.message ?? (res.ok ? "Saved" : "Something went wrong"));
    });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMsg("Couldn't copy — select the link and copy it manually.");
    }
  }

  return (
    <div className="space-y-8">
      {/* The link itself */}
      <section className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-heading">The link</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              live
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}
          >
            {live ? "Live — granting Pro" : data.expired ? "Past its end date — granting nothing" : "Off"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading">
            {fullLink}
          </code>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-[#0b0e14] transition hover:bg-primary-1"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {data.effectiveEndsOn
            ? `Anyone signing up through it gets Pro free through ${data.effectiveEndsOn} (IST, inclusive).`
            : `Anyone signing up through it gets Pro free for ${data.settings.durationDays} days from their signup day.`}
        </p>
        {data.displayEndsOn && data.displayEndsOn !== data.effectiveEndsOn ? (
          <p className="mt-2 text-sm text-amber-300/90">
            The page tells them <b>{data.displayEndsOn}</b>, not {data.effectiveEndsOn} — deliberate,
            so nobody is cut off the day they were told. Pro really ends {data.effectiveEndsOn}.
          </p>
        ) : null}
        <p className="mt-2 text-sm font-bold text-heading">
          {data.redeemed} joined through the link
          {data.settings.maxRedemptions > 0 ? ` / ${data.settings.maxRedemptions} cap` : " (no cap)"}
        </p>
      </section>

      {/* Settings */}
      <section className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-5">
        <h2 className="text-lg font-bold text-heading">Link settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The URL is fixed and cannot be changed from here — switch it off to stop it. By default it
          rides the Pro-trial program&apos;s end date, so link signups and approved testers all finish
          on the same day; move that date and both move together.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-heading">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.active}
                onChange={(e) => setSettings((s) => ({ ...s, active: e.target.checked }))}
                className="h-4 w-4 accent-[color:var(--primary,#b79fff)]"
              />
              Active
            </span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Off means the page says the invite has closed and grants nothing. People who already
              joined keep their Pro either way.
            </span>
          </label>

          <label className="text-sm font-semibold text-heading">
            Max redemptions
            <input
              type="number"
              min={0}
              value={settings.maxRedemptions}
              onChange={(e) => setSettings((s) => ({ ...s, maxRedemptions: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              0 = unlimited. Past the cap, signup still works — it just stops granting Pro.
            </span>
          </label>

          <label className="text-sm font-semibold text-heading">
            Pro ends on
            <input
              type="date"
              value={isYMD(settings.endsOn) ? settings.endsOn : ""}
              onChange={(e) => setSettings((s) => ({ ...s, endsOn: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {isYMD(settings.endsOn)
                ? "The link's own end date — Pro stays on through this whole day."
                : isNone(settings.endsOn)
                  ? 'Set to "none" — every signup gets the rolling window instead.'
                  : "Cleared — follows the Pro-trial program's end date."}
            </span>
            {isYMD(settings.endsOn) ? (
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, endsOn: "" }))}
                className="mt-2 text-xs font-semibold text-primary underline"
              >
                Clear — follow the Pro-trial date instead
              </button>
            ) : null}
          </label>

          <label className="text-sm font-semibold text-heading">
            Date shown on the page
            <input
              type="date"
              value={isYMD(settings.showEndsOn) ? settings.showEndsOn : ""}
              onChange={(e) => setSettings((s) => ({ ...s, showEndsOn: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {isYMD(settings.showEndsOn)
                ? "The /pro page names this date. Pro itself still runs to the date above — set this earlier on purpose, so nobody is cut off the day they were told. Later than the real end is refused."
                : "Cleared — the page names the real end date."}
            </span>
            {isYMD(settings.showEndsOn) ? (
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, showEndsOn: "" }))}
                className="mt-2 text-xs font-semibold text-primary underline"
              >
                Clear — show the real end date
              </button>
            ) : null}
          </label>

          <label className="text-sm font-semibold text-heading">
            Rolling window (days)
            <input
              type="number"
              min={1}
              max={365}
              value={settings.durationDays}
              onChange={(e) => setSettings((s) => ({ ...s, durationDays: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-surface-2/60 px-3 py-2 text-sm text-heading outline-none focus:border-primary disabled:opacity-50"
              disabled={isYMD(settings.endsOn)}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Used only when no shared end date applies. Ignored while a date is set.
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => run(() => saveProInviteSettingsAction(settings))}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-[#0b0e14] transition hover:bg-primary-1 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save settings
          </button>
          {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
        </div>
      </section>

      {/* Who came in through it */}
      <section className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-5">
        <h2 className="text-lg font-bold text-heading">Joined through the link ({data.signups.length})</h2>
        {data.signups.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nobody yet. Share the link above.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4 font-semibold">User</th>
                  <th className="pb-2 pr-4 font-semibold">Joined</th>
                  <th className="pb-2 pr-4 font-semibold">Pro until</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.signups.map((u) => (
                  <tr key={u.sub} className="border-t border-white/[0.06]">
                    <td className="py-2 pr-4">
                      <span className="block font-semibold text-heading">{u.name || "—"}</span>
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{fmtDate(u.grantedAt)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{fmtDate(u.premiumUntil)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          u.isPro
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-white/[0.06] text-muted-foreground"
                        }`}
                      >
                        {u.isPro ? "Pro" : "Lapsed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import type { KeyRow, LaneState, PoolOverview } from "@/server/gemini/admin";

import { addKeyAction, deleteKeyAction, getPoolAction, resetKeyAction, testKeyAction, updateKeyAction } from "./actions";

const REFRESH_MS = 10_000;

const HEALTH: Record<KeyRow["health"], { label: string; dot: string; text: string }> = {
  live: { label: "In rotation", dot: "bg-[#22c55e]", text: "text-[#22c55e]" },
  cooling: { label: "Cooling down", dot: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
  exhausted: { label: "Daily quota used", dot: "bg-[#f97316]", text: "text-[#f97316]" },
  invalid: { label: "Invalid key", dot: "bg-[#ff6c95]", text: "text-[#ff6c95]" },
  disabled: { label: "Disabled", dot: "bg-white/30", text: "text-muted-foreground" },
};

const LANE_STATUS: Record<LaneState["status"], string> = {
  active: "text-[#22c55e]",
  cooldown: "text-[#f59e0b]",
  exhausted: "text-[#f97316]",
};

function ago(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function until(iso: string | null): string {
  if (!iso) return "";
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (s <= 0) return "now";
  if (s < 3600) return `in ${Math.ceil(s / 60)}m`;
  return `in ${Math.floor(s / 3600)}h ${Math.ceil((s % 3600) / 60)}m`;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-heading tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function KeysAdminClient({ initial, initialError }: { initial: PoolOverview | null; initialError: string | null }) {
  const [pool, setPool] = useState<PoolOverview | null>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(initialError ? { ok: false, text: initialError } : null);
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: "", apiKey: "", tier: "free" as "free" | "paid", maxConcurrent: 3, notes: "" });

  // Live view: poll while the tab is visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void getPoolAction().then((r) => r.ok && r.data && setPool(r.data));
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const act = (fn: () => Promise<{ ok: boolean; message?: string; data?: PoolOverview }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.data) setPool(r.data);
      setMsg({ ok: r.ok, text: r.message ?? (r.ok ? "Done" : "Something went wrong") });
    });

  const test = (id: string) =>
    startTransition(async () => {
      const r = await testKeyAction(id);
      if (r.data) setPool(r.data.pool);
      setMsg({ ok: !!r.data?.test.ok, text: r.data?.test.detail ?? r.message ?? "Test failed" });
    });

  const s = pool?.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {msg ? (
          <p role="status" className={`text-sm font-medium ${msg.ok ? "text-primary" : "text-[#ff6c95]"}`}>{msg.text}</p>
        ) : (
          <span className="text-xs text-muted-foreground">Auto-refreshes every 10 s.</span>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => act(getPoolAction)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2 text-xs font-semibold text-heading hover:bg-white/5 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-[#0b0e14] hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add key
          </button>
        </div>
      </div>

      {showAdd && (
        <form
          className="grid gap-3 rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const r = await addKeyAction(form);
              if (r.ok) {
                setForm({ label: "", apiKey: "", tier: "free", maxConcurrent: 3, notes: "" });
                setShowAdd(false);
              }
              return r;
            });
          }}
        >
          <label className="text-xs text-muted-foreground sm:col-span-2">
            API key (from Google AI Studio — ideally a different Google Cloud project than the others)
            <input
              required
              type="password"
              autoComplete="off"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-1 px-3 py-2 font-mono text-sm text-heading"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Label
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. project-ec-3 (account@…)"
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm text-heading"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted-foreground">
              Tier
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value as "free" | "paid" })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm text-heading"
              >
                <option value="free">Free (preferred)</option>
                <option value="paid">Paid (last resort)</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Max live sessions
              <input
                type="number"
                min={1}
                max={100}
                value={form.maxConcurrent}
                onChange={(e) => setForm({ ...form, maxConcurrent: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm text-heading"
              />
            </label>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={pending} className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-[#0b0e14] disabled:opacity-50">
              Save key
            </button>
          </div>
        </form>
      )}

      {s && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Live voice sessions" value={s.liveSessions} sub={`${pool?.activeChats ?? 0} AI Partner chats open`} />
          <Stat label="Free keys in rotation" value={`${s.freeKeysUsable} / ${s.freeKeys}`} />
          <Stat label="Paid key" value={s.paidKeys ? (s.paidKeysUsable ? "Standby" : "Unavailable") : "None"} sub="used only when all free keys are out" />
          <Stat label="Daily quotas reset" value={until(s.nextResetAt) || "—"} sub="midnight Pacific" />
        </div>
      )}

      <div className="space-y-3">
        {(pool?.keys ?? []).map((k) => {
          const h = HEALTH[k.health];
          return (
            <div key={k.id} className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-bold text-heading">
                    <span className={`h-2.5 w-2.5 rounded-full ${h.dot}`} />
                    {k.label}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${k.tier === "paid" ? "bg-[#b79fff]/20 text-[#b79fff]" : "bg-white/10 text-muted-foreground"}`}>
                      {k.tier}
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {k.keyHint} · {k.source === "env" ? "from env" : "added in admin"} · max {k.maxConcurrent} live
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${h.text}`}>
                    {h.label}
                    {k.invalid && k.invalidReason ? ` — ${k.invalidReason}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={pending} onClick={() => test(k.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-heading hover:bg-white/5 disabled:opacity-50">
                    Test
                  </button>
                  {(k.health === "cooling" || k.health === "exhausted" || k.health === "invalid") && (
                    <button type="button" disabled={pending} onClick={() => act(() => resetKeyAction(k.id))} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-heading hover:bg-white/5 disabled:opacity-50">
                      Return to rotation
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(() => updateKeyAction(k.id, { tier: k.tier === "free" ? "paid" : "free" }))}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-heading hover:bg-white/5 disabled:opacity-50"
                  >
                    Make {k.tier === "free" ? "paid" : "free"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => act(() => updateKeyAction(k.id, { enabled: !k.enabled }))}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-heading hover:bg-white/5 disabled:opacity-50"
                  >
                    {k.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Remove "${k.label}" from the pool? This can't be undone.`)) act(() => deleteKeyAction(k.id));
                    }}
                    className="rounded-full border border-[#ff6c95]/30 px-3 py-1 text-xs font-semibold text-[#ff6c95] hover:bg-[#ff6c95]/10 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-3 font-semibold">Lane</th>
                      <th className="py-1 pr-3 font-semibold">Status</th>
                      <th className="py-1 pr-3 font-semibold">Open</th>
                      <th className="py-1 pr-3 font-semibold">Requests today</th>
                      <th className="py-1 pr-3 font-semibold">Errors today</th>
                      <th className="py-1 pr-3 font-semibold">Voice min today</th>
                      <th className="py-1 pr-3 font-semibold">Last OK</th>
                      <th className="py-1 font-semibold">Last error</th>
                    </tr>
                  </thead>
                  <tbody className="text-heading">
                    {k.lanes.map((l) => (
                      <tr key={l.lane} className="border-t border-white/[0.06]">
                        <td className="py-1.5 pr-3 font-semibold">{l.lane === "live" ? "Live (AI Partner)" : "Text (scoring)"}</td>
                        <td className={`py-1.5 pr-3 font-semibold ${LANE_STATUS[l.status]}`}>
                          {l.status}
                          {l.cooldownUntil ? ` · back ${until(l.cooldownUntil)}` : ""}
                        </td>
                        <td className="py-1.5 pr-3 tabular-nums">{l.openLeases}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{l.requestsToday}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{l.errorsToday}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{Math.round(l.secondsToday / 60)}</td>
                        <td className="py-1.5 pr-3">{ago(l.lastOkAt)}</td>
                        <td className="max-w-[260px] truncate py-1.5 text-muted-foreground" title={l.lastError ?? ""}>
                          {l.lastError ? `${ago(l.lastErrorAt)} — ${l.lastError}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {pool && pool.keys.length === 0 && (
          <p className="text-sm text-muted-foreground">No keys yet. Add one above, or set GEMINI_API_KEYS on the server.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-heading">Recent key events</h2>
        {(pool?.events ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet — events appear when a key hits a limit, fails, or is tested.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-surface-2/40">
            {pool!.events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 text-xs">
                <span className="w-16 shrink-0 text-muted-foreground">{ago(e.at)}</span>
                <span className="font-semibold text-heading">{e.keyLabel}</span>
                {e.lane && <span className="text-muted-foreground">{e.lane}</span>}
                <span className="font-mono text-primary">{e.event}</span>
                {e.detail && <span className="min-w-0 truncate text-muted-foreground">{e.detail}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

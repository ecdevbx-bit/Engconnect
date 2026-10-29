"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import {
  grantPaymentAction,
  savePaymentsSettingsAction,
  type PaymentsAdminResponse,
  type PaymentsSettings,
} from "./actions";

type ActionResult = { ok: boolean; message?: string; data?: PaymentsAdminResponse };

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  observed: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  created: "bg-surface-3 text-muted-foreground",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Same rounding as the server's offerFor(), for the live preview while editing.
function previewPrice(s: PaymentsSettings) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const live = s.discountPercent > 0 && (!s.discountEndsOn || today <= s.discountEndsOn);
  return Math.max(1, Math.round((s.basePriceRupees * (100 - (live ? s.discountPercent : 0))) / 100));
}

const INPUT =
  "mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2/60 px-3 text-sm text-heading outline-none focus:border-primary/50";

export default function PaymentsAdminClient({ initial, origin }: { initial: PaymentsAdminResponse; origin: string }) {
  const [data, setData] = useState(initial);
  const [s, setS] = useState<PaymentsSettings>(initial.settings);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<PaymentsSettings>) => setS((x) => ({ ...x, ...patch }));

  const webhookUrl = `${origin}${data.webhookPath}`;
  const price = previewPrice(s);

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.data) {
        setData(res.data);
        setS(res.data.settings);
      }
      setMsg(res.message ?? (res.ok ? "Saved" : "Something went wrong"));
    });

  async function copy() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMsg("Couldn't copy — select the address and copy it.");
    }
  }

  return (
    <div className="space-y-6">
      {/* On / off */}
      <section className="rounded-2xl border border-border bg-surface-2/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-heading">Selling Pro</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {data.live ? `Learners see ₹${data.offer.priceRupees} and a Pay button on /v3/premium.` : "Off — /v3/premium shows the free-trial form."}
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-sm font-semibold text-heading">{s.enabled ? "On" : "Off"}</span>
            <input
              type="checkbox"
              role="switch"
              checked={s.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
              className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-surface-3 transition before:block before:h-5 before:w-5 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-white before:transition checked:bg-emerald-500 checked:before:translate-x-[22px]"
            />
          </label>
        </div>
        {!data.secretSet && (
          <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            <b>YOUPI_WEBHOOK_SECRET</b> isn&apos;t set on the server yet — payments can&apos;t be switched on until it is.
          </p>
        )}
      </section>

      {/* Price */}
      <section className="rounded-2xl border border-border bg-surface-2/40 p-5">
        <h2 className="text-lg font-bold text-heading">Price</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-heading">
            Full price (₹)
            <input type="number" min={1} value={s.basePriceRupees} onChange={(e) => set({ basePriceRupees: Number(e.target.value) })} className={INPUT} />
          </label>
          <label className="block text-sm font-semibold text-heading">
            Pro days per payment
            <input type="number" min={1} value={s.durationDays} onChange={(e) => set({ durationDays: Number(e.target.value) })} className={INPUT} />
          </label>
          <label className="block text-sm font-semibold text-heading">
            Discount (%)
            <input type="number" min={0} max={95} value={s.discountPercent} onChange={(e) => set({ discountPercent: Number(e.target.value) })} className={INPUT} />
          </label>
          <label className="block text-sm font-semibold text-heading">
            Discount ends <span className="font-normal text-muted-foreground">(empty = no end)</span>
            <input type="date" value={s.discountEndsOn} onChange={(e) => set({ discountEndsOn: e.target.value })} className={INPUT} />
          </label>
        </div>
        <p className="mt-4 text-sm text-heading">
          Learners pay <b className="text-lg">₹{price}</b>
          {price !== s.basePriceRupees && <span className="ml-2 text-muted-foreground line-through">₹{s.basePriceRupees}</span>} for {s.durationDays} days.
        </p>
      </section>

      {/* Gateway */}
      <section className="rounded-2xl border border-border bg-surface-2/40 p-5">
        <h2 className="text-lg font-bold text-heading">YouPI gateway</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-heading sm:col-span-2">
            Payment API address
            <input type="url" placeholder="https://pay.englishconnection.in" value={s.gatewayUrl} onChange={(e) => set({ gatewayUrl: e.target.value })} className={INPUT} />
          </label>
          <label className="block text-sm font-semibold text-heading sm:col-span-2">
            Merchant ID <span className="font-normal text-muted-foreground">(empty = gateway default)</span>
            <input type="text" value={s.merchantId} onChange={(e) => set({ merchantId: e.target.value })} className={INPUT} />
          </label>
        </div>

        <p className="mt-4 text-sm font-semibold text-heading">Webhook URL — paste into YouPI&apos;s merchant admin</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-heading">
            {webhookUrl}
          </code>
          <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-[#0b0e14]">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-heading">Unlock Pro when</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["reconciled", "Bank statement matches", "Safest. You import the statement CSV in YouPI; Pro unlocks then."],
                ["observed", "Bank alert matches", "Instant, but an alert can be wrong or spoofed."],
              ] as const
            ).map(([id, title, body]) => (
              <label
                key={id}
                className={`cursor-pointer rounded-xl border p-3 ${s.grantOn === id ? "border-primary/60 bg-primary/10" : "border-border"}`}
              >
                <input type="radio" name="grantOn" className="sr-only" checked={s.grantOn === id} onChange={() => set({ grantOn: id })} />
                <span className="block text-sm font-bold text-heading">{title}</span>
                <span className="block text-xs text-muted-foreground">{body}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={() => run(() => savePaymentsSettingsAction(s))}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-[#0b0e14] disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>

      {/* Recent payments */}
      <section className="rounded-2xl border border-border bg-surface-2/40 p-5">
        <h2 className="text-lg font-bold text-heading">Recent payments</h2>
        {data.recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Learner</th>
                  <th className="py-2 pr-3">₹</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">UTR</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recent.map((p) => (
                  <tr key={p.orderId}>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(p.createdAt)}</td>
                    <td className="py-2 pr-3">
                      <span className="block font-semibold text-heading">{p.name || "—"}</span>
                      <span className="block text-xs text-muted-foreground">{p.email}</span>
                    </td>
                    <td className="py-2 pr-3">{p.amountRupees}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[p.status] ?? "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                        {p.status}
                      </span>
                      {p.status === "paid" && p.grantedUntil && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">Pro till {fmt(p.grantedUntil)}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{p.utr || "—"}</td>
                    <td className="py-2 text-right">
                      {(p.status === "observed" || p.status === "review") && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Grant ${p.durationDays} days of Pro to ${p.email || "this learner"}?`)) {
                              run(() => grantPaymentAction(p.orderId));
                            }
                          }}
                          disabled={pending}
                          className="rounded-full border border-border px-3 py-1 text-xs font-bold text-heading hover:border-primary/50"
                        >
                          Grant Pro
                        </button>
                      )}
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

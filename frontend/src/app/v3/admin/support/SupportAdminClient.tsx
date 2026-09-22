"use client";

import { Check, Loader2, Mail, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { listTicketsAction, setTicketStatusAction, type SupportInbox } from "./actions";

type Filter = "open" | "resolved" | "all";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function SupportAdminClient({ initial }: { initial: SupportInbox }) {
  const [inbox, setInbox] = useState(initial);
  const [filter, setFilter] = useState<Filter>("open");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () =>
    startTransition(async () => {
      try {
        setInbox(await listTicketsAction());
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Refresh failed");
      }
    });

  const setStatus = (id: number, status: "open" | "resolved") =>
    startTransition(async () => {
      const r = await setTicketStatusAction(id, status);
      setMsg(r.message ?? (r.ok ? "Saved" : "Failed"));
      if (r.ok) setInbox(await listTicketsAction());
    });

  const shown = inbox.tickets.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "bg-primary text-[#0b0e14]" : "border border-white/[0.08] text-muted-foreground hover:text-heading"
            }`}
          >
            {f === "open" ? `Open (${inbox.openCount})` : f === "resolved" ? "Resolved" : "All"}
          </button>
        ))}
        <button type="button" onClick={refresh} disabled={pending} className="ml-auto text-xs font-semibold text-primary hover:underline disabled:opacity-50">
          {pending ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </button>
      </div>
      {msg && <p className="text-sm font-medium text-primary">{msg}</p>}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{filter === "open" ? "No open tickets. 🎉" : "Nothing here."}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((t) => (
            <li key={t.id} className="rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-heading">
                    #{t.id} · {t.categoryLabel}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        t.status === "open" ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {t.status}
                    </span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t.name || "—"} ·{" "}
                    <a href={`mailto:${t.email}?subject=Re: support ticket %23${t.id}`} className="text-primary hover:underline">
                      {t.email}
                    </a>{" "}
                    · {t.signedIn ? "signed in" : "guest"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {when(t.createdAt)} IST · page {t.page || "—"} ·{" "}
                    {t.emailed ? (
                      <span className="text-emerald-500">
                        <Mail className="inline h-3 w-3" /> emailed
                      </span>
                    ) : (
                      <span className="text-[#ff6c95]" title={t.emailError ?? ""}>
                        email not sent{t.emailError ? ` (${t.emailError.slice(0, 60)})` : ""}
                      </span>
                    )}
                  </p>
                </div>
                {t.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => setStatus(t.id, "resolved")}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#3f9d2c] px-4 py-2 text-xs font-bold text-white hover:brightness-105 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatus(t.id, "open")}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-heading hover:bg-white/5 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-1/60 p-3 text-sm text-heading">{t.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useState } from "react";

import { useSession } from "@/lib/session";
import { SUPPORT_CATEGORIES } from "@/lib/supportCategories";

// "Something wrong?" form: pick what went wrong from the dropdown, describe
// it, send. Stored as a support ticket and emailed to the team via Resend
// (POST /api/support). Used in the navbar help dropdown and on /support.
// Signed-in learners are identified automatically; guests add their email.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function SupportForm({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken ?? "";
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!category) return setError("Please choose what went wrong.");
    if (message.trim().length < 5) return setError("Please describe the problem in a few words.");
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ category, message, email, page: typeof window !== "undefined" ? window.location.pathname : "" }),
      });
      const body = (await res.json()) as { success?: boolean; message?: string; data?: { ticketId: number } };
      if (!res.ok || !body.success) throw new Error(body.message ?? "Couldn't send. Please try again.");
      setTicket(body.data?.ticketId ?? 0);
      setMessage("");
      setCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (ticket !== null) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-heading">
          <Check className="h-4 w-4 text-emerald-500" /> Sent! Ticket #{ticket}
        </p>
        <p className="mt-1 text-xs text-body">Thanks for telling us — the team gets an email right away and will reply to you.</p>
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => setTicket(null)} className="text-xs font-semibold text-primary hover:underline">
            Report something else
          </button>
          {onDone && (
            <button type="button" onClick={onDone} className="text-xs font-semibold text-muted-foreground hover:underline">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <label className="block text-xs font-semibold text-muted-foreground">
        What went wrong?
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-surface-1 px-3 text-sm font-semibold text-heading"
        >
          <option value="">Choose an option…</option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-muted-foreground">
        Tell us more
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={compact ? 4 : 5}
          maxLength={4000}
          placeholder="What happened? What did you expect? Which screen were you on?"
          className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm text-heading outline-none focus:border-primary"
        />
      </label>
      {!token && (
        <label className="block text-xs font-semibold text-muted-foreground">
          Your email (so we can reply)
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-surface-1 px-3 text-sm text-heading"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-[#ff6c95]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-[#0b0e14] transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to support
      </button>
    </form>
  );
}

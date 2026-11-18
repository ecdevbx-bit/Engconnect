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
      <div className="rounded-2xl bg-good-soft p-4">
        <p className="flex items-center gap-2 text-[17px] font-bold text-heading">
          <Check className="h-5 w-5 text-good" /> Sent! Ticket #{ticket}
        </p>
        <p className="mt-1 text-[15px] text-body">We&apos;ll reply by email.</p>
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => setTicket(null)} className="min-h-11 text-[15px] font-bold text-primary hover:underline">
            Report something else
          </button>
          {onDone && (
            <button type="button" onClick={onDone} className="min-h-11 text-[15px] font-bold text-muted-foreground hover:underline">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block text-[15px] font-bold text-heading">
        What went wrong?
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-input bg-surface-1 px-3 text-[16px] font-semibold text-heading"
        >
          <option value="">Choose an option…</option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[15px] font-bold text-heading">
        Tell us more
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={compact ? 4 : 5}
          maxLength={4000}
          placeholder="What happened? What did you expect? Which screen were you on?"
          className="mt-1.5 w-full resize-y rounded-xl border border-input bg-surface-1 px-3 py-2.5 text-[16px] text-heading outline-none focus:border-primary"
        />
      </label>
      {!token && (
        <label className="block text-[15px] font-bold text-heading">
          Your email (so we can reply)
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-input bg-surface-1 px-3 text-[16px] text-heading"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-[15px] font-semibold text-bad">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[16px] font-extrabold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to support
      </button>
    </form>
  );
}

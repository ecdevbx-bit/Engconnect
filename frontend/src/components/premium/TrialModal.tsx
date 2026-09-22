"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { Sparkles, Loader2, PhoneCall, MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { v3FetchTrialStatus, v3ApplyForTrial, fmtTrialEndsOn, type V3TrialStatus } from "@/lib/v3Trial";
import { CONTACT_NUMBERS, formatNumber, telLink } from "@/config/contact";

// The Go-Pro entry point during the free-trial launch. Instead of payment, it
// pitches a free, fully-unlocked Pro trial that runs to a fixed program end date
// — the same date for everyone, whenever they join — collects the phone number
// as an application, and reflects the user's trial state on repeat opens.
function fmtDate(iso: string) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const btnGreen =
  "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f9d2c] py-3 text-base font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60";
const btnMuted =
  "mt-2 w-full rounded-2xl bg-black/[0.06] py-3 text-base font-bold text-heading transition hover:bg-black/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14]";

export default function TrialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken ?? "";
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";

  const [status, setStatus] = useState<V3TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!accessToken) return;
    setError(null);
    setLoading(true);
    v3FetchTrialStatus(accessToken)
      .then((s) => {
        setStatus(s);
        setPhone(s.phone || "");
      })
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    // Fetch the trial state each time the modal opens (loading spinner while it
    // lands). Legit external-system sync on open, not a render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) refresh();
  }, [open, refresh]);

  const apply = useCallback(async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Please enter your phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const s = await v3ApplyForTrial(accessToken, trimmed);
      setStatus(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, phone]);

  const supportNumber = CONTACT_NUMBERS[0];
  const st = status?.status ?? "";
  const ws = status?.windowState ?? "none";
  // The program end date is shared and inclusive, so every state below promises a
  // date rather than a length. endsLabel is "" only if the backend has the cutoff
  // switched off, in which case we fall back to the legacy per-user duration.
  const endsLabel = fmtTrialEndsOn(status?.endsOn ?? "");
  const duration = status?.durationDays ?? 25;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        {loading ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Loading your Pro trial</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : st === "cancelled" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-heading">
                Your Pro access was cancelled
              </DialogTitle>
              <DialogDescription>
                Your free Pro subscription has been cancelled. If you think this is a mistake,
                please get in touch and we&apos;ll help you out.
              </DialogDescription>
            </DialogHeader>
            <a href={telLink(supportNumber)} className={btnGreen}>
              <PhoneCall className="h-5 w-5" /> Call support · {formatNumber(supportNumber)}
            </a>
          </>
        ) : st === "pending" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-heading">You&apos;re on the list 🎉</DialogTitle>
              <DialogDescription>
                Thanks for applying! We&apos;re onboarding a limited group of testers and will
                activate your free trial once you&apos;re approved. We&apos;ll reach out on the number
                you gave us.
              </DialogDescription>
            </DialogHeader>
            <button onClick={onClose} className={btnMuted}>Got it</button>
          </>
        ) : st === "approved" && ws === "after" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-heading">Your free trial has ended</DialogTitle>
              <DialogDescription>
                Thanks so much for testing English Connection Pro! The free trial
                {endsLabel ? <> ran through {endsLabel} and has</> : <> has</>} wrapped up — we&apos;ll
                be in touch about what&apos;s next.
              </DialogDescription>
            </DialogHeader>
            <button onClick={onClose} className={btnMuted}>Got it</button>
          </>
        ) : st === "approved" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-heading">Your Pro trial is active ✨</DialogTitle>
              <DialogDescription>
                You have full Pro unlocked — every feature at full quality, including the AI speaking
                partner —{" "}
                {endsLabel ? (
                  <>
                    right through <span className="font-semibold text-heading">{endsLabel}</span>
                  </>
                ) : (
                  <>
                    for {duration} days
                    {status!.expiresAt ? <> · ends {fmtDate(status!.expiresAt)}</> : null}
                  </>
                )}
                . No daily check-ins needed; just enjoy it. We&apos;d still love your feedback any
                time.
              </DialogDescription>
            </DialogHeader>
            <Link href="/support" onClick={onClose} className={btnGreen}>
              <MessageSquare className="h-5 w-5" /> Send us feedback (optional)
            </Link>
          </>
        ) : (
          // Not applied — pitch + application form.
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-heading">
                You&apos;re one of our first 100 🎉
              </DialogTitle>
              <DialogDescription>
                We&apos;re not charging for Pro yet — instead we&apos;re giving a small group{" "}
                {endsLabel ? (
                  <>
                    <span className="font-semibold text-heading">free Pro through {endsLabel}</span>
                  </>
                ) : (
                  <>
                    a <span className="font-semibold text-heading">free {duration}-day Pro trial</span>
                  </>
                )}
                , with every feature unlocked at full quality (including the AI speaking partner). No
                daily check-ins
                {endsLabel ? (
                  <> — and it runs to {endsLabel} however late you join</>
                ) : (
                  <> — once you&apos;re approved it&apos;s yours for the full {duration} days</>
                )}
                .
              </DialogDescription>
            </DialogHeader>

            <div className="mt-1 space-y-3">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-heading">{name || "—"}</span>
                <span className="text-muted-foreground">Email</span>
                <span className="truncate font-semibold text-heading">{email || "—"}</span>
              </div>

              <div>
                <label htmlFor="trial-phone" className="text-sm font-semibold text-heading">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  id="trial-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="e.g. 98765 43210"
                  className="mt-1 w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm text-heading outline-none focus:border-primary dark:border-white/[0.12] dark:bg-white/[0.04]"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  We&apos;ll save this to your profile and use it to reach you.
                </p>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <button onClick={apply} disabled={submitting} className={btnGreen}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Apply for free access
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

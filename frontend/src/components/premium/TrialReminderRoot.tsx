"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { X, PhoneCall } from "lucide-react";

import { v3FetchTrialStatus, type V3TrialStatus } from "@/lib/v3Trial";
import { CONTACT_NUMBERS, formatNumber, telLink } from "@/config/contact";

// App-wide trial nudge, mounted once in providers. One reason remains:
//   "cancelled" → admin pulled the trial ("call support")
// The old "submit" nudge is gone: the trial now grants unrestricted Pro for its
// whole window on approval, so there's no daily feedback to chase.
// Session-dismissible so it doesn't nag on every navigation.
type Reason = "cancelled" | null;

function reasonFor(t: V3TrialStatus | null): Reason {
  if (!t) return null;
  if (t.status === "cancelled") return "cancelled";
  return null;
}

export default function TrialReminderRoot() {
  const { data: session, status: authStatus } = useSession();
  const accessToken = session?.user?.accessToken ?? "";
  const [trial, setTrial] = useState<V3TrialStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !accessToken) return;
    let cancelled = false;
    v3FetchTrialStatus(accessToken)
      .then((s) => {
        if (cancelled) return;
        setTrial(s);
        const r = reasonFor(s);
        const seen =
          !!r && typeof window !== "undefined" && sessionStorage.getItem(`trialReminder:${r}`) === "1";
        setDismissed(seen);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authStatus, accessToken]);

  const reason = reasonFor(trial);

  const close = useCallback(() => {
    if (reason && typeof window !== "undefined") {
      sessionStorage.setItem(`trialReminder:${reason}`, "1");
    }
    setDismissed(true);
  }, [reason]);

  if (!reason || dismissed || !trial) return null;

  const supportNumber = CONTACT_NUMBERS[0];

  return (
    <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-sm sm:inset-x-auto sm:bottom-6 sm:right-6">
      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0b0e14] p-4 pr-9 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
        <button
          onClick={close}
          aria-label="Dismiss"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-sm font-bold">Your Pro access was cancelled</p>
        <p className="mt-1 text-[13px] text-white/80">
          If you think this is a mistake, please call support.
        </p>
        <a
          href={telLink(supportNumber)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-white/20"
        >
          <PhoneCall className="h-4 w-4" /> {formatNumber(supportNumber)}
        </a>
      </div>
    </div>
  );
}

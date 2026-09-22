"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Loader2, Check } from "lucide-react";
import { useSession } from "@/lib/session";
import { emitToast } from "@/lib/toast";
import {
  v3FetchPlans,
  v3FetchSubscription,
  startSubscriptionCheckout,
  type SubscriptionPlanPublic,
  type SubscriptionStatus,
} from "@/lib/v3Payments";

// PremiumPlans renders the active subscription plans and drives Razorpay
// Checkout. It is intentionally presentation-light — the goal is a working,
// honest flow: server decides the price, the webhook decides entitlement, and
// this component only reflects state.
//
// After the user authorises payment in the modal we DON'T flip the UI to
// "premium" immediately (that would trust the client). Instead we poll
// GET /payments/subscription a few times — the backend webhook updates the
// row out-of-band — and reflect whatever the server reports.
export default function PremiumPlans() {
  const session = useSession();
  const accessToken = session.data?.user?.accessToken ?? "";
  const displayName = session.data?.user?.name ?? undefined;
  const email = session.data?.user?.email ?? undefined;

  const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    // No synchronous setState here — the `!accessToken` render guard below
    // returns before the loading spinner, so we simply skip fetching.
    if (!accessToken) return;
    let alive = true;
    Promise.all([
      v3FetchPlans(accessToken).catch(() => [] as SubscriptionPlanPublic[]),
      v3FetchSubscription(accessToken).catch(() => null),
    ]).then(([p, s]) => {
      if (!alive) return;
      setPlans(p);
      setStatus(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [accessToken]);

  // Poll subscription status until it flips active (or attempts run out).
  const pollStatus = useCallback(
    async (attempts = 6) => {
      for (let i = 0; i < attempts; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        try {
          const s = await v3FetchSubscription(accessToken);
          setStatus(s);
          if (s.active) return;
        } catch {
          /* keep polling */
        }
      }
    },
    [accessToken],
  );

  const onBuy = useCallback(
    async (planId: string, planName: string) => {
      if (!accessToken || busyKey) return;
      setBusyKey(planId);
      try {
        await startSubscriptionCheckout({
          accessToken,
          planId,
          planName,
          displayName,
          email,
          onAuthorised: () => {
            emitToast({
              title: "Payment received",
              body: "Activating your subscription…",
              type: "success",
            });
            void pollStatus();
          },
          onDismiss: () => setBusyKey(null),
        });
      } catch (err) {
        emitToast({
          title: "Could not start checkout",
          body: err instanceof Error ? err.message : "Please try again.",
        });
        setBusyKey(null);
      }
    },
    [accessToken, busyKey, displayName, email, pollStatus],
  );

  if (!accessToken) {
    return <p className="p-6 text-center text-gray-500">Please sign in to manage your subscription.</p>;
  }
  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Pro members: their status + renewal now lives in the page header
  // (PremiumHeader), so there's nothing to show down here.
  if (status?.active) {
    return null;
  }

  if (plans.length === 0) {
    return <p className="p-6 text-center text-gray-500">No plans are available right now.</p>;
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4 sm:grid-cols-2">
      {plans.map((plan) => (
        <div key={plan.id} className="flex flex-col rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold">{plan.name || plan.id}</h3>
          </div>
          <p className="mb-4 text-2xl font-bold">
            {formatAmount(plan.amountPaise, plan.currency)}
            <span className="text-sm font-normal text-gray-500">
              {plan.period ? ` / ${plan.period}` : ""}
            </span>
          </p>
          {/* Perks are already covered by the feature cards + the "Every Pro
              plan also includes" section above, so the plan card stays lean —
              just the plan-specific server description (if any). */}
          {plan.description && (
            <ul className="mb-6 space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-green-500" /> {plan.description}
              </li>
            </ul>
          )}
          <button
            onClick={() => onBuy(plan.id, plan.name)}
            disabled={busyKey !== null}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {busyKey === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busyKey === plan.id ? "Opening…" : "Subscribe"}
          </button>
        </div>
      ))}
    </div>
  );
}

function formatAmount(paise: number, currency: string): string {
  const amount = paise / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

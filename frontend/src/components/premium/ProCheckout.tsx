"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";

import { ApiError } from "@/lib/apiClient";
import { useSession } from "@/lib/session";
import {
  v3FetchProOffer,
  v3FetchProOrder,
  v3StartProCheckout,
  type ProOffer,
  type ProOrder,
} from "@/lib/v3ProPayments";

// Buying Pro through YouPI PG (D-061). Only rendered while the admin switch
// is on (useProOffer().enabled); otherwise /v3/premium keeps the free-trial
// application. Paying sends the learner to YouPI's hosted checkout; they come
// back to /v3/premium?payment=<id>, where PaymentStatusCard follows the order.

export function useProOffer(): ProOffer | null {
  const [offer, setOffer] = useState<ProOffer | null>(null);
  useEffect(() => {
    let live = true;
    void v3FetchProOffer().then((o) => live && setOffer(o));
    return () => {
      live = false;
    };
  }, []);
  return offer;
}

function endsLabel(day: string): string {
  return new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// `top` = the copy shown above the feature cards on phones, so paying never
// needs a long scroll; the bottom one is the anchor the cards scroll to.
export function ProBuyButton({ offer, top = false }: { offer: ProOffer; top?: boolean }) {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken ?? null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (!accessToken) {
      router.push("/login?next=/v3/premium");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } = await v3StartProCheckout(accessToken);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the payment. Please try again.");
      setBusy(false);
    }
  };

  const discounted = offer.discountPercent > 0;
  return (
    <div id={top ? undefined : "pro-buy"} className={top ? "mb-6 md:hidden" : "mt-6"}>
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center">
        {discounted && (
          <span className="text-lg font-semibold text-muted-foreground line-through">₹{offer.basePriceRupees}</span>
        )}
        <span className="text-4xl font-extrabold text-heading">₹{offer.priceRupees}</span>
        <span className="text-sm text-muted-foreground">/ {offer.durationDays} days</span>
        {discounted && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {offer.discountPercent}% off{offer.discountEndsOn ? ` till ${endsLabel(offer.discountEndsOn)}` : ""}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#3f9d2c] text-base font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {busy ? "Opening payment…" : `Pay ₹${offer.priceRupees} with UPI`}
        {!busy && <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">One-time payment · no auto-renewal</p>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const STATUS_TEXT: Record<ProOrder["status"], { title: string; body: string; tone: "ok" | "wait" | "bad" }> = {
  paid: { title: "You're Pro 🎉", body: "Payment confirmed.", tone: "ok" },
  observed: { title: "Payment received", body: "We're confirming it with the bank. Pro unlocks once it's confirmed.", tone: "wait" },
  created: { title: "Waiting for your payment", body: "If you've paid, this updates by itself.", tone: "wait" },
  review: { title: "We're checking your payment", body: "Something didn't match. We'll sort it out — write to us from Help if it takes long.", tone: "wait" },
  failed: { title: "Payment not received", body: "If money left your account, write to us from Help with the UPI reference. Otherwise, try again.", tone: "bad" },
  expired: { title: "Payment timed out", body: "You can try again.", tone: "bad" },
  cancelled: { title: "Payment cancelled", body: "You can try again whenever you like.", tone: "bad" },
};

// Shown on /v3/premium?payment=<id> after YouPI sends the learner back.
export function PaymentStatusCard() {
  const orderId = useSearchParams()?.get("payment") ?? "";
  const { data: session, update } = useSession();
  const accessToken = session?.user?.accessToken ?? null;
  const [order, setOrder] = useState<ProOrder | null>(null);
  // `update` changes identity whenever the session does; keep the poll loop
  // from restarting (and re-refreshing) because of it.
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    if (!orderId || !accessToken) return;
    let stop = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const o = await v3FetchProOrder(accessToken, orderId);
        if (stop) return;
        setOrder(o);
        if (o.status === "paid") {
          // Refresh the session so Pro shows everywhere at once.
          void updateRef.current({ user: { isPro: true } });
          return;
        }
        if (o.status !== "created" && o.status !== "observed") return;
      } catch {
        if (stop) return;
      }
      tries += 1;
      // Every 4 s for 3 minutes, then every 30 s while the page stays open.
      timer = setTimeout(tick, tries < 45 ? 4000 : 30_000);
    };
    void tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [orderId, accessToken]);

  if (!orderId) return null;
  const s = order ? STATUS_TEXT[order.status] : null;
  return (
    <div
      role="status"
      className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-border bg-surface-1/80 p-4 text-left"
    >
      <span
        className={
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full " +
          (s?.tone === "ok" ? "bg-emerald-500 text-white" : s?.tone === "bad" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")
        }
      >
        {s?.tone === "ok" ? <Check className="h-4 w-4" strokeWidth={3} /> : s?.tone === "bad" ? "!" : <Loader2 className="h-4 w-4 animate-spin" />}
      </span>
      <div>
        <p className="font-bold text-heading">{s?.title ?? "Checking your payment…"}</p>
        {s && <p className="mt-0.5 text-sm text-body">{s.body}</p>}
      </div>
    </div>
  );
}

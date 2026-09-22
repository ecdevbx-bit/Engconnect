// v3 Razorpay subscription helpers. Mirrors the v3Game / v3Pronunciation
// client modules: thin fetch wrappers around the backend payments API plus a
// browser-only helper that loads Razorpay Checkout and opens the modal.
//
// Backend contract lives in backend/internal/apiv3/payments.go:
//   GET  /api/payments/plans          → active Razorpay plans (proxied)
//   POST /api/payments/subscriptions  → { subscriptionId, razorpayKeyId, ... }
//   GET  /api/payments/subscription   → caller's subscription status
//
// Razorpay is the source of truth for plans — the backend proxies its plan
// list (the browser never calls Razorpay directly). The client sends back a
// Razorpay plan *id*, which the backend re-validates against the active plan
// list before creating anything. Entitlement is granted by the verified
// webhook, not by the checkout success callback below.

import { v3Fetch } from "@/lib/apiClient";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Mirrors backend RazorpayPlan (json-tagged fields).
export interface SubscriptionPlanPublic {
  id: string;
  name: string;
  description: string;
  amountPaise: number;
  currency: string;
  period: string;
  interval: number;
}

export interface CreateSubscriptionResponse {
  mode: "subscription" | "onetime";
  razorpayKeyId: string;
  planId: string;
  // subscription mode
  subscriptionId?: string;
  shortUrl?: string;
  // one-time mode
  orderId?: string;
  amountPaise?: number;
  currency?: string;
}

export interface SubscriptionStatus {
  active: boolean;
  status?: string;
  planId?: string;
  currentEnd?: string;
}

export function v3FetchPlans(accessToken: string): Promise<SubscriptionPlanPublic[]> {
  return v3Fetch<SubscriptionPlanPublic[]>("/payments/plans", accessToken);
}

export function v3CreateSubscription(
  accessToken: string,
  planId: string,
): Promise<CreateSubscriptionResponse> {
  return v3Fetch<CreateSubscriptionResponse>("/payments/subscriptions", accessToken, {
    method: "POST",
    body: { planId },
  });
}

export function v3FetchSubscription(accessToken: string): Promise<SubscriptionStatus> {
  return v3Fetch<SubscriptionStatus>("/payments/subscription", accessToken);
}

// ─── Razorpay Checkout (browser only) ────────────────────────────────────

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler?: (resp: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// loadRazorpayCheckout injects checkout.js once and resolves when
// window.Razorpay is available. Safe to call repeatedly.
export function loadRazorpayCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay Checkout can only load in the browser"));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_CHECKOUT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay Checkout failed to load")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout failed to load"));
    document.body.appendChild(script);
  });
}

export interface StartCheckoutArgs {
  accessToken: string;
  planId: string;
  planName?: string;
  displayName?: string;
  email?: string;
  // Called once Razorpay reports the payment authorised on the client. This
  // is NOT proof of entitlement — the backend webhook is the source of truth.
  // Use it only to show a "processing" state and then poll v3FetchSubscription.
  onAuthorised?: (resp: RazorpaySuccess) => void;
  onDismiss?: () => void;
}

// startSubscriptionCheckout creates the subscription server-side, loads
// Checkout, and opens the modal. Resolves once the modal is opened; payment
// outcome arrives via the onAuthorised / onDismiss callbacks.
export async function startSubscriptionCheckout(args: StartCheckoutArgs): Promise<void> {
  const [created] = await Promise.all([
    v3CreateSubscription(args.accessToken, args.planId),
    loadRazorpayCheckout(),
  ]);
  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout unavailable");
  }
  const opts: RazorpayOptions = {
    key: created.razorpayKeyId,
    name: "English Connection Premium",
    description: args.planName ?? created.planId,
    prefill: { name: args.displayName, email: args.email },
    theme: { color: "#16a34a" },
    handler: (resp) => args.onAuthorised?.(resp),
    modal: { ondismiss: () => args.onDismiss?.() },
  };
  if (created.mode === "onetime") {
    opts.order_id = created.orderId;
    opts.amount = created.amountPaise;
    opts.currency = created.currency;
  } else {
    opts.subscription_id = created.subscriptionId;
  }
  const rzp = new window.Razorpay(opts);
  rzp.open();
}

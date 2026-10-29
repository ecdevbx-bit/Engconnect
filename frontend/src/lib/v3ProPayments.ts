// Pro payments through the owner's YouPI PG gateway (D-061). Thin wrappers
// around /api/payments/*. Paying never grants Pro by itself: the server does
// that from YouPI's signed webhook, and the return page polls the order.

import { v3Fetch } from "@/lib/apiClient";

export type ProOffer = {
  enabled: boolean;
  basePriceRupees: number;
  priceRupees: number;
  discountPercent: number;
  /** Last IST day of the discount, "" = no end date. */
  discountEndsOn: string;
  durationDays: number;
  currency: "INR";
};

export type ProOrderStatus = "created" | "observed" | "paid" | "review" | "failed" | "expired" | "cancelled";

export type ProOrder = {
  orderId: string;
  status: ProOrderStatus;
  amountRupees: number;
  durationDays: number;
  grantedUntil: string | null;
  createdAt: string;
};

export async function v3FetchProOffer(): Promise<ProOffer | null> {
  try {
    const res = await fetch("/api/payments/offer", { cache: "no-store" });
    const env = (await res.json()) as { success: boolean; data?: ProOffer };
    return env.success && env.data ? env.data : null;
  } catch {
    return null;
  }
}

export function v3StartProCheckout(accessToken: string): Promise<{ orderId: string; checkoutUrl: string }> {
  return v3Fetch("/payments/checkout", accessToken, { method: "POST", body: {} });
}

export function v3FetchProOrder(accessToken: string, orderId: string): Promise<ProOrder> {
  return v3Fetch(`/payments/orders/${encodeURIComponent(orderId)}`, accessToken);
}

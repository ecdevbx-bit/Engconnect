"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for admin → Payments (YouPI PG, D-061). They wrap the
// internal-API-key gated backend so the shared secret never reaches the browser.

export type PaymentsSettings = {
  enabled: boolean;
  gatewayUrl: string;
  merchantId: string;
  basePriceRupees: number;
  discountPercent: number;
  discountEndsOn: string;
  durationDays: number;
  grantOn: "reconciled" | "observed";
};

export type PaymentRowView = {
  orderId: string;
  status: "created" | "observed" | "paid" | "review" | "failed" | "expired" | "cancelled";
  amountRupees: number;
  durationDays: number;
  grantedUntil: string | null;
  createdAt: string;
  utr: string;
  lastEvent: string;
  name: string;
  email: string;
};

export type PaymentsAdminResponse = {
  settings: PaymentsSettings;
  defaults: PaymentsSettings;
  offer: { basePriceRupees: number; priceRupees: number; discountPercent: number; discountEndsOn: string; durationDays: number };
  live: boolean;
  secretSet: boolean;
  webhookPath: string;
  recent: PaymentRowView[];
};

type Envelope<T> = { success: boolean; message: string; data?: T };

async function call<T>(path: string, method: "GET" | "PUT" | "POST", body?: unknown) {
  await requireAdmin();
  const res = await backendFetch(path, {
    method,
    headers: { "Content-Type": "application/json", "x-internal-api-key": internalAPIKey() },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const env = (await res.json()) as Envelope<T>;
  return { ok: res.ok && !!env.success, message: env.message, data: env.data };
}

export async function getPaymentsAction(): Promise<PaymentsAdminResponse> {
  const { ok, message, data } = await call<PaymentsAdminResponse>("/api/admin/payments", "GET");
  if (!ok || !data) throw new Error(message ?? "Load failed");
  return data;
}

export async function savePaymentsSettingsAction(settings: PaymentsSettings) {
  const res = await call<PaymentsAdminResponse>("/api/admin/payments/settings", "PUT", settings);
  revalidatePath("/v3/admin/payments");
  return res;
}

export async function grantPaymentAction(orderId: string) {
  const res = await call<PaymentsAdminResponse>(`/api/admin/payments/${encodeURIComponent(orderId)}/grant`, "POST", {});
  revalidatePath("/v3/admin/payments");
  return res;
}

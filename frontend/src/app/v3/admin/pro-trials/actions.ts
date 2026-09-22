"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the Pro-trials admin panel. Wrap the internal-API-key
// gated backend so the shared secret never reaches the browser.

export type TrialFeedbackEntry = { text: string; at: string; date: string };

export type ProTrialApplication = {
  sub: string;
  name: string;
  email: string;
  phone: string;
  status: string; // pending | approved | cancelled
  appliedAt: string;
  approvedAt: string;
  expiresAt: string; // shared program cutoff (empty if not approved)
  daysClaimed: number;
  isPro: boolean;
  feedback: TrialFeedbackEntry[];
};

export type ProTrialSettings = {
  // endsOn is the shared last day of the program, "YYYY-MM-DD" in IST and
  // inclusive. Every approved user ends on it whatever day they joined.
  // The literal "none" reverts to the legacy per-user durationDays window.
  endsOn: string;
  durationDays: number;
  maxApprovals: number;
};

export type ProTrialListResponse = {
  applications: ProTrialApplication[];
  approvedCount: number;
  settings: ProTrialSettings;
  defaults: ProTrialSettings;
};

type Envelope<T> = { success: boolean; message: string; data?: T };

async function call<T>(
  path: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
): Promise<{ ok: boolean; message?: string; data?: T }> {
  await requireAdmin();
  const res = await backendFetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const env = (await res.json()) as Envelope<T>;
  return { ok: res.ok && !!env.success, message: env.message, data: env.data };
}

export async function getProTrialsAction(): Promise<ProTrialListResponse> {
  const { ok, message, data } = await call<ProTrialListResponse>("/api/admin/pro-trials", "GET");
  if (!ok || !data) {
    throw new Error(message ?? "Load failed");
  }
  return data;
}

export async function approveTrialAction(sub: string) {
  const res = await call<ProTrialListResponse>("/api/admin/pro-trials/approve", "POST", { sub });
  revalidatePath("/v3/admin/pro-trials");
  return res;
}

export async function cancelTrialAction(sub: string) {
  const res = await call<ProTrialListResponse>("/api/admin/pro-trials/cancel", "POST", { sub });
  revalidatePath("/v3/admin/pro-trials");
  return res;
}

export async function saveTrialSettingsAction(settings: ProTrialSettings) {
  const res = await call<ProTrialListResponse>("/api/admin/pro-trials/settings", "PUT", settings);
  revalidatePath("/v3/admin/pro-trials");
  return res;
}

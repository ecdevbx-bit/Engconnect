"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the AI Partner rewards admin page. Wraps the
// internal-API-key gated backend endpoints so the secret never reaches
// the browser.

export type AdminAIPartnerRewards = {
  thresholdSeconds: number;
  thresholdXp: number;
  recurringIntervalSeconds: number;
  recurringXp: number;
  maxRecordingSeconds: number;
  sessionSeconds: number;
  proDailyCapSeconds: number;
  freeWeeklyCapSeconds: number;
};

export type AdminAIPartnerRewardsResponse = {
  current: AdminAIPartnerRewards;
  defaults: AdminAIPartnerRewards;
};

export async function getAIPartnerRewardsAction(): Promise<AdminAIPartnerRewardsResponse> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/ai-partner/rewards", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success: boolean;
    message: string;
    data?: AdminAIPartnerRewardsResponse;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Load failed");
  }
  return body.data;
}

export async function saveAIPartnerRewardsAction(
  rewards: AdminAIPartnerRewards,
): Promise<{ ok: boolean; message?: string; data?: AdminAIPartnerRewardsResponse }> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/ai-partner/rewards", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: JSON.stringify(rewards),
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success: boolean;
    message: string;
    data?: AdminAIPartnerRewardsResponse;
  };
  revalidatePath("/v3/admin/ai-partner");
  return { ok: !!body.success, message: body.message, data: body.data };
}

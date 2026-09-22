"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the pronunciation timings admin page. Wraps the
// internal-API-key gated backend endpoints so the secret never reaches
// the browser. Values are milliseconds on the wire (matching the
// /phrases contract); the client edits them in seconds.

export type AdminPronunciationTimings = {
  countdownMs: number;
  easyRecordDurationMs: number;
  mediumRecordDurationMs: number;
  hardRecordDurationMs: number;
};

export type AdminPronunciationTimingsResponse = {
  current: AdminPronunciationTimings;
  defaults: AdminPronunciationTimings;
};

export async function getPronunciationTimingsAction(): Promise<AdminPronunciationTimingsResponse> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/pronunciation/timings", {
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
    data?: AdminPronunciationTimingsResponse;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Load failed");
  }
  return body.data;
}

export async function savePronunciationTimingsAction(
  timings: AdminPronunciationTimings,
): Promise<{ ok: boolean; message?: string; data?: AdminPronunciationTimingsResponse }> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/pronunciation/timings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: JSON.stringify(timings),
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success: boolean;
    message: string;
    data?: AdminPronunciationTimingsResponse;
  };
  revalidatePath("/v3/admin/pronunciation");
  return { ok: !!body.success, message: body.message, data: body.data };
}

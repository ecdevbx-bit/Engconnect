"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the jumble settings admin page. Wraps the
// internal-API-key gated backend endpoints so the secret never reaches
// the browser.

export type AdminJumbleSettings = {
  progressiveSetBonusXp: number;
};

export type AdminJumbleSettingsResponse = {
  current: AdminJumbleSettings;
  defaults: AdminJumbleSettings;
};

export async function getJumbleSettingsAction(): Promise<AdminJumbleSettingsResponse> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/jumble/settings", {
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
    data?: AdminJumbleSettingsResponse;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Load failed");
  }
  return body.data;
}

export async function saveJumbleSettingsAction(
  settings: AdminJumbleSettings,
): Promise<{ ok: boolean; message?: string; data?: AdminJumbleSettingsResponse }> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/jumble/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: JSON.stringify(settings),
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success: boolean;
    message: string;
    data?: AdminJumbleSettingsResponse;
  };
  revalidatePath("/v3/admin/jumble");
  return { ok: !!body.success, message: body.message, data: body.data };
}

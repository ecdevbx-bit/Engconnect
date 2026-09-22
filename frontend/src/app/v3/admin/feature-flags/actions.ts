"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the feature-flags admin panel. Wrap the internal-API-key
// gated backend so the shared secret never reaches the browser.

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string;
};

export type FeatureFlagsResponse = {
  flags: FeatureFlag[];
};

type Envelope<T> = { success: boolean; message: string; data?: T };

async function call<T>(
  path: string,
  method: "GET" | "PUT",
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

export async function getFeatureFlagsAction(): Promise<FeatureFlagsResponse> {
  const { ok, message, data } = await call<FeatureFlagsResponse>("/api/admin/feature-flags", "GET");
  if (!ok || !data) {
    throw new Error(message ?? "Load failed");
  }
  return data;
}

export async function saveFeatureFlagsAction(flags: Record<string, boolean>) {
  const res = await call<FeatureFlagsResponse>("/api/admin/feature-flags", "PUT", { flags });
  revalidatePath("/v3/admin/feature-flags");
  return res;
}

"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the levels admin page. The list payload is global
// (no per-user data), so the GET goes through the same admin gate but
// returns whatever the public /levels endpoint returns; PUT is the
// whole-list replace operation.

export type AdminLevel = {
  level: number;
  threshold: number;
  title: string;
  icon: string;
};

export async function listLevelsAction(): Promise<AdminLevel[]> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/levels", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    cache: "no-store",
  });
  const body = (await res.json()) as { success: boolean; message: string; data?: AdminLevel[] };
  if (!res.ok || !body.success) throw new Error(body.message ?? "Load failed");
  return body.data ?? [];
}

export async function saveLevelsAction(
  levels: AdminLevel[],
): Promise<{ ok: boolean; message?: string; data?: AdminLevel[] }> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/levels", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: JSON.stringify({ levels }),
    cache: "no-store",
  });
  const body = (await res.json()) as { success: boolean; message: string; data?: AdminLevel[] };
  revalidatePath("/v3/admin/levels");
  return { ok: !!body.success, message: body.message, data: body.data };
}

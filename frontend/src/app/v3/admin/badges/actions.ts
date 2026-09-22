"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server Actions for badge admin. Same pattern as the problems admin —
// auth re-asserted in every action (server functions can be POSTed
// directly per the Next.js docs).

// Badge is FACTS only — the visual + title come from the frontend registry
// (src/lib/badges + BadgeArt), keyed by the deterministic id. The id is derived
// by the backend from category(+game)+threshold; admin never types it.
export type Badge = {
  id: string;
  category: string;
  game?: string; // combo only
  threshold: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Envelope<T> = { success: boolean; message: string; data?: T; errorCode?: string };

async function callBackend<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await backendFetch(path, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  // Read as text first so a non-JSON error page (e.g. a 5xx HTML page from the
  // load balancer when the backend is unhealthy) yields a readable error rather
  // than an opaque "Unexpected token <" JSON parse crash.
  const raw = await res.text();
  let body: Envelope<T> | null = null;
  try {
    body = raw ? (JSON.parse(raw) as Envelope<T>) : null;
  } catch {
    body = null;
  }
  if (!res.ok || !body?.success) {
    const detail =
      body?.message ?? `HTTP ${res.status} ${res.statusText}${raw ? ` — ${raw.slice(0, 140)}` : ""}`;
    throw new Error(`Backend ${init.method ?? "GET"} ${path} failed: ${detail}`);
  }
  return body.data as T;
}

export async function listBadgesAction(): Promise<Record<string, Badge[]>> {
  await requireAdmin();
  return callBackend<Record<string, Badge[]>>("/api/admin/badges");
}

export async function addBadgeAction(input: {
  category: string;
  game?: string; // required for combo
  threshold: number;
}): Promise<Badge> {
  await requireAdmin();
  const result = await callBackend<Badge>("/api/admin/badges", {
    method: "POST",
    body: input,
  });
  revalidatePath("/v3/admin/badges");
  return result;
}

// No updateBadgeAction: IDs are derived from category(+game)+threshold, so an
// "edit" is just adding a different badge. Use setBadgeActiveAction to retire
// one (the soft delete).

export async function setBadgeActiveAction(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  // Return the backend error instead of throwing: Next.js masks thrown server
  // action errors in production (the client only sees a generic digest, shown
  // as "An error occurred in the Server Components render"). Returning it lets
  // the admin row display the real reason a toggle failed.
  try {
    await callBackend<unknown>(`/api/admin/badges/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
      body: { active },
    });
    revalidatePath("/v3/admin/badges");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update badge" };
  }
}

export type BulkBadgeResult = {
  index: number;
  status: "created" | "updated" | "failed";
  id?: string;
  category?: string;
  error?: string;
};

export async function bulkUpsertBadgesAction(
  payload: { badges: unknown[] },
): Promise<{ ok: boolean; results: BulkBadgeResult[]; message?: string }> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/badges/bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success: boolean;
    message: string;
    data?: { results: BulkBadgeResult[] };
  };
  revalidatePath("/v3/admin/badges");
  return {
    ok: !!body.success,
    results: body.data?.results ?? [],
    message: body.message,
  };
}

export async function refreshBadgeCatalogAction(): Promise<void> {
  await requireAdmin();
  await callBackend<unknown>("/api/admin/badges/refresh", { method: "POST" });
  revalidatePath("/v3/admin/badges");
}

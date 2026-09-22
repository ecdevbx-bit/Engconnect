"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "./adminAuth";

// Server Actions invoked by the admin UI. Each one re-asserts admin auth
// (the docs explicitly note Server Functions are reachable via direct
// POST and must not trust the caller), then proxies to the backend admin
// endpoints with the shared secret header.

export type Problem = {
  category: string;
  order: number;
  difficulty: string;
  // Progressive-band only: a base question and its escalating variant.
  base?: number;
  variant?: number;
  initial: string;
  final: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `Backend call failed: ${path}`);
  }
  return body.data as T;
}

// `sk` is the composite difficulty#order key — internal to the table
// layout. The page passes it back to us through the row, so we never
// hand-construct it on the client.
function encSK(sk: string): string {
  return encodeURIComponent(sk);
}

export async function listProblemsAction(category: string): Promise<Problem[]> {
  await requireAdmin();
  return callBackend<Problem[]>(`/api/admin/problems?category=${encodeURIComponent(category)}`);
}

export async function addProblemAction(input: {
  category: string;
  difficulty: string;
  base?: number;
  variant?: number;
  initial: string;
  final: string;
}): Promise<Problem> {
  await requireAdmin();
  const result = await callBackend<Problem>("/api/admin/problems", {
    method: "POST",
    body: input,
  });
  revalidatePath("/v3/admin/problems");
  return result;
}

export async function reorderProblemAction(
  category: string,
  sk: string,
  newOrder: number,
): Promise<void> {
  await requireAdmin();
  await callBackend<unknown>(
    `/api/admin/problems/${encodeURIComponent(category)}/${encSK(sk)}/reorder`,
    { method: "PATCH", body: { newOrder } },
  );
  revalidatePath("/v3/admin/problems");
}

export async function setProblemActiveAction(
  category: string,
  sk: string,
  active: boolean,
): Promise<void> {
  await requireAdmin();
  await callBackend<unknown>(
    `/api/admin/problems/${encodeURIComponent(category)}/${encSK(sk)}/active`,
    { method: "PATCH", body: { active } },
  );
  revalidatePath("/v3/admin/problems");
}

export type BulkProblemResult = {
  index: number;
  status: "created" | "updated" | "failed";
  category?: string;
  difficulty?: string;
  order?: number;
  error?: string;
};

// bulkUpsertProblemsAction posts the parsed JSON list to the backend's
// bulk endpoint. The backend validates everything before applying; if
// validation fails, no writes happen and the response carries per-item
// errors.
//
// We swallow the standard envelope error from callBackend and let the
// caller render the per-item results — partial failures during apply
// still count as a 200 response with `status:"failed"` entries.
export async function bulkUpsertProblemsAction(
  payload: { problems: unknown[] },
): Promise<{ ok: boolean; results: BulkProblemResult[]; message?: string }> {
  await requireAdmin();
  const res = await backendFetch("/api/admin/problems/bulk", {
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
    data?: { results: BulkProblemResult[] };
  };
  revalidatePath("/v3/admin/problems");
  return {
    ok: !!body.success,
    results: body.data?.results ?? [],
    message: body.message,
  };
}

// Helper exposed to the page so it can compute the SK without knowing
// the padding format. Mirrors backend sortKey().
export async function sortKey(difficulty: string, order: number): Promise<string> {
  return `${difficulty}#${String(order).padStart(7, "0")}`;
}

// progressiveSortKey mirrors the backend's 3-part progressive key
// "progressive#<base>#<variant>".
export async function progressiveSortKey(base: number, variant: number): Promise<string> {
  return `progressive#${String(base).padStart(7, "0")}#${String(variant).padStart(3, "0")}`;
}

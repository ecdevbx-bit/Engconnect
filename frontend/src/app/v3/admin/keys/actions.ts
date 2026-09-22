"use server";

import { addKey, deleteKey, poolOverview, resetKey, testKey, updateKey, type PoolOverview } from "@/server/gemini/admin";

import { requireAdmin } from "../problems/adminAuth";

// Server actions for /v3/admin/keys. Each re-asserts admin (server actions are
// reachable by direct POST) and returns data or a readable error — never the
// raw key.

type Result<T = PoolOverview> = { ok: boolean; message?: string; data?: T };

async function run<T>(fn: () => Promise<T>, okMessage?: string): Promise<Result<T>> {
  try {
    await requireAdmin();
    return { ok: true, message: okMessage, data: await fn() };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function getPoolAction(): Promise<Result> {
  return run(poolOverview);
}

export async function addKeyAction(input: { label: string; apiKey: string; tier: "free" | "paid"; maxConcurrent: number; notes?: string }) {
  return run(async () => {
    await addKey(input);
    return poolOverview();
  }, "Key added");
}

export async function updateKeyAction(
  id: string,
  patch: Partial<{ enabled: boolean; tier: "free" | "paid"; maxConcurrent: number; priority: number; label: string; notes: string }>,
) {
  return run(async () => {
    await updateKey(id, patch);
    return poolOverview();
  }, "Saved");
}

export async function resetKeyAction(id: string) {
  return run(async () => {
    await resetKey(id);
    return poolOverview();
  }, "Key returned to rotation");
}

export async function deleteKeyAction(id: string) {
  return run(async () => {
    await deleteKey(id);
    return poolOverview();
  }, "Key removed");
}

export async function testKeyAction(id: string) {
  return run(async () => {
    const t = await testKey(id);
    return { test: t, pool: await poolOverview() };
  });
}

import "server-only";

import { fail } from "../http";
import { db, must } from "../supabase";
import { ensureEnvKeysSeeded, fingerprint } from "./keyPool";

// Admin operations on the Gemini key pool (page: /v3/admin/keys).
// Raw keys never leave the server: everything returned shows only the last 4.

export type LaneState = {
  lane: "live" | "text";
  status: "active" | "cooldown" | "exhausted";
  cooldownUntil: string | null;
  openLeases: number;
  requestsToday: number;
  errorsToday: number;
  secondsToday: number;
  requestsTotal: number;
  consecutiveFailures: number;
  lastUsedAt: string | null;
  lastOkAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
};

export type KeyRow = {
  id: string;
  label: string;
  keyHint: string;
  tier: "free" | "paid";
  enabled: boolean;
  invalid: boolean;
  invalidReason: string | null;
  maxConcurrent: number;
  priority: number;
  source: "admin" | "env";
  notes: string;
  createdAt: string;
  // derived: is this key usable for live right now?
  health: "live" | "cooling" | "exhausted" | "invalid" | "disabled";
  lanes: LaneState[];
};

export type PoolOverview = {
  keys: KeyRow[];
  summary: {
    liveSessions: number;
    freeKeysUsable: number;
    freeKeys: number;
    paidKeysUsable: number;
    paidKeys: number;
    nextResetAt: string;
  };
  events: { id: number; keyLabel: string; lane: string | null; event: string; detail: string | null; at: string }[];
  activeChats: number;
};

type OverviewRow = {
  id: string;
  label: string;
  key_hint: string;
  enabled: boolean;
  tier: "free" | "paid";
  invalid: boolean;
  invalid_reason: string | null;
  max_concurrent: number;
  priority: number;
  source: "admin" | "env";
  notes: string;
  lane: "live" | "text";
  status: "active" | "cooldown" | "exhausted";
  cooldown_until: string | null;
  open_leases: number;
  requests_today: number;
  errors_today: number;
  seconds_today: number;
  requests_total: number;
  consecutive_failures: number;
  last_used_at: string | null;
  last_ok_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string;
};

export async function poolOverview(): Promise<PoolOverview> {
  await ensureEnvKeysSeeded();
  await db().rpc("gemini_refresh_key_states");
  const rows = must(await db().from("gemini_key_overview").select("*").order("created_at"), "key overview") as OverviewRow[];

  const byKey = new Map<string, KeyRow>();
  for (const r of rows) {
    let k = byKey.get(r.id);
    if (!k) {
      k = {
        id: r.id,
        label: r.label,
        keyHint: r.key_hint,
        tier: r.tier,
        enabled: r.enabled,
        invalid: r.invalid,
        invalidReason: r.invalid_reason,
        maxConcurrent: r.max_concurrent,
        priority: r.priority,
        source: r.source,
        notes: r.notes,
        createdAt: r.created_at,
        health: "live",
        lanes: [],
      };
      byKey.set(r.id, k);
    }
    k.lanes.push({
      lane: r.lane,
      status: r.status,
      cooldownUntil: r.cooldown_until,
      openLeases: Number(r.open_leases),
      requestsToday: r.requests_today,
      errorsToday: r.errors_today,
      secondsToday: r.seconds_today,
      requestsTotal: Number(r.requests_total),
      consecutiveFailures: r.consecutive_failures,
      lastUsedAt: r.last_used_at,
      lastOkAt: r.last_ok_at,
      lastError: r.last_error,
      lastErrorAt: r.last_error_at,
    });
  }

  const keys = [...byKey.values()].map((k) => {
    const live = k.lanes.find((l) => l.lane === "live");
    k.lanes.sort((a, b) => (a.lane === "live" ? -1 : 1) - (b.lane === "live" ? -1 : 1));
    k.health = !k.enabled
      ? "disabled"
      : k.invalid
        ? "invalid"
        : live?.status === "exhausted"
          ? "exhausted"
          : live?.status === "cooldown"
            ? "cooling"
            : "live";
    return k;
  });
  keys.sort((a, b) => (a.tier === b.tier ? a.label.localeCompare(b.label) : a.tier === "free" ? -1 : 1));

  const { data: events } = await db()
    .from("gemini_key_events")
    .select("id, key_id, lane, event, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  const labelOf = new Map(keys.map((k) => [k.id, k.label]));

  const { count: activeChats } = await db()
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { data: reset } = await db().rpc("next_pacific_midnight");

  return {
    keys,
    summary: {
      liveSessions: keys.reduce((n, k) => n + (k.lanes.find((l) => l.lane === "live")?.openLeases ?? 0), 0),
      freeKeys: keys.filter((k) => k.tier === "free").length,
      freeKeysUsable: keys.filter((k) => k.tier === "free" && k.health === "live").length,
      paidKeys: keys.filter((k) => k.tier === "paid").length,
      paidKeysUsable: keys.filter((k) => k.tier === "paid" && k.health === "live").length,
      nextResetAt: (reset as string) ?? "",
    },
    events: (events ?? []).map((e) => ({
      id: e.id as number,
      keyLabel: labelOf.get(e.key_id as string) ?? "deleted key",
      lane: e.lane as string | null,
      event: e.event as string,
      detail: e.detail as string | null,
      at: e.created_at as string,
    })),
    activeChats: activeChats ?? 0,
  };
}

export async function addKey(input: { label: string; apiKey: string; tier: "free" | "paid"; maxConcurrent: number; notes?: string }) {
  const apiKey = input.apiKey.trim();
  if (apiKey.length < 20 || /\s/.test(apiKey)) throw fail.badRequest("That doesn't look like a Gemini API key.");
  const label = input.label.trim() || `key-${fingerprint(apiKey).slice(0, 6)}`;
  const { error } = await db().from("gemini_api_keys").insert({
    label,
    api_key: apiKey,
    fingerprint: fingerprint(apiKey),
    tier: input.tier,
    max_concurrent: Math.max(1, Math.min(100, Math.round(input.maxConcurrent || 3))),
    notes: input.notes?.trim() ?? "",
    source: "admin",
  });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw fail.conflict("This key (or label) is already in the pool.");
    throw new Error(error.message);
  }
}

export async function updateKey(
  id: string,
  patch: Partial<{ enabled: boolean; tier: "free" | "paid"; maxConcurrent: number; priority: number; label: string; notes: string }>,
) {
  const row: Record<string, unknown> = {};
  if (patch.enabled !== undefined) row.enabled = patch.enabled;
  if (patch.tier) row.tier = patch.tier;
  if (patch.maxConcurrent !== undefined) row.max_concurrent = Math.max(1, Math.min(100, Math.round(patch.maxConcurrent)));
  if (patch.priority !== undefined) row.priority = Math.round(patch.priority);
  if (patch.label !== undefined && patch.label.trim()) row.label = patch.label.trim();
  if (patch.notes !== undefined) row.notes = patch.notes;
  must(await db().from("gemini_api_keys").update(row).eq("id", id).select("id"), "update key");
}

export async function deleteKey(id: string) {
  must(await db().from("gemini_api_keys").delete().eq("id", id).select("id"), "delete key");
}

// Put a key back into rotation now (clears cooldown/exhausted + invalid flag).
export async function resetKey(id: string) {
  await db().from("gemini_key_lanes").update({ status: "active", cooldown_until: null, consecutive_failures: 0 }).eq("key_id", id);
  await db().from("gemini_api_keys").update({ invalid: false, invalid_reason: null }).eq("id", id);
  await db().from("gemini_key_events").insert({ key_id: id, event: "admin_reset", detail: "manually returned to rotation" });
}

// Cheap validity probe: list models (does not consume generation quota).
// Does Google itself reject this key right now? Used before believing a
// browser's report that a key is invalid (a learner could otherwise disable
// shared keys). Network trouble = "not proven" → false.
export async function googleRejectsKey(id: string): Promise<boolean> {
  const { data } = await db().from("gemini_api_keys").select("api_key").eq("id", id).maybeSingle();
  if (!data) return false;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
      headers: { "x-goog-api-key": data.api_key as string },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 400 || res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}

export async function testKey(id: string): Promise<{ ok: boolean; detail: string }> {
  const { data } = await db().from("gemini_api_keys").select("api_key").eq("id", id).single();
  if (!data) throw fail.notFound("Key not found.");
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", {
    headers: { "x-goog-api-key": data.api_key as string },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { models?: { name: string }[]; error?: { status?: string; message?: string } };
  if (res.ok) {
    const names = (json.models ?? []).map((m) => m.name);
    const hasLive = names.some((n) => n.includes("live"));
    await db().from("gemini_api_keys").update({ invalid: false, invalid_reason: null }).eq("id", id);
    await db().from("gemini_key_events").insert({ key_id: id, event: "admin_test_ok", detail: `${names.length} models, live=${hasLive}` });
    return { ok: true, detail: `Valid — ${names.length} models available${hasLive ? ", Live models included" : ""}.` };
  }
  const detail = `${json.error?.status ?? res.status}: ${json.error?.message ?? "request failed"}`.slice(0, 300);
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    await db().from("gemini_api_keys").update({ invalid: true, invalid_reason: detail }).eq("id", id);
  }
  await db().from("gemini_key_events").insert({ key_id: id, event: "admin_test_failed", detail });
  return { ok: false, detail };
}

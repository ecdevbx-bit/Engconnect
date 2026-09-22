import "server-only";

import { createHash } from "node:crypto";

import { env } from "../env";
import { fail } from "../http";
import { db, must } from "../supabase";

// Gemini API key pool (see supabase/migrations/*_gemini_key_pool.sql and
// DECISIONS.md D-005/D-006). The database does the bookkeeping atomically;
// this module adds env seeding, error classification and fail-over.

export type Lane = "live" | "text";

export type Lease = { leaseId: string; keyId: string; keyLabel: string; apiKey: string };

export type Outcome = "ok" | "quota_daily" | "quota_minute" | "concurrency" | "invalid" | "error";

export function fingerprint(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}

// Keys listed in GEMINI_API_KEYS are upserted into the pool once per server
// process. Removing a key from env does NOT delete it (use the admin page).
let envSeeded: Promise<void> | null = null;
export function ensureEnvKeysSeeded(): Promise<void> {
  if (!envSeeded) {
    envSeeded = (async () => {
      const toRow = (tier: "free" | "paid") => (k: string, i: number) => {
        // Accept "label=key" or a bare key (Google keys never contain "=").
        const eq = k.indexOf("=");
        const label = eq > 0 ? k.slice(0, eq).trim() : `env-${tier}-${i + 1}`;
        const apiKey = eq > 0 ? k.slice(eq + 1).trim() : k;
        const fp = fingerprint(apiKey);
        return { label: `${label} (${fp.slice(0, 6)})`, api_key: apiKey, fingerprint: fp, source: "env", tier };
      };
      const rows = [...env.geminiApiKeys().map(toRow("free")), ...env.geminiPaidApiKeys().map(toRow("paid"))];
      if (rows.length === 0) return;
      const { error } = await db().from("gemini_api_keys").upsert(rows, { onConflict: "fingerprint", ignoreDuplicates: true });
      if (error) {
        envSeeded = null; // retry next time
        console.error("[gemini] seeding env keys failed:", error.message);
      }
    })();
  }
  return envSeeded;
}

export async function leaseKey(
  userId: string | null,
  lane: Lane,
  ttlSeconds: number,
  exclude: string[] = [],
): Promise<Lease | null> {
  await ensureEnvKeysSeeded();
  const rows = must(
    await db().rpc("gemini_lease_key", {
      p_user_id: userId,
      p_lane: lane,
      p_ttl_seconds: ttlSeconds,
      p_exclude: exclude,
    }),
    "lease gemini key",
  ) as { lease_id: string; key_id: string; key_label: string; api_key: string }[];
  const row = rows?.[0];
  return row ? { leaseId: row.lease_id, keyId: row.key_id, keyLabel: row.key_label, apiKey: row.api_key } : null;
}

export async function heartbeatLease(leaseId: string, ttlSeconds: number): Promise<boolean> {
  const { data } = await db().rpc("gemini_heartbeat_lease", { p_lease_id: leaseId, p_ttl_seconds: ttlSeconds });
  return data === true;
}

export async function releaseLease(leaseId: string, outcome: Outcome, detail?: string, seconds = 0): Promise<void> {
  const { error } = await db().rpc("gemini_release_lease", {
    p_lease_id: leaseId,
    p_outcome: outcome,
    p_detail: detail ?? null,
    p_seconds: Math.max(0, Math.round(seconds)),
  });
  if (error) console.error("[gemini] release lease failed:", error.message);
}

// Map a Gemini failure to what it means for the key's health.
//   429 / RESOURCE_EXHAUSTED  → quota (daily vs per-minute decided by message)
//   400/401/403 key problems  → invalid
//   Live WS close 1008/1011 with quota text → quota
export function classifyGeminiError(status: number | undefined, message: string): Outcome {
  const m = (message || "").toLowerCase();
  const quota = status === 429 || m.includes("resource_exhausted") || m.includes("quota") || m.includes("rate limit");
  if (quota) {
    if (m.includes("per day") || m.includes("perday") || m.includes("daily") || m.includes("requests per day")) {
      return "quota_daily";
    }
    if (m.includes("concurrent") || m.includes("sessions")) return "concurrency";
    return "quota_minute";
  }
  if (
    m.includes("api key not valid") ||
    m.includes("api_key_invalid") ||
    m.includes("permission_denied") ||
    m.includes("api key expired") ||
    m.includes("has been suspended") ||
    m.includes("billing") ||
    ((status === 401 || status === 403) && !m.includes("model"))
  ) {
    return "invalid";
  }
  return "error";
}

// Google's "503 This model is currently experiencing high demand" (and friends)
// says the MODEL is busy, not that the key is bad — counting those as key
// errors would cool down healthy keys during a Gemini hiccup (seen 2026-09-22).
export function isModelBusy(status: number | undefined, message: string): boolean {
  const m = (message || "").toLowerCase();
  return (
    status === 503 ||
    status === 500 ||
    m.includes("high demand") ||
    m.includes("overloaded") ||
    m.includes("unavailable") ||
    m.includes("try again later") ||
    m.includes("internal error")
  );
}

export function errorStatus(err: unknown): number | undefined {
  const e = err as { status?: number; code?: number; response?: { status?: number } };
  return e?.status ?? e?.response?.status ?? (typeof e?.code === "number" ? e.code : undefined);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// Run a short Gemini call on the "text" lane with automatic fail-over:
// if a key is out of quota or invalid, it's marked and the next key is tried.
export async function withTextKey<T>(
  userId: string | null,
  fn: (apiKey: string) => Promise<T>,
  maxAttempts = 3,
): Promise<{ result: T; keyLabel: string }> {
  const tried: string[] = [];
  let lastError = "";
  let busy = false;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // A busy model is worth retrying on the same keys; a bad key is not.
    const lease = await leaseKey(userId, "text", 90, busy ? [] : tried);
    if (!lease) break;
    tried.push(lease.keyId);
    try {
      const result = await fn(lease.apiKey);
      await releaseLease(lease.leaseId, "ok");
      return { result, keyLabel: lease.keyLabel };
    } catch (err) {
      lastError = errorMessage(err);
      if (isModelBusy(errorStatus(err), lastError)) {
        // The key is fine — keep it in rotation and wait a moment.
        busy = true;
        await releaseLease(lease.leaseId, "ok");
        console.warn(`[gemini] text model busy on ${lease.keyLabel}, retrying: ${lastError.slice(0, 120)}`);
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      const outcome = classifyGeminiError(errorStatus(err), lastError);
      await releaseLease(lease.leaseId, outcome, lastError);
      // A non-key problem (bad input, model error) won't be fixed by another key.
      if (outcome === "error") throw err;
    }
  }
  if (busy) {
    console.error("[gemini] text model busy on every attempt:", lastError.slice(0, 200));
    throw fail.unavailable(
      "Google's AI is busy right now. Please try again in a few seconds.",
      "AI_MODEL_BUSY",
    );
  }
  console.error("[gemini] text lane exhausted:", lastError || "no keys available");
  throw fail.unavailable(
    "Our AI coach is at capacity right now. Please try again in a minute.",
    "AI_CAPACITY_EXHAUSTED",
  );
}

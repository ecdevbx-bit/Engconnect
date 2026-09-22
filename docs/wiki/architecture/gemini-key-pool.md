---
title: Gemini key pool
type: architecture
tags: [gemini, keys, quota, rotation]
links: [architecture/gemini-live, features/pronunciation, features/ai-partner, features/admin, architecture/database]
updated: 2026-09-22
---

# Gemini key pool

> **Model busy ≠ bad key** (D-040): Google answers `503 "This model is currently experiencing high
> demand"` in bursts. Those releases count as **ok** (the key stays in rotation), the call is retried,
> and a request that stays busy ends as `503 AI_MODEL_BUSY`. Pronunciation scoring additionally falls
> back to other models. Without this, five bursts in a row put healthy keys into cooldown.

We run on Gemini's **free tier** with several API keys and move between them automatically.

## Keys we hold (2026-09-22)
- **7 free keys** (`GEMINI_API_KEYS`) and **1 paid key** (`GEMINI_PAID_API_KEYS`). All 8 were
  checked: valid, with access to `gemini-3.1-flash-live-preview` and `gemini-3.1-flash-lite`.
- Google rate-limits **per Google Cloud project, not per key**. ✅ The owner confirmed all 7 free
  keys come from **different projects** (D-027), so each adds its own quota.

## Concepts
- **Tier**: `free` keys are always preferred; the **paid** key is leased only when no free key can
  take the request (owner rule, D-011).
- **Lane**: quotas are per model, so each key has independent health for `live` (AI Partner) and
  `text` (pronunciation scoring, memory compile).
- **Lease**: one use of one key. Live leases last the session and are kept alive by heartbeats
  (TTL 90 s); a crashed tab's lease just expires. Text leases last one call.
- **Concurrency**: max open live sessions per key (`max_concurrent`, default 3).

## State machine (per key × lane)
| Event (classified from Google's error) | Result |
|---|---|
| success | `active`, failure streak reset |
| daily quota (`RESOURCE_EXHAUSTED` … per day) | `exhausted` until next **midnight Pacific** |
| per-minute limit | `cooldown` 1 → 2 → 4 … 30 min (exponential by streak) |
| too many concurrent sessions | `cooldown` 45 s |
| invalid / revoked / billing key | whole key `invalid` (admin must fix) |
| 5 unknown errors in a row | `cooldown` 5 min |
Cooldowns expire by themselves; every lease first runs `gemini_refresh_key_states()`.

## Selection order
`paid last` → fewest open leases → fewest requests today → priority → least recently used.
Serialized by an advisory lock, so two sessions starting at once can't overbook a key.

## Fail-over
- **Minting a live token** tries up to 4 keys; a key that fails is marked and skipped.
- **Mid-session**: if the Gemini socket closes with a quota/key error, the browser calls
  `POST /chat/sessions/:id/reconnect {keyFailed:true}` → the key is marked, a token on another key
  is minted, and the recent conversation is replayed as context.
- **Text calls** (`withTextKey`) retry on the next key up to 3 times.
- Nothing left → `503 AI_CAPACITY_EXHAUSTED` ("K.AI is busy…").

## Admin page `/v3/admin/keys`
Shows each key (last 4 chars only) × lane: status, tier, cooldown-until, live sessions, requests
and errors today, seconds today, last error; actions: add key, enable/disable, set tier/max
concurrency, test (a free `models.list` call), reset cooldown. Keys added in env are upserted on
first use (never deleted by removing from env).

Code: `supabase/migrations/20260922000500_gemini_key_pool.sql`, `frontend/src/server/gemini/keyPool.ts`.

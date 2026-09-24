---
title: API reference
type: architecture
tags: [api, contract]
links: [architecture/system, architecture/auth, features/jumble-words, features/pronunciation, features/word-bank, features/ai-partner, architecture/gemini-live, features/premium, features/admin, features/support]
updated: 2026-09-22
---

# API reference (`/api/*`)

Served by `frontend/src/app/api/[...path]/route.ts` → `src/server/routes/index.ts`.

## Conventions
- **Envelope**: success `{success:true, message, data}`; failure
  `{success:false, message, errorCode, traceId, timestamp, fieldErrors?}`. Always JSON.
- **Auth**: `Authorization: Bearer <Supabase access token>`; admin routes also accept
  `x-internal-api-key`. Optional `X-Session-Id` (legacy, inert).
- **Error codes the UI reacts to**: `SESSION_SUPERSEDED` (sign out), `DAILY_QUOTA_REACHED`
  (Go-Pro prompt), `AI_TIME_LIMIT_REACHED` (time's up), `AI_CAPACITY_EXHAUSTED` (all Gemini keys
  busy), `AI_PARTNER_DISABLED`, plus `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`,
  `VALIDATION_FAILED`, `INTERNAL`.

## Endpoints
**Users & progress** — `GET /users/me` · `PATCH /users/me` · `POST /users/me/onboarding` ·
`GET /users/me/attributes` · `GET /users/me/activity?limit=` · `GET /users/me/badges` ·
`GET /users/me/entitlement` · `GET /levels` · `GET /leaderboard?mode=xp|streak|weekly&meRadius=&top=` ·
`GET /flags` (public) · `GET /stt/token` (legacy → always `provider:"browser"`) ·
`GET /users/internal/:sub` (internal) · `POST /debug/clientlog` (internal)

**Jumble** — `GET /game/jumble/batch?difficulty=` · `GET /game/jumble/clue` (sentence shape + meaning,
D-043) · `GET /game/jumble/hint` (level 1–3, logged; level 3 ⇒ half XP) · `POST /game/jumble/submit`
(`hintPenalty`)
→ [[features/jumble-words]]

**Pronunciation & Word Bank** — `GET /pronunciation/phrases` · `POST /pronunciation/attempts`
(multipart: audio, order, difficulty, durationMs) · `GET /pronunciation/attempts?limit=` ·
`GET|POST /word-bank/` · `DELETE /word-bank/:word` → [[features/pronunciation]], [[features/word-bank]]

**AI Partner** → [[features/ai-partner]], [[architecture/gemini-live]]
| | |
|---|---|
| `GET /chat/access` | `{enabled}` |
| `GET /chat/usage` | `{pro, usedSeconds, capSeconds, remainingSeconds, rewards}` |
| `POST /chat/sessions` `{language, level, scenario, voice}` (validated vs `lib/aiPartnerOptions.ts`) | `{sessionID, language, level, rewards, aiUsedSeconds, aiCapSeconds, live:{token, wsUrl, model, apiVersion, expiresAt, kickoff}}` |
| `POST /chat/sessions/:id/progress` `{speakingSeconds, turns[], usage}` | speech_progress payload + `{capReached, sessionActive, usedSeconds, capSeconds, remainingSeconds}` |
| `POST /chat/sessions/:id/reconnect` `{keyFailed, detail, closeCode}` | `{live}` (new token, maybe another key) |
| `POST /chat/sessions/:id/end` (also `DELETE /chat/sessions/:id`) | final progress; releases key; compiles memory |

**Premium** — `GET /trial/status` · `POST /trial/apply` · `POST /feedback` · `GET /pro-link` (public) ·
`GET /payments/plans` · `POST /payments/subscriptions` · `GET /payments/subscription` ·
`POST /payments/webhook` (Razorpay HMAC) → [[features/premium]]

**Admin** (internal key or admin user) — problems (list/add/reorder/active/bulk), badges
(list/add/active/bulk/refresh), levels (get/put), `ai-partner/rewards`, `pronunciation/timings`,
`jumble/settings`, `quotas`, `feature-flags`, `pro-trials` (+approve/cancel/settings),
`pro-invite` (+settings) → [[features/admin]]

**Auth helpers** — `GET /session`, `POST /session/start` (record the new login for the single-session rule),
`POST /account/{signup,resend,reset}` rate-limited email actions → [[architecture/auth]]

**Support** — `POST /support` `{category, message, email?, page}` (guests allowed; 5/hour) ·
`GET /admin/support?status=` · `PATCH /admin/support/:id` `{status}` → [[features/support]]

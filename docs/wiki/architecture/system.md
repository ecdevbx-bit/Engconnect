---
title: System architecture
type: architecture
tags: [architecture]
links: [architecture/api, architecture/database, architecture/auth, architecture/gemini-key-pool, architecture/gemini-live, architecture/storage-r2, operations/deployment]
updated: 2026-09-22
---

# System architecture

```
 Browser (Next.js UI, PWA)
   │  HTTPS /api/*  (Supabase JWT in Authorization)          WebSocket (ephemeral token)
   ▼                                                            ▼
 Vercel: Next.js 16 app ──── mint token / lease key ────► Google Gemini Live
   ├─ UI routes (app router)                                  (gemini-3.1-flash-live-preview)
   ├─ /api/[...path]  → src/server/router.ts → routes/*
   │     ├─ Supabase Postgres (service role)  ◄── award_progress(), gemini_lease_key() …
   │     ├─ Gemini text (gemini-3.1-flash-lite) — pronunciation scoring, memory compile
   │     └─ Cloudflare R2 (S3 API) — recordings
   └─ Supabase Auth (Google OAuth, email+password) via @supabase/ssr cookies
```

## Why this shape
- **Keep the old API contract** — the frontend was written for a Go backend. We re-implemented its
  53 endpoints inside the same Next.js app, so the UI barely changed (DECISIONS D-002).
- **Logic that must be atomic lives in Postgres functions** (XP/badges, key leasing, daily
  counters). Route handlers are thin validators/translators ([[architecture/database]]).
- **Voice never goes through our server.** Streaming audio through Vercel functions is impossible
  (no long-lived sockets) and expensive; the browser connects straight to Gemini with a short-lived,
  locked token ([[architecture/gemini-live]]). Our server still controls access, caps and XP.
- **Keys never reach the browser** — the pool lives in a locked table ([[architecture/gemini-key-pool]]).

## Code map (`frontend/`)
| Path | Role |
|---|---|
| `src/app/api/[...path]/route.ts` | Catch-all API entry (Node runtime, no cache) |
| `src/server/router.ts`, `routes/*.ts` | Route table + handlers per domain |
| `src/server/domain/*` | users/progress, problems, premium |
| `src/server/gemini/*` | key pool, live tokens, scoring, tutor prompt, memory |
| `src/server/{guards,http,settings,env,supabase,r2}.ts` | auth, envelopes, settings docs, config, clients |
| `src/hooks/useGeminiLiveSession.ts` | AI Partner client (Gemini WS + mic + heartbeats) |
| `src/lib/*` | Existing API clients (unchanged contract) |
| `supabase/migrations/*.sql` | Schema source of truth ([[architecture/database]]) |

Deployment: [[operations/deployment]]. Auth: [[architecture/auth]]. Storage: [[architecture/storage-r2]].

---
title: Monitoring (Sentry)
type: operations
tags: [ops, errors, sentry, privacy]
links: [operations/runbook, operations/credentials, operations/deployment, architecture/api, architecture/gemini-key-pool]
updated: 2026-09-24
---

# Monitoring — Sentry (D-044)

**Where**: sentry.io → org **englishconnection** (EU region, `de.sentry.io`) → project **engconnect**
(Next.js). Set up by `node scripts/sentry-setup.mjs` (idempotent: project, DSN, Vercel env).

## What gets reported
| Source | How | Notes |
|---|---|---|
| Unhandled API errors (the learner sees "Something went wrong" + a code) | `server/http.ts → errorResponse` | tagged `traceId` = the code the learner sees — search it |
| Deliberate 5xx (`AI_MODEL_BUSY`, `AI_CAPACITY_EXHAUSTED`, …) | same place, as **warnings**, one issue per code | shows how often "K.AI is busy" happens ([[architecture/gemini-key-pool]]) |
| Server component / route errors | `instrumentation.ts → onRequestError` | 5 % of server requests also traced (slow Gemini calls) |
| Browser errors | `instrumentation-client.ts`, `app/error.tsx`, `app/global-error.tsx` | errors only — no tracing, no session replay (keeps pages light) |

Only **Vercel deployments** report (`VERCEL_ENV` / `NEXT_PUBLIC_APP_ENV`); local dev and local
`next start` stay quiet. Browser events go through our own **`/monitoring`** tunnel so ad blockers
don't drop them (excluded from `src/proxy.ts`).

## Is it working?
`node scripts/sentry-check.mjs` (after a deploy): triggers a deliberate server error through
`POST /api/debug/sentry` (internal key only) and sends a browser-style event through `/monitoring`,
then waits until both appear in Sentry. Events are flushed with `after()` so a frozen Vercel function
doesn't drop them.

## Privacy
`lib/sentryScrub.ts`: Sentry v11 `dataCollection` turns off cookies, request/response bodies (recordings,
transcripts), auth headers, local variables and gen-AI data; URLs are scrubbed of `access_token`,
`token_hash`, `code`…; the user is an opaque id only (set in `lib/session.tsx`). Browser noise is ignored
(mic permission denied, ResizeObserver, flaky mobile fetches, extensions).

## Source maps
Uploaded at build time when `SENTRY_AUTH_TOKEN` is set (Vercel), so stacks show real file/line names.
The token is currently the owner's personal Sentry token (org tokens can only be created in Sentry's web
UI) — replace with an org token when convenient ([[operations/credentials]]).

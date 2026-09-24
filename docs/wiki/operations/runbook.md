---
title: Runbook
type: operations
tags: [ops, local-dev, migrations]
links: [operations/deployment, operations/credentials, operations/monitoring, architecture/database, architecture/gemini-key-pool]
updated: 2026-09-24
---

# Runbook

## Run locally
```bash
cd frontend
npx -y pnpm@11.0.8 install      # local pnpm is 10.x; the repo pins 11.0.8
npx -y pnpm@11.0.8 dev          # http://localhost:3000
```
Env comes from `frontend/.env.local` (git-ignored; template: `frontend/.env.example`).
Checks: `npx tsc --noEmit` · `npx -y pnpm@11.0.8 lint` · `npx -y pnpm@11.0.8 build`.

## Database migrations
1. Add `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql` (never edit an applied one).
2. `node supabase/apply-migrations.mjs --dry-run` then `node supabase/apply-migrations.mjs`.
   Needs `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` env, or reads `credentials.txt`.
3. Ad-hoc SQL: `node supabase/apply-migrations.mjs --sql "select count(*) from problems"`.

## Verification scripts (`scripts/`)
| Script | What it proves |
|---|---|
| `node scripts/smoke-test.mjs [url]` | Whole API end-to-end with a throwaway user (32 checks on 2026-09-22), incl. AI Partner token + setup options and a support ticket (sends one email to the team) |
| `node scripts/gemini-live-probe.mjs [keyIndex] [apiVersion]` | Ephemeral token → constrained socket → spoken reply + transcript + resume handle |
| `node scripts/gemini-speech-probe.mjs [keyIndex]` | Voice turn with manual activity markers (old tap-to-talk wire format; the app is hands-free since D-039) + pronunciation scoring |
| `node scripts/gemini-voice-probe.mjs [Voice…]` | Which prebuilt voices the Live model accepts |
| `node scripts/ai-partner-probe.mjs [url] [Level] "[Mode]" [Language]` | Real AI Partner session via the API; prints K.AI's replies to two learner turns (checks the level/mode instruction files) |
| `node scripts/pronunciation-probe.mjs [url] [NativeLang]` | Real pronunciation attempt (TTS clip with one wrong word); prints verdicts, syllables, native-script respellings, tips |
| `node scripts/pronunciation-strictness.mjs [url]` | Silence / faint noise / wrong sentence / phonetic slips — proves the scorer isn't just echoing the expected sentence (D-038) |
| `node scripts/ai-partner-handsfree-probe.mjs [url]` | Continuous audio with no activity markers + talking over K.AI — hands-free turns and barge-in (D-039) |
| `node scripts/pro-flow-probe.mjs [url]` | Trial status/apply, payment plans, /pro link, entitlement, and what a second login does to the first session |
| `node scripts/wait-deploy.mjs <sha>` | Waits for Vercel to finish deploying that commit |
| `node scripts/tail-prod-logs.mjs` | Streams production runtime logs for 4 min — reproduce the bug while it runs (how the Gemini 503s were found) |
| `node scripts/jumble-hints-probe.mjs [url]` | Jumble hint ladder with a Hindi-speaking throwaway account: structure clue + meaning (cached on the 2nd call), word hints, half XP after the full sentence (D-043) |
| `node scripts/audit-guards-probe.mjs [url]` | The audit guards (D-045): a browser can't mark shared keys invalid, ended K.AI sessions aren't billed, crafted/silent WAVs rejected without using quota, bad ids → 4xx. Starts one real K.AI session |
| `node scripts/sentry-check.mjs [url]` | Proves production reports to Sentry: a deliberate API error (internal-key-only `POST /api/debug/sentry`) must show up tagged with its traceId, and a test event through the `/monitoring` tunnel must arrive (D-044) |
| `node scripts/sentry-setup.mjs` | Sentry project + DSN + Vercel env (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`) — idempotent (D-044, [[operations/monitoring]]) |
| `node scripts/vercel-setup.mjs` | Creates/links the Vercel project, sets env vars, triggers a deploy |

## Gemini keys
- Add in env (`GEMINI_API_KEYS` free, `GEMINI_PAID_API_KEYS` paid; comma-separated) → upserted on
  the next server start, or add on `/v3/admin/keys`.
- Key stuck in cooldown/exhausted? It returns by itself (Pacific midnight for daily). Invalid keys
  need an admin to fix/replace. See [[architecture/gemini-key-pool]].
- Check pool health: `node supabase/apply-migrations.mjs --sql "select label,lane,status,cooldown_until,open_leases,requests_today,errors_today from gemini_key_overview order by label,lane"`.

## Before pushing (build the commit, not your desk)
`npx tsc --noEmit` can hide a file you filtered out of the output, so build the **commit** in a
throwaway worktree:
```bash
git worktree add -q --detach "$TEMP/eb" <sha> && cp frontend/.env.local "$TEMP/eb/frontend/"
cd "$TEMP/eb/frontend" && npx -y pnpm@11.0.8 install --frozen-lockfile && npx -y pnpm@11.0.8 run build
```
Reuse that worktree for later commits (`git checkout --force --detach <sha>`) — the install is the
slow part. Remove it with `cmd /c rd /s /q "\\?\<path>"`; `git worktree remove` trips on Windows
long paths.

## Common problems
| Symptom | Fix |
|---|---|
| `pnpm` "Failed to switch pnpm to v11.0.8" | use `npx -y pnpm@11.0.8 …` |
| API returns `SESSION_SUPERSEDED` | account signed in elsewhere — sign in again |
| `AI_CAPACITY_EXHAUSTED` | every key busy/out of quota → check `/v3/admin/keys`; add keys from other Google projects |
| Google sign-in fails | Google provider not enabled in Supabase or redirect URI mismatch ([[operations/credentials]]) |
| Emails not arriving | built-in Supabase SMTP limit — configure custom SMTP |
| `K.AI is busy right now` | Google 503 on the text model — transient, already retried + model fallback (D-040). Check `gemini_key_overview.last_error` |
| Signed out when opening the app elsewhere | single-active-session by design (D-009) — the older device gets `SESSION_SUPERSEDED` |
| A learner reports "Something went wrong" with a code | that's the `traceId` — search it in Sentry (tag `traceId`) for the stack ([[operations/monitoring]]) |

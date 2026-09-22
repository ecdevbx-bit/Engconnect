---
title: Runbook
type: operations
tags: [ops, local-dev, migrations]
links: [operations/deployment, operations/credentials, architecture/database, architecture/gemini-key-pool]
updated: 2026-09-22
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
| `node scripts/gemini-speech-probe.mjs [keyIndex]` | Tap-to-talk voice turn (input transcription + correction) and pronunciation scoring |
| `node scripts/gemini-voice-probe.mjs [Voice…]` | Which prebuilt voices the Live model accepts |
| `node scripts/vercel-setup.mjs` | Creates/links the Vercel project, sets env vars, triggers a deploy |

## Gemini keys
- Add in env (`GEMINI_API_KEYS` free, `GEMINI_PAID_API_KEYS` paid; comma-separated) → upserted on
  the next server start, or add on `/v3/admin/keys`.
- Key stuck in cooldown/exhausted? It returns by itself (Pacific midnight for daily). Invalid keys
  need an admin to fix/replace. See [[architecture/gemini-key-pool]].
- Check pool health: `node supabase/apply-migrations.mjs --sql "select label,lane,status,cooldown_until,open_leases,requests_today,errors_today from gemini_key_overview order by label,lane"`.

## Common problems
| Symptom | Fix |
|---|---|
| `pnpm` "Failed to switch pnpm to v11.0.8" | use `npx -y pnpm@11.0.8 …` |
| API returns `SESSION_SUPERSEDED` | account signed in elsewhere — sign in again |
| `AI_CAPACITY_EXHAUSTED` | every key busy/out of quota → check `/v3/admin/keys`; add keys from other Google projects |
| Google sign-in fails | Google provider not enabled in Supabase or redirect URI mismatch ([[operations/credentials]]) |
| Emails not arriving | built-in Supabase SMTP limit — configure custom SMTP |

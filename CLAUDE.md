# English Connection — agent instructions (schema)

English-learning platform for Indian learners: Jumble Words, Pronunciation Coach, AI Partner
(K.AI on Gemini Live), progress/badges, Pro. Next.js 16 app (UI + API) on Vercel, Supabase
(Postgres + Auth), Gemini (key pool), Cloudflare R2.

## Memory — read these first, every session (they survive context compaction)
@docs/memory/STATUS.md
@docs/memory/DECISIONS.md

Then open `docs/wiki/index.md` and follow links to the pages relevant to the task.

## Knowledge base = Karpathy "LLM Wiki" (see docs/wiki/meta/how-this-wiki-works.md)
- **After any meaningful change**: update the affected wiki pages (keep frontmatter `links:` in
  sync with body `[[links]]`), append one line to `docs/wiki/log.md`, overwrite
  `docs/memory/STATUS.md` (done / in progress / next / blocked), then rebuild the graph memory with
  `node docs/wiki/build-graph.mjs` and fix anything it lists under Lint.
- **Graph memory**: `docs/wiki/graph.json` (nodes = wiki pages + decisions + status; edges = links,
  citations, supersedes). Use it to find everything connected to a feature before changing it.
- **When you make a decision** that isn't obvious from the code: append `D-0xx` to
  `docs/memory/DECISIONS.md` (append-only; supersede, never rewrite).
- **Before answering "how does X work"**: check the wiki; if it's wrong, fix it (lint).

## Workflow (how every change is made — follow it in order)
1. **Orient**: read STATUS + DECISIONS (auto-loaded), `docs/wiki/index.md`, and the relevant pages;
   use `docs/wiki/graph.json` to see what a feature touches.
2. **Build**: code in `frontend/` (conventions in `frontend/CLAUDE.md`); schema changes as a NEW
   file in `supabase/migrations/` → `node supabase/apply-migrations.mjs` (Management API).
   Auth/SMTP/Google settings → `node supabase/configure-auth.mjs` (env-var driven, idempotent).
3. **Check locally**: `rm -rf frontend/.next` (stale types) → `npx tsc --noEmit` → eslint on the
   changed files → `npx -y pnpm@11.0.8 build` for big changes. Gemini changes: verify live with
   `scripts/gemini-*-probe.mjs`. UI changes: look at them in the browser pane.
4. **Record**: update wiki pages + `log.md`, add `D-0xx` for non-obvious decisions, overwrite
   STATUS, `node docs/wiki/build-graph.mjs` (0 lint).
5. **Ship**: scan staged diff for secrets (sb_secret_, sbp_, vcp_, AQ.Ab8, re_, GOCSPX-, AIza) →
   commit (with the Co-Authored-By line) → `git push origin main` → Vercel auto-deploys
   (new env vars: `scripts/vercel-setup.mjs` pattern / Vercel API with the token in credentials.txt).
6. **Verify prod**: wait for the deployment READY, then
   `node scripts/smoke-test.mjs https://engconnect-beta.vercel.app` (must be all ✓), record the
   result in STATUS, commit.

## Repo layout
- `frontend/` — Next.js 16 app. API = `src/app/api/[...path]/route.ts` → `src/server/**`.
  See `frontend/CLAUDE.md` for code conventions.
- `supabase/migrations/` — schema (source of truth). Apply: `node supabase/apply-migrations.mjs`.
- `docs/wiki/` — product + architecture wiki (+ `build-graph.mjs`, `graph.json`). `docs/memory/` —
  decisions + status.
- `scripts/` — `smoke-test.mjs` (end-to-end, local or prod), `gemini-live-probe.mjs`,
  `gemini-speech-probe.mjs` (tap-to-talk + scoring), `gemini-voice-probe.mjs [Voice…]`,
  `vercel-setup.mjs` (project + env + deploy). All read secrets from local files, print none.
- `credentials.txt` — REAL SECRETS, git-ignored. Read only when needed; **never print values**
  (redact when inspecting), never copy into code, docs or commits.

## Rules
- Keep the old `/api` contract (`{success,message,data}`) — the UI depends on it.
- XP/badges only via the `award_progress()` Postgres function. Gemini only via the key pool.
- No PostgREST-reserved column names (order, count, select, limit…).
- pnpm: `npx -y pnpm@11.0.8 …`. Next 16: read `frontend/node_modules/next/dist/docs/` for
  unfamiliar APIs (middleware is `proxy.ts`, route params are Promises).
- Commit/push only when the owner asks. Git identity: `ecdevbx-bit` (noreply email).

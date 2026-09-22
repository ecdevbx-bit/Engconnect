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
  sync with body `[[links]]`), append one line to `docs/wiki/log.md`, and overwrite
  `docs/memory/STATUS.md` (done / in progress / next / blocked).
- **When you make a decision** that isn't obvious from the code: append `D-0xx` to
  `docs/memory/DECISIONS.md` (append-only; supersede, never rewrite).
- **Before answering "how does X work"**: check the wiki; if it's wrong, fix it (lint).

## Repo layout
- `frontend/` — Next.js 16 app. API = `src/app/api/[...path]/route.ts` → `src/server/**`.
  See `frontend/CLAUDE.md` for code conventions.
- `supabase/migrations/` — schema (source of truth). Apply: `node supabase/apply-migrations.mjs`.
- `docs/wiki/` — product + architecture wiki. `docs/memory/` — decisions + status.
- `credentials.txt` — REAL SECRETS, git-ignored. Read only when needed; **never print values**
  (redact when inspecting), never copy into code, docs or commits.

## Rules
- Keep the old `/api` contract (`{success,message,data}`) — the UI depends on it.
- XP/badges only via the `award_progress()` Postgres function. Gemini only via the key pool.
- No PostgREST-reserved column names (order, count, select, limit…).
- pnpm: `npx -y pnpm@11.0.8 …`. Next 16: read `frontend/node_modules/next/dist/docs/` for
  unfamiliar APIs (middleware is `proxy.ts`, route params are Promises).
- Commit/push only when the owner asks. Git identity: `ecdevbx-bit` (noreply email).

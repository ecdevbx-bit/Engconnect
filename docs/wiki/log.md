---
title: Log
type: log
updated: 2026-09-22
---

# Log (append-only)

Newest at the bottom. One entry per meaningful change: `## [YYYY-MM-DD] kind | summary`.
Kinds: `ingest` (learned from a source), `build` (code/infra), `decision` (see DECISIONS.md),
`wiki` (knowledge-base maintenance), `ops` (deploy/config).

## [2026-09-22] ingest | Frontend + ENGAI studied
- Mapped the Next.js 16 frontend (348 files): 53 backend endpoints + chat WebSocket + 13 env vars
  → [[architecture/api]]. Traced Jumble + Pronunciation flows → [[features/jumble-words]],
  [[features/pronunciation]]. Mapped AI Partner UI vs plumbing → [[features/ai-partner]].
- ENGAI (Desktop/ENGAI): working Gemini 3.1 Live client, K.AI tutor prompt, Karpathy memory idea
  (localStorage) → ported prompt + memory to the server.

## [2026-09-22] build | Supabase backend + API
- 8 migrations (schema, progress engine, key pool, seeds) applied to project uycpxwajvhcigyhvepci.
- `frontend/src/server/**` re-implements the old Go API as Next.js route handlers.

## [2026-09-22] build | Gemini Live + pool verified
- Probes: ephemeral token (v1alpha) → constrained socket → spoken reply + transcripts + resume
  handle ✓; tap-to-talk voice turn ✓; pronunciation word scoring ✓. All 8 keys valid.

## [2026-09-22] decision | Auth → Supabase-only (D-008), key tiers (D-011), and D-009…D-019

## [2026-09-22] wiki | Wiki + memory created (Karpathy pattern)
- index, log, overview, 8 feature pages, 7 architecture pages, 3 operations pages.

## [2026-09-22] ops | GitHub connected
- gh authenticated as `ecdevbx-bit`; remote = github.com/ecdevbx-bit/Engconnect. Vercel team
  `engconnect` found (no project yet).

## [2026-09-22] build | Supabase-only auth + admin keys page + checks
- NextAuth removed; Supabase Auth (Google + email/password), email-send limits, reset flow
  → [[architecture/auth]]. `/v3/admin` landing + `/v3/admin/keys` → [[features/admin]],
  [[architecture/gemini-key-pool]]. /pro now grants existing accounts too (D-021).
- `next build` ✓; 28/28 end-to-end smoke checks ✓ (incl. real Gemini token mint).

## [2026-09-22] ops | First commit + deploy prep
- `.env.example`, READMEs, root CLAUDE.md schema. Next: Vercel project + Supabase auth URLs.

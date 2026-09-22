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

## [2026-09-22] ops | Production live
- https://engconnect-beta.vercel.app READY (commit 4388fa5) after fixing Vercel's pnpm detection
  (D-022). Supabase Auth: site URL + redirect allow-list + password ≥ 8 configured.
- Login card disables "Continue with Google" until the Google provider is enabled in Supabase.
- Account menu (admins): Admin home + Gemini Keys links.

## [2026-09-22] build | AI Partner setup, Google + Resend, support panel, admin updates
- AI Partner start card: 14 languages × 3 levels × 6 practice modes × 18 verified voices (D-026)
  → [[features/ai-partner]], [[architecture/gemini-live]].
- Google sign-in enabled (D-024); Resend SMTP + branded auth emails, 30/h (D-025) →
  [[architecture/auth]]. Admin = ec.devbx@gmail.com (D-023).
- "Something wrong?" Help dropdown + /support form → tickets + Resend email; admin Support inbox;
  "Don't approve" for Pro applications (D-029) → [[features/support]], [[features/admin]].
- Owner confirmed Gemini keys are from different projects (D-027).

## [2026-09-22] wiki | Graph memory
- `docs/wiki/build-graph.mjs` → `graph.json` + [[meta/graph]] (D-028). Wiki updated for all of the above.

## [2026-09-22] ops | Production verified
- Deploy b61c5c8 READY; production smoke 32/32 (setup options, support email via Resend, Google on).

## [2026-09-22] ops | Workflow + scripts saved before compaction
- Smoke test and Gemini probes moved to `scripts/` (D-030); workflow written into root CLAUDE.md;
  [[operations/runbook]] lists the scripts.

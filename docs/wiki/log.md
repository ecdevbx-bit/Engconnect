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

## [2026-09-22] feature | Admin wiki, K.AI levels, pronunciation guide, lighter UI
- Admin **Wiki & memory** page renders this wiki + STATUS + DECISIONS + an interactive graph from a
  snapshot written by `build-graph.mjs` (D-031, [[features/admin]]).
- AI Partner levels Beginner / Intermediate / Expert with instruction files + per-session material
  (IELTS cue cards, interview questions, scenes) — [[features/k-ai-instructions]] (D-032).
  Pro AI Partner time is now 20 min/day (D-033).
- Old support/feedback UI removed; the Resend Help form is the only channel (D-034, [[features/support]]).
- Pronunciation: syllables + native-script respelling + "You said…" per missed word, 🔊 hear it
  (D-035, [[features/pronunciation]]). R2 not needed for scoring (D-036, [[architecture/storage-r2]]).
- Mobile tab bar redesigned (glass, raised K.AI button, custom icon); tours/celebrations/Pro
  prompts load only inside the app; theme-toggle hydration warning fixed (D-037).

## [2026-09-22] ops | Deployed 220ff40, production verified
- Vercel deploy of 220ff40 READY; `scripts/smoke-test.mjs` on production **32/32**; AI Partner probe
  (Beginner/Job Interview/Hindi) and pronunciation probe (Hindi respellings, "You said 'banana'") pass
  on production. Beginner rules tightened afterwards ([[features/k-ai-instructions]]).
- Landing redesign (glassmorphism, lighter, keep the scroll swipe, less generic copy) still in progress.

## [2026-09-22] fix | Pronunciation no longer "always perfect"; instant scoring
- Silent clips scored 100% (model primed by the expected sentence). Now: silence rejected
  (`NO_SPEECH`), blind second listener downgrades words it didn't hear, stricter rubric; recording
  auto-stops when the learner finishes and is scored at once — no listen-back (D-038,
  [[features/pronunciation]]).
- K.AI hands-free conversation (auto voice detection, interruptions, mute-only UI) in progress —
  server side tested live, not shipped until the client is done.

## [2026-09-22] ui | PRO badge for Pro members only; Pro card on mobile home
- Navbar PRO badge now only for Pro members (session `isPro`); mobile home shows the "Unlock Pro"
  card for free users (phones had no way to buy/apply); card copy fixed to 20 min/day with K.AI
  ([[features/premium]]). Deployed 2b167d8 before this: production smoke 32/32, silence → NO_SPEECH.

## [2026-09-22] feature | K.AI hands-free conversation (GPT-voice style)
- No more tap-to-talk: mic streams continuously, Gemini's voice detection takes the turns (pause length
  per level), talking over K.AI interrupts it, echo gate stops K.AI interrupting itself, mute is the only
  control (D-039, [[features/ai-partner]], [[architecture/gemini-live]]).

## [2026-09-22] fix | Gemini "model busy" 503s, token refresh, quiet mics
- Pronunciation failed with a generic internal error whenever Google's text model was overloaded, and
  the 503s were cooling down healthy keys. Now retried + model fallback + a clear message (D-040,
  [[architecture/gemini-key-pool]], [[features/pronunciation]]).
- Expired access token → refresh once and retry (the "unauthorized" on long-open tabs).
- Silence detection is relative to the room's noise floor, so quiet mics still count as speech.

## [2026-09-23] ui | Landing page redesign shipped
- Glass editorial landing built around the product (live captions, respelling, jumble, minutes), the
  scroll-swipe kept, demos lazy-mounted, generic copy gone, hands-free wording; sign-up states the
  Terms/Privacy agreement (D-041).

## [2026-09-23] ui | Landing copy cut back
- Owner: "too much text, obscure". Every section reduced to one short line (hero, mistakes, coach
  tiles, how-it-works, setup, mascot, progress, plans, final CTA). Removed a testimonial that
  described pasting video links — not a feature of this app ([[features/premium]], D-041).

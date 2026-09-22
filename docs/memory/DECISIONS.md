# Decision Log (project memory)

> **Why this file exists:** long AI-assisted sessions get their context compacted.
> Anything important that is *not obvious from the code* is written here so it
> survives. The root `CLAUDE.md` imports this file, so every agent session loads it.
>
> **Rules for editing:** append-only. Never rewrite history. To reverse a decision,
> add a new entry that says `Supersedes D-xxx` and mark the old one
> `**Status: superseded by D-yyy**`. Keep each entry short: what we decided, why, and
> what it affects. Dates are absolute (YYYY-MM-DD).

---

## D-001 · Repo layout: one git repo at `ENG/` — 2026-09-22
- `frontend/` = the Next.js 16 app (UI **and** the API route handlers).
- `supabase/` = database migrations + seed (the source of truth for the schema).
- `docs/memory/` = this log + `STATUS.md`. `docs/wiki/` = product wiki.
- `credentials.txt` at the root is **git-ignored** (and so is every `.env*`). Never commit secrets.

## D-002 · Backend = Supabase (Postgres + Auth) + Next.js route handlers — 2026-09-22
- The frontend was written for an old Go backend at `NEXT_PUBLIC_API_URL` (`/api/*`,
  `{success,message,data}` envelopes). We **re-implement that same contract** as Next.js
  route handlers inside `frontend/src/app/api/**`, backed by Supabase Postgres.
- Why not Supabase Edge Functions: no Docker on the dev machine (can't run them locally),
  extra deploy step, and keeping the old contract means almost no UI code changes.
- Business logic that must be atomic (XP awards, key leasing) lives in **Postgres
  functions**; route handlers stay thin. The server talks to Postgres with the
  **secret (service-role) key**; the browser never gets it.
- `NEXT_PUBLIC_API_URL` is set to the app's own origin, so `v3Fetch` hits our handlers.

## D-003 · Auth: keep NextAuth Google sign-in, swap the token exchange to Supabase — 2026-09-22
**Status: superseded by D-008 (same day).**
- NextAuth still runs the Google OAuth flow (UI unchanged). In the `jwt` callback we call
  `supabase.auth.signInWithIdToken({ provider: 'google', token })` instead of the old
  `/api/auth/google`. Supabase creates/links the user in `auth.users`; a trigger creates
  `public.profiles`. Refresh uses `supabase.auth.refreshSession`.
- `session.user.accessToken` is now a **Supabase JWT**; API handlers verify it.
- Requires: Google provider enabled in Supabase with the same Google OAuth client ID.

## D-004 · AI Partner = Gemini Live, browser ↔ Google directly via ephemeral tokens — 2026-09-22
- We do **not** keep the old chat-WebSocket/Deepgram/TTS pipeline. The browser opens a
  WebSocket straight to Gemini Live (`BidiGenerateContentConstrained`) using a
  short-lived **ephemeral token** minted by our server. Audio in: 16 kHz PCM16 mono.
  Audio out: 24 kHz PCM16 mono. Gemini's own `inputAudioTranscription` /
  `outputAudioTranscription` give us live captions (no separate STT service).
- The system prompt (tutor persona, ported from `ENGAI/src/services/tutorPrompt.js`) is
  locked **inside the token's constraints** server-side, so the browser can't change it.
- Model: `gemini-3.1-flash-live-preview` (owner's choice for the demo). Google now lists
  it as *legacy preview* and recommends `gemini-3.8-live` (stable). Model is a setting
  (`GEMINI_LIVE_MODEL` env / admin), so switching is config-only.

## D-005 · Gemini quotas are per **Google Cloud project**, not per key — 2026-09-22
- Google docs: "Rate limits are applied per project, not per API key." Daily quotas reset
  at **midnight Pacific**. Five keys from the *same* project = the capacity of one key.
- ⇒ Each pool key must come from a **different project** (ideally different accounts).

## D-006 · Key pool design (rotation, cooldown, admin page) — 2026-09-22
- Keys live in `public.gemini_api_keys` (RLS on, no policies ⇒ service-role only). Can be
  seeded from env `GEMINI_API_KEYS` (comma-separated) or added on the admin Keys page.
- One live session = one **lease** (`gemini_key_leases`), kept alive by heartbeats and
  auto-expiring if the tab dies. Leasing picks the least-loaded `active` key under its
  `max_concurrent` (default 3), serialized by an advisory lock.
- Failures move a key out of rotation: daily quota → `exhausted` until next Pacific
  midnight; per-minute → `cooldown` with 1→2→4…30 min back-off; concurrency → 45 s;
  bad key → `invalid` (needs admin). Keys return to rotation automatically.
- If every key is out, the API answers `AI_CAPACITY_EXHAUSTED` and the UI says so.
- Future hardening before a paid plan: move raw keys into Supabase Vault.

## D-007 · AI Partner keeps its UI; only the plumbing under it changes — 2026-09-22
- Kept as-is: `V3AIPartner.tsx` render tree, `ChatBubble`, `SpeechProgressCard`, `VoiceAgent`,
  `PcmPlayer` (already 24 kHz PCM16 — exactly Gemini's output), tour element ids (`#aip-tour-*`).
- Replaced: `useV3ChatSession` (old `/ws/chat`) + Deepgram/WebSpeech capture → one
  `useGeminiLiveSession` hook with the same return shape, so the component barely changes.
- **Tap-to-talk stays** (manual `activityStart`/`activityEnd`, Gemini auto-VAD off) — **superseded by D-039**. Why:
  learners pause mid-sentence to think; auto-VAD would cut them off and answer too early.
- Server keeps authority over what it can: session create checks time caps and returns
  rewards; the browser posts `progress` heartbeats (speaking seconds) and the server clamps
  them to wall-clock time before awarding XP; the ephemeral token expires at the learner's
  remaining allowance, so the cap is enforced even if the client misbehaves.
- Old WS close codes 4001 (superseded) / 4002 (time cap) are mapped to the same UI states.

## D-008 · Auth = Supabase Auth ONLY (Google + email/password); NextAuth removed — 2026-09-22
- Supersedes D-003. Owner asked for email+password + email-sending limits on top of Google;
  Supabase Auth has all of it built in (OAuth, confirmation/reset emails, rate limits), so a
  second auth layer (NextAuth) is pure cost.
- `@supabase/ssr` cookie sessions. A drop-in `useSession()` in `src/lib/session.tsx` keeps the
  old NextAuth shape (`data.user.accessToken`, `status`, `update`) so ~29 components only
  change an import. Server components use `auth()` from `src/auth.ts` (same name as before).
- Google redirect URI to register in Google Cloud: `https://<ref>.supabase.co/auth/v1/callback`.
- Emails use token_hash links → `/auth/confirm` (server-side verifyOtp), not implicit tokens.
- Email sending: Supabase's built-in SMTP is test-only (a few mails/hour). Production needs
  custom SMTP (Resend/Brevo) — then `rate_limit_email_sent` + our own per-email/per-IP limits.

## D-009 · Single active session uses the Supabase JWT `session_id` claim — 2026-09-22
- A login (OAuth callback, email confirm, password sign-in → `POST /api/session/start`) writes
  the JWT's `session_id` into `profiles.active_session_id`. `requireUser` rejects any other
  session_id with `SESSION_SUPERSEDED` (UI then signs out → `/login?reason=signed_in_elsewhere`).
- Not done on `SIGNED_IN` auth events: Supabase fires those on tab refocus too, which would let
  an old device steal the session back.

## D-010 · /pro invite link grants Pro only to NEWLY created accounts — 2026-09-22
**Status: superseded by D-021 (same day).**
- The old code comments disagreed with the /pro page copy. Chose the safer rule (backend
  comment): a sign-up that starts at /pro and creates the account gets Pro; existing accounts
  are not topped up. Change in `server/domain/premium.ts::grantProInviteIfEligible` if needed.

## D-011 · Gemini key tiers: free first, paid only as last resort — 2026-09-22
- Owner supplied 7 free keys + 1 paid key ("only use if free are exhausted").
- `gemini_api_keys.tier` ('free'|'paid'); the lease query orders `tier = 'paid'` LAST, so the paid
  key is used only when no free key can take the request. Env: `GEMINI_API_KEYS` (free) and
  `GEMINI_PAID_API_KEYS` (paid).
- 2026-09-22 probe: all 8 keys valid; each lists `gemini-3.1-flash-live-preview` and
  `gemini-3.1-flash-lite`. Whether they're in different Google projects is unknown (D-005).

## D-012 · Gemini Live wire details (verified by live probes, 2026-09-22) — 2026-09-22
- Token: `authTokens.create` with `httpOptions.apiVersion = "v1alpha"` (SDK says v1alpha only),
  `uses: 1`, `lockAdditionalFields: []` (locks every field we set). `sessionResumption` is NOT
  set in constraints so the client can pass its resume handle.
- Socket: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=<token.name>`;
  client setup = `{ setup: { model: "models/<model>", sessionResumption: {handle?} } }`.
- Verified: setupComplete → audio (24 kHz PCM) + outputTranscription + resumption handle;
  tap-to-talk (`activityStart` → `audio/pcm;rate=N` chunks → `activityEnd`) gives exact
  inputTranscription and a spoken correction. Native-audio text parts are reasoning → hidden.

## D-013 · Never name columns after PostgREST reserved words — 2026-09-22
- `order` broke filtering (`?order=eq.5` is parsed as ORDER BY). Renamed `problems.order` →
  `sort_order` and `daily_usage.count` → `used` before first apply. The API still returns
  `order` to the frontend. Avoid: order, select, limit, offset, count, and, or, not, columns.

## D-014 · Pronunciation scoring — 2026-09-22
- Browser converts every recording to 16 kHz mono WAV (`src/audio/toWav.ts`): Gemini
  officially accepts WAV not WebM, and Safari records mp4.
- `gemini-3.1-flash-lite` judges each expected word (CORRECT/INCORRECT/UNCLEAR, accent is NOT
  penalised); the server recomputes similarity/accuracy deterministically. Verified on a probe:
  "I go … buy" for "I went … bought" → exactly those 2 words INCORRECT.
- XP = round(base × accuracy), base 20/30/40; once per phrase per IST day; combo continues ≥ 80 %.
- Recordings stored in R2 at `pronunciation/<userId>/<attemptId>.wav` when R2 is configured.

## D-015 · Default game economics & free-tier limits (admin-editable) — 2026-09-22
- Jumble XP easy/medium/hard = 10/15/25; progressive by variant 10/15/25 + set bonus 10.
  XP per sentence once per IST day. Round = 6 sentences. Wrong answer resets combo.
- Free quotas: Jumble 18 solved/difficulty/day, Pronunciation 3 attempts/difficulty/day
  (`app_settings.quotas`; 0 = unlimited). Pro = unlimited.
- AI Partner: free 20 min/week (Mon IST), Pro 60 min/day (IST). Talk-time XP: first +10 XP
  after 15 s of speaking, then +30 XP per extra minute (= the "+150 XP / 5 min" promise).
  Talk-time credit ≤ wall-clock and ≤ 2 s per recognised word + 10 s (anti-farming).

## D-016 · Tooling: no Doppler; env via .env.local / Vercel; pnpm 11 via npx — 2026-09-22
- `doppler` isn't installed → scripts become plain `next dev/build/start`.
- Local pnpm is 10.x but package.json pins pnpm@11.0.8 → run `npx -y pnpm@11.0.8 <cmd>`.
  On Vercel set `ENABLE_EXPERIMENTAL_COREPACK=1` so it honours `packageManager`.

## D-017 · Migrations are applied with `supabase/apply-migrations.mjs` — 2026-09-22
- Uses the Management API (`/v1/projects/<ref>/database/query`) with a personal access token
  (sbp_…), one transaction per file, recorded in `supabase_migrations.schema_migrations`
  exactly like the CLI. All 8 initial migrations applied 2026-09-22.

## D-018 · No self-HTTP on the server; API base is same-origin — 2026-09-22
- Admin server actions dispatch to the in-process router (`backendFetch`) instead of fetching
  their own public URL (avoids Vercel deployment-protection 401s and a network hop).
- Client code defaults `NEXT_PUBLIC_API_URL` to "" ⇒ relative `/api/...` on every deployment.

## D-019 · Project knowledge = Karpathy "LLM Wiki" pattern — 2026-09-22
- `docs/wiki/` is a compiled, interlinked markdown wiki maintained by the agent:
  `index.md` (catalog), `log.md` (append-only), topic pages with `[[wikilinks]]` and
  frontmatter (`type`, `tags`, `links`) so a graph memory can be built from it later.
- Root `CLAUDE.md` is the schema: read memory + index first, update wiki + log after work.

## D-020 · Our own email-send limits on top of Supabase's — 2026-09-22
- `/api/account/{signup,resend,reset}` go through `auth_email_allow()`: max 3 emails per address
  and 10 per IP (sha256-hashed) per hour; over-limit → `429 EMAIL_RATE_LIMITED`. Answers are
  identical whether or not the account exists (no email enumeration). Constants in
  `frontend/src/server/routes/account.ts` (LIMITS).

## D-021 · /pro link grants Pro to new AND existing accounts (once each) — 2026-09-22
- Supersedes D-010. The live /pro page explicitly promises existing accounts ("Already have an
  account? Use this same button…"), so the backend now honours that. Guard rails: admin on/off,
  end date, max redemptions, and `pro_invite_signups` (one grant per account).

## D-022 · Vercel builds with explicit pnpm 11 commands; email links handled client-side — 2026-09-22
- Vercel's corepack check reads `packageManager` from the REPO ROOT (ours is in `frontend/`), fell
  back to an old pnpm → "ERR_INVALID_THIS" and "Ignoring not compatible lockfile". Fix: project
  settings `installCommand = npx -y pnpm@11.0.8 install --frozen-lockfile`,
  `buildCommand = npx -y pnpm@11.0.8 run build` (root directory `frontend`).
- Supabase free tier forbids editing email templates while using the built-in SMTP, so default
  templates are used: their links return tokens in the URL #fragment. `/auth/confirm` is therefore a
  CLIENT page handling `#access_token`, `?token_hash` and `?code`. Branded token_hash templates are
  applied automatically by `supabase/configure-auth.mjs` once SMTP env vars are given.
- Production URL: https://engconnect-beta.vercel.app (Vercel project `engconnect`, team `engconnect`).

## D-023 · Admin is ec.devbx@gmail.com — 2026-09-22
- Owner asked to change the admin. `ADMIN_EMAILS=ec.devbx@gmail.com` in `frontend/.env.local` and in
  Vercel (all environments). Replaces bharatrix.dev@gmail.com. Comma-separate to add more.

## D-024 · Google sign-in enabled in Supabase — 2026-09-22
- Google OAuth client (ID `75134788131-d6lh0…apps.googleusercontent.com`, secret in `credentials.txt`)
  configured via `supabase/configure-auth.mjs`; redirect URI registered by the owner:
  `https://uycpxwajvhcigyhvepci.supabase.co/auth/v1/callback`. The login card auto-enables the Google
  button by reading Supabase's public `/auth/v1/settings`.

## D-025 · Auth email via Resend SMTP (no verified domain yet) — 2026-09-22
- Supabase SMTP → `smtp.resend.com:465`, user `resend`, pass = Resend API key (in `credentials.txt`),
  sender `onboarding@resend.dev`, `rate_limit_email_sent = 30`/hour (was 2). Custom SMTP unlocked the
  branded token_hash templates (confirmation, recovery, email change) → `/auth/confirm`.
- ⚠️ The Resend account has NO verified domain: Resend only delivers to the account owner's own
  address until a domain is verified. To go live: add a domain in Resend (DNS records), then re-run
  `configure-auth.mjs` with `SMTP_FROM=noreply@<domain>`.

## D-026 · AI Partner session setup: language × level × mode × voice (ENGAI-style) — 2026-09-22
- Owner: "AI partner can talk with any language … like ENGAI … change the voice from the menu".
- Options live in `frontend/src/lib/aiPartnerOptions.ts` (shared by UI + server): 14 languages
  (English-only or X + English 70/30 Roman script: Hindi, Bengali, Marathi, Gujarati, Punjabi, Tamil,
  Telugu, Kannada, Malayalam, Odia, Assamese, Urdu, Nepali), 3 levels, 6 practice modes (casual,
  job interview, IELTS/TOEFL, travel, office, grammar — role-play rules from ENGAI), 18 voices.
- All 18 voices verified live on gemini-3.1-flash-live-preview (2026-09-22); unknown names are
  rejected by Google (close 1007) so the server validates against the list and falls back to Aoede.
- Chosen on the start card (`SessionSetup.tsx`), remembered per device (localStorage), sent to
  `POST /chat/sessions`, baked into the locked token (voice + prompt), stored on `chat_sessions`
  (`scenario` column added) so reconnects keep them. "Change setup" in-session starts a new one.

## D-027 · The 7 free Gemini keys are from different Google Cloud projects — 2026-09-22
- Owner confirmed. So each key adds its own quota (resolves the D-005 caveat).

## D-028 · Graph memory = generated from the wiki (`docs/wiki/graph.json`) — 2026-09-22
- `node docs/wiki/build-graph.mjs` parses every wiki page's frontmatter + `[[links]]` and every
  `D-0xx` in DECISIONS.md → nodes (pages, decisions) and edges (page→page links, page→decision
  references, decision→decision supersedes). Writes `graph.json` (machine-readable) and
  `meta/graph.md` (Mermaid map + adjacency + broken-link lint). Re-run after editing the wiki.

## D-029 · Customer support panel: navbar "Help" dropdown → ticket + Resend email — 2026-09-22
- Owner: "customer support panel which uses Resend to send me mail if anything happens … phone and
  desktop with drop down menu". Built as a navbar Help button (every in-app screen) opening a
  dropdown panel with an issue-type select + message; also on /support. Navbar, not a floating
  button, so it never covers the AI Partner mic bar on phones.
- `POST /api/support` (guests allowed with email; 5/hour per account or IP) → `support_tickets`
  → Resend HTTP API email to `SUPPORT_EMAIL_TO` (ec.devbx@gmail.com) with Reply-To = learner.
  Admin inbox `/v3/admin/support` (open/resolved). Admin home + menu also list "Pro applications"
  (existing /v3/admin/pro-trials, now with a "Don't approve" button for pending applications).

## D-030 · Verification scripts live in `scripts/`; the workflow is written in CLAUDE.md — 2026-09-22
- The smoke test and Gemini probes were in a temporary scratch folder; moved to `scripts/` with
  repo-relative paths (read secrets from `frontend/.env.local` / `credentials.txt`, print none).
- Root `CLAUDE.md` now has a numbered **Workflow**: orient → build → check → record (wiki, D-entry,
  STATUS, graph) → ship (secret scan, commit, push) → verify prod (`scripts/smoke-test.mjs`).

## D-031 · Admin "Wiki & memory" page reads a generated snapshot — 2026-09-22
- Owner: "in admin page option there should be the wiki page also". `/v3/admin/wiki/[...page]` renders
  every wiki page + STATUS + DECISIONS (react-markdown + remark-gfm, server-side after the admin check),
  with search, backlinks, cited decisions and an interactive SVG knowledge graph (no graph library;
  mermaid was tried and dropped — ~900 extra lockfile lines for one page).
- Vercel builds from `frontend/` only, so `build-graph.mjs` also writes
  `frontend/src/generated/wiki-bundle.json`; it is committed and must be regenerated after wiki edits.
- ec.devbx@gmail.com confirmed as the only admin (ADMIN_EMAILS local + Vercel); the second account
  (abhi03chauhan87@gmail.com) is a normal learner.

## D-032 · K.AI levels + practice modes live in instruction files — 2026-09-22
- Owner: "modes like beginner, intermediate and expert … complete beginner should speak softly and make
  them understand slowly … write instruction files", "options like ENGAI, preparing for IELTS".
- Levels Beginner / Intermediate / Expert ("Advanced" renamed; normalised on read) in
  `server/gemini/instructions/levels.ts` (voice & pace, teaching, correction depth, language mix, reply
  length, greeting). Modes in `instructions/modes.ts`: rules + material banks (IELTS Part 1 topics,
  12 original cue cards, Part 3 questions, interview questions, travel/office scenes, grammar points by
  level, casual topics). Each session gets a seeded slice; `chat_sessions.material_seed` (migration
  …1300) keeps reconnects identical. Pacing ("softly, slowly") is by prompt — native-audio models follow it.
- Verified live with `scripts/ai-partner-probe.mjs` (Beginner+Hindi, Expert+IELTS).

## D-033 · Pro AI Partner time = 20 min/day — 2026-09-22
- Owner: "for pro limit the timings for 20 mins talk a day". Partly supersedes D-015 (only the Pro cap;
  free stays 20 min/week). Default `proDailyCapSeconds` 3600 → 1200 (admin can still change it); UI copy
  on /pro, Go-Pro sheet/cards and the AI Partner screen updated.

## D-034 · One support channel: the Resend Help form — 2026-09-22
- Owner: "remove the old support and feedback … now we have connected with Resend". Removed the old
  FeedbackForm (`/feedback` table form), the account-menu "Support & Feedback" row and the call/WhatsApp
  list on /support. /support = "Help & Support" with the SupportForm; feedback uses the
  "Suggestion / feedback" category. The old `POST /feedback` API stays for the trial admin view.

## D-035 · Pronunciation "how to say it": syllables + native-script respelling — 2026-09-22
- Owner: break words into syllables and show them "written in Hindi" (the learner's language), plus what
  they pronounced wrong. The scoring JSON now returns per word `syllables` (stressed syllable in
  CAPITALS) and `native` (same sounds in the script of `profiles.native_lang`; 13 Indian languages mapped
  to scripts), and the reason names the wrong sound/syllable. UI: chip popover + "How to say the words you
  missed" cards with "You said …" and a 🔊 button using the device's speech synthesis (rate 0.7, en-IN).

## D-036 · Cloudflare R2 is not needed for pronunciation — 2026-09-22
- Scoring sends the WAV from our server straight to Gemini inline in the request (≤ a few hundred KB;
  inline limit 20 MB). R2 only *keeps* recordings (history playback, disputes, datasets). Decision: run
  without R2 for now (privacy + zero cost); the upload code stays and switches on when R2 env vars exist.
  The browser can't call Gemini directly for scoring: ephemeral tokens only work for the Live API, and a
  raw key in the browser would leak.

## D-037 · Lighter UI: app-only layer out of the root providers; new mobile tab bar — 2026-09-22
- Owner: "optimize the UI to be faster … I don't want it heavy". NextStep tours + level-up / badge
  celebrations + Go-Pro / trial / AI-Partner-gate overlays moved from `app/providers.tsx` into
  `components/layout/AppExtras.tsx`, mounted by AppShell (in-app screens only); overlays are next/dynamic.
  Public pages (landing, /pro, /login) no longer download them.
- Mobile BottomNav rewritten: glass island, raised centre K.AI button with a custom speech-bubble +
  waveform icon (`navIcons.tsx`), House / Puzzle / Speech / Trophy icons, no JS drag logic.
- ThemeToggle: label/icon gated on mount (fixes the hydration-mismatch warning).
- Landing: owner likes the scroll-driven horizontal swipe — keep it (GSAP ScrollTrigger ≈ 30 KB gz is
  fine); make the rest lighter (lazy demos, CSS motion, glassmorphism) — landing redesign in progress.

## D-038 · Pronunciation: never score silence, blind second listener, no listen-back — 2026-09-22
- Owner: "for any pronunciation it shows perfect always", "send directly … without listening yourself",
  "we don't have to store or show their recording". Root cause found by test: a SILENT recording scored
  100% — primed with the expected sentence, the model "hears" it anyway.
- Server (`server/gemini/scoring.ts`, `routes/pronunciation.ts`): `speechStats()` measures voiced 20 ms
  frames in the WAV; < 250 ms of voice → `422 NO_SPEECH` (not scored, no quota used). A **blind listener**
  (same flash-lite model, audio only, no expected text) runs in parallel; after word alignment, expected
  words it didn't hear are downgraded (sim < 0.5 → INCORRECT, < 0.8 → UNCLEAR) and its transcript is the
  shown "what you said". Stricter rubric (t/th, w/v, dropped endings → INCORRECT; unsure → UNCLEAR).
- Browser: recording stops by itself ~1.3 s after the learner finishes (Web Audio VAD) or at the time
  limit, and is scored immediately — the review/replay/Submit step is gone; no audio kept (R2 off, D-036).
- Model check 2026-09-22: omni-1.1-flash has no free quota (429); 3.8/3.5-flash often 503 and 20–50 s;
  3.5-transcribe normalises words; 3.1-flash-lite is fastest (2–9 s) and caught phonetic slips
  ("Tenk yu wery mach" → 25%). Kept flash-lite for both scorer and blind listener. Phoneme-exact option
  for later: Azure AI Speech Pronunciation Assessment (needs an Azure key).

## D-039 · K.AI is hands-free (auto voice detection + interruptions, mute only) — 2026-09-22
- Supersedes the tap-to-talk part of D-007. Owner: "K.AI should work like GPT voice mode / ENGAI —
  continuous conversation, not click; interruption should be allowed; there should be only a mute option";
  "till I press the button it doesn't respond".
- Token (`server/gemini/liveToken.ts`): automatic activity detection ON, start/end sensitivity LOW,
  prefixPadding 200 ms, `silenceDurationMs` = level `pauseMs` (Beginner 1500 / Intermediate 1100 /
  Expert 800, `instructions/levels.ts`) so thinking pauses don't end the turn; START_OF_ACTIVITY_INTERRUPTS.
  Prompt: "hands-free voice call" rules (stop and listen when interrupted; don't jump in on a noise).
- Client (`hooks/useGeminiLiveSession.ts`): mic opens on setupComplete and streams continuously (no
  activityStart/End); echo gate — while K.AI plays, mic frames under RMS 0.05 are sent as zeros (hold
  1.5 s after a louder frame) so K.AI's own voice can't interrupt it; on `interrupted` the player is flushed
  and K.AI's bubble closed; the learner's bubble closes when K.AI starts answering; mute = release mic +
  `audioStreamEnd`; talk-time = voiced mic time while K.AI is silent (server still clamps).
  `V3AIPartner.tsx`: push-to-talk wrapper removed; one mute button (+ Space), status Listening/Speaking/Muted.
- Verified 2026-09-22 against Gemini with continuous audio: K.AI answered by itself after the learner
  stopped. Real-mic/echo behaviour to be checked by the owner on phone + laptop speakers.

## D-040 · A busy Gemini model must not fail the learner (or cool down keys) — 2026-09-22
- Owner hit "something went wrong … internal error" on Pronunciation (free AND Pro). Cause found in
  `gemini_key_overview`: every text-lane key had 4–5 errors today, all
  `503 "This model is currently experiencing high demand"` from Google — and one key had been put in
  **cooldown** for it. `classifyGeminiError` called 503 a plain "error", so `withTextKey` threw at once
  (→ 500 INTERNAL) and the consecutive-error rule shrank the pool for a fault that wasn't ours.
- `isModelBusy()` (503/500/"high demand"/"overloaded"/"unavailable"/"try again later"): the lease is
  released as **ok** (key stays healthy), the call is retried after 400 ms × attempt, and if every
  attempt is busy the API answers `503 AI_MODEL_BUSY` — "Google's AI is busy right now. Please try
  again in a few seconds." instead of a generic internal error.
- Pronunciation scoring also falls back across models when the configured one stays busy:
  `gemini-3.1-flash-lite` → `gemini-3.5-flash-lite` → `gemini-2.5-flash-lite` → `gemini-2.5-flash`
  (the model that actually scored is stored in `pronunciation_attempts.scorer`).
- Two more robustness fixes in the same pass: a 401 from an expired access token now refreshes the
  Supabase session once and retries (`lib/freshToken.ts`, used by `v3Fetch` and the attempt upload) —
  that was the "unauthorized" seen on a long-open tab; and silence detection (server `speechStats`,
  browser auto-stop) is now relative to the clip's own noise floor (max(absolute, 3× noise)) so quiet
  laptop mics aren't reported as "we couldn't hear you".

## D-041 · Landing page redesign (glass, lighter, scroll-swipe kept) — 2026-09-23
- Owner: glassmorphism, "optimize the UI to be faster … I don't want it heavy", "I liked the previous
  landing page animation where it swipes on scrolling", "remove 'built for India's ambitious learners'
  … it is too generic — take inspiration from Land-book".
- `components/ShowcaseV4.tsx` rebuilt around the product itself: editorial hero with live-caption glass
  card, "every mistake comes back as a fix" section, real feature panels (pronunciation respelling,
  jumble, AI Partner minutes), mixed-language strip, the kept **scroll-swipe** (`landing/ScrollSwipe.tsx`,
  GSAP ScrollTrigger ≈ 30 KB gz) for the three drills and the reviews, setup/voices, pricing, footer.
  Generic marketing lines removed; the existing 4.9 / 1,00,000+ figures are the owner's own claims.
- Weight: demos load only near the viewport and unmount when far away (`landing/LazyMount.tsx`,
  `LazyDemos.tsx`); shared styles in `landing/landingStyles.ts`; no new dependencies.
- Copy follows D-039: "Just talk … K.AI answers when you pause", "Hands-free", no tap-to-talk.
- Sign-up now states agreement to the Terms of Service and Privacy Policy (both pages already existed
  and are linked in the landing footer).
- Checked at 375 px and 1280 px, dark scheme: one `<h1>`, no horizontal scroll, 44 px tap targets.

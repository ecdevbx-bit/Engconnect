# Status — where the project stands right now

> Working-memory snapshot (Karpathy "RAM" layer). **Overwrite** this file whenever the state
> changes; history lives in `docs/wiki/log.md`, decisions in `DECISIONS.md`, and the whole thing
> as a graph in `docs/wiki/graph.json` (rebuild: `node docs/wiki/build-graph.mjs`).
> Last updated: 2026-09-22 (session 2).

## Live 🚀
- **https://engconnect-beta.vercel.app** — Vercel project `engconnect` (team `engconnect`, root
  `frontend`, pnpm 11 via explicit commands — D-022). Auto-deploys on push to `main`.
- GitHub `ecdevbx-bit/Engconnect` (gh logged in as `ecdevbx-bit`). Supabase `uycpxwajvhcigyhvepci`:
  13 migrations applied, RLS everywhere.
- Admin: **ec.devbx@gmail.com** (only admin) → `/v3/admin` (Pro applications, Support inbox,
  **Wiki & memory**, Gemini keys, …). Accounts in auth: ec.devbx@gmail.com (Google) and
  abhi03chauhan87@gmail.com (email + Google, normal learner).

## Done ✅
- Session 1: backend (Supabase + Next API on the old contract), auth (Google + email, Resend SMTP),
  AI Partner on Gemini Live with setup options, key pool (7 free + 1 paid), pronunciation scoring,
  support panel, wiki + graph memory, `scripts/`.
- Session 2:
  - Admin **Wiki & memory** page with interactive graph (D-031).
  - K.AI **Beginner / Intermediate / Expert** + practice-mode **instruction files** and material banks
    (IELTS cue cards, interview questions, scenes) — verified live (D-032).
  - Pro AI Partner = **20 min/day** (D-033).
  - Old Support & Feedback removed; Resend Help form is the only channel (D-034).
  - Pronunciation **syllables + native-script respelling + "You said…"** + 🔊 — verified via API (D-035).
  - R2 decided **not needed** for now (D-036).
  - Lighter UI: app-only providers moved into AppShell; new glass mobile tab bar with K.AI button;
    theme-toggle hydration fix (D-037).
  - **Deployed 220ff40** (READY) — production smoke **32/32**, AI Partner + pronunciation probes pass
    on production. Then: Beginner rules tightened (modelled sentence must be fully correct; one ask
    per reply) — shipped in 9be5cb6 (READY).
  - **Pronunciation fixed** (D-038): silence no longer scores 100% (NO_SPEECH), blind second listener,
    stricter rubric; auto-stop + instant scoring, no listen-back — verified via API probes.

## In progress 🔧
- **K.AI hands-free, like GPT voice mode** (owner: "continuous convo, not click; interruption allowed;
  only a mute option"). DONE but UNCOMMITTED (would break prod without the client part):
  `server/gemini/liveToken.ts` (automatic VAD on, low sensitivities, START_OF_ACTIVITY_INTERRUPTS,
  `silenceDurationMs` = level `pauseMs` 1500/1100/800), `instructions/levels.ts` (pauseMs),
  `tutorPrompt.ts` ("hands-free voice call" rules), `routes/chat.ts` (passes pauseMs). Tested live:
  continuous audio with no activity markers → K.AI answered by itself. TODO: `useGeminiLiveSession.ts`
  (mic streams continuously after connect, no activityStart/End — the API rejects them when auto-VAD is
  on; commit user text when K.AI starts replying, commit assistant text on `interrupted`; echo gate —
  while K.AI plays, zero mic frames under RMS ~0.06 so its own voice can't interrupt it; mute =
  stop mic + `realtimeInput.audioStreamEnd`; talk-time from voiced frames), V3AIPartner UI → one
  mute button (+ end), status Listening/Speaking/Muted; then verify barge-in and ship together.
- **Landing page redesign** (glassmorphism, lighter, KEEP the scroll-swipe section, drop generic copy
  like "built for ambitious learners", Land-book-style designer feel) by a helper agent —
  files `frontend/src/components/ShowcaseV4.tsx` + `src/components/landing/*`; not yet committed.
  Review in the browser (mobile + desktop, both themes), make sure `src/app/landing-preview` is deleted,
  then ship as its own commit.

## Next ⏭️
1. Owner tests on the phone: AI Partner (Beginner vs Expert, IELTS), pronunciation "How to say it"
   cards, new tab bar, /v3/admin/wiki.
2. Verify a sending domain in Resend → re-run `supabase/configure-auth.mjs` with `SMTP_FROM` and set
   `SUPPORT_EMAIL_FROM`.
3. Ideas not built yet: post-session review card (talk ratio, mistakes, IELTS band estimate saved per
   session) and a learner-facing "What K.AI remembers" drawer (ENGAI's memory drawer).
4. CAPTCHA (Turnstile) on sign-up; pre-existing lint debt (LevelsAdminClient, LeaderboardPopover,
   V3AIPartner celebration effect, AuthLayout); old `/showcase/*` design pages could be deleted.
5. Later: `gemini-3.8-live` (stable) is a config switch (`GEMINI_LIVE_MODEL`).

## Blocked on the owner 🙋
- Resend: a verified domain (until then emails reach only the Resend account owner). Optional:
  Razorpay, custom domain, R2 (only if keeping recordings becomes a feature).
- Security hygiene: tokens were pasted in chat (Vercel, Supabase access, Resend) — rotate when convenient
  and update `credentials.txt` + Vercel env.

## Gotchas
- pnpm: `npx -y pnpm@11.0.8 …`. No Doppler. `credentials.txt` = real secrets, never print them.
- Next 16: `src/proxy.ts` (not middleware); route `params` are Promises; `.next` types can go stale
  after deleting a route → `rm -rf frontend/.next` before `tsc`.
- After editing the wiki or memory files, run `node docs/wiki/build-graph.mjs` — it also refreshes the
  admin wiki snapshot (`frontend/src/generated/wiki-bundle.json`), which must be committed.
- Python edits on Windows: open files with `newline=""` or they get CRLF line endings.
- TTS clips can't simulate subtle mispronunciations (the voice "fixes" them) — probes swap whole words.
- A leftover `next start` can keep port 3000 busy on Windows — find it with Get-CimInstance.

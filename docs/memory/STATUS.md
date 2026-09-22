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
    stricter rubric; auto-stop + instant scoring, no listen-back — deployed 2b167d8, production smoke
    32/32, silence/noise → NO_SPEECH on production.
  - PRO badge only for Pro members; "Unlock Pro" card on the mobile home for free users (03b5728,
    production smoke 32/32).
  - **Gemini 503 "model busy" handled** (D-040): keys are no longer cooled down for Google's
    overload, calls retry, scoring falls back to other models, and the learner sees "Google's AI is
    busy, try again in a few seconds" instead of an internal error. Also: expired-token 401 →
    refresh + retry; silence detection adapts to quiet mics.
  - **Landing page redesigned** (D-041): glass editorial hero, real product panels, the scroll-swipe
    kept, lazy demos, no generic copy; sign-up shows the Terms/Privacy agreement.
  - **K.AI hands-free** like GPT voice mode (D-039): auto voice detection, interruptions, mute-only UI,
    echo gate. Owner verifies on a real phone/laptop (echo with speakers is the thing to watch).

## Next ⏭️
1. Owner tests on the phone: hands-free K.AI (talk, pause, interrupt, mute; with speakers AND
   headphones), pronunciation auto-stop + strict scoring, Pro card, /v3/admin/wiki. If K.AI cuts
   itself off on speakers → raise BARGE_IN_RMS in useGeminiLiveSession.ts; if it answers too early
   → raise the level's pauseMs.
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

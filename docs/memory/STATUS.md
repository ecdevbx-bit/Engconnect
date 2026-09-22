# Status — where the project stands right now

> Working-memory snapshot (Karpathy "RAM" layer). **Overwrite** this file whenever the state
> changes; history lives in `docs/wiki/log.md`, decisions in `DECISIONS.md`, and the whole thing
> as a graph in `docs/wiki/graph.json` (rebuild: `node docs/wiki/build-graph.mjs`).
> Last updated: 2026-09-23 (end of session 2).

## Live 🚀
- **https://engconnect-beta.vercel.app** — Vercel project `engconnect` (team `engconnect`, root
  `frontend`, pnpm 11 via explicit commands — D-022). Auto-deploys on push to `main`.
  Latest: `fa8ac7d` READY; production smoke **32/32** after every deploy this session.
- GitHub `ecdevbx-bit/Engconnect` (gh logged in as `ecdevbx-bit`). Supabase `uycpxwajvhcigyhvepci`:
  13 migrations applied, RLS everywhere.
- Admin: **ec.devbx@gmail.com** → `/v3/admin` (Pro applications, Support inbox, **Wiki & memory**,
  Gemini keys, content, settings). Real accounts now include ec.devbx, abhi03chauhan87 (both Pro),
  abhich8730, soloco.mvp, ecit5552.

## Done ✅
- Session 1: backend (Supabase + Next API on the old contract), auth (Google + email, Resend SMTP),
  AI Partner on Gemini Live, key pool (7 free + 1 paid), pronunciation scoring, support panel,
  wiki + graph memory, `scripts/`.
- Session 2 (all deployed and smoke-tested):
  - Admin **Wiki & memory** page with an interactive knowledge graph (D-031).
  - K.AI levels **Beginner / Intermediate / Expert** + practice modes as **instruction files** with
    material banks — IELTS cue cards, interview questions, role-play scenes (D-032).
  - Pro AI Partner **20 min/day** (D-033); PRO badge only for Pro members; "Unlock Pro" card on the
    mobile home (phones had no way to buy/apply).
  - One support channel: the Resend Help form (D-034).
  - Pronunciation: syllables + **native-script respelling** + "You said…" + 🔊 (D-035); **silence is
    never scored** (it used to come back 100%), blind second listener, stricter rubric, auto-stop and
    instant scoring with no listen-back and nothing stored (D-038).
  - R2 **not needed** (D-036). Lighter UI: app-only providers out of the public pages, new glass
    mobile tab bar with the K.AI button, theme-toggle hydration fix (D-037).
  - **K.AI hands-free** like GPT voice mode: continuous mic, Gemini voice detection, interruptions,
    echo gate, mute as the only control (D-039).
  - **Gemini 503 "model busy" survived**: keys are no longer cooled down for Google's overload, calls
    retry, scoring falls back across models, learner sees "K.AI is busy…" (D-040). Expired-token 401 →
    refresh + retry; silence detection adapts to quiet mics.
  - **Landing page redesigned** (D-041): glass editorial hero, real product panels, the scroll-swipe
    kept, lazy demos; then the copy was cut back to one short line per section. Sign-up states the
    Terms/Privacy agreement.

## Next ⏭️
1. Owner testing on a real phone: hands-free K.AI (speakers AND headphones), pronunciation, the new
   landing. If K.AI cuts itself off on speakers → raise `BARGE_IN_RMS` in `useGeminiLiveSession.ts`;
   if it answers too early → raise the level's `pauseMs` in `instructions/levels.ts`.
2. Verify a sending domain in Resend → re-run `supabase/configure-auth.mjs` with `SMTP_FROM`, set
   `SUPPORT_EMAIL_FROM`. Until then Resend only delivers to the account owner's own address.
3. Not built yet: post-session review card (talk ratio, mistakes, IELTS band estimate) and a
   learner-facing "What K.AI remembers" drawer (ENGAI's memory drawer).
4. Consider: single-active-session (D-009) signs you out when the same account opens elsewhere — it
   confused the owner mid-test; an admin switch would help. CAPTCHA on sign-up. Old `/showcase/*`
   pages could be deleted. Pre-existing lint debt: LevelsAdminClient, LeaderboardPopover,
   V3AIPartner celebration effect, PronunciationCoach initial-difficulty effect, AuthLayout.
5. Later: `gemini-3.8-live` (stable) is a config switch (`GEMINI_LIVE_MODEL`). Phoneme-exact scoring
   would need Azure AI Speech Pronunciation Assessment (owner's key).

## Blocked on the owner 🙋
- Resend: a verified domain. Optional: Razorpay, custom domain, R2 (only if keeping recordings).
- Security hygiene: tokens were pasted in chat (Vercel, Supabase access, Resend) — rotate when
  convenient and update `credentials.txt` + Vercel env.
- Landing claims "4.9 rating" and "1,00,000+ learners" are the owner's own pre-existing copy.

## Gotchas
- pnpm: `npx -y pnpm@11.0.8 …`. No Doppler. `credentials.txt` = real secrets, never print them.
- Next 16: `src/proxy.ts` (not middleware); route `params` are Promises; `.next` types can go stale
  after deleting a route → `rm -rf frontend/.next` before `tsc`.
- **Never filter `tsc` output to hide a file you're ignoring** — a landing-demo type error hid that
  way and only the clean-worktree build caught it. Build the COMMIT in a worktree before pushing:
  `git worktree add --detach <tmp> <sha>`, copy `frontend/.env.local`, install, build. Delete it with
  `cmd /c rd /s /q "\\?\<path>"` (long paths) — plain `git worktree remove` fails on Windows.
- After editing the wiki or memory files run `node docs/wiki/build-graph.mjs` — it also refreshes the
  admin wiki snapshot (`frontend/src/generated/wiki-bundle.json`), which must be committed.
- Python edits on Windows: open files with `newline=""`, and some landing files are CRLF.
- TTS clips can't simulate subtle mispronunciations (the voice "fixes" them) — probes swap whole
  words or use phonetic spellings ("Tenk yu wery mach").
- Gemini free tier: `gemini-omni-*` has no quota (429); 3.8/3.5-flash are often 503 and slow (20–50 s);
  `gemini-3.1-flash-lite` is the fast, reliable scorer.
- A leftover `next start` can keep port 3000 busy on Windows — find it with Get-CimInstance.

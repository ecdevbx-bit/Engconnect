# Status — where the project stands right now

> Working-memory snapshot (Karpathy "RAM" layer). **Overwrite** this file whenever the state
> changes; history lives in `docs/wiki/log.md`, decisions in `DECISIONS.md`, and the whole thing
> as a graph in `docs/wiki/graph.json` (rebuild: `node docs/wiki/build-graph.mjs`).
> Last updated: 2026-09-24 (session 3).

## Live 🚀
- **https://engconnect-beta.vercel.app** — Vercel project `engconnect` (team `engconnect`, root
  `frontend`, pnpm 11 via explicit commands — D-022). Auto-deploys on push to `main`.
  Session 3 pushed as one commit (see git log); production smoke result recorded in the log/commit after deploy.
- GitHub `ecdevbx-bit/Engconnect` (gh logged in as `ecdevbx-bit`). Supabase `uycpxwajvhcigyhvepci`:
  15 migrations applied (…0924000100 learn+hints, …0924000200 session guards), RLS everywhere.
- Admin: **ec.devbx@gmail.com** → `/v3/admin` (Learn switch on top, Pro applications, Support inbox,
  Wiki & memory, Gemini keys, content, settings).
- **Sentry**: org `englishconnection` (EU), project `engconnect` — errors from Vercel deployments only
  (wiki: operations/monitoring, D-044).

## Done ✅
- Sessions 1–2: backend, auth, K.AI on Gemini Live (hands-free), key pool, pronunciation scoring (strict,
  native-script respelling), levels/modes instruction files, Pro 20 min/day, support via Resend, admin
  wiki + knowledge graph, landing redesign (D-001…D-041).
- Session 3 (2026-09-24):
  - **Learn library** `/learn`: 39 visual lessons, 4 tracks (13 Pro), server-side Pro gate (non-Pro get the
    first section only), SEO + JSON-LD + sitemap. **Admin switch "show to everyone" — currently OFF**
    (admins only) (D-042). Verified: quiz works, locked sections/quiz absent from guest HTML, 404 when OFF.
  - **Jumble hint ladder**: sentence shape (type, tense, blocks, meaning in the learner's script) → words →
    full sentence at **half XP**; 💡 Hint button (D-043). `scripts/jumble-hints-probe.mjs` all ✓ locally.
  - **Sentry** wired, privacy-first, `/monitoring` tunnel, traceId tag on API errors (D-044).
  - **Code audit**: 17 findings, 15 fixed (D-045) — the critical ones: a browser could disable shared Gemini
    keys; dead K.AI sessions billed minutes; the full-answer hint paid full XP. `scripts/audit-guards-probe.mjs`
    all ✓ locally.
  - **Landing explained with figures** (~1,000 → ~470 words), scroll-swipe kept, Learn link when public (D-046).
  - Login honours a safe `?next=` path (Learn "Sign in" returns to the lesson).

## Next ⏭️
1. **Owner: read the Learn lessons** (admin → open /learn), then flip the switch ON. Simplifications to
   eyeball: "feel badly" / "Who did call you?" marked ✗; may 50 % vs might 35 % on the certainty scale;
   British schwa examples; "the Ganga"; "click a photo" labelled Indian English; IELTS timings.
2. Owner testing on a real phone: K.AI on speakers AND headphones (tune `BARGE_IN_RMS` /
   level `pauseMs`), pronunciation on an **iPhone** (Safari AudioContext fix), the Jumble 💡 hint card.
3. Verify a sending domain in Resend → `supabase/configure-auth.mjs` with `SMTP_FROM`, set `SUPPORT_EMAIL_FROM`.
4. Not fixed from the audit (low): leaderboard RPC capped at 1,000 rows by PostgREST (rank missing past
   1,000 learners); streak board ranks stored streaks that never reset by themselves.
5. Not built yet: post-session review card (talk ratio, mistakes, IELTS band), "What K.AI remembers"
   drawer, "Practise this lesson with K.AI" deep link (K.AI grammar focus from a Learn lesson),
   admin switch for single-active-session (D-009 confuses testers), CAPTCHA on sign-up (needs keys).
6. Lint debt: 49 React-compiler errors in old files (mostly `/showcase/*` previews, some game components)
   — build doesn't depend on them.
7. SEO: canonical/sitemap/JSON-LD use `englishconnection.in`, which currently serves a different (old)
   site — fine once the domain moves to this app; until then the Vercel URL pages canonicalise away.

## Blocked on the owner 🙋
- Resend: a verified domain. Optional: Razorpay, custom domain move, R2 (only if keeping recordings).
- Security hygiene: tokens pasted in chat (Vercel, Supabase access, Resend, **Sentry**) — rotate and update
  `credentials.txt` + Vercel env. Swap Vercel's `SENTRY_AUTH_TOKEN` for a Sentry **org** token (the API
  can't mint one; Sentry → Settings → Auth Tokens), then re-run `scripts/sentry-setup.mjs`.
- Landing claims "4.9 rating" and "1,00,000+ learners" are the owner's own pre-existing copy; reviews
  are shortened verbatim quotes of the existing testimonials.

## Gotchas
- pnpm: `npx -y pnpm@11.0.8 …`. No Doppler. `credentials.txt` = real secrets, never print them — and when
  "redacting" it, redact EVERY line (values sit on their own lines under labels; a `key: value` regex
  missed them on 2026-09-24).
- Next 16: `src/proxy.ts` (not middleware; excludes `/monitoring`, the Sentry tunnel); route `params` are
  Promises; `.next` types can go stale after deleting a route → `rm -rf frontend/.next` before `tsc`.
- **Never filter `tsc` output to hide a file you're ignoring.** Build the COMMIT in a worktree before
  pushing (reuse `$TEMP/eb1340`: `git checkout --force --detach <sha>`, install, build). Delete worktrees
  with `cmd /c rd /s /q "\\?\<path>"`.
- After editing the wiki or memory run `node docs/wiki/build-graph.mjs` — it refreshes the admin wiki
  snapshot `frontend/src/generated/wiki-bundle.json`, which must be committed.
- Python edits on Windows: `newline=""`; some landing files are CRLF. Bash heredocs with quotes/backslashes
  break — write a .py/.mjs file with the Write tool instead.
- Sentry v11: `sendDefaultPii` is gone → `dataCollection` (see `lib/sentryScrub.ts`); `withSentryConfig`
  comes from `@sentry/nextjs/config`.
- Gemini free tier: `gemini-omni-*` has no quota; 3.8/3.5-flash often 503 and slow; `gemini-3.1-flash-lite`
  is the fast scorer. Text calls: 15 s timeout, 30 s deadline, model fallback (`gemini/textModel.ts`).
- Test data: probes create throwaway users via the admin API and delete them; the audit probe starts one
  real K.AI session.
- A leftover `next start` can keep port 3000 busy on Windows — find it with Get-CimInstance.

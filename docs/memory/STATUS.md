# Status — where the project stands right now

> Working-memory snapshot (Karpathy "RAM" layer). **Overwrite** this file whenever the state
> changes; history lives in `docs/wiki/log.md` and decisions in `DECISIONS.md`.
> Last updated: 2026-09-22 (session 1, before first deploy).

## Done ✅
- Repo `ENG/` → GitHub `ecdevbx-bit/Engconnect` (gh logged in as `ecdevbx-bit`, ADMIN).
- Supabase `uycpxwajvhcigyhvepci`: 9 migrations applied (schema, progress engine, key pool with
  tiers/lanes, 173 seeded sentences, auth email limits). RLS on every table (verified).
- Backend API = `frontend/src/server/**` via `src/app/api/[...path]/route.ts` (old Go contract +
  `/chat/sessions/:id/{progress,reconnect,end}`, `/session`, `/session/start`, `/account/*`).
- **Auth = Supabase only** (D-008): Google (needs OAuth client) + email/password with our email
  limits (D-020); `/auth/callback`, `/auth/confirm`, `/auth/signout`; `/forgot-password`,
  `/reset-password`; drop-in `useSession()` (`src/lib/session.tsx`), server `auth()`. NextAuth removed.
- Gemini: pool (7 free + 1 paid), Live tokens + tap-to-talk + pronunciation scoring verified live;
  learner memory compile. AI Partner UI on `useGeminiLiveSession`.
- Admin: `/v3/admin` landing + `/v3/admin/keys` live key dashboard (+ existing admin pages).
- Checks: `tsc` clean; `next build` passes; **28/28 E2E smoke checks** against the built app
  (sign-in → onboarding → jumble → progressive → pronunciation → word bank → leaderboard →
  AI Partner session with real Gemini token → security).
- Docs: root CLAUDE.md (schema), wiki (18 pages), DECISIONS D-001…D-021, READMEs, .env.example.

## In progress 🔧
- Pushed to GitHub (commits 10a4ac8, 4388fa5). Vercel project `engconnect` created (root `frontend`,
  12 env vars, explicit pnpm 11 install/build — D-022). First build failed on old pnpm (fixed);
  second build running → https://engconnect-beta.vercel.app.
- Supabase Auth configured (site URL, allow-list, password ≥ 8). Email templates can't be edited on
  free-tier SMTP → `/auth/confirm` is a client page that handles default-template links.

## Next ⏭️
1. When the owner sends Google OAuth creds → enable Google provider via Management API.
2. When SMTP creds arrive → configure SMTP + raise `rate_limit_email_sent`; add CAPTCHA
   (Turnstile/hCaptcha) — direct `supabase.auth.signUp` with the publishable key bypasses our
   `/api/account/*` limits (Supabase's global email limit still applies).
3. R2 creds → recordings stored; add a 90-day lifecycle rule on the bucket.
4. Pre-existing lint debt (untouched code): `LevelsAdminClient.tsx`, `V3AIPartner.tsx` celebration
   effect, `AuthLayout.tsx` unused props.
5. Consider `gemini-3.8-live` (stable) once the 3.1 preview demo is done — config only.

## Blocked on the owner 🙋
- Google OAuth client ID + secret (redirect `https://uycpxwajvhcigyhvepci.supabase.co/auth/v1/callback`).
- SMTP (Resend/Brevo) for real email volume. Cloudflare R2 keys. Optional Razorpay.
- Confirm the 7 free Gemini keys come from **different Google Cloud projects** (D-005).

## Gotchas
- pnpm: `npx -y pnpm@11.0.8 …`. No Doppler. `credentials.txt` = real secrets, never print.
- Next 16: `src/proxy.ts` (not middleware); route `params` are Promises.
- Supabase built-in email = 2/hour — sign-up confirmations will stall without custom SMTP.

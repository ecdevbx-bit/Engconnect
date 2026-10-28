---
title: Authentication
type: architecture
tags: [auth, supabase, google, email, resend]
links: [architecture/api, operations/credentials, features/premium, features/support]
updated: 2026-10-28
---

# Authentication — Supabase Auth only

Decision D-008 (replaced NextAuth). Methods: **Google** (enabled — D-024) and **email + password**.
All configuration is applied by `node supabase/configure-auth.mjs` (idempotent).

## Flows
- **Google**: browser → `supabase.auth.signInWithOAuth({provider:"google", redirectTo: <site>/auth/callback})`
  → Google → Supabase (`https://uycpxwajvhcigyhvepci.supabase.co/auth/v1/callback`, registered in the
  Google OAuth client) → `/auth/callback?code=…` (route: exchange code → cookie session → record login
  → /pro grant → redirect). The login card enables the Google button by reading Supabase's public
  `/auth/v1/settings` (it greys out if Google is ever switched off).
- **Email sign-up**: `POST /api/account/signup` (rate-limited) → `supabase.auth.signUp` → Supabase
  emails a branded link → `/auth/confirm` (client page; handles `?token_hash`, the default template's
  `#access_token` fragment, and `?code`) → `POST /api/session/start` → signed in.
- ⚠️ **Since 2026-10-28 confirmation is OFF** (`mailer_autoconfirm`, D-050): sign-up creates a confirmed
  account and `LoginForm` signs the learner straight in; the inbox card only shows if sign-in says UNCONFIRMED.
- **Email sign-in**: `supabase.auth.signInWithPassword` in the browser → `POST /api/session/start`.
- **Forgot password**: `POST /api/account/reset` → email → `/auth/confirm` (type recovery) →
  `/reset-password` → `updateUser({password})`.

## Email delivery (D-025)
- Supabase sends auth emails through **Resend SMTP** (`smtp.resend.com:465`, user `resend`, API key
  as password), sender `onboarding@resend.dev`, **30 emails/hour** Supabase-wide, plus our own limits:
  3 per address and 10 per IP per hour (`auth_email_allow()`, D-020).
- Branded templates (confirmation, recovery, email change) point to `/auth/confirm?token_hash=…`.
- ⚠️ **No verified domain in Resend yet** → Resend only delivers to the Resend account owner's own
  address. To email real learners: add a domain in Resend, add its DNS records, then re-run
  `configure-auth.mjs` with `SMTP_FROM=noreply@<domain>` (and update `SUPPORT_EMAIL_FROM`).

- **Sending is broken until a sender works** (D-050): Resend rejects every non-owner recipient with 550, so
  sign-ups failed and password reset still fails. Pending: DNS for `englishconnection.in` at GoDaddy, or Gmail SMTP.

## Settings
Site URL `https://englishconnection.in` (D-051); redirect allow-list = englishconnection.in, www, the Vercel URL,
Vercel previews (`https://engconnect-*-engconnect.vercel.app/**`), `http://localhost:3000/**` — **every host the app
is served from must be listed** or Google sign-in lands signed out on the site URL's home page; password ≥ 8
(our API also requires a letter and a number); email confirmation **off** for now (D-050).

## Sessions
- `@supabase/ssr` keeps the session in cookies; `src/proxy.ts` refreshes it on page requests.
- Client components use `useSession()` from `src/lib/session.tsx` (same shape as the old NextAuth
  hook: `data.user.accessToken`, `status`, `update()`); server components use `auth()` (`src/auth.ts`).
- API calls send the Supabase access token as `Bearer`; `src/server/guards.ts` verifies it via JWKS.
- **Sign-out is instant** (D-055): `signOut()` deletes the `sb-<ref>-auth-token` cookies at once and
  reloads the page; the session is revoked on Supabase in the background (`keepalive` POST
  `/auth/v1/logout?scope=local`). It used to wait 0.3–1.5 s on supabase-js with nothing on screen.
- Signed-in visitors of `/` are sent to `/dashboard` by `src/proxy.ts`, so the landing is a static,
  CDN-cached page (`revalidate = 60`), not rendered per visit (~0.9 s before the first byte).
- Cookies last 400 days, and the server refreshes an expired access token (checked 2026-10-28 against
  production), so closing the browser doesn't sign you out. Each address (englishconnection.in, www.,
  the Vercel URL) has its own cookies, though: signing in on one and opening another looks signed out.

## Single active session (D-009)
Each login stores the JWT's `session_id` in `profiles.active_session_id`; any request from an older
session gets `SESSION_SUPERSEDED` and that device signs out ("signed in elsewhere").

## Admins
`ADMIN_EMAILS` (currently ec.devbx@gmail.com — D-023) → `isAdmin` on the session and `/v3/admin/*`.

---
title: Authentication
type: architecture
tags: [auth, supabase, google, email]
links: [architecture/api, operations/credentials, features/premium]
updated: 2026-09-22
---

# Authentication — Supabase Auth only

Decision D-008 (replaces the earlier NextAuth plan). Methods: **Google** and **email + password**.

## Flows
- **Google**: browser → `supabase.auth.signInWithOAuth({provider:"google", redirectTo: <site>/auth/callback})`
  → Google → Supabase (`https://uycpxwajvhcigyhvepci.supabase.co/auth/v1/callback`) →
  `/auth/callback?code=…` (our route: exchange code → session cookies → record login → /pro grant → redirect).
- **Email sign-up**: our rate-limited endpoint → `supabase.auth.signUp` → Supabase emails a link →
  `/auth/confirm` (a **client page**: handles the default template's `#access_token` fragment, our
  branded `?token_hash` links once custom SMTP exists, and `?code`) → `POST /api/session/start`.
- **Email sign-in**: `supabase.auth.signInWithPassword` in the browser → `POST /api/session/start`.
- **Forgot password**: rate-limited endpoint → reset email → `/auth/confirm` (type recovery) →
  `/reset-password` → `updateUser({password})`.
- **Config** (`node supabase/configure-auth.mjs`): site URL https://engconnect-beta.vercel.app,
  redirect allow-list (prod, previews, localhost), password ≥ 8. Google, SMTP and branded
  templates are added by the same script when their env vars are passed (D-022).

## Sessions
- `@supabase/ssr` keeps the session in cookies; `src/proxy.ts` refreshes it on requests.
- Client components use `useSession()` from `src/lib/session.tsx` — same shape as the old NextAuth
  hook (`data.user.accessToken`, `status`, `update()`), so components didn't change.
- Server components use `auth()` from `src/auth.ts`.
- API calls send the Supabase access token as `Bearer`; `src/server/guards.ts` verifies it
  (JWKS, local) — [[architecture/api]].

## Single active session (D-009)
Each login stores the JWT's `session_id` in `profiles.active_session_id`; any request from an
older session gets `SESSION_SUPERSEDED` and that device signs out ("signed in elsewhere").

## Email limits
Built-in Supabase email is for testing only (a handful per hour). Production needs custom SMTP
(Resend/Brevo) — then we set Supabase's `rate_limit_email_sent` and keep our own per-email /
per-IP limits on sign-up, resend and reset. Credentials: [[operations/credentials]].

## Admins
`ADMIN_EMAILS` allow-list (server env) → `isAdmin` on the session and access to `/v3/admin/*`.

---
title: Credentials & config
type: operations
tags: [ops, secrets, config]
links: [operations/deployment, operations/monitoring, architecture/auth, architecture/storage-r2, architecture/gemini-key-pool]
updated: 2026-09-22
---

# Credentials & configuration

Secrets live **only** in: `credentials.txt` (repo root, git-ignored, local), `frontend/.env.local`
(git-ignored), and Vercel env vars. **Never** in the wiki, code or commits.

| Variable | What | Source | Status (2026-09-22) |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project + browser key | Supabase dashboard | ✅ have |
| `SUPABASE_SECRET_KEY` | server (service-role) key | Supabase dashboard | ✅ have |
| `SUPABASE_ACCESS_TOKEN` (sbp_…) | Management API (migrations, auth config) — tooling only, not in Vercel | Supabase account tokens | ✅ have |
| `GEMINI_API_KEYS` / `GEMINI_PAID_API_KEYS` | key pool (7 free / 1 paid) | Google AI Studio | ✅ have — different projects confirmed (D-027) |
| Google OAuth client ID + secret | Google sign-in (entered into Supabase, not our env) | Google Cloud Console → OAuth client (Web); redirect `https://uycpxwajvhcigyhvepci.supabase.co/auth/v1/callback` | ✅ enabled in Supabase (D-024) |
| Resend API key → Supabase SMTP + `RESEND_API_KEY` (support emails) | auth emails + support notifications | Resend dashboard | ✅ configured — ❌ **verified sending domain still needed** to email learners (D-025) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | recordings storage | Cloudflare → R2 → Manage API tokens (Object Read & Write, one bucket) | ❌ needed |
| Vercel token (vcp_…) | create project + env vars — tooling only | Vercel account | ✅ have — project `engconnect` created, env vars set |
| `INTERNAL_API_KEY`, `ADMIN_EMAILS` | admin actions; admin allow-list (ec.devbx@gmail.com) | generated / owner | ✅ set (D-023) |
| `SUPPORT_EMAIL_TO`, `SUPPORT_EMAIL_FROM` | where support tickets are emailed / sender | owner | ✅ ec.devbx@gmail.com / onboarding@resend.dev |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | payments | Razorpay dashboard | optional, later |
| `NEXT_PUBLIC_SENTRY_DSN` | where error reports go (public by design) | Sentry project `engconnect` (org `englishconnection`, EU) | ✅ set locally + Vercel (D-044) |
| `SENTRY_AUTH_TOKEN` | source-map upload at build time — Vercel only | owner's Sentry user token (sntryu_…, in `credentials.txt`); swap for an org token (Sentry → Settings → Auth Tokens) when convenient | ✅ set on Vercel (encrypted) |

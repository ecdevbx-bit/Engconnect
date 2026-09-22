---
title: Deployment
type: operations
tags: [ops, vercel, github]
links: [operations/credentials, operations/runbook, architecture/system]
updated: 2026-09-22
---

# Deployment

- **Code**: GitHub `ecdevbx-bit/Engconnect`, branch `main`. Pushing to `main` deploys production;
  other branches/PRs get preview deployments.
- **Host**: Vercel team `engconnect`, project `engconnect` → https://engconnect-beta.vercel.app, **Root Directory = `frontend`**,
  framework Next.js. Install: `npx -y pnpm@11.0.8 install --frozen-lockfile`; build: `npx -y pnpm@11.0.8 run build` (Vercel ignores `packageManager` outside the repo root — D-022).
- **Database**: Supabase (not deployed by Vercel) — apply migrations separately
  ([[operations/runbook]]) *before* pushing code that needs them.

## Environment variables (Vercel → Project → Settings → Environment Variables)
Same names as `frontend/.env.example`: Supabase URL/publishable/secret, `INTERNAL_API_KEY`,
`ADMIN_EMAILS`, `GEMINI_API_KEYS`, `GEMINI_PAID_API_KEYS`, `GEMINI_LIVE_*`, `GEMINI_TEXT_MODEL`,
`R2_*`, optional `RAZORPAY_*`. `NEXT_PUBLIC_API_URL` is **not** set (API is same-origin).
Where each value comes from: [[operations/credentials]].

## After the first deploy
1. Put the production URL into Supabase Auth → Site URL + Redirect URLs (done via Management API).
2. Add the same URL to the Google OAuth client's authorised JavaScript origins.

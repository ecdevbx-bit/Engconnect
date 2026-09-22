---
title: Premium (Pro)
type: feature
tags: [premium, pro, trial, payments, quotas]
links: [features/admin, features/jumble-words, features/pronunciation, features/ai-partner]
updated: 2026-09-22
---

# Premium (Pro)

**Pro ⇔ `profiles.premium_until` is in the future.** Every way of getting Pro only pushes that date
forward (`extendPremium`), never back.

## Free vs Pro (defaults, admin-editable at `/v3/admin/*`)
| | Free | Pro |
|---|---|---|
| Jumble | 18 solved sentences / band / day | unlimited |
| Pronunciation | 3 scored attempts / band / day | unlimited |
| AI Partner | 20 min / week (Mon IST) | 60 min / day (IST) |
Over-limit responses: `DAILY_QUOTA_REACHED` (games) / `AI_TIME_LIMIT_REACHED` (AI) → Go-Pro prompt.

## Ways to get Pro
1. **Pro trial program** — learner applies with a phone number (`POST /api/trial/apply`); admin
   approves at `/v3/admin/pro-trials`; Pro runs until the program's shared end date (`endsOn`,
   IST, inclusive) or a rolling `durationDays`. Cap on approvals. Cancel takes back trial-granted Pro.
2. **/pro invite link** — a fixed public page. Sign-in started there drops a 1-hour cookie; if that
   sign-in **creates a new account**, it gets Pro (DECISIONS D-010). Settings: active, end date,
   display date, duration, max redemptions (`/v3/admin/pro-invite`).
3. **Razorpay subscriptions** — implemented (`/api/payments/*` + HMAC-verified webhook), inactive
   until `RAZORPAY_*` env vars are set. The plans UI component exists but isn't mounted.

Feedback (`POST /api/feedback`) is collected for everyone; it no longer affects Pro.

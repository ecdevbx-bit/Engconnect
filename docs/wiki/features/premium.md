---
title: Premium (Pro)
type: feature
tags: [premium, pro, trial, payments, quotas]
links: [features/learn, features/admin, features/jumble-words, features/pronunciation, features/ai-partner]
updated: 2026-10-29
---

# Premium (Pro)

**Pro ⇔ `profiles.premium_until` is in the future.** Every way of getting Pro only pushes that date
forward (`extendPremium`), never back.

## Free vs Pro (defaults, admin-editable at `/v3/admin/*`)
| | Free | Pro |
|---|---|---|
| Jumble | 18 solved sentences / band / day | unlimited |
| Pronunciation | 3 scored attempts / band / day | unlimited |
| AI Partner | 20 min / week (Mon IST) | 20 min / day (IST) — D-033 |
Over-limit responses: `DAILY_QUOTA_REACHED` (games) / `AI_TIME_LIMIT_REACHED` (AI) → Go-Pro prompt.

## Where learners see Pro
- **PRO badge** next to the logo in the navbar — shown **only to Pro members** (`isPro` in the
  `/api/session` payload, from `profiles.premium_until`).
- **Desktop**: the "Pro" navbar tab and the green "Unlock Pro" card beside the activity heatmap.
- **Mobile**: the same "Unlock Pro" card on the home screen (free users only) → `/v3/premium`
  (buy / apply for the trial).

## Ways to get Pro
1. **Pro trial program** — learner applies with a phone number (`POST /api/trial/apply`); admin
   approves at `/v3/admin/pro-trials`; Pro runs until the program's shared end date (`endsOn`,
   IST, inclusive) or a rolling `durationDays`. Cap on approvals. Cancel takes back trial-granted Pro.
2. **/pro invite link** — a fixed public page. Sign-in started there drops a 1-hour cookie; if that
   sign-in **creates a new account**, it gets Pro (DECISIONS D-010). Settings: active, end date,
   display date, duration, max redemptions (`/v3/admin/pro-invite`).
3. **Buy Pro with UPI through YouPI PG** (D-061) — experimental, **off by default**. The owner runs
   the self-hosted [YouPI PG](https://github.com/youpi-pg/YouPI-PG) gateway (Node + SQLite + an
   Android phone/Gmail reading bank alerts — it can't run on Vercel) and switches selling on at
   **admin → Payments** (`/v3/admin/payments`): gateway URL, merchant id, full price, discount % + end
   date, days per payment, and when to unlock Pro (default **bank statement matched** = YouPI's
   `RECONCILED`; or **bank alert matched** = `OBSERVED_SUCCESS`, instant but riskier). Needs
   `YOUPI_WEBHOOK_SECRET` on the server and the webhook URL `/api/payments/youpi/webhook` set in
   YouPI's merchant admin.
   - Learner: `/v3/premium` shows ₹price (crossed-out full price + "N% off till …") and **Pay ₹X with
     UPI** (also above the cards on phones) → `POST /api/payments/checkout` creates the gateway session
     server-side → YouPI's hosted checkout → back to `/v3/premium?payment=<id>`, which polls
     `GET /api/payments/orders/:id` (received → being confirmed → You're Pro). One-time, no renewal;
     days stack on top of existing Pro.
   - Server (`server/routes/payments.ts`): order rows in `pro_payments` (amount frozen at checkout),
     webhook verified with `X-Gateway-Signature-V2` (HMAC over `timestamp.body`, ≤ 3 h old) or the
     body-only signature, deduplicated by delivery id (`pro_payment_deliveries`), amount must equal the
     order's or it goes to **review**; grant claims the row once (`status → paid`). Max 5 checkouts per
     hour, none while one is "observed". Admin can **Grant Pro** by hand for observed/review rows.
   - Off → the Pay button disappears and `/v3/premium` shows the trial form; the webhook keeps working
     so a payment in flight still counts. Terms §4 (payments & refunds) and Privacy (payments) cover it.
   - Proof: `scripts/payments-probe.mjs` (fake gateway on localhost, 14 checks).
4. **Razorpay subscriptions** — older code (`/api/payments/plans|subscriptions|webhook`), inactive
   until `RAZORPAY_*` env vars are set; its UI isn't mounted.

Feedback (`POST /api/feedback`) is collected for everyone; it no longer affects Pro.

## Pro in the Learn library
13 of the 39 [[features/learn]] lessons are Pro (Advanced track, most of Speaking & Career, two
Intermediate). Non-Pro visitors see a preview (first section) and an "Unlock with Pro" card.

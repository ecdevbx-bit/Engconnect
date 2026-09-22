---
title: Customer support ("Something wrong?")
type: feature
tags: [support, resend, email]
links: [features/admin, architecture/auth, operations/credentials, architecture/api]
updated: 2026-09-22
---

# Customer support — "Something wrong?"

Learners report problems from anywhere in the app; the team gets an **email via Resend** and the
ticket lands in the admin **Support inbox** (DECISIONS D-029).

## What the learner sees
- A **Help** button (life-buoy icon) in the top navbar on every in-app screen — phone and desktop.
  It opens a dropdown panel (sized to the screen) with:
  - **What went wrong?** dropdown: Something isn't working · AI Partner (K.AI) problem ·
    Microphone / audio problem · Pronunciation Coach · Jumble Words · Account & sign-in ·
    Pro plan & payments · Suggestion / feedback · Something else;
  - **Tell us more** text box; guests also give their email (signed-in learners are identified
    automatically);
  - **Send to support** → "Sent! Ticket #N".
- The same form is on the public **/support** page (with WhatsApp / call numbers below).
- It lives in the navbar (not a floating button) so it never covers the AI Partner mic bar on phones.

## What happens behind it
1. `POST /api/support` validates the category (`frontend/src/lib/supportCategories.ts`) and message,
   rate-limits (5 reports / hour per account or IP), stores a row in `support_tickets` (with the page
   the learner was on and their browser).
2. After responding, the server emails the team through Resend's HTTP API
   (`frontend/src/server/email.ts`): subject `[Support #N] <type> — <name>`, **Reply-To = the learner**,
   so replying to the email answers them directly. Delivery result is saved (`emailed`, `email_error`).
3. Admin inbox `/v3/admin/support`: open / resolved filter, learner email link, page, email status,
   **Mark resolved** / **Reopen**.

## Configuration
`RESEND_API_KEY`, `SUPPORT_EMAIL_TO` (default ec.devbx@gmail.com), `SUPPORT_EMAIL_FROM`
(`English Connection <onboarding@resend.dev>` until a domain is verified). ⚠️ Until a sending
domain is verified in Resend, Resend only delivers to the Resend account owner's own address —
fine for support emails *to* the owner, not for emails to learners ([[operations/credentials]]).

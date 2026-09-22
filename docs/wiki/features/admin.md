---
title: Admin panel
type: feature
tags: [admin]
links: [architecture/gemini-key-pool, features/premium, features/progress-and-rewards, features/jumble-words, features/pronunciation]
updated: 2026-09-22
---

# Admin panel (`/v3/admin/*`)

Access: signed-in users whose email is in `ADMIN_EMAILS` (server env). Admin pages call the API
through server actions carrying `INTERNAL_API_KEY`, dispatched in-process (DECISIONS D-018).

| Page | Controls |
|---|---|
| `/v3/admin/keys` | **Gemini key pool**: every key × lane (live/text) status (active / cooldown / exhausted / invalid / disabled), tier (free/paid), live sessions, requests & errors today, last error; add / disable / test keys ([[architecture/gemini-key-pool]]) |
| `/v3/admin/problems` | Jumble + Pronunciation content: add, reorder, (de)activate, bulk JSON upload (validated all-or-nothing) |
| `/v3/admin/jumble` | Progressive set bonus XP |
| `/v3/admin/pronunciation` | Countdown + recording lengths per band |
| `/v3/admin/ai-partner` | Talk-time XP rules, max recording, session length, Pro daily / free weekly caps |
| `/v3/admin/levels` | Level ladder (thresholds, titles, icons) |
| `/v3/admin/badges` | Badge catalog (xp, streak, combo, progset, onboarding) |
| `/v3/admin/feature-flags` | Pronunciation, language carousel, Word Bank, AI Partner |
| `/v3/admin/pro-trials` | Approve/cancel trial applications, program end date, approval cap |
| `/v3/admin/pro-invite` | /pro link on/off, dates, duration, redemption cap, sign-ups |
Free-tier quotas live in `app_settings.quotas` (API: `GET/PUT /api/admin/quotas`).

---
title: Admin panel
type: feature
tags: [admin]
links: [architecture/gemini-key-pool, features/premium, features/progress-and-rewards, features/jumble-words, features/pronunciation, features/support, features/learn, meta/how-this-wiki-works]
updated: 2026-09-22
---

# Admin panel (`/v3/admin`)

**Who**: signed-in users whose email is in `ADMIN_EMAILS` — currently **ec.devbx@gmail.com**
(D-023; comma-separate to add more; set in `frontend/.env.local` and Vercel). Admins see an
**Admin** section in the account menu. Admin pages call the API through server actions carrying
`INTERNAL_API_KEY`, dispatched in-process (D-018).

| Page | Controls |
|---|---|
| `/v3/admin` | Landing page linking every tool, with the **Learn library** "show to everyone" switch on top (D-042) |
| `/v3/admin/pro-trials` — **Pro applications** | Learners who applied for Pro (name, email, phone, date): **Approve** or **Don't approve** (pending → declined; they can re-apply), **Cancel** an approved trial; program end date + approval cap. Opens on the pending queue. ([[features/premium]]) |
| `/v3/admin/wiki` — **Wiki & memory** | This wiki, STATUS, the decision log and an interactive **knowledge graph** (hover a page to light up its links, toggle decisions), with search, backlinks and cited decisions per page. Reads a snapshot built by `build-graph.mjs` (D-031, [[meta/how-this-wiki-works]]) |
| `/v3/admin/support` — **Support inbox** | "Something wrong?" reports: type, message, learner, page, email-sent status; Mark resolved / Reopen ([[features/support]]) |
| `/v3/admin/keys` | **Gemini key pool**: every key × lane (live/text) status, tier (free/paid), live sessions, requests & errors today, last error; add / test / disable / return to rotation / remove ([[architecture/gemini-key-pool]]) |
| `/v3/admin/problems` | Jumble + Pronunciation content: add, reorder, (de)activate, bulk JSON upload (validated all-or-nothing) |
| `/v3/admin/ai-partner` | Talk-time XP rules, max recording, session length, Pro daily (default 20 min) / free weekly (20 min) caps |
| `/v3/admin/pronunciation` | Countdown + recording lengths per band |
| `/v3/admin/jumble` | Progressive set bonus XP |
| `/v3/admin/levels` | Level ladder (thresholds, titles, icons) |
| `/v3/admin/badges` | Badge catalog (xp, streak, combo, progset, onboarding) |
| `/v3/admin/feature-flags` | Pronunciation, language carousel, Word Bank, AI Partner, **Learn library** (`englishconnection-learn`: OFF = admins only, [[features/learn]]) |
| `/v3/admin/pro-invite` | /pro link on/off, dates, duration, redemption cap, sign-ups |

Free-tier quotas live in `app_settings.quotas` (API: `GET/PUT /api/admin/quotas`).

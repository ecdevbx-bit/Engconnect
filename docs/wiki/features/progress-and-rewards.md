---
title: Progress & rewards
type: feature
tags: [xp, levels, badges, streaks, leaderboard]
links: [features/jumble-words, features/pronunciation, features/ai-partner, architecture/database, features/admin]
updated: 2026-09-22
---

# Progress & rewards

One Postgres function, **`award_progress()`**, is the only place XP, streaks, combos, levels and
badges change — atomically, so fast double-submits can't corrupt totals ([[architecture/database]]).

## XP sources
| Source | XP |
|---|---|
| Jumble | 10 / 15 / 25 per sentence (easy/medium/hard); progressive 10/15/25 by variant + set bonus 10 |
| Pronunciation | round(20 / 30 / 40 × accuracy) |
| AI Partner | +10 after 15 s of talk-time, then +30 per extra minute |
A given sentence/phrase pays XP once per IST day.

## Levels (admin-editable, `/v3/admin/levels`)
1 Hello World 0 · 2 Word Collector 100 · 3 Sentence Builder 250 · 4 Conversationalist 500 ·
5 Storyteller 850 · 6 Linguist 1300 · 7 Orator 1900 · 8 Wordsmith 2700 · 9 Polyglot 3700 ·
10 Eloquent 5000. Editing the ladder re-derives everyone's level (`recompute_levels()`).

## Streaks & combos
- **Daily streak**: any XP-earning action on a new IST day extends it; skipping a day resets it.
- **Combo** (per game): consecutive correct answers (Jumble), ≥ 80 % attempts (Pronunciation),
  milestones within a conversation (AI Partner). A miss resets it.

## Badges (ids are data; art/titles live in `frontend/src/lib/badges.ts`)
`xp:100/500/1000/2500/5000/10000` · `streak:3/7/14/30/60/100` · `combo:jumble:5/10/25/50` ·
`combo:pronunciation:3/5/10/25` · `combo:ai-partner:3/5/10` · `progset:1/2/3/5/7/9/10` ·
`onboarding:1` (silent, on finishing onboarding) · `lvl:N` for every level reached (drives the
level-up card, never listed in `newlyEarnedBadges`). Admin: `/v3/admin/badges`.

## Leaderboard (`GET /api/leaderboard?mode=xp|streak|weekly`)
Everyone is ranked (the old "Pro-only ranking" was a Redis cost workaround — not needed now).
Weekly = XP since Monday 00:00 IST. Returns top-N and a ±radius window around "me".

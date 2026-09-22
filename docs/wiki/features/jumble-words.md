---
title: Jumble Words
type: feature
tags: [trainer, jumble, xp]
links: [features/progress-and-rewards, features/premium, features/admin, architecture/api, architecture/database]
updated: 2026-09-22
---

# Jumble Words

Learners rebuild a sentence from scrambled word tiles. It trains **word order** — the hardest
part of English for speakers of SOV languages like Hindi ("I market to went" → "I went to the market").

## What the learner experiences
1. Open **Dashboard → Jumble Words** (`/dashboard/jumble`). Signed-in only. First visit (or
   `?tour=1`) runs a guided tour.
2. Pick a band: **Easy / Medium / Hard / Progressive**. A **round = 6 sentences**, all in that band.
   Switching tabs starts a fresh round.
3. Drag or tap tiles into "Your sentence" (a little train adds a carriage per word). **Re-Jumble**
   resets; the speaker button reads the current arrangement aloud (device voice, Indian English).
4. There's no Check button: when every tile is placed it **auto-submits** (~0.65 s).
5. **Correct** → confetti, "+N XP", combo +1, next sentence. **Wrong** → train "derails",
   combo resets to 0, the **same sentence** returns.
6. After **2 wrong tries** the AI-coach card offers hints: ① first + last word, ② also 2nd and
   2nd-last, ③ the whole sentence. Hidden words show only their length.
7. Level-ups and new badges get full-screen celebrations ([[features/progress-and-rewards]]).
8. After 6: round summary (XP, best streak) → next round or stop.
9. Free learners who finish today's allowance for a band see "Easy is done for today — still
   free: Medium, Hard…" and a Go-Pro prompt ([[features/premium]]).

**Progressive** = sets of one sentence that grows: v1 easy (4–5 words) → v2 medium (7–9) →
v3 hard (11–14). The progress bar becomes an Easy → Medium → Hard stepper. Clearing the last
variant of a set = **set complete** celebration + bonus XP + `progset:N` badges.

## Rules the backend enforces (`frontend/src/server/routes/jumble.ts`)
- The correct sentence **never** leaves the server except for a level-3 hint.
- Each learner has a **cursor per band** (`user_attributes.cursors["jumble:<band>"]`). A round is
  the next 6 active sentences from the cursor (wrapping). The cursor only moves on a **correct**
  answer, so unsolved sentences come back next round.
- Tiles = the answer's tokens shuffled at serve time (never returned in the correct order). An
  admin may hand-craft the scramble (`initial`) — it's used only if it's a true permutation.
- Answer check = exact token match (capitals and punctuation count — "the capitalised word
  opens the sentence, the word with the full stop ends it").
- XP: easy **10**, medium **15**, hard **25**; progressive variant 1/2/3+ → 10/15/25, plus the
  admin **set bonus** (default 10) on the last variant. A given sentence pays XP **once per IST
  day** (`problem_rewards`), so replays/double-submits can't farm XP.
- Wrong answer → `combo = 0`, no XP; still returns current totals.
- Free quota: **18 solved sentences per band per day** (admin: `quotas`). Checked when a batch is
  requested → `DAILY_QUOTA_REACHED`.

## Content
173 seeded sentences (Indian everyday context) — Jumble: 40 easy, 30 medium, 20 hard,
12 progressive sets × 3. Editable at `/v3/admin/problems` ([[features/admin]]). Stored in
`problems` ([[architecture/database]]).

## API
`GET /api/game/jumble/batch?difficulty=` · `GET /api/game/jumble/hint?order=&difficulty=&level=[&base=&variant=]`
· `POST /api/game/jumble/submit` — shapes in [[architecture/api]].

## Known quirks (from the frontend, not changed)
- The 30 s timer ring and "speed bonus" in the tour are cosmetic — no timing is sent.
- Hint card comment says 3 misses; live code uses 2.
- The level-up card uses hard-coded level labels, not the admin level titles.

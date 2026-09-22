---
title: Pronunciation Coach
type: feature
tags: [trainer, pronunciation, gemini, r2]
links: [features/word-bank, features/progress-and-rewards, features/premium, architecture/gemini-key-pool, architecture/storage-r2, architecture/api]
updated: 2026-09-22
---

# Pronunciation Coach

Learners read a sentence aloud and get **word-by-word feedback** on what was clear and what wasn't.

## What the learner experiences (`/dashboard/pronunciation`)
Four steps, shown in a side stepper:
1. **Listen** — the sentence appears; a play button reads it in an Indian-English device voice
   (browser speech synthesis — no server audio).
2. **Speak** — countdown (default 5 s, admin-set), then recording starts automatically and **stops by
   itself ~1.3 s after the learner finishes speaking** (in-browser voice detection), at the band's limit
   (default easy 6 s / medium 8 s / hard 12 s) or on Stop — and is **scored straight away**. No
   listen-back, no Submit button, nothing stored (D-038). If no voice was heard: "We couldn't hear you"
   + **Try again** (not sent, no attempt used).
3. **Feedback** — accuracy ring + headline:
   ≥90 **Excellent** · ≥80 **Great job** · ≥55 **Solid effort** · ≥40 **Getting there** · else
   **Keep going**. Each word is green (correct), red (mispronounced) or amber (unclear); tap for
   *expected / heard / match % / confidence / tip*, plus **how to say it**: spoken syllables with the
   stressed one highlighted (`pruh·nun·see·AY·shun`), the same sounds **in the learner's own script**
   (mother tongue from onboarding, e.g. Hindi `वेन्ज़-डे`, Tamil `வென்ஸ்-டே`) and a 🔊 button (device
   voice, slow). Below the chips, **"How to say the words you missed"** cards show each missed word
   with syllables, native-script spelling, *You said: "…"* and what to fix (D-035).
   "+XP", level-up, badges; ≥80 % celebrates.
   With the Word Bank flag on, words can be dragged into the wallet ([[features/word-bank]]).
4. **Improve** — "Words to revisit" (tap to hear slowly) + tip cards → **Next sentence**.
"Sentence X of 12" is a client-side counter. The side panel shows attempts and best % (last 50).

## How scoring works (`frontend/src/server/gemini/scoring.ts`)
1. Browser converts the recording to **16 kHz mono WAV** (`src/audio/toWav.ts`) — Gemini accepts
   WAV reliably; Safari's mp4 and Chrome's webm are normalised away.
2. `POST /api/pronunciation/attempts` (multipart). Server sniffs the real format from bytes and
   **rejects silence** (`speechStats`: < 250 ms of voiced audio → `422 NO_SPEECH`) — a silent clip used
   to score 100% because the model "heard" the expected sentence (D-038).
3. **Gemini `gemini-3.1-flash-lite`** hears the audio + the expected sentence and returns strict
   JSON: transcript, one verdict per expected word (CORRECT/INCORRECT/UNCLEAR + heard + confidence
   + what-went-wrong tip + `syllables` + `native` respelling in the learner's script), a feedback
   message and 1–3 tips. The audio goes **straight from our server to Gemini** inside the request —
   nothing has to be stored first. The prompt says: *do not penalise an Indian
   accent, only sounds that change or blur the word* (v/w, th, stress, dropped syllables).
4. A **blind listener** (same model, audio only — it is NOT told the sentence) transcribes in parallel;
   expected words it didn't hear can't stay CORRECT (downgraded to INCORRECT/UNCLEAR, "It sounded like
   …"), and its transcript is what's shown as "what you said". The scorer prompt is strict: t/th, w/v,
   dropped endings, wrong vowel/stress → INCORRECT; unsure → UNCLEAR.
5. Server recomputes **similarity** (Levenshtein) and **accuracy = correct ÷ expected words**, so
   numbers are deterministic. Uses the key pool's `text` lane with fail-over
   ([[architecture/gemini-key-pool]]).
6. Verified 2026-09-22: learner said "Yesterday I go to the market and buy vegetables" for
   "…I went… bought…" → exactly `went` and `bought` marked INCORRECT. `scripts/pronunciation-probe.mjs`
   (real API, native language set): "Wednesday" → INCORRECT "You said 'banana'; say 'WENZ-day'…",
   syllables for every word, Hindi and Tamil respellings.

## Rules
- Phrase choice: per-learner cursor per band; moves past a phrase once it's scored, so "Next
  sentence" is always new (`sessionOffset` from the client is informational only).
- XP = round(base × accuracy), base easy **20** / medium **30** / hard **40**; once per phrase
  per IST day. Combo continues at ≥ 80 %, else resets. XP tier: HIGH ≥80, MID ≥55, else NEEDS_REVIEW.
- Free quota: **3 scored attempts per band per day** → `DAILY_QUOTA_REACHED` on `GET /phrases`.
- Recording kept in **R2** (`pronunciation/<user>/<attempt>.wav`) after the response is sent — only
  if R2 is configured; **not needed for scoring** and currently off (D-036, [[architecture/storage-r2]]).

## Content
47 seeded phrases: 20 easy, 15 medium (Indian-English traps: v/w, th, silent letters, stress),
12 hard. Editable at `/v3/admin/problems` (category Pronunciation).

## API
`GET /api/pronunciation/phrases?difficulty=&sessionOffset=` · `POST /api/pronunciation/attempts`
· `GET /api/pronunciation/attempts?limit=` — see [[architecture/api]].

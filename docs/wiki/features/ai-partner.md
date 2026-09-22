---
title: AI Partner (K.AI)
type: feature
tags: [trainer, ai-partner, gemini-live, voice]
links: [architecture/gemini-live, architecture/gemini-key-pool, features/progress-and-rewards, features/premium, architecture/api]
updated: 2026-09-22
---

# AI Partner — K.AI

A live **voice conversation** with K.AI, a warm English mentor. The learner speaks, K.AI answers
out loud, gently corrects mistakes, asks one follow-up, and **remembers** the learner next time.

## What the learner experiences (`/dashboard/ai-partner`)
1. Gate: shown if the `englishconnection-ai-partner` flag is on (default **on**) or the account has
   `ai_partner_access`; otherwise an "upgrading" modal.
2. If onboarding isn't done, the wizard asks first (K.AI uses it to personalise).
3. **Start card**: how it works, XP rule (from admin config), time left ("12 min left this week"),
   and **Session language**: "Hindi + English" (70/30 Roman-script mix) or "English only".
4. **Start session** → K.AI greets by name.
5. **Tap to talk**: tap the mic (or Space), speak, tap again. Silence auto-stop after a grace
   window. While you talk, K.AI's voice stops (barge-in). Live captions show both sides.
6. Status reads **Listening… / Thinking… / Speaking… / Your turn**.
7. Talk-time earns XP (**+10 after 15 s of speaking, then +30 per extra minute**), shown on the
   "Speak to earn" card with celebrations.
8. The session ends when the time allowance is used, or when the learner leaves.

## How it works
- The browser talks **directly to Google Gemini Live** (`gemini-3.1-flash-live-preview`) over a
  WebSocket, using a **single-use token** our server mints — see [[architecture/gemini-live]].
- The server picks a healthy API key from the pool ([[architecture/gemini-key-pool]]), bakes the
  K.AI prompt + voice + transcription + tap-to-talk mode into the token (locked), and returns it.
- Gemini returns speech (24 kHz PCM → `PcmPlayer`) and **transcripts of both sides** — no
  Deepgram / browser speech recognition anymore.
- Every ~20 s the browser posts **progress** (talk-time + new transcript lines). The server clamps
  talk-time (≤ wall-clock, ≤ ~2 s per recognised word), awards XP, bills time against the cap and
  tells the browser if the cap is reached.
- If a key hits its quota mid-session, the browser asks the server for a token on **another key**
  and replays the recent conversation so K.AI continues seamlessly. Plain network drops resume
  the same Gemini session with its resumption handle.
- **Memory**: after a session, a cheap Gemini text call compiles the transcript into
  `learner_memory` (summary, recurring mistakes, vocabulary). The next session's prompt includes
  it (idea from ENGAI's "Karpathy memory", moved from localStorage to Postgres).

## Tutor persona (server/gemini/tutorPrompt.ts)
Ported from the production K.AI prompt in ENGAI: acknowledge → correct with WHY → one question;
1–2 short spoken sentences (<35 words); learner does 80 % of the talking; topic guard; adapts to
level; says its name as "kaa-ee". Language mode per session: English-only or native + English
70/30 in Roman script.

## Limits ([[features/premium]])
Free **20 min / week** (resets Monday IST) · Pro **60 min / day** (IST) · one live conversation
per learner (a new one closes the old). All admin-editable (`/v3/admin/ai-partner`).

## Code map
UI `frontend/src/components/game/V3AIPartner.tsx` (unchanged render tree) · hook
`src/hooks/useGeminiLiveSession.ts` · mic `src/audio/micPcmStream.ts` · player
`src/audio/pcmPlayer.ts` · API `src/server/routes/chat.ts` · token `src/server/gemini/liveToken.ts`.

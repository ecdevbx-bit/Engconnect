---
title: AI Partner (K.AI)
type: feature
tags: [trainer, ai-partner, gemini-live, voice]
links: [architecture/gemini-live, architecture/gemini-key-pool, features/progress-and-rewards, features/premium, architecture/api, features/k-ai-instructions]
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
   and the **session setup** (ENGAI-style, D-026 — `SessionSetup.tsx`):
   - **Language**: English only, or any of 13 languages mixed with English (70/30, Roman script):
     Hindi, Bengali, Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, Odia, Assamese,
     Urdu, Nepali. The learner's own language (profile) is listed first and preselected.
   - **Level**: Beginner / Intermediate / Expert — each has its own instruction block (Beginner = soft,
     slow voice, very simple words, "say with me"); the chosen level's description shows under the
     pills. See [[features/k-ai-instructions]].
   - **Practice mode**: ☕ Casual chat · 💼 Job interview · 🎓 IELTS/TOEFL · ✈️ Travel & shopping ·
     🏢 Office talk · 🎯 Grammar workout — each has rules + a material bank (IELTS cue cards,
     interview questions, scenes…); every session gets a different slice (D-032).
   - **K.AI's voice**: 18 Gemini voices (Aoede, Kore, Leda, Zephyr, Callirrhoe, Autonoe, Despina,
     Sulafat, Erinome, Laomedeia, Puck, Charon, Fenrir, Orus, Achird, Gacrux, Umbriel, Iapetus) —
     all verified live on 2026-09-22.
   Choices are remembered on the device. In a session, the header shows the setup and a
   **Change setup** button (settings are baked into the token, so this starts a new conversation).
4. **Start session** → K.AI greets by name (and opens the chosen practice mode).
5. **Just talk — hands-free, like GPT voice mode** (D-039): the mic opens by itself when the call
   connects; K.AI answers when the learner pauses (longer pause allowed for Beginners); talking over
   K.AI interrupts it. The only control is **mute** (mic button or Space). Live captions show both sides.
6. Status reads **Listening… / Thinking… / Speaking… / Muted**.
7. Talk-time earns XP (**+10 after 15 s of speaking, then +30 per extra minute**), shown on the
   "Speak to earn" card with celebrations.
8. The session ends when the time allowance is used, or when the learner leaves.

## How it works
- The browser talks **directly to Google Gemini Live** (`gemini-3.1-flash-live-preview`) over a
  WebSocket, using a **single-use token** our server mints — see [[architecture/gemini-live]].
- The server picks a healthy API key from the pool ([[architecture/gemini-key-pool]]), bakes the
  K.AI prompt + voice + transcription + hands-free voice-detection settings into the token (locked),
  and returns it.
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
level; says its name as "kaa-ee". Language mode per session: English-only or X + English 70/30 in
Roman script (hand-tuned phrases for 7 languages, a generic rule for the rest). A **SESSION MODE**
block adds the chosen practice mode's rules. Both the **LEVEL** and **SESSION MODE** blocks come from
the instruction files `server/gemini/instructions/levels.ts` and `modes.ts`
([[features/k-ai-instructions]]), including "TODAY'S MATERIAL" picked with the session's `material_seed`. Options are validated server-side against
`frontend/src/lib/aiPartnerOptions.ts` and stored on `chat_sessions` (language, level, scenario,
voice), so reconnects keep the same mode and voice.

## Limits ([[features/premium]])
Free **20 min / week** (resets Monday IST) · Pro **20 min / day** (IST, D-033) · one live conversation
per learner (a new one closes the old). All admin-editable (`/v3/admin/ai-partner`).

## Code map
UI `frontend/src/components/game/V3AIPartner.tsx` (unchanged render tree) · hook
`src/hooks/useGeminiLiveSession.ts` · mic `src/audio/micPcmStream.ts` · player
`src/audio/pcmPlayer.ts` · API `src/server/routes/chat.ts` · token `src/server/gemini/liveToken.ts`.

---
title: AI Partner (K.AI)
type: feature
tags: [trainer, ai-partner, gemini-live, voice]
links: [architecture/gemini-live, architecture/gemini-key-pool, features/progress-and-rewards, features/premium, architecture/api, architecture/database, features/k-ai-instructions]
updated: 2026-10-28
---

# AI Partner — K.AI

A live **voice conversation** with K.AI, a warm English mentor. The learner speaks, K.AI answers
out loud, gently corrects mistakes, asks one follow-up, and **remembers** the learner next time.

## What the learner experiences (`/dashboard/ai-partner`)
1. Gate: shown if the `englishconnection-ai-partner` flag is on (default **on**) or the account has
   `ai_partner_access`; otherwise an "upgrading" modal.
2. If onboarding isn't done, the wizard asks first (K.AI uses it to personalise) — 4 phone-first
   steps, only language / status / reason required (D-060).
3. **Start card** (one phone screen, D-060): mascot + "Talk to K.AI" + History, the **session setup**
   (`SessionSetup.tsx`) and **Start session** pinned above the tab bar on phones, with the time left
   under it. No language picker any more (D-059):
   - **Language: K.AI decides.** It opens in simple English and follows how the learner talks —
     comfortable English → English; Hindi/Hinglish/Tamil… or lost → a blend (their language for warmth
     and meanings, English for everything they practise); "Hindi mein bolo" / "only English" → that.
     The profile's mother tongue is only a hint: after every call (free and Pro) the digest notes the
     language they actually spoke (`learner_memory.comfort_language`, e.g. "Marathi + English") and the
     next call uses that instead (D-063). It answers in the language of the learner's last message
     (Marathi ≠ Hindi); the live model still sometimes takes Devanagari Marathi for Hindi. English is spoken with an
     Indian English accent, Indian languages like a native speaker would (D-064). When K.AI knows their language
     (earlier calls, else the profile) it speaks it from the greeting on, at every level; old notes can't force
     English-only and mixing is never written down as a mistake (D-065). Sessions store `language = 'Auto'`; a language sent by an old page is ignored.
   - **Level**: Beginner / Intermediate / Expert — each has its own instruction block (Beginner = soft,
     slow voice, very simple words, "say with me"); the chosen level's description shows under the
     pills. See [[features/k-ai-instructions]].
   - **Practice mode**: ☕ Casual chat · 💼 Job interview · 🎓 IELTS/TOEFL · ✈️ Travel & shopping ·
     🏢 Office talk · 🎯 Grammar workout — each has rules + a material bank (IELTS cue cards,
     interview questions, scenes…); every session gets a different slice (D-032).
   - **K.AI's voice**: two — **Female (Aoede, default)** or **Male (Charon)** (D-048; there were 18).
     A saved or requested voice that isn't one of these falls back to Aoede.
   Choices are remembered on the device. In a session, the header shows the setup and a
   **Change setup** button (settings are baked into the token, so this starts a new conversation).
4. **Start session** → K.AI greets by name (and opens the chosen practice mode).
5. **Just talk — hands-free, like GPT voice mode** (D-039): the mic opens by itself when the call
   connects; K.AI answers when the learner pauses (longer pause allowed for Beginners); talking over
   K.AI interrupts it — 180 ms of voice within any 450 ms above K.AI's echo peaks on that device, or 200 ms
   of steady voice over the echo on loud speakers (D-066; D-062's one-run rule never filled up on real,
   syllable-shaped speech). Simulation: `scripts/barge-in-sim.mjs`. Controls: **mute** (mic button or Space) and a red **✕ End call** beside it,
   which ends the conversation (saved and digested as usual) and returns to the start card (D-060). Mute keeps the mic open and
   just stops sending, so a phone never switches audio mode mid-call (K.AI's volume used to drop) (D-054).
   **Live captions** (D-054): K.AI's words appear as they are spoken (bubble + one-line caption in the
   mic bar), not seconds early; on a computer the learner's own words show while they talk (browser
   speech preview), on phones when they pause. Talking over K.AI only interrupts it if it's a real,
   sustained voice — a cough, "mm" or K.AI's own echo no longer cuts it off.
   Background voices (TV, people across the room) are filtered out: only a voice near the mic reaches
   K.AI, and K.AI is told to ignore side speech (D-052). The browser's auto-gain is off (it turned the
   room up between the learner's words); our own gain follows the learner's voice only (D-054). A background voice as loud as the learner
   still gets through.
   K.AI keeps replies short (under 20/25/30 words by level) and hands the turn back with one open
   question, so the learner does most of the talking (D-053). The player buffers ~120 ms so network
   jitter doesn't crackle.
6. Status reads **Listening… / Thinking… / Speaking… / Muted**.
7. Talk-time earns XP (**+10 after 15 s of speaking, then +30 per extra minute**), shown on the
   "Speak to earn" card with celebrations.
8. The session ends when the time allowance is used, or when the learner leaves.

## How it works
- The browser talks **directly to Google Gemini Live** (`gemini-3.1-flash-live-preview`) over a
  WebSocket, using a **single-use token** our server mints — see [[architecture/gemini-live]].
- Starting a conversation reads profile, settings, memory and usage in parallel; the server runs in Mumbai
  (bom1) next to the database (D-056 — it was in Washington DC, ~5 s per start).
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
- **Memory** (D-047): after a session the transcript is digested — long chats are split into
  chunks and summarised first — into a per-conversation digest (title, summary, topics, facts the
  learner shared, corrections, words, next-time tip). Everyone gets the structured memory
  (`learner_memory`: running summary, recurring mistakes, words). **Pro** learners also get a
  compacted **Markdown memory file** (`learner_memory.memory_md`: About them · Goals & plans · What
  we've talked about · Mistakes to keep an eye on · Words they've learnt · Next time), re-written
  after every conversation and sent to Gemini in the next session's locked prompt — K.AI follows up
  on last time ("Have you thought more about that Goa trip?"). Stored in Postgres only (no Redis).
  A chat only counts once it's merged into memory; unmerged chats are retried (D-049).

## History & memory (Pro) — `/dashboard/ai-partner/history`
- ChatGPT-style list of past conversations (Today / Yesterday / Previous 7 days / …) → transcript,
  summary, corrections, new words, next-time tip; **Continue this conversation** starts a new session
  that picks up the thread (`?continue=<id>`); **Delete** removes a chat (transcript + chunks).
- Tab **What K.AI remembers**: the memory file, with **Clear memory** (K.AI forgets; chats stay).
- Free learners: list locked with the number of saved chats + Pro CTA; they can still clear memory.
- Entry: "History & memory" button on the K.AI start card. Probe: `scripts/chat-memory-probe.mjs`.

## Tutor persona (server/gemini/tutorPrompt.ts)
Ported from the production K.AI prompt in ENGAI: acknowledge → correct with WHY → one question;
1–2 short spoken sentences (<35 words); learner does 80 % of the talking; topic guard; adapts to
level; says its name as "kaa-ee". Language: "Auto" (D-059) — a "MATCH THE LEARNER" block (open in
English, follow what they speak, never ask or announce); sessions from before 2026-10-29 keep their
English-only / X + English 70/30 Roman-script rule on reconnect. A **SESSION MODE**
block adds the chosen practice mode's rules. Both the **LEVEL** and **SESSION MODE** blocks come from
the instruction files `server/gemini/instructions/levels.ts` and `modes.ts`
([[features/k-ai-instructions]]), including "TODAY'S MATERIAL" picked with the session's `material_seed`. Options are validated server-side against
`frontend/src/lib/aiPartnerOptions.ts` and stored on `chat_sessions` (language, level, scenario,
voice), so reconnects keep the same mode and voice.

## Limits ([[features/premium]])
Free **20 min / week** (resets Monday IST) · Pro **20 min / day** (IST, D-033) · one live conversation
per learner (a new one closes the old). All admin-editable (`/v3/admin/ai-partner`).

## Code map
UI `frontend/src/components/game/V3AIPartner.tsx` · hook
`src/hooks/useGeminiLiveSession.ts` · mic `src/audio/micPcmStream.ts` · player
`src/audio/pcmPlayer.ts` (audio clock for captions) · learner caption preview `src/audio/speechPreview.ts` · API `src/server/routes/chat.ts` · token `src/server/gemini/liveToken.ts` ·
memory pipeline `src/server/gemini/memory.ts` · history/memory API `src/server/routes/chatHistory.ts` ·
history UI `src/app/(app)/dashboard/ai-partner/history/` + `src/components/aiPartnerHistory/` ·
client `src/lib/v3ChatHistory.ts`.

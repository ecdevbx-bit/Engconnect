---
title: Gemini Live integration
type: architecture
tags: [gemini, live, websocket, audio]
links: [features/ai-partner, architecture/gemini-key-pool, architecture/api]
updated: 2026-09-22
---

# Gemini Live integration

Model **`gemini-3.1-flash-live-preview`** (owner's choice for the demo). Google marks it *legacy
preview* and recommends **`gemini-3.8-live`** (stable) — switching is just `GEMINI_LIVE_MODEL`.

## 1. Token (server) — `src/server/gemini/liveToken.ts`
`new GoogleGenAI({apiKey, httpOptions:{apiVersion:"v1alpha"}}).authTokens.create({config:{…}})`:
- `uses: 1` (resuming the same session doesn't count), `expireTime` = session budget + 2 min,
  `newSessionExpireTime` = +2 min.
- `liveConnectConstraints` = model + `responseModalities:[AUDIO]`, the **K.AI system prompt**,
  the learner-chosen voice (one of 18, validated; default Aoede — D-026), `inputAudioTranscription:{}`,
  `outputAudioTranscription:{}`, **automatic voice detection on** (low start/end sensitivity,
  `prefixPaddingMs` 200, `silenceDurationMs` = the level's pause: Beginner 1500 / Intermediate 1100 /
  Expert 800) with `activityHandling = START_OF_ACTIVITY_INTERRUPTS` (hands-free, barge-in — D-039),
  `contextWindowCompression.slidingWindow`.
- `lockAdditionalFields: []` → every field above is locked; the browser can't change the prompt.
  `sessionResumption` is deliberately *not* locked so the client can pass its resume handle.

## 2. Socket (browser) — `src/hooks/useGeminiLiveSession.ts`
URL: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=<token>`

| Direction | Message |
|---|---|
| → | `{setup:{model:"models/…", sessionResumption:{handle?}}}` |
| ← | `setupComplete` → send `kickoff` as `clientContent` (K.AI greets) |
| → mic (continuous) | `realtimeInput.audio {mimeType:"audio/pcm;rate=16000", data}` every ~100 ms for the whole call — no activityStart/End (rejected when auto-VAD is on). While K.AI plays, quiet frames are sent as zeros (echo gate). Mute → mic released + `realtimeInput.audioStreamEnd` |
| ← | `serverContent.inputTranscription` (learner caption), `outputTranscription` (K.AI caption), `modelTurn.parts[].inlineData` (24 kHz PCM → `PcmPlayer`), `interrupted`, `turnComplete` |
| ← | `sessionResumptionUpdate.newHandle`, `goAway`, `usageMetadata` |
Text parts in `modelTurn` are internal reasoning on native-audio models → never shown.

## 3. Reliability
- Plain drop / `goAway` → reopen the **same** session with the resumption handle.
- Quota/key error in the close reason → server `reconnect` on another key + replay last 12 turns.
- Token expired → server `reconnect` (fresh token).
- Reply watchdog: if nothing comes back in 15 s, the mic unlocks.

## Voices
All 18 prebuilt voices offered in the UI return audio on this model (probe 2026-09-22): Aoede, Puck,
Charon, Kore, Fenrir, Leda, Orus, Zephyr, Callirrhoe, Autonoe, Despina, Sulafat, Achird, Gacrux,
Umbriel, Iapetus, Erinome, Laomedeia. An unknown name closes the socket with 1007 — hence server
validation.

## Verified (2026-09-22, scratch probes)
Token mint ✓ · setupComplete ✓ · spoken greeting (14 audio chunks) + transcript ✓ · resumption
handle ✓ · tap-to-talk turn: learner "Yesterday I go to the market and buy vegetables." →
K.AI "Yesterday, you went to the market and bought vegetables. What did you buy?" ✓

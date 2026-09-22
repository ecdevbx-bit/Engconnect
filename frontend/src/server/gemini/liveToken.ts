import "server-only";

import { ActivityHandling, EndSensitivity, GoogleGenAI, Modality, StartSensitivity } from "@google/genai";

import { env } from "../env";
import { fail } from "../http";
import {
  classifyGeminiError,
  errorMessage,
  errorStatus,
  leaseKey,
  releaseLease,
  type Lease,
} from "./keyPool";

// Mints a single-use, short-lived Gemini Live token for the browser. The
// tutor prompt, voice, transcription and turn-taking mode are baked into the
// token's constraints and LOCKED, so the browser can only open the exact
// session we configured — it never sees an API key. (DECISIONS.md D-004)

export type LiveGrant = {
  leaseId: string;
  keyLabel: string;
  token: string;
  model: string;
  apiVersion: string;
  wsUrl: string;
  expiresAt: string;
};

// Live lease TTL: the session heartbeats every ~20 s and extends this.
export const LIVE_LEASE_TTL_SECONDS = 90;

function wsUrlFor(apiVersion: string, token: string): string {
  return (
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${apiVersion}` +
    `.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`
  );
}

async function mint(lease: Lease, systemPrompt: string, expiresAt: Date, voice: string, pauseMs: number): Promise<LiveGrant> {
  const apiVersion = env.geminiLiveApiVersion();
  const model = env.geminiLiveModel();
  const ai = new GoogleGenAI({ apiKey: lease.apiKey, httpOptions: { apiVersion } });
  const token = await ai.authTokens.create({
    config: {
      uses: 1, // resuming the same session does not consume a use
      expireTime: expiresAt.toISOString(),
      newSessionExpireTime: new Date(Date.now() + 2 * 60_000).toISOString(),
      liveConnectConstraints: {
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemPrompt,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || env.geminiLiveVoice() } } },
          // Live captions for both sides — replaces Deepgram / Web Speech.
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // Hands-free conversation (D-038): Gemini's own voice detection ends
          // the learner's turn after `pauseMs` of silence (longer for beginners,
          // who pause to think); low sensitivities so noise/echo don't trigger
          // it. Speaking over K.AI interrupts it, like a real call.
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
              prefixPaddingMs: 200,
              silenceDurationMs: pauseMs,
            },
            activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
          },
          // Long sessions: slide the context window instead of hard-failing.
          contextWindowCompression: { slidingWindow: {} },
        },
      },
      // [] ⇒ lock every field set above. sessionResumption is intentionally
      // NOT set, so the client can pass its resume handle on reconnect.
      lockAdditionalFields: [],
    },
  });
  if (!token.name) throw new Error("Gemini returned no token name");
  return {
    leaseId: lease.leaseId,
    keyLabel: lease.keyLabel,
    token: token.name,
    model: `models/${model}`,
    apiVersion,
    wsUrl: wsUrlFor(apiVersion, token.name),
    expiresAt: expiresAt.toISOString(),
  };
}

// Lease a healthy key and mint a token, failing over to the next key when
// one is out of quota or rejected. Throws AI_CAPACITY_EXHAUSTED when none work.
export async function grantLiveSession(args: {
  userId: string;
  systemPrompt: string;
  sessionSeconds: number;
  exclude?: string[];
  // prebuilt voice, validated by the caller against AI_PARTNER_VOICES
  voice?: string;
  // silence (ms) that ends the learner's turn — see LEVEL_INSTRUCTIONS.pauseMs
  pauseMs?: number;
}): Promise<LiveGrant & { keyId: string }> {
  const tried = [...(args.exclude ?? [])];
  // Token outlives the session budget slightly; Google caps tokens at 20 h.
  const expiresAt = new Date(Date.now() + Math.min(args.sessionSeconds + 120, 6 * 3600) * 1000);
  let lastError = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    const lease = await leaseKey(args.userId, "live", LIVE_LEASE_TTL_SECONDS, tried);
    if (!lease) break;
    tried.push(lease.keyId);
    try {
      const grant = await mint(lease, args.systemPrompt, expiresAt, args.voice ?? "", args.pauseMs ?? 1100);
      return { ...grant, keyId: lease.keyId };
    } catch (err) {
      lastError = errorMessage(err);
      const outcome = classifyGeminiError(errorStatus(err), lastError);
      await releaseLease(lease.leaseId, outcome === "error" ? "error" : outcome, lastError);
      console.warn(`[gemini] live token mint failed on ${lease.keyLabel}: ${outcome} — ${lastError.slice(0, 200)}`);
    }
  }
  console.error("[gemini] no live capacity:", lastError || "no healthy keys");
  throw fail.unavailable(
    "K.AI is busy with other learners right now. Please try again in a minute.",
    "AI_CAPACITY_EXHAUSTED",
  );
}

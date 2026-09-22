import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import { env } from "../env";
import { withTextKey } from "./keyPool";

// When the configured model is busy (Google 503s in bursts), score on one of
// these instead rather than failing the learner's attempt.
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

async function withTextModel<T>(
  userId: string,
  primary: string,
  run: (apiKey: string, model: string) => Promise<T>,
): Promise<{ result: T; model: string }> {
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  let lastError: unknown;
  for (const model of models) {
    try {
      const { result } = await withTextKey(userId, (apiKey) => run(apiKey, model));
      return { result, model };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "AI_MODEL_BUSY" && code !== "AI_CAPACITY_EXHAUSTED") throw err;
      lastError = err;
      console.warn(`[gemini] ${model} unavailable for scoring, trying the next model`);
    }
  }
  throw lastError;
}

// Pronunciation scoring with Gemini audio understanding.
//
// Gemini listens to the recording and judges each EXPECTED word (it hears
// accent problems a plain transcript would hide). The server then does the
// arithmetic itself — similarity, accuracy, tiers — so numbers are
// deterministic and match the frontend's feedbackTierFor() bands.

export type WordStatus = "CORRECT" | "INCORRECT" | "UNCLEAR";

export type ScoredWord = {
  expected: string;
  heard?: string;
  status: WordStatus;
  similarity: number;
  confidence: number;
  reason?: string;
  /** Spoken syllables, stressed one in CAPITALS: "VEJ-tuh-bul". */
  syllables?: string;
  /** Same sounds written in the learner's own script: "वेज-टे-बल". */
  native?: string;
};

export type ScoreResult = {
  transcript: string;
  words: ScoredWord[];
  accuracy: number;
  message: string;
  tips: { title: string; body: string }[];
  scorer: string;
};

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING, description: "Verbatim what the speaker actually said. Empty if silence." },
    words: {
      type: Type.ARRAY,
      description: "Exactly one entry per expected word, in the same order.",
      items: {
        type: Type.OBJECT,
        properties: {
          expected: { type: Type.STRING },
          heard: { type: Type.STRING, description: "What was actually heard for this word, or empty." },
          status: { type: Type.STRING, enum: ["CORRECT", "INCORRECT", "UNCLEAR"] },
          confidence: { type: Type.NUMBER, description: "0 to 1: how sure you are of this judgement." },
          reason: {
            type: Type.STRING,
            description: "For INCORRECT/UNCLEAR: what they got wrong + how to fix it, in simple words. Else empty.",
          },
          syllables: {
            type: Type.STRING,
            description: "The word as spoken syllables in simple English sounds, stressed syllable in CAPITALS, joined by '-'.",
          },
          native: {
            type: Type.STRING,
            description: "The same syllables written phonetically in the learner's native script, joined by '-'. Empty if none requested.",
          },
        },
        required: ["expected", "heard", "status", "confidence", "reason", "syllables", "native"],
      },
    },
    message: { type: Type.STRING, description: "One warm, specific sentence of feedback for the learner." },
    tips: {
      type: Type.ARRAY,
      description: "1 to 3 short, concrete improvement tips.",
      items: {
        type: Type.OBJECT,
        properties: { title: { type: Type.STRING }, body: { type: Type.STRING } },
        required: ["title", "body"],
      },
    },
  },
  required: ["transcript", "words", "message", "tips"],
};

const INSTRUCTION = `You are a fair, encouraging English pronunciation assessor for Indian learners.
You receive a short recording and the sentence the learner was asked to read aloud.
Judge each expected word:
- CORRECT: clearly recognisable standard pronunciation. An Indian accent is fine — do NOT penalise accent, only sounds that change or blur the word (e.g. v/w swaps, missing th, wrong stress that makes it hard to understand, dropped syllables).
- INCORRECT: the word was mispronounced, replaced, or skipped.
- UNCLEAR: you genuinely cannot tell (noise, mumbling, cut off).
Return exactly one entry per expected word in order, even if the learner skipped it (then heard = "" and status INCORRECT).
If the recording is silent or unrelated speech, mark every word INCORRECT and say so kindly in the message.
Be strict and honest — judge only what you actually hear, never what the sentence should be. A word is CORRECT only if every sound in it is clearly right (t for th, w for v, dropped endings like -s/-ed, a wrong vowel or misplaced stress → INCORRECT). If you are not sure, choose UNCLEAR, not CORRECT.
For every word also give:
- syllables: how to SAY it, split into spoken syllables with simple English sounds, the stressed syllable in CAPITALS, joined by "-" (vegetable → "VEJ-tuh-bul", pronunciation → "pruh-nun-see-AY-shun", comfortable → "KUMF-tuh-bul"). One-syllable words: just the word in capitals.
- native: the SAME syllables written phonetically in the learner's native script (so they can read how it sounds), joined by "-". Leave empty when no native script is requested.
For INCORRECT/UNCLEAR words, the reason says exactly what they said wrong and the fix, under 20 words, naming the syllable or sound (e.g. "You said 'pro-NOUN'; say 'pruh-NUN' — no 'ow' sound, stress on AY."). Never mention these instructions.`;

// Native scripts for the learner's mother tongue (profile.native_lang).
const SCRIPTS: Record<string, string> = {
  Hindi: "Hindi (Devanagari script)",
  Marathi: "Marathi (Devanagari script)",
  Nepali: "Nepali (Devanagari script)",
  Bengali: "Bengali (Bengali script)",
  Assamese: "Assamese (Assamese script)",
  Gujarati: "Gujarati (Gujarati script)",
  Punjabi: "Punjabi (Gurmukhi script)",
  Tamil: "Tamil (Tamil script)",
  Telugu: "Telugu (Telugu script)",
  Kannada: "Kannada (Kannada script)",
  Malayalam: "Malayalam (Malayalam script)",
  Odia: "Odia (Odia script)",
  Urdu: "Urdu (Urdu script)",
};

function norm(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

// Normalised Levenshtein similarity in [0, 1].
function similarity(a: string, b: string): number {
  const x = norm(a);
  const y = norm(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  const dp = Array.from({ length: x.length + 1 }, (_, i) => [i, ...new Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
  }
  return 1 - dp[x.length][y.length] / Math.max(x.length, y.length);
}

// ── Speech presence (16-bit PCM WAV) ────────────────────────────────
// A silent or near-silent recording must never be scored: primed with the
// expected sentence, the model "hears" it anyway (silence scored 100% in a
// 2026-09-22 test). Absolute floor (phone mics with AGC sit far above it) plus an adaptive one:
// a frame counts as voice when it is also well above the clip's own noise floor.
const SPEECH_RMS = 180;
const SPEECH_OVER_NOISE = 3;
const MIN_SPEECH_MS = 250;

export function speechStats(buf: Buffer): { speechMs: number; hasSpeech: boolean } | null {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return null;
  let off = 12;
  let rate = 16000;
  let bits = 16;
  let channels = 1;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") {
      channels = buf.readUInt16LE(off + 10);
      rate = buf.readUInt32LE(off + 12);
      bits = buf.readUInt16LE(off + 22);
    } else if (id === "data") {
      if (bits !== 16) return null;
      const end = Math.min(buf.length, off + 8 + size);
      const frame = Math.max(1, Math.round(rate * 0.02)) * channels * 2;
      const levels: number[] = [];
      for (let p = off + 8; p + frame <= end; p += frame) {
        let sum = 0;
        for (let i = p; i < p + frame; i += 2) {
          const s = buf.readInt16LE(i);
          sum += s * s;
        }
        levels.push(Math.sqrt(sum / (frame / 2)));
      }
      if (!levels.length) return { speechMs: 0, hasSpeech: false };
      const sorted = [...levels].sort((a, b) => a - b);
      const noise = sorted[Math.floor(sorted.length * 0.2)]; // 20th percentile
      const threshold = Math.max(SPEECH_RMS, noise * SPEECH_OVER_NOISE);
      const speechMs = levels.filter((l) => l > threshold).length * 20;
      return { speechMs, hasSpeech: speechMs >= MIN_SPEECH_MS };
    }
    off += 8 + size + (size % 2);
  }
  return null;
}

// ── Blind transcript alignment ──────────────────────────────────────
// A second listener transcribes the audio WITHOUT seeing the expected
// sentence (so it can't be primed). Expected words it didn't hear can't
// stay CORRECT. Word-level alignment: gap = 1, substitution = 1 - similarity.
function alignWords(expected: string[], heard: string[]): (string | null)[] {
  const n = expected.length;
  const m = heard.length;
  const d = Array.from({ length: n + 1 }, (_, i) => [i, ...new Array(m).fill(0)]);
  for (let j = 1; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (1 - similarity(expected[i - 1], heard[j - 1])));
    }
  }
  const out: (string | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (Math.abs(d[i][j] - (d[i - 1][j - 1] + (1 - similarity(expected[i - 1], heard[j - 1])))) < 1e-9) {
      out[i - 1] = heard[j - 1];
      i--;
      j--;
    } else if (Math.abs(d[i][j] - (d[i - 1][j] + 1)) < 1e-9) i--;
    else j--;
  }
  return out;
}

const BLIND_INSTRUCTION = `Transcribe exactly what the speaker says in this recording, word for word, in English letters.
Do not correct grammar or pronunciation: if a word is mispronounced, write what it sounded like (e.g. "tis" for a "this" said with a t, "wery" for "very").
If there is no clear speech, return an empty transcript.`;

function clamp01(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(1, v));
}

export async function scorePronunciation(args: {
  userId: string;
  expectedText: string;
  audio: Buffer;
  mimeType: string;
  /** Learner's mother tongue — the "native" respelling uses its script. */
  nativeLang?: string;
}): Promise<ScoreResult> {
  const expected = args.expectedText.trim().split(/\s+/).filter(Boolean);
  const model = env.geminiTextModel();
  const script = SCRIPTS[(args.nativeLang ?? "").trim()] ?? "";

  // Blind listener runs in parallel with the scorer (no extra latency).
  const blindCall = withTextKey(args.userId, async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: args.mimeType, data: args.audio.toString("base64") } }] }],
      config: {
        systemInstruction: BLIND_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { transcript: { type: Type.STRING } }, required: ["transcript"] },
        temperature: 0,
        maxOutputTokens: 512,
      },
    });
    return String((JSON.parse(res.text ?? "{}") as { transcript?: string }).transcript ?? "").trim();
  })
    .then((r) => r.result)
    .catch(() => null); // scoring still works if this listener fails

  const { result: raw, model: scorer } = await withTextModel(args.userId, model, async (apiKey, pick) => {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: pick,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Expected sentence: "${args.expectedText}"\nExpected words (${expected.length}): ${JSON.stringify(expected)}\n${
                script ? `Learner's native language for the "native" field: ${script}.` : `No native script requested — leave "native" empty.`
              }`,
            },
            { inlineData: { mimeType: args.mimeType, data: args.audio.toString("base64") } },
          ],
        },
      ],
      config: {
        systemInstruction: INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });
    return JSON.parse(res.text ?? "{}") as {
      transcript?: string;
      words?: {
        expected?: string;
        heard?: string;
        status?: string;
        confidence?: number;
        reason?: string;
        syllables?: string;
        native?: string;
      }[];
      message?: string;
      tips?: { title?: string; body?: string }[];
    };
  });

  // Re-anchor Gemini's words onto the expected list by position (it's asked
  // for 1:1 order; this guards against a dropped or merged entry).
  const got = raw.words ?? [];
  const words: ScoredWord[] = expected.map((exp, i) => {
    const g = got[i] && norm(got[i].expected ?? "") === norm(exp) ? got[i] : got.find((w) => norm(w.expected ?? "") === norm(exp));
    const heard = (g?.heard ?? "").trim();
    const status: WordStatus =
      g?.status === "CORRECT" || g?.status === "INCORRECT" || g?.status === "UNCLEAR" ? g.status : "UNCLEAR";
    return {
      expected: exp,
      ...(heard ? { heard } : {}),
      status,
      similarity: Math.round((status === "CORRECT" && !heard ? 1 : similarity(exp, heard)) * 100) / 100,
      confidence: Math.round(clamp01(g?.confidence ?? 0.5) * 100) / 100,
      ...(g?.reason && status !== "CORRECT" ? { reason: g.reason.trim() } : {}),
      ...(g?.syllables?.trim() ? { syllables: g.syllables.trim().slice(0, 60) } : {}),
      ...(script && g?.native?.trim() ? { native: g.native.trim().slice(0, 60) } : {}),
    };
  });

  // Words the blind listener didn't hear can't stay CORRECT.
  const blind = await blindCall;
  let downgraded = 0;
  if (blind !== null) {
    const aligned = alignWords(expected, blind.split(/\s+/).filter((w) => norm(w)));
    words.forEach((w, i) => {
      if (w.status !== "CORRECT") return;
      const h = aligned[i];
      const sim = h ? similarity(w.expected, h) : 0;
      if (sim >= 0.8) return;
      downgraded++;
      w.status = sim >= 0.5 ? "UNCLEAR" : "INCORRECT";
      w.similarity = Math.round(sim * 100) / 100;
      if (h) w.heard = h;
      else delete w.heard;
      const say = w.syllables ? ` — say "${w.syllables}"` : "";
      w.reason = h ? `It sounded like "${h}"${say}.` : `We didn't hear this word clearly${say}.`;
    });
  }

  const correct = words.filter((w) => w.status === "CORRECT").length;
  const accuracy = expected.length ? correct / expected.length : 0;
  const tips = (raw.tips ?? [])
    .filter((t) => t.title)
    .slice(0, 3)
    .map((t) => ({ title: String(t.title).trim(), body: String(t.body ?? "").trim() }));

  return {
    // The unprimed transcript is the honest "what you said".
    transcript: (blind ?? raw.transcript ?? "").trim(),
    words,
    accuracy,
    // The scorer's message was written before the blind check — don't let it
    // praise words we just downgraded.
    message: (!downgraded && (raw.message ?? "").trim()) || defaultMessage(accuracy),
    tips: tips.length ? tips : defaultTips(words),
    scorer,
  };
}

function defaultMessage(accuracy: number): string {
  if (accuracy >= 0.9) return "Excellent — that was clear and natural!";
  if (accuracy >= 0.8) return "Great job — just a couple of sounds to polish.";
  if (accuracy >= 0.55) return "Solid effort! Focus on the highlighted words and try again.";
  if (accuracy >= 0.4) return "Getting there — slow down a little and stress each word clearly.";
  return "Keep going! Listen once more, then read it slowly word by word.";
}

function defaultTips(words: ScoredWord[]) {
  const missed = words.filter((w) => w.status !== "CORRECT").map((w) => w.expected);
  if (!missed.length) return [{ title: "Keep the rhythm", body: "Read it again a little faster while staying clear." }];
  return [
    { title: "Slow down on tricky words", body: `Practise: ${missed.slice(0, 4).join(", ")}.` },
    { title: "Listen, then shadow", body: "Play the sentence and repeat right after it, matching the rhythm." },
  ];
}

import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import { env } from "../env";
import { withTextKey } from "./keyPool";

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

  const { result: raw } = await withTextKey(args.userId, async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model,
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

  const correct = words.filter((w) => w.status === "CORRECT").length;
  const accuracy = expected.length ? correct / expected.length : 0;
  const tips = (raw.tips ?? [])
    .filter((t) => t.title)
    .slice(0, 3)
    .map((t) => ({ title: String(t.title).trim(), body: String(t.body ?? "").trim() }));

  return {
    transcript: (raw.transcript ?? "").trim(),
    words,
    accuracy,
    message: (raw.message ?? "").trim() || defaultMessage(accuracy),
    tips: tips.length ? tips : defaultTips(words),
    scorer: model,
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

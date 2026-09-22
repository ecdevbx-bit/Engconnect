// v3 pronunciation-trainer API helpers. Mirrors the shape of v3Game.ts but
// includes a multipart submitter for the audio blob.
//
// Backend contract lives in backend/internal/apiv3/pronunciation.go:
//   GET  /api/pronunciation/phrases?difficulty=&seed=
//   POST /api/pronunciation/attempts (multipart)
//   GET  /api/pronunciation/attempts?limit=

import { toWav16k } from "@/audio/toWav";

import { DAILY_QUOTA_REACHED_CODE, triggerQuotaPrompt } from "./quotaPrompt";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export type PronunciationDifficulty = "easy" | "medium" | "hard";

export type PronunciationPhrase = {
  sentence: string;
  order: number;
  difficulty: PronunciationDifficulty;
  countdownMs: number;
  recordDurationMs: number;
};

export type PronunciationWordStatus = "CORRECT" | "INCORRECT" | "UNCLEAR";
export type PronunciationTier = "HIGH" | "MID" | "NEEDS_REVIEW";

// 5-band presentation tier — drives the ring colour, headline label, and
// whether the full-screen celebration fires. Distinct from the XP tier above.
export type PronunciationFeedbackTier =
  | "EXCELLENT"
  | "GREAT"
  | "SOLID"
  | "GETTING_THERE"
  | "KEEP_GOING";

export const PRONUNCIATION_FEEDBACK_META: Record<
  PronunciationFeedbackTier,
  { label: string; ringColor: string; celebrate: boolean }
> = {
  EXCELLENT: { label: "Excellent!", ringColor: "#16a34a", celebrate: true }, // dark green
  GREAT: { label: "Great job!", ringColor: "#4ade80", celebrate: true }, // light green
  SOLID: { label: "Solid effort", ringColor: "#fbbf24", celebrate: false }, // yellow
  GETTING_THERE: { label: "Getting there", ringColor: "#fb923c", celebrate: false }, // orange
  KEEP_GOING: { label: "Keep going", ringColor: "#f87171", celebrate: false }, // red
};

// Mirrors the backend's feedbackTierFor — used as a fallback when a result
// predates the feedbackTier field (e.g. a cached response).
export function feedbackTierFromPercent(pct: number): PronunciationFeedbackTier {
  if (pct >= 90) return "EXCELLENT";
  if (pct >= 80) return "GREAT";
  if (pct >= 55) return "SOLID";
  if (pct >= 40) return "GETTING_THERE";
  return "KEEP_GOING";
}

// pronunciationFeedbackMeta resolves the colour/label/celebrate triple for a
// result, preferring the backend's feedbackTier and falling back to %.
export function pronunciationFeedbackMeta(result: {
  feedbackTier?: PronunciationFeedbackTier;
  accuracyPercent: number;
}) {
  const tier = result.feedbackTier ?? feedbackTierFromPercent(result.accuracyPercent);
  return PRONUNCIATION_FEEDBACK_META[tier];
}

export type PronunciationWord = {
  expected: string;
  heard?: string;
  status: PronunciationWordStatus;
  similarity: number;
  confidence: number;
  reason?: string;
};

export type PronunciationTip = {
  title: string;
  body: string;
};

export type PronunciationAttemptResult = {
  attemptId: string;
  order: number;
  difficulty: PronunciationDifficulty;
  expectedText: string;
  transcript: string;
  accuracy: number;        // 0–1
  accuracyPercent: number; // floored int (display)
  tier: PronunciationTier; // XP tier
  feedbackTier: PronunciationFeedbackTier; // 5-band presentation tier
  message: string;
  correctWords: string[];
  incorrectWords: string[];
  words: PronunciationWord[];
  durationMs: number;
  tips: PronunciationTip[];
  // XP / progression
  xpEarned: number;
  totalXp: number;
  currentLevel: number;
  leveledUp: boolean;
  combo: number;
  newlyEarnedBadges?: string[];
  createdAt: string;
};

export type PronunciationHistoryRow = {
  attemptId: string;
  difficulty: PronunciationDifficulty;
  expectedText: string;
  accuracy: number;
  accuracyPercent: number;
  tier: PronunciationTier;
  message: string;
  createdAt: string;
};

type Envelope<T> = { success: boolean; message: string; data?: T; errorCode?: string };

function envelopeError<T>(body: Envelope<T>, fallback: string): Error {
  return new Error(body.message ?? body.errorCode ?? fallback);
}

export async function v3FetchPronunciationPhrase(
  accessToken: string,
  difficulty: PronunciationDifficulty,
  sessionOffset: number,
): Promise<PronunciationPhrase> {
  const params = new URLSearchParams({ difficulty, sessionOffset: String(sessionOffset) });
  const res = await fetch(`${API_URL}/api/pronunciation/phrases?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const body = (await res.json()) as Envelope<PronunciationPhrase>;
  if (!res.ok || !body.success || !body.data) {
    if (body.errorCode === DAILY_QUOTA_REACHED_CODE) triggerQuotaPrompt("pronunciation", difficulty);
    throw envelopeError(body, "Failed to load phrase");
  }
  return body.data;
}

export async function v3SubmitPronunciationAttempt(
  accessToken: string,
  args: {
    audio: Blob;
    order: number;
    difficulty: PronunciationDifficulty;
    durationMs: number;
  },
): Promise<PronunciationAttemptResult> {
  // Normalise to 16 kHz mono WAV on the device (Gemini-friendly, Safari-safe,
  // smaller). Falls back to the raw recording if the browser can't decode it.
  const audio = await toWav16k(args.audio);
  const form = new FormData();
  const ext = audio.type === "audio/wav" ? "wav" : audio.type.includes("webm") ? "webm" : "m4a";
  form.append("audio", audio, `attempt.${ext}`);
  form.append("order", String(args.order));
  form.append("difficulty", args.difficulty);
  form.append("durationMs", String(args.durationMs));

  const res = await fetch(`${API_URL}/api/pronunciation/attempts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = (await res.json()) as Envelope<PronunciationAttemptResult>;
  if (!res.ok || !body.success || !body.data) {
    throw envelopeError(body, "Failed to score attempt");
  }
  return body.data;
}

export async function v3ListPronunciationAttempts(
  accessToken: string,
  limit = 20,
): Promise<PronunciationHistoryRow[]> {
  const res = await fetch(`${API_URL}/api/pronunciation/attempts?limit=${limit}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const body = (await res.json()) as Envelope<{ attempts: PronunciationHistoryRow[] }>;
  if (!res.ok || !body.success || !body.data) {
    throw envelopeError(body, "Failed to load history");
  }
  return body.data.attempts ?? [];
}

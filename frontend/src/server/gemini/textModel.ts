import "server-only";

import { errorMessage, errorStatus, isModelMissing, ModelOutputError, withTextKey } from "./keyPool";

// When the configured model is busy (Google 503s in bursts), run the call on
// one of these instead rather than failing the learner (pronunciation scoring,
// jumble clues).
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

// Per-call timeout for text calls (pass as httpOptions.timeout). Typical calls
// take 2–9 s; the 3.x previews sometimes hang for 30 s+.
export const TEXT_CALL_TIMEOUT_MS = 15_000;

// No new attempt starts after this much time, so attempt + timeout stays under
// the API route's 60 s maxDuration (a timeout there = a non-JSON error page).
const TEXT_DEADLINE_MS = 30_000;

export async function withTextModel<T>(
  userId: string,
  primary: string,
  run: (apiKey: string, model: string) => Promise<T>,
): Promise<{ result: T; model: string }> {
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  const deadline = Date.now() + TEXT_DEADLINE_MS;
  let lastError: unknown;
  for (const model of models) {
    if (lastError && Date.now() > deadline) break;
    try {
      const { result } = await withTextKey(userId, (apiKey) => run(apiKey, model), 3, deadline);
      return { result, model };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const missing = isModelMissing(errorStatus(err), errorMessage(err));
      if (code !== "AI_MODEL_BUSY" && code !== "AI_CAPACITY_EXHAUSTED" && !missing) throw err;
      lastError = err;
      console.warn(`[gemini] ${model} unavailable for a text call (${missing ? "missing" : code}), trying the next model`);
    }
  }
  throw lastError;
}

// JSON from a structured-output call; unusable output → ModelOutputError so the
// call is retried / moved to another model instead of failing with a 500.
export function parseModelJson<T>(res: { text?: string; candidates?: { finishReason?: string }[] }): T {
  const text = res.text ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ModelOutputError(`unusable model output (finish: ${res.candidates?.[0]?.finishReason ?? "unknown"})`);
  }
}

// Learner's native language → how to ask the model to write in its script.
export const NATIVE_SCRIPTS: Record<string, string> = {
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

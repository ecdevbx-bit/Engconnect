import "server-only";

import { ThinkingLevel } from "@google/genai";

import { fail } from "../http";
import { errorMessage, errorStatus, isModelMissing, ModelOutputError, withTextKey } from "./keyPool";

// When the configured model is busy (Google 503s in bursts), run the call on
// one of these instead rather than failing the learner (pronunciation scoring,
// jumble clues). Different models get busy at different times (D-057:
// 2026-10-28 the lite models 503'd for an hour while gemini-3-flash-preview
// answered in ~5 s). gemini-2.5-flash-lite was retired by Google (404).
const FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

// The full Flash models think before answering (3–5 s); low is enough for our
// judging tasks. MINIMAL made gemini-3-flash-preview loop to its token limit.
export function thinkingFor(model: string): { thinkingConfig?: { thinkingLevel: ThinkingLevel } } {
  return /-flash(-preview)?$/.test(model) && !/lite/.test(model) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {};
}

// Per-call timeout for text calls (pass as httpOptions.timeout). Typical calls
// take 2–9 s; the 3.x previews sometimes hang for 30 s+.
export const TEXT_CALL_TIMEOUT_MS = 15_000;

// No new attempt starts after this much time, so attempt + timeout stays under
// the API route's 60 s maxDuration (a timeout there = a non-JSON error page).
const TEXT_DEADLINE_MS = 30_000;

// `hedgeMs` (latency-sensitive calls — the learner is waiting): if no answer
// has come after that long, the next model starts IN PARALLEL and the first
// good answer wins (a failure also starts the next one at once). Costs an
// extra call only on slow attempts. Without it, models are tried one by one.
export async function withTextModel<T>(
  userId: string,
  primary: string,
  run: (apiKey: string, model: string) => Promise<T>,
  opts: { hedgeMs?: number } = {},
): Promise<{ result: T; model: string }> {
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  const deadline = Date.now() + TEXT_DEADLINE_MS;
  if (opts.hedgeMs) return hedged(userId, models, run, opts.hedgeMs, deadline);
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

function isRetryable(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === "AI_MODEL_BUSY" || code === "AI_CAPACITY_EXHAUSTED" || isModelMissing(errorStatus(err), errorMessage(err));
}

function hedged<T>(
  userId: string,
  models: string[],
  run: (apiKey: string, model: string) => Promise<T>,
  hedgeMs: number,
  deadline: number,
): Promise<{ result: T; model: string }> {
  return new Promise((resolve, reject) => {
    let next = 0;
    let running = 0;
    let done = false;
    let lastError: unknown = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const launch = () => {
      if (done || next >= models.length || (next > 0 && Date.now() > deadline)) {
        if (!done && running === 0) {
          done = true;
          // Every model failed (busy, timed out, cut-off output): a retryable
          // "busy" for the learner, never a generic 500.
          console.error("[gemini] every model failed for a text call:", errorMessage(lastError).slice(0, 200));
          reject(fail.unavailable("K.AI is busy right now. Please try again in a few seconds.", "AI_MODEL_BUSY"));
        }
        return;
      }
      const model = models[next++];
      running++;
      if (timer) clearTimeout(timer);
      timer = setTimeout(launch, hedgeMs);
      withTextKey(userId, (apiKey) => run(apiKey, model), 2, deadline).then(
        ({ result }) => {
          running--;
          if (done) return;
          done = true;
          if (timer) clearTimeout(timer);
          resolve({ result, model });
        },
        (err) => {
          running--;
          if (done) return;
          // Any failure moves on to the next model; the learner is waiting.
          lastError = err;
          console.warn(`[gemini] ${model} failed for a text call (${isRetryable(err) ? "busy" : errorMessage(err).slice(0, 80)}), trying the next model`);
          launch();
        },
      );
    };
    launch();
  });
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

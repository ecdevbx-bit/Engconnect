import { getSessionId } from "./sessionId";
import { handleSessionSuperseded, SESSION_SUPERSEDED_CODE } from "./sessionSupersede";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? ""
).replace(/\/$/, "");

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface BackendErrorBody {
  success: false;
  message: string;
  errorCode: string;
  traceId?: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
}

export interface EcaiUser {
  sub: string;
  createdAt: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  nativeLang: string;
  currentStatus: string;
  englishReason: string;
  goals: string;
  hobbies: string;
  avatar: string;
  onboardingCompleted: boolean;
  // Denormalised entitlement cursor — ISO timestamp the user's paid access
  // expires. Set only by the Razorpay webhook (see backend payments.go).
  // Absent ⇒ never subscribed. Don't trust this for gating server-side; it's
  // a UI hint mirrored from the authoritative ecaiSubscription row.
  premiumUntil?: string;
}

export interface JumbleSentence {
  position: number;
  sentenceId: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "PROGRESSIVE";
  // Progressive band only: the base question id and the variant (= displayed
  // level). Both undefined for the fixed bands. The client echoes them on
  // submit/hint so the backend can rebuild the exact row key.
  progressiveBase?: number;
  progressiveLevel?: number;
  shuffledWords: string[];
}

export interface JumbleBatch {
  sentences: JumbleSentence[];
}

export interface SubmitJumbleAnswerRequest {
  sentenceId: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "PROGRESSIVE";
  // Progressive band: pin the exact row. Ignored for the fixed bands.
  base?: number;
  variant?: number;
  userAnswer: string[];
}

export interface SubmitJumbleAnswerResponse {
  correct: boolean;
  xpEarned: number;
  totalXp: number;
  currentLevel: number;
  leveledUp: boolean;
  combo?: number;
  // Earned badge IDs (e.g. "xp:1000"); excludes level cards, which the
  // leveledUp flag drives. Resolved via the frontend badge registry.
  newlyEarnedBadges?: string[];
  // True when this solve completed the LAST variant of a progressive base
  // (the player cleared the whole easy → medium → hard set). Celebrated on
  // EVERY occurrence, unlike badges. setBonusXp is the extra XP for it,
  // already included in xpEarned/totalXp. v3 only.
  progressiveSetComplete?: boolean;
  setBonusXp?: number;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public traceId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function v3Fetch<T>(
  path: string,
  idToken: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}/api${suffix}`;
  const method = init.method ?? "GET";

  const sid = getSessionId();
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        ...(sid ? { "X-Session-Id": sid } : {}),
      },
      credentials: "include",
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (err) {
    throw new ApiError(
      "NETWORK",
      `Could not reach ${url} (${err instanceof Error ? err.message : "network error"})`,
    );
  }

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(
      "BAD_RESPONSE",
      `Non-JSON response from ${suffix}: ${text.slice(0, 200)}`,
    );
  }

  if (
    !res.ok ||
    (parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as ApiEnvelope<T>).success === false)
  ) {
    const error = (parsed ?? {}) as BackendErrorBody;
    // Account was opened elsewhere — sign this device out (once).
    if (error.errorCode === SESSION_SUPERSEDED_CODE) handleSessionSuperseded();
    throw new ApiError(
      error.errorCode ?? `HTTP_${res.status}`,
      error.message ?? res.statusText,
      error.traceId,
    );
  }

  return (parsed as ApiEnvelope<T>).data as T;
}

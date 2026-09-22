// HTTP helpers for the v3 AI partner. The WebSocket itself is opened
// directly inside useV3ChatSession — it doesn't go through v3Fetch
// because browsers can't attach Authorization headers to a WS upgrade
// (auth happens via the first WS frame instead — see chat_ws.go).

import { v3Fetch } from "@/lib/apiClient";

export interface V3ChatSession {
  sessionID: string;
  sub: string;
  language: string;
  level: string;
  voice: string;
  startedAt: string;
  endedAt?: string;
}

// AIPartnerRewards mirrors the backend struct. Returned in every
// createChatSession response so the client knows max-record duration +
// threshold / interval / XP without a separate fetch.
export interface AIPartnerRewards {
  thresholdSeconds: number;
  thresholdXp: number;
  recurringIntervalSeconds: number;
  recurringXp: number;
  maxRecordingSeconds: number;
  sessionSeconds: number;
  proDailyCapSeconds: number;
  freeWeeklyCapSeconds: number;
}

export interface V3CreateSessionResponse {
  sessionID: string;
  language: string;
  level: string;
  rewards: AIPartnerRewards;
  // AI time cap for the current window (Pro: daily, free: weekly). aiUsedSeconds
  // is what's already spent before this session; aiCapSeconds the total (0 =
  // uncapped). The chat page shows used/cap and counts up from here.
  aiUsedSeconds: number;
  aiCapSeconds: number;
}

export interface V3CreateSessionRequest {
  language?: string;
  level?: string;
  voice?: string;
}

// AI-Partner time usage for the current window — backs the pre-session start
// card ("X min left"). Fetched without opening a session.
export interface V3AIUsage {
  pro: boolean;
  usedSeconds: number;
  capSeconds: number;
  remainingSeconds: number;
  // Current admin reward config, so the start card's copy matches reality.
  rewards?: AIPartnerRewards;
}

// Per-account AI Partner eligibility. This stays separate from the public
// feature-flag snapshot so a private beta can be opened for named accounts
// without exposing the feature to every signed-in learner.
export interface V3AIPartnerAccess {
  enabled: boolean;
}

// Backend errorCode when a new session is refused because the window's time is
// spent (see domain.AITimeLimitReached). The create call throws ApiError.code.
export const AI_TIME_LIMIT_REACHED_CODE = "AI_TIME_LIMIT_REACHED";
// WS close code the server sends when the cap is hit mid-session (chat_ws.go).
export const WS_CLOSE_AI_LIMIT = 4002;

export function v3CreateSession(
  accessToken: string,
  req: V3CreateSessionRequest = {},
): Promise<V3CreateSessionResponse> {
  return v3Fetch<V3CreateSessionResponse>("/chat/sessions", accessToken, {
    method: "POST",
    body: req,
  });
}

export function v3FetchAIUsage(accessToken: string): Promise<V3AIUsage> {
  return v3Fetch<V3AIUsage>("/chat/usage", accessToken);
}

export function v3FetchAIPartnerAccess(accessToken: string): Promise<V3AIPartnerAccess> {
  return v3Fetch<V3AIPartnerAccess>("/chat/access", accessToken);
}

export function v3EndSession(accessToken: string, sessionID: string): Promise<unknown> {
  return v3Fetch<unknown>(`/chat/sessions/${encodeURIComponent(sessionID)}`, accessToken, {
    method: "DELETE",
  });
}

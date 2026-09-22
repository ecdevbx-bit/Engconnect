// Wire protocol for the ai-partner WebSocket at /ws/v2/session.
// Mirrors ai-partner/backend/app/routers/ws_session.py + services/gemini_live.py.

export type ServerEvent =
  | { type: "ai_text_delta"; delta: string }
  | { type: "ai_audio_chunk"; data: string }
  | { type: "ai_turn_complete"; full_text: string; model: string; duration_sec: number }
  | { type: "error"; message: string }
  | { type: "reset_ok" };

export type ClientEvent =
  | { type: "start"; session_id: string }
  | { type: "turn"; session_id: string; user_message: string }
  | { type: "reset"; session_id: string };

export interface CreateSessionRequest {
  native_language: string;
  code_mix: boolean;
  level: "beginner" | "intermediate" | "advanced";
}

export interface CreateSessionResponse {
  session_id: string;
}

export type ChatRole = "assistant" | "user";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  time: string;
  body: string;
}

// K.AI chat history + memory (D-047). Pro learners see every past
// conversation (ChatGPT-style list → transcript), can continue one, and can see
// / clear the memory file K.AI keeps about them. The server compacts each
// finished conversation into a digest and folds it into that memory file,
// which is sent to Gemini at the start of the next session.

import { v3Fetch } from "./apiClient";

export type ChatDigestStatus = "ready" | "pending" | "skipped";

export type ChatHistoryItem = {
  id: string;
  /** Short auto title ("Planning a trip to Goa"); "" until the digest is ready. */
  title: string;
  summary: string;
  startedAt: string;
  endedAt: string | null;
  /** Billed talk minutes, one decimal. */
  minutes: number;
  /** Learner + K.AI lines saved for this conversation. */
  turns: number;
  /** Practice mode ("General Conversation", "IELTS / TOEFL Speaking", …). */
  mode: string;
  language: string;
  level: string;
  status: "active" | "ended";
  digest: ChatDigestStatus;
};

export type ChatHistoryPage = {
  /** true for non-Pro learners: sessions is empty, total says how many are saved. */
  locked: boolean;
  total: number;
  sessions: ChatHistoryItem[];
  /** Pass as `before` to load older conversations; null when there are no more. */
  nextBefore: string | null;
};

export type ChatDigest = {
  summary: string;
  topics: string[];
  /** Things the learner shared about themselves (job, plans, family…). */
  facts: string[];
  mistakes: { wrong: string; correct: string; why: string }[];
  vocabulary: { word: string; meaning: string }[];
  /** One suggestion for the next conversation. */
  nextTime: string;
};

export type ChatTranscriptLine = { role: "user" | "assistant"; text: string; at: string };

export type ChatHistoryDetail = {
  session: ChatHistoryItem;
  messages: ChatTranscriptLine[];
  digest: ChatDigest | null;
};

export type KaiMemory = {
  pro: boolean;
  /** The compacted memory file (Markdown) — Pro only, "" otherwise or before the first digest. */
  memoryMd: string;
  updatedAt: string | null;
  /** Conversations folded into memory so far. */
  sessions: number;
  mistakes: { wrong: string; correct: string; why?: string; count?: number }[];
  vocabulary: { word: string; meaning?: string }[];
};

/** Errors: non-Pro detail requests throw ApiError with code "PRO_REQUIRED". */
export const PRO_REQUIRED_CODE = "PRO_REQUIRED";

export function v3FetchChatHistory(
  accessToken: string,
  opts: { limit?: number; before?: string | null } = {},
): Promise<ChatHistoryPage> {
  const qs = new URLSearchParams();
  if (opts.limit) qs.set("limit", String(opts.limit));
  if (opts.before) qs.set("before", opts.before);
  const q = qs.toString();
  return v3Fetch<ChatHistoryPage>(`/chat/history${q ? `?${q}` : ""}`, accessToken);
}

export function v3FetchChatHistoryDetail(accessToken: string, id: string): Promise<ChatHistoryDetail> {
  return v3Fetch<ChatHistoryDetail>(`/chat/history/${encodeURIComponent(id)}`, accessToken);
}

export function v3DeleteChat(accessToken: string, id: string): Promise<{ deleted: boolean }> {
  return v3Fetch<{ deleted: boolean }>(`/chat/history/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

export function v3FetchKaiMemory(accessToken: string): Promise<KaiMemory> {
  return v3Fetch<KaiMemory>("/chat/memory", accessToken);
}

export function v3ClearKaiMemory(accessToken: string): Promise<{ cleared: boolean }> {
  return v3Fetch<{ cleared: boolean }>("/chat/memory", accessToken, { method: "DELETE" });
}

/** Link that starts a new K.AI session continuing a past conversation (Pro). */
export function continueChatHref(id: string): string {
  return `/dashboard/ai-partner?continue=${encodeURIComponent(id)}`;
}

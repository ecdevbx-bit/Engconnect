import { readJsonSafe } from "./apiClient";
import { freshAccessToken } from "./freshToken";
import { getSessionId } from "./sessionId";
import { handleSessionSuperseded, SESSION_SUPERSEDED_CODE } from "./sessionSupersede";

// Word Bank API client. Mirrors the v3Game.ts convention: NEXT_PUBLIC_API_URL
// is the origin (routes live under /api), a Bearer access token authenticates,
// and the single-active-session X-Session-Id header rides along.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function sessionHeaders(): Record<string, string> {
  const sid = getSessionId();
  return sid ? { "X-Session-Id": sid } : {};
}

type Envelope<T> = { success: boolean; message: string; data?: T; errorCode?: string };

export type WordBankEntry = {
  word: string;
  source: string; // "manual" | "pronunciation"
  createdAt: string;
};

async function request<T>(path: string, accessToken: string, init: RequestInit): Promise<T> {
  const send = (token: string) =>
    fetch(`${API_URL}/api/word-bank${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...sessionHeaders(),
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  let res = await send(accessToken);
  if (res.status === 401) {
    const fresh = await freshAccessToken(accessToken);
    if (fresh) res = await send(fresh);
  }
  const body = await readJsonSafe<Envelope<T>>(res);
  if (!res.ok || !body.success) {
    if (body.errorCode === SESSION_SUPERSEDED_CODE) handleSessionSuperseded();
    throw new Error(body.message ?? `word-bank ${init.method ?? "GET"} ${path} failed`);
  }
  return body.data as T;
}

export async function fetchWordBank(accessToken: string): Promise<WordBankEntry[]> {
  const data = await request<{ words: WordBankEntry[] }>("/", accessToken, { method: "GET" });
  return data.words ?? [];
}

export type AddWordResult = { word: WordBankEntry; added: boolean };

export async function addWord(
  accessToken: string,
  word: string,
  source: "manual" | "pronunciation" = "manual",
): Promise<AddWordResult> {
  return request<AddWordResult>("/", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, source }),
  });
}

export async function deleteWord(accessToken: string, word: string): Promise<void> {
  await request<unknown>(`/${encodeURIComponent(word)}`, accessToken, { method: "DELETE" });
}

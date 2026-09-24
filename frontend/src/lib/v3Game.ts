// v3 game API helpers. Parallel to fetchJumbleWordsBatch/submitJumbleAnswer
// in lib/apiClient.ts (which talk to /api/v1 with a Firebase ID token).
//
// The v3 backend uses `order` as the per-problem identifier (it's the
// natural key in ecaiProblems). The wrappers below translate to/from the
// existing `sentenceId` field name the jumble UI already speaks, so
// MainLayout.tsx only has to branch on the flag — no field renaming
// downstream.

import { ApiError, v3Fetch, type JumbleBatch, type SubmitJumbleAnswerRequest, type SubmitJumbleAnswerResponse } from "./apiClient";
import { DAILY_QUOTA_REACHED_CODE, difficultyFromPath, gameFromPath, QuotaReachedError, triggerQuotaPrompt } from "./quotaPrompt";


type V3Sentence = {
  position: number;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "PROGRESSIVE" | string;
  progressiveBase?: number;
  progressiveLevel?: number;
  shuffledWords: string[];
};

type V3BatchResponse = { sentences: V3Sentence[] };

// Through v3Fetch: non-JSON error pages, an expired token (refresh + retry)
// and "signed in elsewhere" are handled there; the daily-quota prompt here.
async function v3Call<T>(path: string, accessToken: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  try {
    return await v3Fetch<T>(path, accessToken, init);
  } catch (err) {
    if (err instanceof ApiError && err.code === DAILY_QUOTA_REACHED_CODE) {
      const game = gameFromPath(path);
      const difficulty = difficultyFromPath(path);
      triggerQuotaPrompt(game, difficulty);
      throw new QuotaReachedError(err.message || "Daily limit reached", game, difficulty);
    }
    throw err;
  }
}

const v3Get = <T,>(path: string, accessToken: string) => v3Call<T>(path, accessToken);
const v3Post = <T,>(path: string, accessToken: string, payload: unknown) =>
  v3Call<T>(path, accessToken, { method: "POST", body: payload });

// Normalise difficulty casing to match the v1 wire shape the UI expects.
function upperDifficulty(d: string): "EASY" | "MEDIUM" | "HARD" | "PROGRESSIVE" {
  const upper = d.toUpperCase();
  if (upper === "EASY" || upper === "MEDIUM" || upper === "HARD" || upper === "PROGRESSIVE") return upper;
  // Fall back to EASY for unknown values rather than throwing — keeps the
  // UI rendering even if the backend ever adds a difficulty we haven't
  // taught the frontend about yet.
  return "EASY";
}

// Difficulty is player-chosen — the backend serves a batch entirely at the
// requested difficulty (defaults to easy server-side if omitted). "PROGRESSIVE"
// is a cyclical band whose problems escalate #1 → #2 → #3 → #1 …
export type JumbleDifficulty = "EASY" | "MEDIUM" | "HARD" | "PROGRESSIVE";

export async function v3FetchJumbleBatch(
  accessToken: string,
  difficulty: JumbleDifficulty = "EASY",
): Promise<JumbleBatch> {
  const data = await v3Get<V3BatchResponse>(
    `/game/jumble/batch?difficulty=${difficulty.toLowerCase()}`,
    accessToken,
  );
  return {
    sentences: data.sentences.map((s) => ({
      position: s.position,
      sentenceId: s.order, // v3 uses `order` natively; map to the UI's existing field name
      difficulty: upperDifficulty(s.difficulty),
      progressiveBase: s.progressiveBase,
      progressiveLevel: s.progressiveLevel,
      shuffledWords: s.shuffledWords,
    })),
  };
}

// ─── Jumble hint ───────────────────────────────────────────────────────────
// Progressive hint for a stuck player. The server reveals only the words for
// the requested level — hidden words arrive as a bare `length` (for sizing a
// blank), never their text. `full` is present ONLY at level 3, when the player
// explicitly asked to see the whole sentence.
export type V3JumbleHintWord = { word?: string; length: number; revealed: boolean };
export type V3JumbleHint = { level: number; words: V3JumbleHintWord[]; full?: string };

export async function v3FetchJumbleHint(
  accessToken: string,
  params: { order: number; difficulty: string; level: number; base?: number; variant?: number },
): Promise<V3JumbleHint> {
  const qp: Record<string, string> = {
    order: String(params.order),
    difficulty: params.difficulty.toLowerCase(),
    level: String(params.level),
  };
  // Progressive rows are keyed by base+variant, not a single order.
  if (params.base != null) qp.base = String(params.base);
  if (params.variant != null) qp.variant = String(params.variant);
  const qs = new URLSearchParams(qp).toString();
  return v3Get<V3JumbleHint>(`/game/jumble/hint?${qs}`, accessToken);
}

// Structure clue — the first hint (D-043): sentence type, tense, building
// blocks in order and the meaning in the learner's own language. Reveals no
// word positions.
export type V3JumbleClue = {
  kind: "statement" | "question" | "negative" | "command" | "exclamation";
  tense: string;
  pattern: string[];
  clue: string;
  meaning: string;
  meaningLang: string;
  source: "ai" | "basic";
};

export async function v3FetchJumbleClue(
  accessToken: string,
  params: { order: number; difficulty: string; base?: number; variant?: number },
): Promise<V3JumbleClue> {
  const qp: Record<string, string> = { order: String(params.order), difficulty: params.difficulty.toLowerCase() };
  if (params.base != null) qp.base = String(params.base);
  if (params.variant != null) qp.variant = String(params.variant);
  return v3Get<V3JumbleClue>(`/game/jumble/clue?${new URLSearchParams(qp).toString()}`, accessToken);
}

export type V3UserAttributes = {
  sub: string;
  xp: number;
  currentLevel: number;
  activityStreak: number;
  streak: number;
  badges: string[];
  cursors: Record<string, number>;
  combos: Record<string, number>;
  createdAt: string;
};

export type V3MeProfile = {
  sub: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  nativeLang: string;
  currentStatus: string;
  englishReason: string;
  goals: string;
  hobbies: string;
  // "<style>:<seed>" — e.g. "notionists:Felix-xy3". Empty when not set.
  avatar: string;
  createdAt: string;
  // Entitlement cursor: ISO timestamp until which Pro is active. Absent/empty
  // for free users (backend uses omitempty). Pro = this is in the future.
  premiumUntil?: string;
};

// Avatar styles we offer in the picker. The backend's regex allow-list
// must match — see internal/apiv3/users.go.
export const AVATAR_STYLES = ["notionists", "pixel-art", "lorelei", "dylan"] as const;
export type AvatarStyle = (typeof AVATAR_STYLES)[number];

// DiceBear base URL — the public CDN by default, swap to a self-hosted
// instance by setting NEXT_PUBLIC_DICEBEAR_BASE_URL in Doppler.
//
// Self-host migration: deploy https://github.com/dicebear/dicebear behind
// a domain you control, set NEXT_PUBLIC_DICEBEAR_BASE_URL=https://your-dicebear-host,
// restart the frontend. Backend / Lambda need no changes — they only ever
// store the "<style>:<seed>" string; URL construction lives here.
const DICEBEAR_BASE_URL = (process.env.NEXT_PUBLIC_DICEBEAR_BASE_URL ?? "https://api.dicebear.com").replace(/\/$/, "");

// avatarUrl resolves "<style>:<seed>" into the DiceBear SVG URL.
// Returns null for empty/invalid — caller should fall back to initials.
export function avatarUrl(avatar: string | undefined | null, size = 96): string | null {
  if (!avatar) return null;
  const idx = avatar.indexOf(":");
  if (idx <= 0) return null;
  const style = avatar.slice(0, idx);
  const seed = avatar.slice(idx + 1);
  if (!style || !seed) return null;
  // `size` is a render hint for raster formats; for SVG it sets the
  // intrinsic dimensions on the served file. Set it so DiceBear-CDN
  // (or the self-hosted instance) can cache one variant per size.
  return `${DICEBEAR_BASE_URL}/9.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

// v3FetchMyProfile loads the signed-in user's ecaiUser identity row
// (name, email, location, onboarding answers, avatar). XP / level / streaks
// live on the attributes row — see v3FetchMyAttributes.
export async function v3FetchMyProfile(accessToken: string): Promise<V3MeProfile> {
  return v3Get<V3MeProfile>("/users/me", accessToken);
}

// v3PatchMyProfile updates one or more fields on the user's ecaiUser
// row. Only fields present in `patch` are touched — others stay as-is.
// On success the backend also updates its in-memory leaderboard cache
// so the new name appears immediately.
export async function v3PatchMyProfile(
  accessToken: string,
  patch: Partial<Pick<V3MeProfile, "name" | "phone" | "location" | "nativeLang" | "currentStatus" | "englishReason" | "goals" | "hobbies" | "avatar">>,
): Promise<V3MeProfile> {
  return v3Call<V3MeProfile>("/users/me", accessToken, { method: "PATCH", body: patch });
}

// ─── Levels ──────────────────────────────────────────────────────────────

export type V3Level = {
  level: number;
  threshold: number;
  title: string;
  icon: string;
};

// v3FetchLevels reads the level catalog. Cognito-authed because the
// endpoint is meant for signed-in users only — the popover uses it.
export async function v3FetchLevels(accessToken: string): Promise<V3Level[]> {
  return v3Get<V3Level[]>("/levels", accessToken);
}

// v3PutLevels saves the entire level list (whole-list replacement).
// Admin-only; called from the server action with INTERNAL_API_KEY.
// Returns the saved (and re-numbered) list.
export async function v3PutLevels(
  internalApiKey: string,
  apiUrl: string,
  levels: V3Level[],
): Promise<V3Level[]> {
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/admin/levels`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalApiKey,
    },
    body: JSON.stringify({ levels }),
  });
  const body = (await res.json()) as { success: boolean; message: string; data?: V3Level[] };
  if (!res.ok || !body.success) throw new Error(body.message ?? "Save failed");
  return body.data ?? [];
}

// v3FetchMyAttributes pulls the authoritative hot-state row for the
// signed-in user. The session's XP/level are stale (set once at signup
// and never refreshed), so anything that needs current values reads
// this on load and on demand.
export async function v3FetchMyAttributes(accessToken: string): Promise<V3UserAttributes> {
  return v3Get<V3UserAttributes>("/users/me/attributes", accessToken);
}

// v3FetchMyBadges returns the user's earned badge IDs (e.g. "xp:1000",
// "lvl:3", "combo:jumble:10"). Presentation is the frontend registry's job —
// resolve each ID through src/lib/badges + BadgeArt. Empty when none yet.
// v1 of this type carried an `xp` field; the response now keys the
// metric value as `value` (same shape for the XP and streak boards)
// with the metric name on the envelope. Components render the label
// for the value based on the active mode rather than the field name.
export type V3LeaderboardEntry = {
  rank: number;
  sub: string;
  name: string;
  avatar?: string;
  value: number;
};

// V3LeaderboardMode is the toggle the UI exposes (xp/streak — the
// cumulative all-time boards). V3LeaderboardMetric is the wider set
// accepted by the API — adds "weekly" (the current-ISO-week XP board)
// which the page fetches independently of the UI toggle.
export type V3LeaderboardMode = "xp" | "streak";
export type V3LeaderboardMetric = V3LeaderboardMode | "weekly";

// Free users aren't ranked on the board (Pro-only, to save Redis compute);
// instead the API returns an estimated standing computed from the population
// XP distribution. Present only for free users on the XP board; Pro users get
// `me` (exact rank) instead.
export type V3LeaderboardEstimate = {
  band: string; // e.g. "Top 25%"; "" when below the median
  approxRankFrom: number;
  approxRankTo: number;
  totalLearners: number;
};

export type V3LeaderboardResponse = {
  metric: V3LeaderboardMetric;
  total: number;
  top?: V3LeaderboardEntry[];
  me: { rank: number; entries: V3LeaderboardEntry[] } | null;
  estimate?: V3LeaderboardEstimate | null;
};

// v3FetchLeaderboard returns whatever slice the caller asks for. The
// popover uses `meRadius=4`, the full page uses `meRadius=8&top=10`.
// `mode` defaults to XP — backend also defaults there for back-compat.
export async function v3FetchLeaderboard(
  accessToken: string,
  opts: { mode?: V3LeaderboardMetric; meRadius?: number; top?: number } = {},
): Promise<V3LeaderboardResponse> {
  const params = new URLSearchParams();
  if (opts.mode) params.set("mode", opts.mode);
  if (opts.meRadius !== undefined) params.set("meRadius", String(opts.meRadius));
  if (opts.top !== undefined) params.set("top", String(opts.top));
  const qs = params.toString();
  return v3Get<V3LeaderboardResponse>(
    `/leaderboard${qs ? `?${qs}` : ""}`,
    accessToken,
  );
}

export type V3Activity = {
  sub: string;
  category: string;     // "jumble" today; future categories: "pronunciation" etc.
  difficulty: string;   // "easy" | "medium" | "hard"
  problemOrder: number;
  xpEarned: number;
  timestamp: string;    // RFC 3339
};

// v3FetchMyActivity returns the most-recent N activity rows newest-first.
export async function v3FetchMyActivity(accessToken: string, limit = 20): Promise<V3Activity[]> {
  const data = await v3Get<V3Activity[] | null>(`/users/me/activity?limit=${limit}`, accessToken);
  return data ?? [];
}

export async function v3FetchMyBadges(accessToken: string): Promise<string[]> {
  const data = await v3Get<string[] | null>("/users/me/badges", accessToken);
  return data ?? [];
}

export async function v3SubmitJumbleAnswer(
  accessToken: string,
  request: SubmitJumbleAnswerRequest,
): Promise<SubmitJumbleAnswerResponse> {
  return v3Post<SubmitJumbleAnswerResponse>("/game/jumble/submit", accessToken, {
    order: request.sentenceId, // sentenceId on the UI is the problem's `order` on v3
    difficulty: request.difficulty.toLowerCase(),
    base: request.base, // progressive only; undefined for fixed bands
    variant: request.variant,
    userAnswer: request.userAnswer,
  });
}

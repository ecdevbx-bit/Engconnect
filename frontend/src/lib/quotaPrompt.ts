// Global "free daily quota reached → Go Pro" trigger. The API helpers call
// triggerQuotaPrompt() when the backend returns errorCode DAILY_QUOTA_REACHED;
// the app-wide <GoPremiumRoot> registers a listener that (mobile) slides up a
// bottom sheet or (desktop) opens a modal with the feature's Pro card. Module-
// level so the fetch helpers don't need React context (same shape as
// sessionSupersede.ts).

export const DAILY_QUOTA_REACHED_CODE = "DAILY_QUOTA_REACHED";

export type QuotaGame = "jumble" | "pronunciation" | "ai" | "leaderboard";

// Thrown by the API helpers on a DAILY_QUOTA_REACHED response so a caller (e.g.
// the jumble page) can render a "switch difficulty / go Pro" state instead of a
// generic error. Still an Error subclass, so existing `err.message` handling
// keeps working.
export class QuotaReachedError extends Error {
  game?: QuotaGame;
  difficulty?: string;
  constructor(message: string, game?: QuotaGame, difficulty?: string) {
    super(message);
    this.name = "QuotaReachedError";
    this.game = game;
    this.difficulty = difficulty;
  }
}

// The difficulties each game has free-quota for — used to work out which ones
// are still available when one is exhausted.
export const GAME_DIFFICULTIES: Record<string, string[]> = {
  jumble: ["easy", "medium", "hard", "progressive"],
  pronunciation: ["easy", "medium", "hard"],
};

// Difficulties we've seen return DAILY_QUOTA_REACHED this session, per game.
// In-memory only: it resets on reload (then self-corrects as the user retries),
// which is a fine tradeoff for avoiding a server round-trip.
const exhausted = new Map<string, Set<string>>();

// Subscribers (React stores) notified when the exhausted set changes, so
// difficulty selectors can light up a "done today" indicator live.
const subscribers = new Set<() => void>();

export function subscribeExhausted(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

function markExhausted(game: string, difficulty?: string) {
  if (!difficulty) return;
  const set = exhausted.get(game) ?? new Set<string>();
  if (set.has(difficulty)) return; // already known — no change, no notify
  set.add(difficulty);
  exhausted.set(game, set);
  subscribers.forEach((fn) => fn());
}

// remainingDifficulties returns the game's difficulties NOT yet seen exhausted
// this session — i.e. the ones to suggest the user tries instead.
export function remainingDifficulties(game: string): string[] {
  const used = exhausted.get(game) ?? new Set<string>();
  return (GAME_DIFFICULTIES[game] ?? []).filter((d) => !used.has(d));
}

export function exhaustedDifficulties(game: string): string[] {
  return Array.from(exhausted.get(game) ?? []);
}

export type QuotaPromptDetail = { game?: QuotaGame; difficulty?: string };

type Listener = (detail: QuotaPromptDetail) => void;

let listener: Listener | null = null;

export function registerQuotaPromptListener(fn: Listener | null): void {
  listener = fn;
}

export function triggerQuotaPrompt(game?: QuotaGame, difficulty?: string): void {
  if (typeof window === "undefined") return;
  if (game) markExhausted(game, difficulty);
  listener?.({ game, difficulty });
}

// Infer which game from an API path so the prompt can tailor its headline.
export function gameFromPath(path: string): QuotaGame | undefined {
  if (path.includes("jumble")) return "jumble";
  if (path.includes("pronunciation")) return "pronunciation";
  return undefined;
}

// Pull the `difficulty` query value out of an API path, if present.
export function difficultyFromPath(path: string): string | undefined {
  const m = path.match(/[?&]difficulty=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

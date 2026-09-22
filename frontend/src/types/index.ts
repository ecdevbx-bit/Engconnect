// ─── Difficulty & Sentences ───────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

export interface Sentence {
  id: string;
  text: string;
  difficulty: Difficulty;
}

// ─── Game Session ─────────────────────────────────────────────────────────────

export type SessionSlot = Difficulty;
export const SESSION_FLOW: Difficulty[] = ["easy", "medium", "easy", "medium", "easy", "hard"];

export interface WordTile {
  id: string;
  word: string;
}

export type GameStatus = "idle" | "playing" | "correct" | "wrong" | "completed";

export interface GameSession {
  currentSlotIndex: number;
  usedSentenceIds: string[];
  currentSentence: Sentence | null;
  scrambledWords: WordTile[];
  arrangedWords: WordTile[];
  status: GameStatus;
  sessionComplete: boolean;
  // Hint flow — counts consecutive wrong guesses on the *current* sentence.
  // After 3, the AI partner offers a hint. hintLevel: 0 none · 1 first+last
  // word · 2 also second+second-last word · 3 full sentence. All three reset
  // whenever a new sentence loads or the session advances/resets.
  consecutiveWrong: number;
  hintLevel: number;
  hintPromptVisible: boolean;
}

// ─── XP & Levels ─────────────────────────────────────────────────────────────

export interface XPState {
  totalXP: number;
  currentLevel: number;
  // Per-category consecutive-correct counter. Persists across rounds
  // and page loads. Keyed by game category ("jumble", "pronunciation",
  // …). Increment on correct, reset to 0 on wrong.
  combos: Record<string, number>;
  // Level catalog — admin-editable on the backend. The frontend
  // mirrors the latest catalog into Redux so the popover and any
  // derived UI (rank, next-level XP) all read from one place.
  levels: Array<{ level: number; threshold: number; title: string; icon: string }>;
  // Set to the new level number when a gameplay submit reports a level-up,
  // so a single root-level celebration can fire from anywhere. null when no
  // celebration is pending. Driven by the backend `leveledUp` flag (never set
  // on login restore), so it can't misfire when state is hydrated.
  levelUpTo: number | null;
  // FIFO queue of badge IDs awaiting their full-screen award celebration.
  // Enqueued from gameplay handlers (non-level badges only); drained one at a
  // time by BadgeCelebrationRoot.
  badgeQueue: string[];
}

export const XP_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 25,
};

// Index = level (1-indexed; index 0 unused), value = total XP required
export const LEVEL_THRESHOLDS: number[] = [0, 0, 100, 250, 500, 850, 1300, 1900, 2700, 3700, 5000];

export const MAX_LEVEL = 10;

export const LEVEL_LABELS: Record<number, string> = {
  0:  "Starter",
  1:  "Beginner",
  2:  "Explorer",
  3:  "Achiever",
  4:  "Learner",
  5:  "Intermediate",
  6:  "Conversant",
  7:  "Fluent",
  8:  "Proficient",
  9:  "Advanced",
  10: "Master",
};

// Max XP from one full jumble session: 3×10 + 2×15 + 1×25 = 85
export const MAX_GAME_XP = 85;

// ─── User Profile ─────────────────────────────────────────────────────────────

export type UserStatus = "school" | "college" | "working";

export interface UserProfile {
  name: string;
  location: string;
  hobbies: string;
  goals: string;
  currentStatus: UserStatus;
  nativeLang: string;
  phone: string;
  email: string;
  englishReason: string;
  xp: number;
  level: number;
}

// ─── Backend Data ─────────────────────────────────────────────────────────────
// Mirrors UserResponseDto returned by POST /api/auth/sync.
// Keep this type in lockstep with englishconnection/backend UserResponseDto.java.

export type BackendUserRole = "ADMIN" | "STUDENT";

export interface BackendUserData {
  id: number;
  name: string;
  email: string;
  role: BackendUserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  totalXp: number;
  currentLevel: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Pronunciation Coach ─────────────────────────────────────────────────────

export type WordStatus = "CORRECT" | "INCORRECT" | "UNCLEAR" | "NOT_HEARD";

export interface PronunciationWordResult {
  expected: string;
  transcribed: string;
  status: WordStatus;
  reason: string;
  similarity: string;
  confidence: string;
}

export interface PronunciationAnalysisResult {
  transcript: string;
  words: PronunciationWordResult[];
  score: {
    correct: number;
    incorrect: number;
    unclear: number;
    notHeard: number;
    total: number;
    accuracy: number;
  };
  coachAudio: string | null;
  feedbackText: string;
}

export const PRONOUN_XP_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 20,
  medium: 30,
  hard: 40,
};

export const PRONOUN_SESSION_SIZE = 3;

export const MIC_AUTO_STOP_SECONDS: Record<Difficulty, number> = {
  easy: 5,
  medium: 8,
  hard: 10,
};

export const MIC_AUTO_START_SECONDS = 5;

// ─── Signup Flow ──────────────────────────────────────────────────────────────

export type SignupEntryPoint = "direct" | "jumble-words" | "ai-partner" | "pronoun-coach";

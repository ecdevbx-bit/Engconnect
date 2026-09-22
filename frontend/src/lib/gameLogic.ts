import { Sentence, Difficulty, WordTile, SESSION_FLOW } from "@/types";
import { ALL_SENTENCES } from "@/data/sentences";

export const SESSION_SIZE = 6;

// [easy%, medium%, hard%] per level range
const DIFFICULTY_WEIGHTS: Record<string, [number, number, number]> = {
  "1-2":  [100,  0,  0],
  "3-5":  [ 50, 40, 10],
  "6-7":  [ 30, 40, 30],
  "8-10": [ 10, 40, 50],
};

function levelToWeightKey(level: number): string {
  if (level <= 2) return "1-2";
  if (level <= 5) return "3-5";
  if (level <= 7) return "6-7";
  return "8-10";
}

export function generateSessionFlow(level: number): Difficulty[] {
  const [eW, mW] = DIFFICULTY_WEIGHTS[levelToWeightKey(level)];
  return Array.from({ length: SESSION_SIZE }, () => {
    const roll = Math.random() * 100;
    if (roll < eW) return "easy" as Difficulty;
    if (roll < eW + mW) return "medium" as Difficulty;
    return "hard" as Difficulty;
  });
}

export function pickRandomSentence(
  difficulty: Difficulty,
  usedIds: string[]
): Sentence | null {
  const pool = ALL_SENTENCES[difficulty].filter((s) => !usedIds.includes(s.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function scrambleSentence(sentence: Sentence): WordTile[] {
  const words = sentence.text.split(" ");
  const tiles: WordTile[] = words.map((word, idx) => ({
    id: `${sentence.id}-w${idx}`,
    word,
  }));
  return shuffle(tiles);
}

export function checkArrangement(arranged: WordTile[], sentence: Sentence): boolean {
  const original = sentence.text.split(" ");
  if (arranged.length !== original.length) return false;
  return arranged.every((tile, i) => tile.word === original[i]);
}

export interface HintWord {
  word: string;
  revealed: boolean;
}

// Build the masked word list for a progressive hint.
//   level 1 → reveal the first & last word
//   level 2 → also reveal the second & second-to-last word
//   level 3 → reveal everything
// Uses the same split as checkArrangement so the words line up with
// the game tiles. Safe on short sentences (overlapping indices just collapse).
export function buildSentenceHint(sentence: Sentence, level: number): HintWord[] {
  const words = sentence.text.split(" ");
  const n = words.length;
  const reveal = new Set<number>();
  if (level >= 1) { reveal.add(0); reveal.add(n - 1); }
  if (level >= 2) { reveal.add(1); reveal.add(n - 2); }
  if (level >= 3) { words.forEach((_, i) => reveal.add(i)); }
  return words.map((word, i) => ({ word, revealed: reveal.has(i) }));
}

export function difficultyForSlot(slotIndex: number): Difficulty {
  return SESSION_FLOW[slotIndex];
}

export function adaptServerSentences(
  items: Array<{ id: number; text: string; difficulty: string }>
): Sentence[] {
  return items.map((s) => ({
    id: String(s.id),
    text: s.text,
    difficulty: s.difficulty as Difficulty,
  }));
}

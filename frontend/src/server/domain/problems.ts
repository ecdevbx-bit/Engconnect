import "server-only";

import { db, must } from "../supabase";

export type ProblemRow = {
  id: number;
  category: "jumble" | "pronunciation";
  difficulty: "easy" | "medium" | "hard" | "progressive";
  sort_order: number;
  base: number | null;
  variant: number | null;
  initial: string;
  final: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export const DIFFICULTIES = ["easy", "medium", "hard", "progressive"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export function parseDifficulty(v: string | null | undefined, allowProgressive = true): Difficulty {
  const d = (v ?? "").toLowerCase().trim();
  if (d === "medium" || d === "hard" || d === "easy") return d;
  if (d === "progressive" && allowProgressive) return d;
  return "easy";
}

// Active problems for one band in serve order. Progressive is ordered by
// base then variant so a set is always served easy → medium → hard.
export async function activeProblems(category: string, difficulty: Difficulty): Promise<ProblemRow[]> {
  let q = db()
    .from("problems")
    .select("*")
    .eq("category", category)
    .eq("difficulty", difficulty)
    .eq("active", true);
  q = difficulty === "progressive" ? q.order("base").order("variant") : q.order("sort_order");
  return must(await q, "load problems") as ProblemRow[];
}

export async function findProblem(args: {
  category: string;
  difficulty: Difficulty;
  order?: number;
  base?: number;
  variant?: number;
}): Promise<ProblemRow | null> {
  let q = db().from("problems").select("*").eq("category", args.category).eq("difficulty", args.difficulty);
  if (args.difficulty === "progressive" && args.base != null && args.variant != null) {
    q = q.eq("base", args.base).eq("variant", args.variant);
  } else {
    q = q.eq("sort_order", args.order ?? -1);
  }
  return (must(await q.maybeSingle(), "find problem") as ProblemRow | null) ?? null;
}

// Tokens exactly as the learner must arrange them (capitals + punctuation kept).
export function tokens(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((x, i) => x === sb[i]);
}

// Serve-time scramble. Uses the admin's hand-made `initial` when it's a valid
// permutation of the answer; otherwise shuffles, never returning the answer
// itself (unless every permutation IS the answer, e.g. one word).
export function scramble(p: Pick<ProblemRow, "initial" | "final">): string[] {
  const answer = tokens(p.final);
  const manual = tokens(p.initial);
  if (manual.length && sameMultiset(manual, answer) && manual.join(" ") !== answer.join(" ")) return manual;
  if (new Set(answer).size <= 1) return answer;
  for (let attempt = 0; attempt < 8; attempt++) {
    const out = [...answer];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.join(" ") !== answer.join(" ")) return out;
  }
  return [...answer].reverse();
}

// Record that a learner was paid for a problem today. Returns false when they
// were already paid (replayed submit / re-solve on the same IST day).
export async function claimDailyReward(userId: string, problemId: number, xp: number): Promise<boolean> {
  const { data, error } = await db()
    .from("problem_rewards")
    .upsert({ user_id: userId, problem_id: problemId, xp }, { onConflict: "user_id,problem_id,day", ignoreDuplicates: true })
    .select("problem_id");
  if (error) throw new Error(`claim reward: ${error.message}`);
  return (data ?? []).length > 0;
}

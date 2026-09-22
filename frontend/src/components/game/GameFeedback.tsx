"use client";

import { GameStatus, XP_PER_DIFFICULTY, Difficulty } from "@/types";

interface GameFeedbackProps {
  status: GameStatus;
  difficulty: Difficulty;
}

export function GameFeedback({ status, difficulty }: GameFeedbackProps) {
  if (status === "correct") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-cyan/10 border border-cyan/20 px-5 py-3 text-cyan">
        <span className="text-lg">🎉</span>
        <span className="font-semibold text-sm">
          Correct! +{XP_PER_DIFFICULTY[difficulty]} XP earned
        </span>
      </div>
    );
  }
  if (status === "wrong") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-pink/10 border border-pink/20 px-5 py-3 text-pink">
        <span className="text-lg">🔄</span>
        <span className="font-medium text-sm">Not quite — try rearranging the words.</span>
      </div>
    );
  }
  return null;
}

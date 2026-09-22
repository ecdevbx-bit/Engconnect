"use client";

import { Button } from "@/components/ui/button";
import { GameStatus } from "@/types";

interface GameActionsProps {
  status: GameStatus;
  isLastSlot: boolean;
  hasArrangedWords: boolean;
  onCheck: () => void;
  onTryAgain: () => void;
  onNext: () => void;
}

export function GameActions({
  status,
  isLastSlot,
  hasArrangedWords,
  onCheck,
  onTryAgain,
  onNext,
}: GameActionsProps) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {status === "playing" && (
        <Button
          onClick={onCheck}
          disabled={!hasArrangedWords}
          className="w-full rounded-full"
        >
          ✓ Check Answer
        </Button>
      )}
      {status === "wrong" && (
        <Button
          onClick={onTryAgain}
          variant="secondary"
          className="w-full rounded-full"
        >
          Try Again
        </Button>
      )}
      {status === "correct" && (
        <Button
          onClick={onNext}
          className="w-full rounded-full"
        >
          {isLastSlot ? "Finish Session →" : "Next Sentence →"}
        </Button>
      )}
    </div>
  );
}

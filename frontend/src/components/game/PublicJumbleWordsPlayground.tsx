"use client";

/**
 * PublicJumbleWordsPlayground — unprotected, used at /game/jumble-words
 *
 * No backend calls. Uses local sentence pool and fixed SESSION_FLOW.
 * On completion, prompts user to sign up to save progress.
 */

import { useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loadSentence,
  moveToArranged,
  moveToScrambled,
  reorderArranged,
  setStatus,
  registerWrongGuess,
  requestHint,
  dismissHintPrompt,
  advanceSlot,
  resetSession,
} from "@/store/slices/gameSlice";
import { addXP } from "@/store/slices/xpSlice";
import { setPendingXP, setSignupEntryPoint } from "@/store/slices/userSlice";
import {
  checkArrangement,
  pickRandomSentence,
  SESSION_SIZE,
} from "@/lib/gameLogic";
import { SESSION_FLOW, Difficulty, XP_PER_DIFFICULTY } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WordPool } from "./WordPool";
import { SentenceZone } from "./SentenceZone";
import { GameFeedback } from "./GameFeedback";
import { GameActions } from "./GameActions";
import { HintPanel } from "./HintPanel";
import { SessionCompleteCard } from "./SessionCompleteCard";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_BADGE_CLASSES: Record<Difficulty, string> = {
  easy: "bg-cyan/10 text-cyan border-cyan/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  hard: "bg-pink/10 text-pink border-pink/20",
};

function GameBoard({
  slotLabel,
  currentDifficulty,
  onQuit,
  onCheck,
  onTryAgain,
  onNext,
}: {
  slotLabel: string;
  currentDifficulty: Difficulty;
  onQuit: () => void;
  onCheck: () => void;
  onTryAgain: () => void;
  onNext: () => void;
}) {
  const dispatch = useAppDispatch();
  const game = useAppSelector((s) => s.game);
  const isLocked = game.status === "correct" || game.status === "wrong";

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    const srcId = source.droppableId;
    const dstId = destination.droppableId;

    if (srcId === dstId && srcId === "arranged") {
      const reordered = [...game.arrangedWords];
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      dispatch(reorderArranged(reordered));
    } else if (dstId === "arranged") {
      dispatch(moveToArranged({ tileId: result.draggableId, toIndex: destination.index }));
    } else if (dstId === "scrambled") {
      dispatch(moveToScrambled(result.draggableId));
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Sentence {slotLabel}
            </span>
            <Badge
              variant="outline"
              className={[
                "text-xs font-semibold uppercase tracking-wide rounded-full",
                DIFFICULTY_BADGE_CLASSES[currentDifficulty],
              ].join(" ")}
            >
              {DIFFICULTY_LABELS[currentDifficulty]}
            </Badge>
          </div>
          <Button
            onClick={onQuit}
            variant="secondary"
            size="sm"
            className="rounded-full text-xs"
          >
            Quit Session
          </Button>
        </div>

        <WordPool tiles={game.scrambledWords} disabled={isLocked} />
        <SentenceZone tiles={game.arrangedWords} disabled={isLocked} status={game.status} />

        {game.currentSentence && (
          <GameFeedback status={game.status} difficulty={game.currentSentence.difficulty} />
        )}

        {game.currentSentence && (game.hintPromptVisible || game.hintLevel > 0) && (
          <HintPanel
            sentence={game.currentSentence}
            hintLevel={game.hintLevel}
            promptVisible={game.hintPromptVisible}
            onRequestHalf={() => dispatch(requestHint("half"))}
            onRequestFull={() => dispatch(requestHint("full"))}
            onDismiss={() => dispatch(dismissHintPrompt())}
          />
        )}

        <GameActions
          status={game.status}
          isLastSlot={game.currentSlotIndex >= SESSION_SIZE - 1}
          hasArrangedWords={game.arrangedWords.length > 0}
          onCheck={onCheck}
          onTryAgain={onTryAgain}
          onNext={onNext}
        />
      </div>
    </DragDropContext>
  );
}

export function PublicJumbleWordsPlayground() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const game = useAppSelector((s) => s.game);
  const { totalXP, currentLevel } = useAppSelector((s) => s.xp);

  useEffect(() => {
    return () => { dispatch(resetSession()); };
  }, [dispatch]);

  useEffect(() => {
    if (game.sessionComplete || game.status !== "idle") return;
    const difficulty = SESSION_FLOW[game.currentSlotIndex] ?? "easy";
    const sentence = pickRandomSentence(difficulty as Difficulty, game.usedSentenceIds);
    if (sentence) dispatch(loadSentence(sentence));
  }, [game.status, game.sessionComplete, game.currentSlotIndex, game.usedSentenceIds, dispatch]);

  const handleCheck = () => {
    if (!game.currentSentence) return;
    const correct = checkArrangement(game.arrangedWords, game.currentSentence);
    dispatch(setStatus(correct ? "correct" : "wrong"));
    if (correct) {
      const { difficulty } = game.currentSentence;
      dispatch(addXP(difficulty));
      const xpEarned = XP_PER_DIFFICULTY[difficulty] ?? 10;
      toast.success(`+${xpEarned} XP earned!`, {
        description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} sentence correct ✓`,
        duration: 2500,
      });
    } else {
      dispatch(registerWrongGuess());
      toast.error("Not quite right", {
        description: "Rearrange the words and try again.",
        duration: 2000,
      });
    }
  };

  const handleSignUp = () => {
    dispatch(setPendingXP({ xp: totalXP, level: currentLevel }));
    dispatch(setSignupEntryPoint("jumble-words"));
    router.push("/signup");
  };

  const handlePlayAgain = () => { dispatch(resetSession()); };
  const handleQuit = () => { dispatch(resetSession()); router.push("/"); };

  if (game.sessionComplete) {
    return (
      <SessionCompleteCard
        xp={totalXP}
        level={currentLevel}
        sentenceCount={SESSION_SIZE}
        isAuthed={false}
        onSignUp={handleSignUp}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  const currentDifficulty = (SESSION_FLOW[game.currentSlotIndex] ?? "easy") as Difficulty;

  return (
    <GameBoard
      slotLabel={`${game.currentSlotIndex + 1} / ${SESSION_SIZE}`}
      currentDifficulty={currentDifficulty}
      onQuit={handleQuit}
      onCheck={handleCheck}
      onTryAgain={() => dispatch(setStatus("playing"))}
      onNext={() => dispatch(advanceSlot())}
    />
  );
}

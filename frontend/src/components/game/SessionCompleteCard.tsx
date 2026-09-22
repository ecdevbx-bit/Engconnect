"use client";

import { Button } from "@/components/ui/button";
import { XPDisplay } from "@/components/xp/XPDisplay";

interface SessionCompleteCardProps {
  xp: number;
  level: number;
  sentenceCount: number;
  isAuthed: boolean;
  onSignUp: () => void;
  onPlayAgain: () => void;
  onGoHome?: () => void;
}

export function SessionCompleteCard({
  xp,
  level,
  sentenceCount,
  isAuthed,
  onSignUp,
  onPlayAgain,
  onGoHome,
}: SessionCompleteCardProps) {
  return (
    <div className="c-box rounded-xl flex flex-col items-center gap-6 max-w-md mx-auto mt-8 p-6">
      <div className="text-center flex flex-col gap-1">
        <div className="text-4xl mb-1">🎊</div>
        <h2 className="font-bold text-xl text-heading">Session Complete!</h2>
        <p className="text-sm text-muted-foreground">
          You completed all {sentenceCount} sentences.
        </p>
      </div>

      <div className="w-full rounded-xl bg-surface-2 border border-white/[0.06] px-6 py-4">
        <XPDisplay xp={xp} level={level} />
      </div>

      <div className="flex flex-col gap-2 w-full">
        {isAuthed ? (
          <>
            <Button onClick={onPlayAgain} className="w-full rounded-full">
              Play Again
            </Button>
            <Button onClick={onGoHome} variant="secondary" className="w-full rounded-full">
              Back to Home
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onSignUp} className="w-full rounded-full">
              Sign Up to Save Progress
            </Button>
            <Button onClick={onPlayAgain} variant="secondary" className="w-full rounded-full">
              Play Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speak } from "@/lib/tts";
import { PronunciationAttemptResult } from "@/lib/v3Pronunciation";

// Static improvement tips returned by the backend per (difficulty,
// mispronouncedCount). Last step before the user advances to the next
// sentence in the session. Tapping a missed word plays its correct
// pronunciation via the shared TTS helper (prefers an Indian-English voice).

export function ImproveStep({
  result,
  onNext,
}: {
  result: PronunciationAttemptResult;
  onNext: () => void;
}) {
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const speakWord = useCallback((word: string) => {
    speak(word, {
      rate: 0.85, // a touch slower than the sentence read — clearer per word
      onstart: () => setSpeakingWord(word),
      onend: () => setSpeakingWord(null),
      onerror: () => setSpeakingWord(null),
    });
  }, []);

  // Cancel any in-flight speech when leaving the step.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div>
      <p className="text-center text-sm font-medium text-primary">Let&apos;s Improve Together</p>
      <p className="text-center text-sm text-muted-foreground">
        Follow the tips and practice to perfect your pronunciation.
      </p>

      {(result.incorrectWords ?? []).length > 0 && (
        <div className="mt-6 rounded-xl border border-white/[0.06] bg-surface-2/30 p-4">
          <p className="text-sm font-medium text-heading">Words to revisit</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tap a word to hear the correct pronunciation.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(result.incorrectWords ?? []).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => speakWord(w)}
                aria-label={`Hear ${w} pronounced`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50",
                  speakingWord === w
                    ? "border-rose-400/70 bg-rose-500/25"
                    : "border-rose-500/30 bg-rose-500/10",
                )}
              >
                <Volume2 className={cn("h-3.5 w-3.5", speakingWord === w && "animate-pulse")} />
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(result.tips ?? []).map((tip) => (
          <div
            key={tip.title}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2/30 p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-heading">{tip.title}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} size="lg">
          Next sentence →
        </Button>
      </div>
    </div>
  );
}

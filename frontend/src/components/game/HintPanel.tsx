"use client";

/**
 * HintPanel — the AI partner's progressive hint helper for Jumble Words.
 *
 * Appears once the player has missed the same sentence 3 times in a row. The
 * partner first *offers* a hint (half / full), then reveals it in escalating
 * steps:
 *   level 1 → first & last word
 *   level 2 → also second & second-to-last word
 *   level 3 → the full sentence
 * All gameplay logic lives in gameSlice; this component is presentation only.
 */

import { Button } from "@/components/ui/button";
import { buildSentenceHint } from "@/lib/gameLogic";
import { Sentence } from "@/types";

interface HintPanelProps {
  sentence: Sentence;
  hintLevel: number; // 0 none · 1 first/last · 2 +second/second-last · 3 full
  promptVisible: boolean; // partner is offering a hint, none revealed yet
  onRequestHalf: () => void;
  onRequestFull: () => void;
  onDismiss: () => void;
}

export function HintPanel({
  sentence,
  hintLevel,
  promptVisible,
  onRequestHalf,
  onRequestFull,
  onDismiss,
}: HintPanelProps) {
  const offering = promptVisible && hintLevel === 0;
  if (!offering && hintLevel === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-surface-2/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg">
          🤖
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            AI Partner
          </p>
          {offering ? (
            <>
              <p className="text-sm text-heading">
                Hey! That&apos;s <span className="font-semibold">3 misses</span> in a
                row. Would you like to see a hint?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" onClick={onRequestHalf}>
                  Half hint
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={onRequestFull}
                >
                  Full hint
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={onDismiss}
                >
                  No thanks
                </Button>
              </div>
            </>
          ) : (
            <HintReveal
              sentence={sentence}
              hintLevel={hintLevel}
              onRequestHalf={onRequestHalf}
              onRequestFull={onRequestFull}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function HintReveal({
  sentence,
  hintLevel,
  onRequestHalf,
  onRequestFull,
}: {
  sentence: Sentence;
  hintLevel: number;
  onRequestHalf: () => void;
  onRequestFull: () => void;
}) {
  if (hintLevel >= 3) {
    return (
      <>
        <p className="text-sm text-muted-foreground">Here&apos;s the full sentence:</p>
        <p className="rounded-xl bg-surface-3 px-4 py-3 text-base font-semibold text-heading">
          {sentence.text}
        </p>
      </>
    );
  }

  const words = buildSentenceHint(sentence, hintLevel);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {hintLevel === 1
          ? "Here are the first and last words:"
          : "A couple more words to help:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <span
            key={i}
            className={[
              "rounded-md px-2.5 py-1 text-sm",
              w.revealed
                ? "bg-surface-3 font-semibold text-heading"
                : "bg-white/5 tracking-widest text-muted-foreground",
            ].join(" ")}
          >
            {w.revealed ? w.word : "•".repeat(Math.max(w.word.length, 2))}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {hintLevel < 2 && (
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full"
            onClick={onRequestHalf}
          >
            Still stuck? Reveal more
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={onRequestFull}
        >
          Show full sentence
        </Button>
      </div>
    </>
  );
}

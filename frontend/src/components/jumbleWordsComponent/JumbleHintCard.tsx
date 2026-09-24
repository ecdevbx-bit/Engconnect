"use client";

/**
 * JumbleHintCard — the AI coach's hint ladder, shown as a dismissible pop-up
 * card. Opens by itself after 2 misses on the same sentence, or any time from
 * the 💡 button on the board.
 *
 * The ladder (D-043), cheapest help first:
 *   1. Shape  — sentence type, tense, its building blocks in order
 *               (Who → Did what → What → When), a grammar clue and the
 *               meaning in the learner's own language. Reveals no positions.
 *   2. Words  — first + last word, then the 2nd and 2nd-last.
 *   3. Full   — the whole sentence (that sentence then earns half XP).
 * Everything comes from the server (GET /game/jumble/clue, /hint) so hidden
 * words never reach the browser. Presentation only — state lives in MainLayout.
 */

import { ArrowRight, Lightbulb, X } from "lucide-react";
import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";
import type { V3JumbleClue, V3JumbleHint } from "@/lib/v3Game";

const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 disabled:opacity-50";
const BTN_SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2 px-4 py-2 text-sm font-semibold text-heading transition-colors hover:bg-surface-3 disabled:opacity-50";
const BTN_GHOST =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-heading disabled:opacity-50";

const KIND_LABEL: Record<V3JumbleClue["kind"], string> = {
  statement: "Statement",
  question: "Question",
  negative: "Negative",
  command: "Instruction",
  exclamation: "Exclamation",
};

interface JumbleHintCardProps {
  misses: number; // live consecutive-miss count for the current sentence
  hintLevel: number; // words revealed: 0 none · 1 first/last · 2 +second/second-last · 3 full
  clue: V3JumbleClue | null; // the sentence's shape (first rung)
  hint: V3JumbleHint | null; // revealed words from the server
  loading: boolean;
  onRequestClue: () => void;
  onRequestHalf: () => void;
  onRequestFull: () => void;
  onDismiss: () => void;
}

export default function JumbleHintCard({
  misses,
  hintLevel,
  clue,
  hint,
  loading,
  onRequestClue,
  onRequestHalf,
  onRequestFull,
  onDismiss,
}: JumbleHintCardProps) {
  const offering = !clue && hintLevel === 0 && !loading;
  const showingFull = !!hint?.full || hintLevel >= 3;

  const emotion: MascotEmotion = loading ? "thinking" : offering ? "asking" : showingFull ? "happy" : "idea";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop — click to dismiss */}
      <button
        type="button"
        aria-label="Dismiss hint"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-label="Hint"
        className="c-box animate-in fade-in zoom-in-95 relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.6)] duration-200"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-heading"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-1 flex justify-center">
          <PixelMascot emotion={emotion} isThinking={loading} size={88} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Coach</p>

        {offering ? (
          <>
            <p className="mt-2 text-sm text-heading">
              {misses >= 2 ? (
                <>
                  <span className="font-semibold">{misses} misses</span> in a row. Want a hint?
                </>
              ) : (
                "Stuck? Pick a hint."
              )}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={onRequestClue} className={BTN_PRIMARY}>
                <Lightbulb className="h-4 w-4" /> Show the sentence shape
              </button>
              <button type="button" onClick={onRequestHalf} className={BTN_SECONDARY}>
                Show some words
              </button>
              <button type="button" onClick={onRequestFull} className={BTN_GHOST}>
                Reveal the full sentence · ½ XP
              </button>
            </div>
          </>
        ) : (
          <>
            {clue && <ClueView clue={clue} compact={hintLevel > 0} />}
            {hintLevel > 0 && <WordsView hintLevel={hintLevel} hint={hint} showingFull={showingFull} />}
            {loading && !clue && !hint && <p className="mt-3 text-sm text-muted-foreground">Thinking of a hint…</p>}

            <div className="mt-5 flex flex-col gap-2">
              {showingFull ? (
                <button type="button" onClick={onDismiss} className={BTN_PRIMARY}>
                  Got it
                </button>
              ) : (
                <>
                  {hintLevel < 2 && (
                    <button type="button" onClick={onRequestHalf} disabled={loading} className={BTN_SECONDARY}>
                      {hintLevel === 0 ? "Still stuck? Show some words" : "Show more words"}
                    </button>
                  )}
                  <button type="button" onClick={onRequestFull} disabled={loading} className={BTN_GHOST}>
                    Show full sentence · ½ XP
                  </button>
                  {clue && hintLevel === 0 && (
                    <button type="button" onClick={onDismiss} className={BTN_GHOST}>
                      I&apos;ll try again
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
        {/* keep the clue request reachable if it failed and the learner opened words first */}
        {!clue && hintLevel > 0 && !showingFull && !loading && (
          <button type="button" onClick={onRequestClue} className={`${BTN_GHOST} mt-1 w-full`}>
            <Lightbulb className="h-4 w-4" /> Show the sentence shape
          </button>
        )}
      </div>
    </div>
  );
}

// The sentence's shape: type + tense chips, the building blocks as a flow of
// arrow-joined blocks, one grammar line, and the meaning in their language.
function ClueView({ clue, compact }: { clue: V3JumbleClue; compact: boolean }) {
  return (
    <div className="mt-3 text-left">
      <div className="flex flex-wrap justify-center gap-1.5">
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
          {KIND_LABEL[clue.kind] ?? "Sentence"}
        </span>
        {clue.tense && (
          <span className="rounded-full bg-[#ab8eff]/15 px-2.5 py-1 text-xs font-semibold text-[#ab8eff]">
            {clue.tense}
          </span>
        )}
      </div>

      <ol aria-label="Sentence shape, in order" className="mt-3 flex flex-wrap items-center justify-center gap-1">
        {clue.pattern.map((block, i) => (
          <li key={i} className="flex items-center gap-1">
            <span className="rounded-lg border border-white/[0.08] bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-heading">
              <span className="mr-1 text-[10px] font-bold text-primary">{i + 1}</span>
              {block}
            </span>
            {i < clue.pattern.length - 1 && <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />}
          </li>
        ))}
      </ol>

      {!compact && clue.clue && (
        <p className="mt-3 flex gap-2 rounded-xl bg-white/[0.03] p-3 text-sm text-heading">
          <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{clue.clue}</span>
        </p>
      )}

      {!compact && clue.meaning && (
        <div className="mt-2 rounded-xl border border-white/[0.06] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Meaning · {clue.meaningLang}
          </p>
          <p className="mt-1 text-base text-heading">{clue.meaning}</p>
        </div>
      )}
    </div>
  );
}

function WordsView({ hintLevel, hint, showingFull }: { hintLevel: number; hint: V3JumbleHint | null; showingFull: boolean }) {
  if (!hint) return <p className="mt-3 text-sm text-muted-foreground">Thinking of a hint…</p>;
  const heading = showingFull
    ? "The full sentence:"
    : hintLevel === 1
      ? "The first and last words:"
      : "A couple more words:";
  // Every level renders the same word chips — earlier reveals stay shown and
  // newly revealed words fill in. At full, all words are revealed.
  return (
    <>
      <p className="mt-4 text-sm text-muted-foreground">{heading}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {hint.words.map((w, i) => (
          <span
            key={i}
            className={[
              "rounded-md px-2.5 py-1 text-sm",
              w.revealed ? "bg-surface-3 font-semibold text-heading" : "bg-white/5 tracking-widest text-muted-foreground",
            ].join(" ")}
          >
            {w.revealed ? w.word : "•".repeat(Math.max(w.length, 2))}
          </span>
        ))}
      </div>
    </>
  );
}

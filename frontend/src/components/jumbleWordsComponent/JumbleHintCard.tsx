"use client";

/**
 * JumbleHintCard — the AI coach's progressive hint helper, shown as a
 * dismissible pop-up card (not an inline strip). Surfaces once the player has
 * missed the same sentence 3 times in a row.
 *
 * The coach first OFFERS a hint (half / full); the revealed words come from the
 * server (GET /game/jumble/hint) so hidden words never reach the browser —
 * unrevealed positions arrive as a bare length and render as blanks. The full
 * sentence is only fetched when the player explicitly picks "full hint".
 *
 * Dismiss via the ✕, the backdrop, or "No, thanks". Presentation only — all
 * counting + request logic lives in MainLayout.
 */

import { X } from "lucide-react";
import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";
import type { V3JumbleHint } from "@/lib/v3Game";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 disabled:opacity-50";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2 px-4 py-2 text-sm font-semibold text-heading transition-colors hover:bg-surface-3 disabled:opacity-50";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-heading disabled:opacity-50";

interface JumbleHintCardProps {
  misses: number; // live consecutive-miss count for the current sentence
  promptVisible: boolean; // coach is offering, nothing revealed yet
  hintLevel: number; // 0 none · 1 first/last · 2 +second/second-last · 3 full
  hint: V3JumbleHint | null; // revealed words from the server
  loading: boolean;
  onRequestHalf: () => void;
  onRequestFull: () => void;
  onDismiss: () => void;
}

export default function JumbleHintCard({
  misses,
  promptVisible,
  hintLevel,
  hint,
  loading,
  onRequestHalf,
  onRequestFull,
  onDismiss,
}: JumbleHintCardProps) {
  const offering = promptVisible && hintLevel === 0;
  const showingFull = !!hint?.full || hintLevel >= 3;

  const emotion: MascotEmotion = loading
    ? "thinking"
    : offering
      ? "asking"
      : showingFull
        ? "happy"
        : "idea";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop — click to dismiss */}
      <button
        type="button"
        aria-label="Dismiss hint"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      {/* Pop card */}
      <div className="c-box animate-in fade-in zoom-in-95 relative z-10 w-full max-w-sm rounded-3xl p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.6)] duration-200">
        <button
          type="button"
          aria-label="Close"
          onClick={onDismiss}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-heading"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-1 flex justify-center">
          <PixelMascot emotion={emotion} isThinking={loading} size={96} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Coach</p>

        {offering ? (
          <>
            <p className="mt-2 text-sm text-heading">
              That&apos;s <span className="font-semibold">{misses} misses</span> in a row.
              Would you like to see a hint?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={onRequestHalf} disabled={loading} className={BTN_PRIMARY}>
                Show me a half hint
              </button>
              <button type="button" onClick={onRequestFull} disabled={loading} className={BTN_SECONDARY}>
                Reveal the full sentence
              </button>
              <button type="button" onClick={onDismiss} disabled={loading} className={BTN_GHOST}>
                No, thanks
              </button>
            </div>
          </>
        ) : (
          <HintReveal
            hintLevel={hintLevel}
            hint={hint}
            loading={loading}
            showingFull={showingFull}
            onRequestHalf={onRequestHalf}
            onRequestFull={onRequestFull}
            onDismiss={onDismiss}
          />
        )}
      </div>
    </div>
  );
}

function HintReveal({
  hintLevel,
  hint,
  loading,
  showingFull,
  onRequestHalf,
  onRequestFull,
  onDismiss,
}: {
  hintLevel: number;
  hint: V3JumbleHint | null;
  loading: boolean;
  showingFull: boolean;
  onRequestHalf: () => void;
  onRequestFull: () => void;
  onDismiss: () => void;
}) {
  if (!hint) {
    return <p className="mt-2 text-sm text-muted-foreground">Thinking of a hint…</p>;
  }

  const heading = showingFull
    ? "Here's the full sentence:"
    : hintLevel === 1
      ? "Here are the opening and closing words:"
      : "A couple more words to help:";

  // Every level renders the same word chips — earlier reveals stay shown and
  // newly revealed words simply fill in. At full, all words are revealed.
  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">{heading}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {hint.words.map((w, i) => (
          <span
            key={i}
            className={[
              "rounded-md px-2.5 py-1 text-sm",
              w.revealed
                ? "bg-surface-3 font-semibold text-heading"
                : "bg-white/5 tracking-widest text-muted-foreground",
            ].join(" ")}
          >
            {w.revealed ? w.word : "•".repeat(Math.max(w.length, 2))}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {showingFull ? (
          <button type="button" onClick={onDismiss} className={BTN_PRIMARY}>
            Got it
          </button>
        ) : (
          <>
            {hintLevel < 2 && (
              <button type="button" onClick={onRequestHalf} disabled={loading} className={BTN_SECONDARY}>
                Still stuck? Reveal more
              </button>
            )}
            <button type="button" onClick={onRequestFull} disabled={loading} className={BTN_GHOST}>
              Show full sentence
            </button>
          </>
        )}
      </div>
    </>
  );
}

"use client";

import { Mic, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { RecorderPhase } from "../hooks/useRecorderStateMachine";
import { RecordingWaveform } from "./RecordingWaveform";

// Speak step — implements the spec's auto-record timer state machine in
// terms of the recorder FSM. The countdown ring shows time remaining; the
// recording state turns the mic red and stops by itself when the learner
// finishes speaking. There is no listen-back: the take is scored straight away.

function formatSeconds(ms: number) {
  return Math.max(0, Math.ceil(ms / 1000)).toString();
}

// M:SS clock for the elapsed recording duration shown in the record pill.
function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function SpeakStep({
  sentence,
  phase,
  remainingMs,
  countdownMs,
  recordDurationMs,
  stream,
  errorMessage,
  onMicClick,
  onStopClick,
  onRetry,
  demo = false,
}: {
  sentence: string;
  phase: RecorderPhase;
  remainingMs: number;
  countdownMs: number;
  recordDurationMs: number;
  stream: MediaStream | null;
  errorMessage: string | null;
  onMicClick: () => void;
  onStopClick: () => void;
  onRetry: () => void;
  /** Landing-demo mode: hides the auto-start countdown helper hint. */
  demo?: boolean;
}) {
  // Recording progress: elapsed vs. the auto-stop duration (0→100% as time runs
  // out). Drives the pill's elapsed clock and its left→right progress fill.
  const recordedMs = recordDurationMs - remainingMs;
  const recordProgress =
    recordDurationMs > 0
      ? Math.min(100, Math.max(0, (recordedMs / recordDurationMs) * 100))
      : 0;

  // Countdown emphasis: the final 3 · 2 · 1 each get a traffic-light colour
  // (green → amber → red) and pop on change; higher numbers stay neutral.
  const countdownSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const countdownColor =
    countdownSec <= 1
      ? "text-rose-400"
      : countdownSec === 2
        ? "text-amber-400"
        : countdownSec === 3
          ? "text-emerald-400"
          : "text-heading";

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-medium text-primary">Your Turn</p>
      <p className="mt-1 text-sm text-muted-foreground">Pronounce the sentence clearly.</p>

      <h3 className="mt-6 max-w-2xl font-display text-2xl font-semibold leading-snug text-heading md:text-3xl">
        {sentence}
      </h3>

      <div className="mt-8 flex flex-col items-center gap-3">
        {phase === "countdown" && (
          <>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Recording starts in
            </span>
            <p
              key={countdownSec}
              className={cn("anim-countdown-pop font-display text-5xl font-bold", countdownColor)}
            >
              {formatSeconds(remainingMs)}
            </p>
            {!demo && (
              <Button onClick={onMicClick} size="lg" className="mt-2">
                <Mic className="h-4 w-4" />
                Start now
              </Button>
            )}
            {!demo && (
              <p className="mt-2 hidden text-xs text-muted-foreground md:block">
                Or wait — we&apos;ll start automatically in {formatSeconds(countdownMs)}s.
              </p>
            )}
          </>
        )}

        {phase === "recording" && (
          <>
            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-destructive">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              Recording
            </span>
            {!demo && (
              <p className="text-sm text-muted-foreground">Read it aloud — we&apos;ll stop when you finish.</p>
            )}
            <RecordingWaveform stream={stream} demo={demo} />
            {/* Pill: a left→right progress fill toward the auto-stop, the
                elapsed clock on the left, and the red stop button on the right. */}
            <div className="relative mt-1 flex h-[76px] w-full max-w-md items-center justify-between overflow-hidden rounded-full bg-surface-2 px-6">
              <div
                className="absolute inset-y-0 left-0 bg-primary/20 transition-[width] duration-300 ease-linear"
                style={{ width: `${recordProgress}%` }}
              />
              <span className="relative text-[28px] font-medium tracking-wide tabular-nums text-heading">
                {formatClock(recordedMs)}
              </span>
              <button
                type="button"
                onClick={onStopClick}
                aria-label="Stop recording"
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-transform hover:scale-95"
              >
                <span className="h-5 w-5 rounded-[3px] bg-white" />
              </button>
            </div>
          </>
        )}

        {(phase === "review" || phase === "submitting") &&
          (errorMessage ? (
            <>
              <p role="alert" className="max-w-sm text-sm text-destructive">
                {errorMessage}
              </p>
              <Button onClick={onRetry} size="lg" className="mt-2">
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs uppercase tracking-[0.18em] text-primary">Checking your pronunciation</span>
              <p className="mt-2 text-sm text-muted-foreground">Hold tight…</p>
            </>
          ))}

        {phase === "results" && (
          <p className="text-sm text-muted-foreground">Open the Feedback step to see results.</p>
        )}
      </div>
    </div>
  );
}

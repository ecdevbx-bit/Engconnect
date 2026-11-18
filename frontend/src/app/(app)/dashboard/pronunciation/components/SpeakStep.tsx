"use client";

import { Mic, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepDots } from "./StepDots";

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
      ? "text-bad"
      : countdownSec === 2
        ? "text-amber-400"
        : countdownSec === 3
          ? "text-good"
          : "text-heading";

  return (
    <div className="flex flex-col items-center text-center">
      {!demo && <StepDots current="speak" />}

      <h3 className="mt-4 max-w-2xl font-display text-[26px] font-bold leading-snug text-heading text-balance md:text-[34px]">
        {sentence}
      </h3>

      <div className="mt-8 flex flex-col items-center gap-3">
        {phase === "countdown" && (
          <>
            <span className="text-[15px] font-semibold text-muted-foreground">
              Recording starts in
            </span>
            <p
              key={countdownSec}
              className={cn("anim-countdown-pop font-display text-5xl font-bold", countdownColor)}
            >
              {formatSeconds(remainingMs)}
            </p>
            {!demo && (
              <button
                type="button"
                onClick={onMicClick}
                aria-label="Start recording now"
                className="mt-2 grid h-24 w-24 place-items-center rounded-full bg-speak text-white shadow-[0_0_0_10px_var(--speak-soft)] transition-transform active:scale-95"
              >
                <Mic className="h-10 w-10" />
              </button>
            )}
            {!demo && (
              <p className="font-display text-[17px] font-extrabold text-heading">Tap and speak</p>
            )}
            {!demo && (
              <span className="sr-only">Recording starts by itself in {formatSeconds(countdownMs)} seconds.</span>
            )}
          </>
        )}

        {phase === "recording" && (
          <>
            <span className="flex items-center gap-2 text-[15px] font-bold text-destructive">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              Recording
            </span>
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
              <p role="alert" className="max-w-sm rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-semibold text-bad">
                {errorMessage}
              </p>
              <Button onClick={onRetry} size="lg" className="mt-2">
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 text-[17px] font-bold text-heading"><span className="h-5 w-5 animate-spin rounded-full border-[3px] border-speak border-t-transparent motion-reduce:animate-none" aria-hidden />Checking…</span>
            </>
          ))}

        {phase === "results" && (
          <p className="text-sm text-muted-foreground">Open the Feedback step to see results.</p>
        )}
      </div>
    </div>
  );
}

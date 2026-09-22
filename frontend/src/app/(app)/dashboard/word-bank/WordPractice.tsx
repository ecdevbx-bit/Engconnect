"use client";

import { useCallback, useState } from "react";
import { Check, Mic, RotateCcw, Square, Volume2, X } from "lucide-react";

import { speak } from "@/lib/tts";
import { RecordingPlayer } from "../pronunciation/components/RecordingPlayer";
import { useMediaRecorder } from "../pronunciation/hooks/useMediaRecorder";

const TARGET_REPS = 3;

type Take = { blob: Blob; durationMs: number };

// Listen to a word (Indian-accent TTS), then say it three times — each take is
// recorded and played back. No scoring: this is repetition practice.
//
// Mounted with key={word} by the parent, so it always starts fresh — no
// word-change reset needed here.
export function WordPractice({ word, onClose }: { word: string; onClose: () => void }) {
  const recorder = useMediaRecorder();
  const [takes, setTakes] = useState<Take[]>([]);
  const [pendingDur, setPendingDur] = useState<number | null>(null);
  const [seenBlob, setSeenBlob] = useState<Blob | null>(null);

  // stop() returns the duration synchronously; the Blob lands in recorder.blob
  // one render later (via MediaRecorder.onstop). Bank it exactly once — keyed
  // off the blob's identity — with a render-phase state adjustment, React's
  // recommended alternative to a setState-in-effect.
  if (recorder.blob && recorder.blob !== seenBlob && pendingDur != null) {
    const take = { blob: recorder.blob, durationMs: pendingDur };
    setSeenBlob(recorder.blob);
    setPendingDur(null);
    setTakes((prev) => (prev.length >= TARGET_REPS ? prev : [...prev, take]));
  }

  const done = takes.length >= TARGET_REPS;

  const onRecord = useCallback(() => {
    void recorder.start();
  }, [recorder]);

  const onStop = useCallback(() => {
    setPendingDur(recorder.stop());
  }, [recorder]);

  const onReset = useCallback(() => {
    setTakes([]);
    setPendingDur(null);
    recorder.reset();
  }, [recorder]);

  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-surface-2/40 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Practice
          </p>
          <p className="text-2xl font-extrabold text-heading">{word}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close practice"
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/5 hover:text-heading"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => speak(word, { rate: 0.9 })}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-sm font-bold text-heading transition hover:bg-white/5"
        >
          <Volume2 className="h-4 w-4" /> Listen
        </button>

        {!done &&
          (recorder.isRecording ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:brightness-105"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={onRecord}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-[#0b0e14] transition hover:bg-primary-1"
            >
              <Mic className="h-4 w-4" /> Say it ({takes.length}/{TARGET_REPS})
            </button>
          ))}

        {done && (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Practiced {TARGET_REPS}×
          </span>
        )}
      </div>

      {recorder.error && (
        <p className="mt-3 text-sm text-red-500">
          {recorder.error === "permission-denied"
            ? "Microphone permission is needed to practice speaking."
            : "Couldn't access the microphone."}
        </p>
      )}

      {takes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Your takes</p>
          {takes.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-4 text-sm font-bold text-muted-foreground">{i + 1}</span>
              <div className="flex-1">
                <RecordingPlayer blob={t.blob} durationMs={t.durationMs} />
              </div>
            </div>
          ))}
          {done && (
            <button
              type="button"
              onClick={onReset}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <RotateCcw className="h-4 w-4" /> Practice again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

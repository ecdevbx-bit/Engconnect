"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// Custom playback control for a just-recorded take — a flat play/pause pill
// with a progress bar, replacing the default browser <audio controls>.
//
// WebM blobs frequently report `duration` as Infinity/NaN until fully
// played, so we fall back to the recorder's measured duration for the total
// and for progress scaling.

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function RecordingPlayer({ blob, durationMs }: { blob: Blob; durationMs: number }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const fallbackSecs = Math.max(1, durationMs / 1000);
  const [total, setTotal] = useState(fallbackSecs);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) a.pause();
    else void a.play();
  };

  const effectiveDuration = (a: HTMLAudioElement) =>
    Number.isFinite(a.duration) && a.duration > 0 ? a.duration : fallbackSecs;

  return (
    <div className="mt-2 flex w-full max-w-xl items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface-2 p-4">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 translate-x-[1px]" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-heading">Your recording</span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatClock(elapsed)} / {formatClock(total)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={url}
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setTotal(effectiveDuration(e.currentTarget))}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          const dur = effectiveDuration(a);
          setElapsed(a.currentTime);
          setProgress(Math.min(100, (a.currentTime / dur) * 100));
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          setElapsed(0);
        }}
      />
    </div>
  );
}

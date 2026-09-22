"use client";

import { useCallback, useEffect, useRef } from "react";

// Push-to-talk timer + transcript-flush wrapper. Consumes a capture
// object (the browser Web Speech hook) injected by the parent, kept as a
// generic CaptureResult so the STT implementation can change without
// touching this wrapper.
//
//   - click-to-toggle (no press-and-hold)
//   - HIDDEN grace window (no UI), then a silent silence-based auto-stop
//   - auto-send the captured transcript when recording ends
//
// Lives in components/game/aiPartner because this behaviour is
// specific to the AI Partner trainer.

// Grace window: for the first `grace` ms of a recording we record freely with
// NO auto-stop and NO UI — the user is never told about it. Sourced from the
// per-session admin config (maxRecordingMs); this is the fallback default.
export const PUSH_TO_TALK_DEFAULT_MAX_MS = 15_000;

// After the grace window, auto-stop once the user has gone quiet (no new
// recognized words) for SILENCE_STOP_MS. Fully silent — no countdown / bar.
export const SILENCE_STOP_MS = 4_000;

// CaptureResult is the contract the capture hook (useV3WebSpeechCapture)
// satisfies. The parent passes it in here as a plain object so this
// wrapper stays decoupled from the STT implementation.
export interface CaptureResult {
  isRecording: boolean;
  isStarting: boolean;
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  getAnalyser: () => AnalyserNode | null;
  // Optional: performance.now() of the last frame with voice in it. Engines
  // whose transcript only lands after the turn (Gemini Live) use this so the
  // silence auto-stop still works mid-recording.
  getLastVoiceAt?: () => number;
}

export interface UseV3PushToTalkOptions {
  capture: CaptureResult;
  // Hidden grace window (ms): record freely with no auto-stop for this long,
  // then the silence auto-stop arms. Sourced from the per-session rewards
  // config so the admin can tune it without redeploying.
  maxRecordingMs: number;
  // Called with the final transcript when the recording ends (silence
  // auto-stop OR the user clicking the mic again). Empty transcripts dropped.
  onCapture: (text: string) => void;
  // Hard guard: skip start() / stop() / auto-send entirely while disabled
  // (session ended, WS not yet connected, AI still thinking, etc.).
  enabled: boolean;
}

export interface UseV3PushToTalkResult {
  isRecording: boolean;
  isStarting: boolean;
  transcript: string;
  error: string | null;
  toggle: () => void;
  // Forwarded so the existing MicLevelRing keeps working (returns
  // null when the capture backend doesn't expose an analyser).
  getAnalyser: () => AnalyserNode | null;
}

export function useV3PushToTalk({
  capture,
  maxRecordingMs,
  onCapture,
  enabled,
}: UseV3PushToTalkOptions): UseV3PushToTalkResult {
  const grace = maxRecordingMs > 0 ? maxRecordingMs : PUSH_TO_TALK_DEFAULT_MAX_MS;

  // Silence tracking: timestamp of the last transcript growth (a recognized
  // word). The silence auto-stop measures "quiet for" from here.
  const lastChangeRef = useRef<number>(0);

  const startedAtRef = useRef<number>(0);
  const tickHandleRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>("");
  const wasRecordingRef = useRef(false);
  // Hold the grace value in a ref so the ticker callback always sees the
  // latest without being re-created (which would tear down the interval).
  const graceRef = useRef(grace);
  useEffect(() => {
    graceRef.current = grace;
  }, [grace]);

  // Keep a live ref of the transcript so the stop handler sees the latest
  // value, and stamp the silence clock whenever it grows.
  useEffect(() => {
    const t = capture.transcript;
    if (t && t !== transcriptRef.current) {
      lastChangeRef.current = performance.now();
    }
    transcriptRef.current = t;
  }, [capture.transcript]);

  const clearTicker = useCallback(() => {
    if (tickHandleRef.current !== null) {
      window.clearInterval(tickHandleRef.current);
      tickHandleRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    capture.stop();
    clearTicker();
  }, [capture, clearTicker]);

  // Hold stop in a ref so the ticker effect can call it WITHOUT listing it as
  // a dependency. The capture hook returns a fresh object every render, so
  // stop's identity changes each render — if the ticker depended on it, the
  // effect would tear down and re-create the interval (resetting startedAtRef)
  // every render, breaking the timing.
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Same trick for the optional voice-activity clock.
  const voiceAtRef = useRef(capture.getLastVoiceAt);
  useEffect(() => {
    voiceAtRef.current = capture.getLastVoiceAt;
  }, [capture.getLastVoiceAt]);

  // Ticker runs only while recording. HIDDEN behaviour (no UI): record freely
  // for the first `grace` ms; after that, auto-stop once the user has been
  // quiet (no new recognized words) for SILENCE_STOP_MS. Depends ONLY on
  // isRecording so the interval survives the capture hook's per-render churn.
  useEffect(() => {
    if (!capture.isRecording) {
      clearTicker();
      return;
    }
    startedAtRef.current = performance.now();
    lastChangeRef.current = performance.now();
    tickHandleRef.current = window.setInterval(() => {
      const now = performance.now();
      const graceOver = now - startedAtRef.current >= graceRef.current;
      const lastSound = Math.max(lastChangeRef.current, voiceAtRef.current?.() ?? 0);
      const quietFor = now - lastSound;
      if (graceOver && quietFor >= SILENCE_STOP_MS) {
        stopRef.current();
      }
    }, 100);
    return clearTicker;
  }, [capture.isRecording, clearTicker]);

  // Fire onCapture exactly once when recording transitions on→off. The capture
  // hooks clear their transcript inside start(); the snapshot at stop is kept
  // in transcriptRef.
  //
  // Deliver whatever the user actually said — do NOT gate this on `enabled`.
  // `enabled` (which folds in isAiTyping and isConnected) is meant only to gate
  // STARTING a recording; using it here too silently DROPS a finished utterance
  // whenever the flag flips in the sliver of time between the user finishing
  // speaking and the recognizer's onend firing (e.g. K.AI's previous reply
  // begins → isAiTyping=true, or a momentary WS blip). That lost turn is the
  // "K.AI didn't respond / only answered my 2nd prompt" bug. The real guards
  // live downstream: onCapture → sendCapturedTranscript checks isConnected /
  // isSessionEnded, and sendUserMessage checks the socket is OPEN.
  useEffect(() => {
    const was = wasRecordingRef.current;
    wasRecordingRef.current = capture.isRecording;
    if (was && !capture.isRecording) {
      const text = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (text) onCapture(text);
    }
  }, [capture.isRecording, onCapture]);

  const toggle = useCallback(() => {
    if (!enabled) return;
    if (capture.isRecording || capture.isStarting) {
      stop();
    } else {
      void capture.start();
    }
  }, [enabled, capture, stop]);

  return {
    isRecording: capture.isRecording,
    isStarting: capture.isStarting,
    transcript: capture.transcript,
    error: capture.error,
    toggle,
    getAnalyser: capture.getAnalyser,
  };
}

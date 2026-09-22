"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import { useMediaRecorder } from "./useMediaRecorder";

// State machine for the record-and-score loop:
//
//   idle ──(sentence ready)──► countdown(countdownMs)
//   countdown ──(tick to 0 | mic click)──► recording(autoCutMs)
//   recording ──(speech ended | tick to 0 | stop click)──► review (blob ready)
//   review ──(auto, by the page)──► submitting   — no listen-back step
//   review ──(no speech heard / api error → retry)──► countdown(countdownMs)
//   submitting ──(api ok | api err)──► review|results
//   results ──(next)──► idle (caller fetches a new sentence)
//
// `countdownMs` and `recordDurationMs` are driven by the backend's
// /phrases response so the spec lives server-side.

export type RecorderPhase =
  | "idle"
  | "countdown"
  | "recording"
  | "review"
  | "submitting"
  | "results";

type State = {
  phase: RecorderPhase;
  remainingMs: number;     // ticks down during countdown/recording
  countdownMs: number;
  recordDurationMs: number;
  blob: Blob | null;
  durationMs: number;
  errorMessage: string | null;
};

type Action =
  | { type: "ARM"; countdownMs: number; recordDurationMs: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING"; blob: Blob | null; durationMs: number; noSpeech?: boolean }
  | { type: "RETRY" }
  | { type: "SUBMIT" }
  | { type: "SUBMIT_OK" }
  | { type: "SUBMIT_ERR"; message: string }
  | { type: "RESET" };

const initial: State = {
  phase: "idle",
  remainingMs: 0,
  countdownMs: 5000,
  recordDurationMs: 6000,
  blob: null,
  durationMs: 0,
  errorMessage: null,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "ARM":
      return {
        ...s,
        phase: "countdown",
        remainingMs: a.countdownMs,
        countdownMs: a.countdownMs,
        recordDurationMs: a.recordDurationMs,
        blob: null,
        durationMs: 0,
        errorMessage: null,
      };
    case "TICK": {
      const next = Math.max(0, s.remainingMs - a.deltaMs);
      return { ...s, remainingMs: next };
    }
    case "START_RECORDING":
      return { ...s, phase: "recording", remainingMs: s.recordDurationMs };
    case "STOP_RECORDING":
      return {
        ...s,
        phase: "review",
        remainingMs: 0,
        blob: a.blob,
        durationMs: a.durationMs,
        errorMessage: a.noSpeech ? NO_SPEECH_MESSAGE : s.errorMessage,
      };
    case "RETRY":
      return {
        ...s,
        phase: "countdown",
        remainingMs: s.countdownMs,
        blob: null,
        durationMs: 0,
        errorMessage: null,
      };
    case "SUBMIT":
      return { ...s, phase: "submitting", errorMessage: null };
    case "SUBMIT_OK":
      return { ...s, phase: "results" };
    case "SUBMIT_ERR":
      return { ...s, phase: "review", errorMessage: a.message };
    case "RESET":
      return initial;
    default:
      return s;
  }
}

const TICK_MS = 250;
// Less than this much voice in a take = we didn't hear the learner; don't send it.
const MIN_VOICED_MS = 300;
const NO_SPEECH_MESSAGE = "We couldn't hear you — check your microphone and speak a little louder.";

export function useRecorderStateMachine() {
  const [state, dispatch] = useReducer(reducer, initial);
  const recorder = useMediaRecorder();
  const tickHandleRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Single ticker — runs continuously while in countdown or recording.
  // Effects on phase transition (start recording, force stop) are derived
  // from the latest state inside the tick callback.
  useEffect(() => {
    if (state.phase !== "countdown" && state.phase !== "recording") {
      if (tickHandleRef.current !== null) {
        window.clearInterval(tickHandleRef.current);
        tickHandleRef.current = null;
      }
      return;
    }
    lastTickRef.current = performance.now();
    tickHandleRef.current = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      dispatch({ type: "TICK", deltaMs: delta });
    }, TICK_MS);
    return () => {
      if (tickHandleRef.current !== null) {
        window.clearInterval(tickHandleRef.current);
        tickHandleRef.current = null;
      }
    };
  }, [state.phase]);

  // Countdown hit zero → auto-start recording.
  useEffect(() => {
    if (state.phase === "countdown" && state.remainingMs <= 0) {
      void recorder.start();
      dispatch({ type: "START_RECORDING" });
    }
  }, [state.phase, state.remainingMs, recorder]);

  // Recording hit auto-cut, or the learner finished speaking → stop and bank
  // the blob. The MediaRecorder produces the blob asynchronously via onstop;
  // it's attached by the next effect that watches recorder.blob.
  useEffect(() => {
    if (state.phase === "recording" && (state.remainingMs <= 0 || recorder.speechEnded)) {
      const noSpeech = recorder.getVoicedMs() < MIN_VOICED_MS;
      const dur = recorder.stop();
      dispatch({ type: "STOP_RECORDING", blob: null, durationMs: dur, noSpeech });
    }
  }, [state.phase, state.remainingMs, recorder]);

  // Recorder produced a blob — attach it to review state.
  useEffect(() => {
    if (state.phase === "review" && !state.blob && recorder.blob) {
      dispatch({ type: "STOP_RECORDING", blob: recorder.blob, durationMs: state.durationMs });
    }
  }, [state.phase, state.blob, state.durationMs, recorder.blob]);

  // Surface a user-friendly error if mic permission was denied during a
  // countdown→record transition. Bail back to idle so the page can prompt
  // again.
  useEffect(() => {
    if (recorder.error && (state.phase === "countdown" || state.phase === "recording")) {
      dispatch({
        type: "SUBMIT_ERR",
        message:
          recorder.error === "permission-denied"
            ? "We need microphone access to record. Please allow it and try again."
            : "Could not start recording. Please check your device and try again.",
      });
    }
  }, [recorder.error, state.phase]);

  const arm = useCallback((args: { countdownMs: number; recordDurationMs: number }) => {
    dispatch({ type: "ARM", ...args });
  }, []);

  const skipCountdown = useCallback(() => {
    if (state.phase !== "countdown") return;
    void recorder.start();
    dispatch({ type: "START_RECORDING" });
  }, [state.phase, recorder]);

  const stopRecording = useCallback(() => {
    if (state.phase !== "recording") return;
    const noSpeech = recorder.getVoicedMs() < MIN_VOICED_MS;
    const dur = recorder.stop();
    dispatch({ type: "STOP_RECORDING", blob: null, durationMs: dur, noSpeech });
  }, [state.phase, recorder]);

  const retry = useCallback(() => {
    recorder.reset();
    dispatch({ type: "RETRY" });
  }, [recorder]);

  const beginSubmit = useCallback(() => dispatch({ type: "SUBMIT" }), []);
  const submitSucceeded = useCallback(() => dispatch({ type: "SUBMIT_OK" }), []);
  const submitFailed = useCallback((m: string) => dispatch({ type: "SUBMIT_ERR", message: m }), []);
  const reset = useCallback(() => {
    recorder.reset();
    dispatch({ type: "RESET" });
  }, [recorder]);

  return {
    phase: state.phase,
    remainingMs: state.remainingMs,
    countdownMs: state.countdownMs,
    recordDurationMs: state.recordDurationMs,
    blob: state.blob,
    durationMs: state.durationMs,
    errorMessage: state.errorMessage,
    isRecording: recorder.isRecording,
    stream: recorder.stream,
    arm,
    skipCountdown,
    stopRecording,
    retry,
    beginSubmit,
    submitSucceeded,
    submitFailed,
    reset,
  };
}

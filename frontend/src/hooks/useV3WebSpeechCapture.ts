"use client";

// Browser-native Speech Recognition wrapper for the v3 AI Partner — the
// sole STT path. Uses window.SpeechRecognition / webkitSpeechRecognition,
// so there is no network round-trip from this client to an STT vendor; the
// browser talks to its own provider (Chrome → Google, Safari → Apple).
// Browsers without SpeechRecognition get an error and an inert mic button.

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API isn't in TS lib.dom by default for all targets;
// declare the minimum surface we use.
type WebSpeechAlternative = { transcript: string; confidence: number };
type WebSpeechResult = {
  isFinal: boolean;
  length: number;
  [index: number]: WebSpeechAlternative;
};
type WebSpeechResultList = {
  length: number;
  [index: number]: WebSpeechResult;
};
type WebSpeechEvent = { resultIndex: number; results: WebSpeechResultList };
type WebSpeechErrorEvent = { error: string; message?: string };

interface WebSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: WebSpeechEvent) => void) | null;
  onerror: ((e: WebSpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type WebSpeechCtor = new () => WebSpeechRecognition;

function getRecognitionCtor(): WebSpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechCtor;
    webkitSpeechRecognition?: WebSpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Native-language → BCP 47 tag, biased toward Indian variants since
// this is an Indian English learning product. Falls back to "en-US"
// for unknown values.
const LANGUAGE_TAGS: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Gujarati: "gu-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
};

function resolveLang(nativeLanguage: string | null | undefined): string {
  return LANGUAGE_TAGS[nativeLanguage ?? ""] ?? "en-US";
}

// mergeAppend joins two transcript fragments, collapsing the case where `seg`
// re-contains what's already in `acc`. Web Speech engines do NOT reliably
// return disjoint segments: with continuous=true (especially on mobile) a later
// result re-emits the whole running phrase ("hey" → "hey I am" → "hey I am
// Aditya"), and the live interim is frequently the FULL hypothesis including
// already-finalized words. Blindly concatenating those stacks the overlaps and
// prints "hey hey I am hey I am Aditya". We merge only on WHOLE-WORD containment
// (seg starts with all of acc → seg is the fuller hypothesis; or seg already
// sits at acc's tail → nothing new), so genuinely distinct speech is still
// appended and nothing is silently dropped.
function mergeAppend(acc: string, seg: string): string {
  const a = acc.trim();
  const s = seg.trim();
  if (!a) return s;
  if (!s) return a;
  const al = a.toLowerCase();
  const sl = s.toLowerCase();
  if (sl === al) return s; // identical hypothesis → keep a single copy
  if (sl.startsWith(al + " ")) return s; // seg extends acc → take the fuller seg
  if (al.endsWith(" " + sl)) return a; // seg already present at acc's tail
  return `${a} ${s}`; // genuinely disjoint → append
}

const LOG = "[v3webspeech]";

export interface UseV3WebSpeechCaptureOptions {
  // accessToken / sessionId are accepted for call-site convenience but
  // unused: Web Speech runs entirely in-browser with no server token.
  accessToken: string | null;
  sessionId?: string | null;
  nativeLanguage?: string | null;
}

export interface UseV3WebSpeechCaptureResult {
  isRecording: boolean;
  isStarting: boolean;
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  // Web Speech doesn't expose a raw audio analyser — the MicLevelRing
  // will idle. Returning null keeps the CaptureResult contract uniform.
  getAnalyser: () => AnalyserNode | null;
}

// IsWebSpeechSupported is exported so the parent can detect the lack
// of browser support up-front (e.g., Firefox without the pref, older
// iOS Safari) and show a useful message instead of a silent failure.
export function isWebSpeechSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function useV3WebSpeechCapture({
  nativeLanguage,
}: UseV3WebSpeechCaptureOptions): UseV3WebSpeechCaptureResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recogRef = useRef<WebSpeechRecognition | null>(null);
  const finalAccRef = useRef<string>("");
  const interimRef = useRef<string>("");
  const closedManuallyRef = useRef(false);

  const teardown = useCallback(() => {
    const r = recogRef.current;
    if (r) {
      try {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.onstart = null;
        // abort() drops any pending audio — preferable to stop() which
        // can keep firing onresult after we've already moved on.
        r.abort();
      } catch {
        /* noop */
      }
    }
    recogRef.current = null;
  }, []);

  const stop = useCallback(() => {
    closedManuallyRef.current = true;
    const r = recogRef.current;
    if (r) {
      try {
        // abort() (NOT stop()) releases the microphone IMMEDIATELY. This is
        // critical for Bluetooth headsets: while the mic is held the device
        // stays in the low-quality HFP/"call" profile, so K.AI's reply plays
        // back muffled ("underwater"). The graceful stop() keeps the mic/SCO
        // link warm until Chrome finalizes — long enough to muffle the whole
        // reply. We don't lose words: the latest transcript (final + current
        // interim) is already in `transcript` state, which the push-to-talk
        // wrapper flushes on the onend → isRecording=false transition.
        r.abort();
      } catch {
        /* noop */
      }
    }
    // Let onend fire to transition state + run teardown (abort() triggers it).
    setIsStarting(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    finalAccRef.current = "";
    interimRef.current = "";
    closedManuallyRef.current = false;

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError(
        "Your browser doesn't support voice input. Try Chrome, Edge, or Safari 15+.",
      );
      return;
    }

    setIsStarting(true);

    let r: WebSpeechRecognition;
    try {
      r = new Ctor();
    } catch (err) {
      console.error(`${LOG} construct failed`, err);
      setError("Could not start voice input. Please refresh and try again.");
      setIsStarting(false);
      return;
    }

    r.lang = resolveLang(nativeLanguage ?? null);
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setIsStarting(false);
      setIsRecording(true);
    };

    r.onresult = (event) => {
      // Fold the results with mergeAppend rather than blind concatenation.
      // `event.results` is cumulative, but engines (mobile especially, with
      // continuous=true) emit OVERLAPPING/GROWING hypotheses across result
      // indices, and the live interim is often the full running phrase that
      // re-contains already-finalized words. Concatenating those stacks the
      // repeats ("hey hey I am hey I am Aditya"); merging on whole-word
      // containment collapses the overlap for both disjoint (desktop) and
      // growing (mobile) result streams. Walk from 0 so a stale resultIndex
      // can't skip or re-count segments either.
      let finalText = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = (res[0]?.transcript ?? "").trim();
        if (!txt) continue;
        if (res.isFinal) {
          finalText = mergeAppend(finalText, txt);
        } else {
          interim = mergeAppend(interim, txt);
        }
      }
      finalAccRef.current = finalText;
      interimRef.current = interim;
      setTranscript(mergeAppend(finalText, interim));
    };

    r.onerror = (e) => {
      // "no-speech" / "aborted" are normal end-of-utterance signals
      // for some engines. Don't surface them as errors.
      if (e.error === "no-speech" || e.error === "aborted") {
        return;
      }
      console.warn(`${LOG} error`, e.error, e.message);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access denied. Allow it in your browser and try again.");
      } else if (e.error === "audio-capture") {
        setError("No microphone detected. Plug one in and try again.");
      } else if (e.error === "language-not-supported") {
        setError("This language isn't supported by your browser's voice engine.");
      } else if (e.error === "network") {
        setError("Voice recognition needs an internet connection.");
      } else {
        setError("Voice recognition error — please try again.");
      }
    };

    r.onend = () => {
      // Recognition naturally ends after the user stops talking (some
      // engines) or when we called stop(). Wipe state and let the
      // pushToTalk wrapper flush the captured transcript.
      setIsRecording(false);
      setIsStarting(false);
      teardown();
    };

    recogRef.current = r;
    try {
      r.start();
    } catch (err) {
      // Most common: start() called twice in a row, or before previous
      // session ended. Treat as transient.
      console.warn(`${LOG} start failed`, err);
      setError("Voice input is already running — please wait a moment and try again.");
      teardown();
      setIsStarting(false);
    }
  }, [nativeLanguage, teardown]);

  // Belt-and-braces: tear down on unmount in case stop() wasn't called.
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const getAnalyser = useCallback((): AnalyserNode | null => null, []);

  return { isRecording, isStarting, transcript, error, start, stop, getAnalyser };
}

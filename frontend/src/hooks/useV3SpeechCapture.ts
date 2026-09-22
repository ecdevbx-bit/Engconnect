"use client";

// The AI Partner's microphone: Deepgram first, browser Web Speech as the
// safety net.
//
// Deepgram is the standard — one engine, identical on an iPhone, an Android
// phone, and a laptop, with real Hindi/English code-switching. But it depends
// on our backend minting a token, a WebSocket surviving the learner's network,
// and a vendor staying up. Any of those can fail, and a language learner
// staring at a mic button that does nothing is a worse product than one
// running on a less accurate engine.
//
// So this hook owns the choice, and the two capture hooks below it stay
// single-purpose:
//
//   useV3DeepgramCapture   — streams PCM to Deepgram      (primary)
//   useV3WebSpeechCapture  — window.SpeechRecognition     (fallback)
//
// Both satisfy the same CaptureResult contract that useV3PushToTalk consumes,
// so everything downstream — push-to-talk timing, silence auto-stop, transcript
// flush, the mic ring — is identical whichever engine is live.
//
// Fallback fires in three places:
//   1. Before recording — the server answered provider:"browser" (Deepgram
//      unconfigured or its token grant failed).
//   2. On start — no token, socket refused, handshake timed out.
//   3. Mid-recording — the socket dropped after audio was already flowing.
//
// A Deepgram failure falls back for the current turn, then waits briefly before
// trying Deepgram again. Permanently latching the browser engine made one
// transient socket failure turn the rest of a Hindi-English session into
// browser STT, which cannot reliably code-switch.

import { useCallback, useRef, useState } from "react";

import {
  isWebSpeechSupported,
  useV3WebSpeechCapture,
} from "@/hooks/useV3WebSpeechCapture";
import { useV3DeepgramCapture } from "@/hooks/useV3DeepgramCapture";

const LOG = "[v3speech]";
const DEEPGRAM_RETRY_BACKOFF_MS = 30_000;

export type SpeechEngine = "deepgram" | "browser";

export interface UseV3SpeechCaptureOptions {
  accessToken: string | null;
  sessionId?: string | null;
  nativeLanguage?: string | null;
}

export interface UseV3SpeechCaptureResult {
  isRecording: boolean;
  isStarting: boolean;
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  getAnalyser: () => AnalyserNode | null;
  /** Which engine served the current/most recent turn. Diagnostics only. */
  engine: SpeechEngine | null;
}

export function useV3SpeechCapture({
  accessToken,
  sessionId,
  nativeLanguage,
}: UseV3SpeechCaptureOptions): UseV3SpeechCaptureResult {
  const [engine, setEngine] = useState<SpeechEngine | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Browser STT is only a temporary safety net. Avoid a costly retry on every
  // utterance during an outage, while allowing the multilingual primary to
  // recover during the same conversation.
  const deepgramRetryAfterRef = useRef(0);
  const engineRef = useRef<SpeechEngine | null>(null);

  // Words Deepgram had already transcribed when it died mid-sentence.
  //
  // Without this they are silently lost. useV3PushToTalk tracks the visible
  // transcript in a ref and sends it on the isRecording on→off transition —
  // but when the engine swaps, `transcript` becomes the browser engine's
  // (empty) value in the same commit, so the flush sees "" and drops the
  // turn. Carrying the text forward and prepending it means a dropped socket
  // costs the learner nothing but the syllable they were mid-way through.
  const [carryOver, setCarryOver] = useState("");

  const webSpeech = useV3WebSpeechCapture({ accessToken, sessionId, nativeLanguage });

  // A socket that dies mid-sentence. Hand the turn straight to the browser
  // engine so the learner can carry on talking, carrying their words across
  // with them. `spokenSoFar` arrives as an argument rather than being read
  // back off the Deepgram hook, because that hook receives this callback —
  // reaching back into it from here would be a cycle.
  const handleRuntimeFailure = useCallback(
    (spokenSoFar: string) => {
      if (engineRef.current === "browser") return;
      console.warn(`${LOG} deepgram dropped mid-recording — switching to browser stt`);
      deepgramRetryAfterRef.current = Date.now() + DEEPGRAM_RETRY_BACKOFF_MS;
      engineRef.current = "browser";
      setCarryOver(spokenSoFar.trim());
      setEngine("browser");
      void webSpeech.start();
    },
    [webSpeech],
  );

  const deepgram = useV3DeepgramCapture({
    accessToken,
    sessionId,
    nativeLanguage,
    onRuntimeFailure: handleRuntimeFailure,
  });

  const start = useCallback(async () => {
    setError(null);
    setCarryOver("");
    setIsStarting(true);

    if (Date.now() >= deepgramRetryAfterRef.current) {
      const ok = await deepgram.start();
      if (ok) {
        engineRef.current = "deepgram";
        setEngine("deepgram");
        setIsStarting(false);
        return;
      }
      // A denied mic permission is not a Deepgram problem — the browser
      // engine will hit the identical wall, so surface it instead of
      // pretending a fallback will help.
      if (deepgram.error) {
        setError(deepgram.error);
        setIsStarting(false);
        return;
      }
      console.info(`${LOG} deepgram unavailable — using browser stt for this session`);
	  deepgramRetryAfterRef.current = Date.now() + DEEPGRAM_RETRY_BACKOFF_MS;
    }

    if (!isWebSpeechSupported()) {
      setError(
        "Voice input isn't available right now. Please check your connection and try again.",
      );
      setIsStarting(false);
      return;
    }

    engineRef.current = "browser";
    setEngine("browser");
    await webSpeech.start();
    setIsStarting(false);
  }, [deepgram, webSpeech]);

  const stop = useCallback(() => {
    if (engineRef.current === "deepgram") deepgram.stop();
    else if (engineRef.current === "browser") webSpeech.stop();
    setIsStarting(false);
  }, [deepgram, webSpeech]);

  // Everything below proxies the engine that actually ran this turn. Reading
  // from the inactive one would report a permanently idle mic.
  const active = engine === "deepgram" ? deepgram : engine === "browser" ? webSpeech : null;

  // Only Deepgram has raw audio to analyse; the Web Speech engine never
  // exposes it, so the mic ring idles on the fallback path exactly as it did
  // before this migration.
  const getAnalyser = useCallback(
    () => (engineRef.current === "deepgram" ? deepgram.getAnalyser() : null),
    [deepgram],
  );

  return {
    isRecording: active?.isRecording ?? false,
    isStarting: isStarting || (active?.isStarting ?? false),
    transcript: [carryOver, active?.transcript ?? ""].map((s) => s.trim()).filter(Boolean).join(" "),
    error: error ?? active?.error ?? null,
    start,
    stop,
    getAnalyser,
    engine,
  };
}

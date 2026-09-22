"use client";

// Deepgram streaming speech-to-text for the v3 AI Partner.
//
// Replaces the browser's Web Speech API as the PRIMARY microphone. Web Speech
// is not one engine — it's Chrome talking to Google, Safari talking to Apple,
// and Firefox refusing entirely — so accuracy, language handling, and basic
// availability all changed with the learner's device. Deepgram is one engine
// for every device, which is the whole point of the migration.
//
// useV3WebSpeechCapture is still there and still wired up: useV3SpeechCapture
// falls back to it whenever this hook can't run. Nothing here should ever
// leave the learner with a dead mic.
//
// Shape of a session:
//
//   1. GET /api/stt/token           → short-lived Deepgram JWT + wss:// URL
//   2. getUserMedia                 → mic stream
//   3. AudioContext + AudioWorklet  → raw PCM frames (linear16)
//   4. WebSocket → Deepgram         → Results messages, interim + final
//   5. stop(): release mic, CloseStream, drain trailing finals
//
// WHY RAW PCM AND NOT MediaRecorder: this is the decision that makes the
// feature work on phones. MediaRecorder's output format is per-browser —
// Chrome and Android give webm/opus, iOS Safari gives fragmented mp4/aac,
// which Deepgram's streaming endpoint does not accept. Capturing Float32
// frames from an AudioWorklet and converting them to linear16 ourselves
// produces byte-identical audio on every platform. The batch pronunciation
// path can keep using MediaRecorder because Deepgram's *pre-recorded* API
// sniffs containers; the streaming API does not.

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchSTTToken } from "@/lib/sttToken";

const LOG = "[v3deepgram]";

// Deepgram closes an idle socket after ~10s of no audio. We only stream while
// the learner holds the mic, but a long silent pause inside one recording is
// normal, so ping well inside that window.
const KEEPALIVE_MS = 8_000;

// After CloseStream, Deepgram flushes whatever it was still holding. Wait
// briefly for those trailing finals before reporting the recording as over —
// useV3PushToTalk sends the transcript on exactly that transition, so cutting
// this short truncates the learner's last few words.
const FLUSH_GRACE_MS = 900;

// Give the handshake a bounded window. A phone on bad mobile data should fall
// back to the browser engine quickly rather than sit on a dead mic button.
const CONNECT_TIMEOUT_MS = 6_000;

// AudioWorklet processor source. Shipped as a Blob URL rather than a file in
// public/ so there's no static asset to deploy, no path to get wrong across
// environments, and no extra network round trip before the mic can start.
const PCM_WORKLET_SOURCE = `
class PCMRecorder extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    const out = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let s = ch[i];
      if (s > 1) s = 1; else if (s < -1) s = -1;
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.port.postMessage(out.buffer, [out.buffer]);
    return true;
  }
}
registerProcessor('pcm-recorder', PCMRecorder);
`;

type DeepgramResults = {
  type?: string;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: { alternatives?: Array<{ transcript?: string }> };
};

export interface UseV3DeepgramCaptureOptions {
  accessToken: string | null;
  sessionId?: string | null;
  nativeLanguage?: string | null;
  /**
   * Called when a session dies AFTER it started (socket dropped, mic revoked).
   * useV3SpeechCapture uses this to hand the turn to the Web Speech engine
   * instead of leaving the learner talking into a closed socket.
   *
   * Receives whatever had been transcribed up to the failure so those words
   * can be carried into the fallback turn rather than lost with the socket.
   */
  onRuntimeFailure?: (spokenSoFar: string) => void;
}

export interface UseV3DeepgramCaptureResult {
  isRecording: boolean;
  isStarting: boolean;
  transcript: string;
  error: string | null;
  /** Resolves true when Deepgram is live; false means "use the fallback". */
  start: () => Promise<boolean>;
  stop: () => void;
  getAnalyser: () => AnalyserNode | null;
}

/**
 * Open the Deepgram socket, trying both documented browser auth schemes.
 *
 * Deepgram's own guidance is inconsistent here — their support threads point
 * at the `?access_token=` query parameter for JWTs, their docs show the
 * Sec-WebSocket-Protocol subprotocol. So we measured it instead of picking a
 * side: `go run ./cmd/sttcheck` in the API repo dials both against the live
 * API, and as of this writing the **subprotocol is the one that connects**
 * while the query parameter is rejected at the handshake.
 *
 * Order matters for latency, not just correctness. A recording cannot start
 * until the socket is up, so a first attempt that always fails puts a wasted
 * round trip in front of every single push-to-talk. The working scheme goes
 * first; the other stays as a fallback because this is exactly the kind of
 * vendor detail that flips back without notice. Re-run sttcheck to see which
 * is live today.
 */
async function openDeepgramSocket(url: string, token: string): Promise<WebSocket> {
  const attempts: Array<() => WebSocket> = [
    () => new WebSocket(url, ["bearer", token]),
    () => new WebSocket(`${url}&access_token=${encodeURIComponent(token)}`),
  ];

  let lastErr = "unknown";
  for (const open of attempts) {
    try {
      const ws = await new Promise<WebSocket>((resolve, reject) => {
        const sock = open();
        const timer = window.setTimeout(() => {
          try {
            sock.close();
          } catch {
            /* noop */
          }
          reject(new Error("connect timeout"));
        }, CONNECT_TIMEOUT_MS);

        sock.onopen = () => {
          window.clearTimeout(timer);
          resolve(sock);
        };
        sock.onerror = () => {
          window.clearTimeout(timer);
          reject(new Error("socket error"));
        };
        sock.onclose = (e) => {
          window.clearTimeout(timer);
          reject(new Error(`closed ${e.code}`));
        };
      });
      return ws;
    } catch (err) {
      lastErr = String(err);
      console.warn(`${LOG} auth attempt failed`, lastErr);
    }
  }
  throw new Error(lastErr);
}

export function useV3DeepgramCapture({
  accessToken,
  nativeLanguage,
  onRuntimeFailure,
}: UseV3DeepgramCaptureOptions): UseV3DeepgramCaptureResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletURLRef = useRef<string | null>(null);
  const keepAliveRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);

  const finalsRef = useRef<string[]>([]);
  const interimRef = useRef("");
  // Set once stop() has run, so a late socket close isn't reported as a
  // runtime failure and doesn't trigger a pointless fallback.
  const closingRef = useRef(false);

  const onRuntimeFailureRef = useRef(onRuntimeFailure);
  useEffect(() => {
    onRuntimeFailureRef.current = onRuntimeFailure;
  }, [onRuntimeFailure]);

  /** Release the microphone. Split out because timing matters — see stop(). */
  const releaseMic = useCallback(() => {
    if (nodeRef.current) {
      try {
        nodeRef.current.disconnect();
      } catch {
        /* noop */
      }
      nodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    analyserRef.current = null;
    if (workletURLRef.current) {
      URL.revokeObjectURL(workletURLRef.current);
      workletURLRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const ws = wsRef.current;
    if (ws) {
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        /* noop */
      }
    }
    wsRef.current = null;
    releaseMic();
  }, [releaseMic]);

  /** Fold Deepgram's finals + current interim into the visible transcript. */
  const publish = useCallback(() => {
    const finals = finalsRef.current.join(" ").trim();
    const interim = interimRef.current.trim();
    setTranscript([finals, interim].filter(Boolean).join(" "));
  }, []);

  const stop = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    // Release the mic FIRST, before waiting on the socket. While the mic is
    // held, a Bluetooth headset stays in the low-quality HFP "call" profile,
    // so K.AI's reply plays back muffled. This is the same reason the Web
    // Speech hook calls abort() instead of stop(). The audio for everything
    // the learner already said is on the wire; nothing is lost by cutting
    // capture here.
    releaseMic();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        // CloseStream tells Deepgram to finalize what it's holding rather
        // than discard it, which is where the tail of the last sentence
        // usually lives.
        ws.send(JSON.stringify({ type: "CloseStream" }));
      } catch {
        /* noop */
      }
    }

    // Drain trailing finals, THEN flip isRecording. useV3PushToTalk fires
    // onCapture on that transition and reads whatever transcript state holds
    // at the time, so flipping early silently truncates the turn.
    flushTimerRef.current = window.setTimeout(() => {
      teardown();
      setIsRecording(false);
      setIsStarting(false);
    }, FLUSH_GRACE_MS);
  }, [releaseMic, teardown]);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    setTranscript("");
    finalsRef.current = [];
    interimRef.current = "";
    closingRef.current = false;

    if (!accessToken) {
      console.warn(`${LOG} no access token — falling back`);
      return false;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    setIsStarting(true);

    try {
      // 1 — credential. A "browser" verdict here is a normal answer, not an
      // error: Deepgram may be unconfigured or temporarily unreachable.
      const cred = await fetchSTTToken(accessToken, nativeLanguage ?? null);
      if (cred.provider !== "deepgram" || !cred.accessToken || !cred.url) {
        console.info(`${LOG} server says use browser stt:`, cred.reason);
        setIsStarting(false);
        return false;
      }

      // 2 — microphone. Echo cancellation matters more than usual here: K.AI
      // speaks through the same device, and without it the learner's mic
      // re-transcribes the AI's own voice back into their turn.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // 3 — audio graph. Ask for 16 kHz (Deepgram's native rate for these
      // models, and a quarter of the bytes of 48 kHz on mobile data) but
      // never depend on getting it: Safari has historically ignored the hint.
      // Whatever rate we actually get is what we declare to Deepgram, so a
      // refused hint costs bandwidth, never correctness.
      const AC: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      let ctx: AudioContext;
      try {
        ctx = new AC({ sampleRate: 16_000 });
      } catch {
        ctx = new AC();
      }
      ctxRef.current = ctx;
      // iOS starts contexts suspended until a user gesture. The mic button
      // click is that gesture, so this resolves — but it must be awaited or
      // the worklet produces silence.
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);

      // The analyser is a genuine upgrade over the Web Speech path, which had
      // no access to raw audio and returned null here — leaving MicLevelRing
      // permanently idle. It now animates to the learner's actual voice.
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 4 — socket, before wiring audio, so no frames are captured and
      // dropped while the handshake is in flight.
      const url = `${cred.url}&encoding=linear16&sample_rate=${Math.round(ctx.sampleRate)}&channels=1`;
      const ws = await openDeepgramSocket(url, cred.accessToken);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        let msg: DeepgramResults;
        try {
          msg = JSON.parse(event.data) as DeepgramResults;
        } catch {
          return;
        }
        if (msg.type !== "Results") return; // Metadata / SpeechStarted / UtteranceEnd
        const text = (msg.channel?.alternatives?.[0]?.transcript ?? "").trim();
        if (msg.is_final) {
          // Deepgram's finals are disjoint segments, so plain accumulation is
          // correct here. (Web Speech needed whole-word merge logic because
          // its engines re-emit the whole growing phrase; Deepgram does not.)
          if (text) finalsRef.current.push(text);
          interimRef.current = "";
        } else {
          interimRef.current = text;
        }
        publish();
      };

      ws.onerror = () => {
        console.warn(`${LOG} socket error`);
      };

      ws.onclose = () => {
        if (closingRef.current) return; // our own stop() — expected
        console.warn(`${LOG} socket closed mid-recording`);
        const spokenSoFar = [finalsRef.current.join(" "), interimRef.current]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(" ");
        teardown();
        setIsRecording(false);
        setIsStarting(false);
        onRuntimeFailureRef.current?.(spokenSoFar);
      };

      // 5 — PCM tap. AudioWorklet runs on the audio thread and is supported
      // everywhere we care about (Chrome, Safari 14.1+, Firefox). The
      // ScriptProcessor fallback is deprecated but universally available, and
      // covers the long tail of older Android WebViews.
      let tap: AudioNode;
      if (ctx.audioWorklet) {
        const blob = new Blob([PCM_WORKLET_SOURCE], { type: "application/javascript" });
        const workletURL = URL.createObjectURL(blob);
        workletURLRef.current = workletURL;
        await ctx.audioWorklet.addModule(workletURL);
        const worklet = new AudioWorkletNode(ctx, "pcm-recorder");
        worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data);
          }
        };
        tap = worklet;
      } else {
        const proc = ctx.createScriptProcessor(4096, 1, 1);
        proc.onaudioprocess = (e) => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const out = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          wsRef.current.send(out.buffer);
        };
        // ScriptProcessor only fires while connected to a destination; the
        // zero gain keeps the learner from hearing themselves echoed back.
        const mute = ctx.createGain();
        mute.gain.value = 0;
        proc.connect(mute);
        mute.connect(ctx.destination);
        tap = proc;
      }
      source.connect(tap);
      nodeRef.current = tap;

      keepAliveRef.current = window.setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "KeepAlive" }));
        }
      }, KEEPALIVE_MS);

      setIsStarting(false);
      setIsRecording(true);
      return true;
    } catch (err) {
      console.warn(`${LOG} start failed — falling back`, err);
      // Permission denial is the one failure the browser engine can't rescue:
      // it will hit the same wall. Surface it so the learner knows to fix it.
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Microphone access denied. Allow it in your browser and try again.");
      } else if (name === "NotFoundError") {
        setError("No microphone detected. Plug one in and try again.");
      }
      teardown();
      setIsStarting(false);
      setIsRecording(false);
      return false;
    }
  }, [accessToken, nativeLanguage, publish, teardown]);

  useEffect(() => {
    return () => {
      closingRef.current = true;
      teardown();
    };
  }, [teardown]);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return { isRecording, isStarting, transcript, error, start, stop, getAnalyser };
}

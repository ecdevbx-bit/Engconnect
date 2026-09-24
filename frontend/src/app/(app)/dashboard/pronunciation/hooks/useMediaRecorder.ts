"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Thin wrapper over the browser MediaRecorder API. Records audio/webm with
// the opus codec where supported; falls back to default container otherwise.
// The hook intentionally exposes raw start/stop + a `blob` output rather
// than baking in the timing logic — that lives in useRecorderStateMachine.

export type RecorderError =
  | "no-media-devices"
  | "permission-denied"
  | "not-supported"
  | "internal";

const PREFERRED_MIME = "audio/webm;codecs=opus";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) return PREFERRED_MIME;
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return undefined;
}

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<RecorderError | null>(null);
  // The active mic stream, exposed so a live visualizer (waveform) can tap
  // it via a Web Audio analyser. Null whenever nothing is recording.
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Voice activity on the live mic (~100 ms RMS checks): `speechEnded` flips
  // once the learner has spoken and then gone quiet, so the take can stop by
  // itself; getVoicedMs() tells the caller whether anything was said at all.
  const [speechEnded, setSpeechEnded] = useState(false);
  const voicedMsRef = useRef(0);
  const vadRef = useRef<{ ctx: AudioContext; timer: number } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  // Bumped by stop/reset/unmount: a start() still waiting on the permission
  // prompt sees it changed and releases the mic instead of recording forever.
  const genRef = useRef(0);

  // Tear everything down — stop tracks, drop the recorder. Safe to call
  // when nothing is running.
  const stopVad = useCallback(() => {
    const v = vadRef.current;
    if (!v) return;
    window.clearInterval(v.timer);
    void v.ctx.close().catch(() => {});
    vadRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    genRef.current++;
    stopVad();
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, [stopVad]);

  useEffect(() => cleanup, [cleanup]);

  // Resolves true once the mic is actually recording (false on error or when
  // cancelled while the permission prompt was open).
  const start = useCallback(async (): Promise<boolean> => {
    const gen = ++genRef.current;
    setError(null);
    setBlob(null);
    chunksRef.current = [];

    // A previous take that never stopped: release its mic and analyser first.
    stopVad();
    const old = recorderRef.current;
    if (old) {
      old.ondataavailable = null;
      old.onstop = null;
      if (old.state !== "inactive") old.stop();
      recorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("no-media-devices");
      return false;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("not-supported");
      return false;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (gen === genRef.current) setError("permission-denied");
      return false;
    }
    if (gen !== genRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setError("internal");
      return false;
    }

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      setBlob(new Blob(chunksRef.current, { type }));
      setIsRecording(false);
    };
    recorder.onerror = () => {
      setError("internal");
      setIsRecording(false);
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    recorder.start();
    setIsRecording(true);
    setStream(stream);

    voicedMsRef.current = 0;
    setSpeechEnded(false);
    try {
      const AC: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      // Created after an await (not in a tap), so Safari may start it
      // suspended — then the level meter would read silence forever.
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let silentMs = 0;
      // Quiet laptop mics sit near the floor, so "voice" is measured against
      // this room's own noise level (with a low absolute floor as a backstop).
      let noise = 0.004;
      const timer = window.setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const x of samples) sum += x * x;
        const rms = Math.sqrt(sum / samples.length);
        const speaking = rms > Math.max(0.008, noise * 3);
        if (speaking) {
          voicedMsRef.current += 100;
          silentMs = 0;
        } else {
          noise = noise * 0.9 + rms * 0.1; // track the room while they're quiet
          silentMs += 100;
        }
        if (voicedMsRef.current >= 400 && silentMs >= 1300) setSpeechEnded(true);
      }, 100);
      vadRef.current = { ctx, timer };
    } catch {
      // No Web Audio: the time limit still ends the take.
    }
    return true;
  }, [stopVad]);

  const getVoicedMs = useCallback(() => voicedMsRef.current, []);
  // False when the level meter isn't running (no Web Audio, or the context
  // stayed suspended) — then "no voice heard" means nothing and the take is
  // sent anyway (the server rejects real silence itself).
  const canDetectSpeech = useCallback(() => vadRef.current?.ctx.state === "running", []);

  const stop = useCallback((): number => {
    genRef.current++;
    stopVad();
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    const duration = startedAtRef.current ? Math.round(performance.now() - startedAtRef.current) : 0;
    startedAtRef.current = 0;
    return duration;
  }, [stopVad]);

  const reset = useCallback(() => {
    genRef.current++;
    setBlob(null);
    setError(null);
    setSpeechEnded(false);
    chunksRef.current = [];
  }, []);

  return { isRecording, blob, error, stream, speechEnded, getVoicedMs, canDetectSpeech, start, stop, reset };
}

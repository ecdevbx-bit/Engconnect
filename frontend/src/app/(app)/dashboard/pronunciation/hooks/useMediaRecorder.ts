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

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);

  // Tear everything down — stop tracks, drop the recorder. Safe to call
  // when nothing is running.
  const cleanup = useCallback(() => {
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async (): Promise<void> => {
    setError(null);
    setBlob(null);
    chunksRef.current = [];

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("no-media-devices");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("not-supported");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("permission-denied");
      return;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setError("internal");
      return;
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
  }, []);

  const stop = useCallback((): number => {
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
  }, []);

  const reset = useCallback(() => {
    setBlob(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  return { isRecording, blob, error, stream, start, stop, reset };
}

"use client";

import { useEffect, useRef } from "react";

// Live recording waveform. Taps the active mic MediaStream through a Web
// Audio analyser and paints amplitude bars scrolling right-to-left past a
// red playhead — the in-app replacement for the default browser recorder UI.
//
// The analyser is rebuilt whenever the stream changes; the draw loop reads
// the analyser ref live each frame, so it picks up (and drops) the stream
// without restarting.

const BAR_COUNT = 150;
const BAR_WIDTH = 2.5;
const BAR_SPACING = 4.5;

export function RecordingWaveform({
  stream,
  demo = false,
}: {
  stream: MediaStream | null;
  /** Landing-demo mode: paints a lively synthetic waveform (no mic). */
  demo?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const historyRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Build / tear down the analyser as the stream comes and goes.
  useEffect(() => {
    if (!stream) {
      analyserRef.current = null;
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AC();
    // Auto-start (after the countdown) isn't a direct click, so the context
    // can come up suspended — resume it or the analyser reads silence.
    void audioCtx.resume();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;
    historyRef.current = new Array(BAR_COUNT).fill(0);

    return () => {
      source.disconnect();
      analyser.disconnect();
      void audioCtx.close();
      analyserRef.current = null;
    };
  }, [stream]);

  // Single draw loop for the canvas lifetime.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Current amplitude (RMS) from the live analyser, or a quiet floor.
      let amplitude = 0.04;
      const analyser = analyserRef.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        amplitude = Math.min(1, Math.max(0.04, rms * 6));
      } else if (demo) {
        // No mic in the landing demo — fake a lively, speech-like waveform
        // from layered sine waves (deterministic, so it stays lint-pure).
        const t = frameRef.current;
        amplitude = Math.min(
          1,
          0.28 +
            0.24 * Math.abs(Math.sin(t * 0.18)) +
            0.18 * Math.abs(Math.sin(t * 0.31 + 1)) +
            0.12 * Math.abs(Math.sin(t * 0.53 + 2)),
        );
      }

      // Advance the history every other frame for a calmer scroll speed.
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) {
        historyRef.current.unshift(amplitude);
        if (historyRef.current.length > BAR_COUNT) historyRef.current.pop();
      }

      const playheadX = width - 24;
      ctx.fillStyle = "#ecedf6"; // --heading
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < historyRef.current.length; i++) {
        const x = playheadX - i * BAR_SPACING - BAR_SPACING;
        if (x < 0) break;
        const barHeight = Math.max(2, historyRef.current[i] * height * 0.9);
        const y = height / 2 - barHeight / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Red playhead line.
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(playheadX, 0, 1.5, height);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [demo]);

  return (
    <canvas
      ref={canvasRef}
      width={432}
      height={96}
      aria-hidden="true"
      className="h-24 w-full max-w-md"
    />
  );
}

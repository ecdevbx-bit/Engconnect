"use client";

import { useEffect, useRef } from "react";
import { readLevel, stateColor, type AgentState } from "./agentConfig";

const SIZE = 200;
const BARS = 96;
const BLOB_POINTS = 64;
const PARTICLES = 12;

// Simple 2D noise for organic blob deformation
function noise(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 1.2 + t * 0.7) * 0.3 +
    Math.sin(y * 0.9 + t * 1.1) * 0.3 +
    Math.sin((x + y) * 0.7 + t * 0.5) * 0.2 +
    Math.sin(x * 2.1 - t * 0.9) * 0.2
  );
}

export default function AgentOrb({
  state,
  getInputAnalyser,
  getOutputAnalyser,
}: {
  state: AgentState;
  getInputAnalyser: () => AnalyserNode | null;
  getOutputAnalyser: () => AnalyserNode | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const timeBuf = new Uint8Array(new ArrayBuffer(1024));
    const freqBuf = new Uint8Array(new ArrayBuffer(512));
    const spectrum = new Float32Array(BARS);
    const ripples: number[] = [0.0, 0.33, 0.66];
    const particles = Array.from({ length: PARTICLES }, (_, i) => ({
      angle: (i / PARTICLES) * Math.PI * 2,
      dist: 0.6 + Math.random() * 0.4,
      speed: 0.3 + Math.random() * 0.7,
      size: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));
    let smLevel = 0;
    let rot = 0;
    let raf = 0;

    const hexToRgb = (h: string) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
    };

    const drawBlob = (
      cx: number, cy: number, baseR: number, time: number,
      amplitude: number, color: string, alpha: number, lineW: number, fill: boolean,
    ) => {
      ctx.beginPath();
      for (let i = 0; i <= BLOB_POINTS; i++) {
        const t = (i / BLOB_POINTS) * Math.PI * 2;
        const nx = Math.cos(t);
        const ny = Math.sin(t);
        const deform = noise(nx * 3, ny * 3, time) * (6 + amplitude * 18);
        const r = baseR + deform;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lineW;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const loop = () => {
      const s = stateRef.current;
      const color = stateColor(s);
      const [r, g, b] = hexToRgb(color);
      const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
      const analyser =
        s === "listening" ? getInputAnalyser() : s === "speaking" ? getOutputAnalyser() : null;

      const now = performance.now() / 1000;
      let level = analyser ? readLevel(analyser, timeBuf) : 0;
      if (!analyser) level = 0.15 + 0.08 * Math.sin(now * 0.8);
      smLevel += (level - smLevel) * 0.18;

      if (analyser) analyser.getByteFrequencyData(freqBuf);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const baseR = 30 + smLevel * 14;
      ctx.clearRect(0, 0, SIZE, SIZE);

      // ── 1. deep ambient glow ──
      const ambientR = 85 + smLevel * 20;
      const ambient = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, ambientR);
      ambient.addColorStop(0, rgba(0.25 + smLevel * 0.35));
      ambient.addColorStop(0.5, rgba(0.08 + smLevel * 0.1));
      ambient.addColorStop(1, rgba(0));
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // ── 2. outer blob layers (ghostly, organic) ──
      drawBlob(cx, cy, baseR + 22, now * 0.4, smLevel, color, 0.04 + smLevel * 0.04, 0, true);
      drawBlob(cx, cy, baseR + 14, now * 0.6, smLevel, color, 0.07 + smLevel * 0.06, 0, true);
      drawBlob(cx, cy, baseR + 8, now * 0.55 + 1, smLevel, rgba(0.12), 1, 1.2, false);

      // ── 3. rotating spectral corona ──
      rot += 0.004 + smLevel * 0.025;
      const ringR = baseR + 5;
      for (let i = 0; i < BARS; i++) {
        const half = i < BARS / 2 ? i : BARS - 1 - i;
        const bin = Math.floor((half / (BARS / 2)) * 180);
        let v = analyser ? freqBuf[bin] / 255 : 0;
        if (!analyser) v = 0.08 + 0.08 * Math.sin(now * 0.9 + i * 0.4);
        spectrum[i] += (v - spectrum[i]) * 0.3;
        const len = 3 + spectrum[i] * 24;
        const ang = (i / BARS) * Math.PI * 2 + rot;
        const x0 = cx + Math.cos(ang) * ringR;
        const y0 = cy + Math.sin(ang) * ringR;
        const x1 = cx + Math.cos(ang) * (ringR + len);
        const y1 = cy + Math.sin(ang) * (ringR + len);
        ctx.strokeStyle = rgba(0.35 + spectrum[i] * 0.65);
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // ── 4. expanding echo rings ──
      for (let i = 0; i < ripples.length; i++) {
        ripples[i] += 0.005 + smLevel * 0.014;
        if (ripples[i] > 1) ripples[i] -= 1;
        const p = ripples[i];
        const ringAlpha = (1 - p) * (0.25 + smLevel * 0.2);
        ctx.strokeStyle = rgba(ringAlpha);
        ctx.lineWidth = 1.2 * (1 - p);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR + 8 + p * 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── 5. the core blob (organic, not a circle) ──
      ctx.save();
      ctx.shadowBlur = 28 + smLevel * 16;
      ctx.shadowColor = color;

      // core fill with gradient
      const coreGrad = ctx.createRadialGradient(
        cx - baseR * 0.3, cy - baseR * 0.35, 1, cx, cy, baseR + 4,
      );
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.35, color);
      coreGrad.addColorStop(1, "#1a1530");
      ctx.fillStyle = coreGrad;

      ctx.beginPath();
      for (let i = 0; i <= BLOB_POINTS; i++) {
        const t = (i / BLOB_POINTS) * Math.PI * 2;
        const nx = Math.cos(t);
        const ny = Math.sin(t);
        const deform = noise(nx * 2.5, ny * 2.5, now * 0.7) * (4 + smLevel * 12);
        const rr = baseR + deform;
        const x = cx + Math.cos(t) * rr;
        const y = cy + Math.sin(t) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // sheen arc
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR - 5, rot * 1.5, rot * 1.5 + 1.2);
      ctx.stroke();

      // inner highlight
      const hlSize = baseR * 0.22;
      const hlGrad = ctx.createRadialGradient(
        cx - baseR * 0.28, cy - baseR * 0.3, 0,
        cx - baseR * 0.28, cy - baseR * 0.3, hlSize,
      );
      hlGrad.addColorStop(0, "rgba(255,255,255,0.7)");
      hlGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hlGrad;
      ctx.beginPath();
      ctx.arc(cx - baseR * 0.28, cy - baseR * 0.3, hlSize, 0, Math.PI * 2);
      ctx.fill();

      // ── 6. orbiting particles ──
      for (const p of particles) {
        const orbitR = ringR + 18 + Math.sin(now * p.speed + p.phase) * 8;
        const ang = p.angle - rot * 2.2 * p.speed;
        const px = cx + Math.cos(ang) * orbitR * p.dist;
        const py = cy + Math.sin(ang) * orbitR * p.dist;
        const pSize = p.size + smLevel * 2.5;

        // particle glow
        const pGrad = ctx.createRadialGradient(px, py, 0, px, py, pSize * 2.5);
        pGrad.addColorStop(0, rgba(0.5 + smLevel * 0.5));
        pGrad.addColorStop(1, rgba(0));
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, pSize * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // particle core
        ctx.fillStyle = rgba(0.7 + smLevel * 0.3);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getInputAnalyser, getOutputAnalyser]);

  return <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} aria-hidden="true" />;
}

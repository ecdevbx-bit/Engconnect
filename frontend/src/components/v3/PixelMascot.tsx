"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { MascotEmotion } from "@/lib/emotion";

// PixelMascot — a procedural 64×64 pixel-art robot rendered on a canvas, with
// a rich emotional spectrum + on-canvas particle effects (hearts, tears,
// sweat, sparks, stars). Shared across Jumble, Pronunciation, and AI Partner.
//
// emotion / isThinking are read through refs inside a single rAF loop, so
// changing them retargets the animation live instead of restarting it.

type Particle = { x: number; y: number; type: string; life: number; vx: number; vy: number };

export function PixelMascot({
  emotion = "idle",
  isThinking = false,
  paused = false,
  size = 200,
  className,
}: {
  emotion?: MascotEmotion;
  isThinking?: boolean;
  /** Freeze the animation on its current pose (still drawn, just static). */
  paused?: boolean;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const emotionRef = useRef<MascotEmotion>(emotion);
  const thinkingRef = useRef<boolean>(isThinking);
  const pausedRef = useRef<boolean>(paused);

  // Keep the refs the rAF loop reads in sync with the latest props (runs
  // after every render — retargets the live animation without restarting it).
  useEffect(() => {
    emotionRef.current = emotion;
    thinkingRef.current = isThinking;
    pausedRef.current = paused;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    // Virtual clock — only advances while not paused, so `paused` freezes the
    // mascot on its current pose (it's still drawn, just no longer animating).
    let clock = 0;
    let lastReal = Date.now();
    const startTime = 0;
    let lastBlink = 0;
    let isBlinking = false;

    const draw = () => {
      const real = Date.now();
      if (!pausedRef.current) clock += real - lastReal;
      lastReal = real;
      const emotion = emotionRef.current;
      const isThinking = thinkingRef.current;
      const time = clock;
      const dt = time - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 64;
      const pixelSize = canvas.width / gridSize;

      const drawRect = (gx: number, gy: number, gw: number, gh: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(gx * pixelSize), Math.floor(gy * pixelSize), Math.ceil(gw * pixelSize), Math.ceil(gh * pixelSize));
      };

      let globalXOff = 0;
      let globalYOff = 0;
      let headYOff = 0;
      let leftArmRot = 0;
      let rightArmRot = 0;

      const P = particlesRef.current;
      if (emotion === "love" && Math.random() < 0.05) {
        P.push({ x: 32 + (Math.random() * 40 - 20), y: 32, type: "heart", life: 1, vx: (Math.random() - 0.5) * 0.5, vy: -1 - Math.random() });
      } else if ((emotion === "confused" || emotion === "asking") && Math.random() < 0.03) {
        P.push({ x: 32 + (Math.random() * 20 - 10), y: 16, type: "question", life: 1, vx: 0, vy: -0.5 });
      } else if (emotion === "scared" && Math.random() < 0.1) {
        P.push({ x: 32 + (Math.random() * 24 - 12), y: 20 + Math.random() * 10, type: "sweat", life: 1, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
      } else if (emotion === "idea" && Math.random() < 0.1) {
        P.push({ x: 32 + (Math.random() * 10 - 5), y: 10, type: "spark", life: 1, vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() });
      } else if (emotion === "tips" && Math.random() < 0.05) {
        P.push({ x: 32 + (Math.random() * 30 - 15), y: 16, type: "star", life: 1, vx: 0, vy: -0.5 });
      }

      if (emotion === "happy") {
        globalYOff = Math.abs(Math.sin(dt / 120)) * -4;
        leftArmRot = 1; rightArmRot = 1;
      } else if (emotion === "sad") {
        globalYOff = Math.sin(dt / 600) * 1 + 2; headYOff = 2; leftArmRot = -0.5; rightArmRot = -0.5;
      } else if (emotion === "angry") {
        globalXOff = (Math.random() - 0.5) * 3; globalYOff = (Math.random() - 0.5) * 3; leftArmRot = 0.5; rightArmRot = 0.5;
      } else if (emotion === "surprised") {
        headYOff = -3; globalYOff = -1; leftArmRot = 0.8; rightArmRot = 0.8;
      } else if (emotion === "scared") {
        globalXOff = Math.sin(dt / 20) * 2; leftArmRot = -0.2; rightArmRot = -0.2;
      } else if (emotion === "love") {
        globalYOff = Math.sin(dt / 300) * 2 - 2;
      } else if (emotion === "confused") {
        headYOff = Math.sin(dt / 400) * 1; leftArmRot = 0.9; rightArmRot = 0;
      } else if (emotion === "idea") {
        headYOff = -4; globalYOff = -2; leftArmRot = 1; rightArmRot = 1;
      } else if (emotion === "tips") {
        headYOff = 1; leftArmRot = 0.8; rightArmRot = -0.5;
      } else if (emotion === "greeting") {
        headYOff = -1; leftArmRot = Math.sin(dt / 80) > 0 ? 1 : 0.5; rightArmRot = -0.5;
      } else if (emotion === "asking") {
        headYOff = 1; leftArmRot = 0.5; rightArmRot = 0;
      } else if (emotion === "conversing") {
        globalYOff = Math.sin(dt / 300) * 1; leftArmRot = Math.sin(dt / 250) * 0.4 + 0.1; rightArmRot = Math.cos(dt / 250) * 0.4 + 0.1;
      } else {
        globalYOff = Math.sin(dt / 400) * 1.5;
      }

      if (isThinking && emotion !== "thinking") {
        globalYOff = Math.sin(dt / 200) * 2;
      }

      if (time - lastBlink > 3000 + Math.random() * 3000) { isBlinking = true; lastBlink = time; }
      if (isBlinking && time - lastBlink > 150) { isBlinking = false; }

      ctx.save();
      ctx.translate(globalXOff * pixelSize, globalYOff * pixelSize);

      const colors = {
        base: "#64748b", highlight: "#94a3b8", shadow: "#334155", dark: "#0f172a",
        accent: "#f59e0b", accentShadow: "#b45309", screen: "#020617", eye: "#10b981",
      };
      if (emotion === "angry") { colors.accent = "#ef4444"; colors.accentShadow = "#b91c1c"; colors.eye = "#ef4444"; }
      if (emotion === "sad") { colors.accent = "#3b82f6"; colors.accentShadow = "#1d4ed8"; colors.eye = "#60a5fa"; }
      if (emotion === "happy" || emotion === "love") { colors.accent = "#f43f5e"; colors.accentShadow = "#be123c"; }
      if (emotion === "love") colors.eye = "#f43f5e";
      if (emotion === "happy") colors.eye = "#fbbf24";
      if (emotion === "scared") colors.eye = "#cbd5e1";
      if (emotion === "idea") { colors.accent = "#facc15"; colors.accentShadow = "#a16207"; colors.eye = "#eab308"; }
      if (emotion === "tips") { colors.accent = "#22d3ee"; colors.accentShadow = "#0891b2"; colors.eye = "#06b6d4"; }
      if (emotion === "greeting") { colors.accent = "#34d399"; colors.accentShadow = "#059669"; colors.eye = "#10b981"; }
      if (emotion === "asking") { colors.accent = "#fb923c"; colors.accentShadow = "#c2410c"; colors.eye = "#f97316"; }
      if (emotion === "conversing") { colors.accent = "#818cf8"; colors.accentShadow = "#4338ca"; colors.eye = "#6366f1"; }
      if (isThinking || emotion === "thinking") { colors.accent = "#10b981"; colors.accentShadow = "#047857"; colors.eye = "#10b981"; }

      // 1. Treads / base
      const baseY = 54;
      drawRect(16, baseY, 32, 6, colors.dark);
      drawRect(14, baseY + 2, 36, 4, colors.shadow);
      const treadOffset = Math.floor(time / 50) % 4;
      for (let i = 0; i < 8; i++) drawRect(16 + i * 4 + treadOffset - 2, baseY + 2, 2, 4, colors.base);

      // 2. Torso
      const torsoY = 34;
      drawRect(20, torsoY, 24, baseY - torsoY, colors.base);
      drawRect(20, torsoY, 24, 2, colors.highlight);
      drawRect(42, torsoY, 2, baseY - torsoY, colors.shadow);
      drawRect(26, torsoY + 4, 12, 8, colors.dark);
      if (emotion === "love" || isThinking) {
        const pulse = (Math.sin(dt / 150) + 1) / 2;
        drawRect(30 - pulse, torsoY + 7 - pulse, 4 + pulse * 2, 2 + pulse * 2, emotion === "love" ? "#f43f5e" : "#10b981");
      } else {
        drawRect(30, torsoY + 7, 4, 2, colors.eye);
      }

      // 3. Arms
      const drawArm = (isLeft: boolean, rotPhase: number) => {
        const ax = isLeft ? 12 : 44;
        const ay = torsoY + 2;
        let endY = ay + 10;
        let endX = ax;
        if (rotPhase > 0) { endY = ay - 8; endX = isLeft ? ax - 4 : ax + 4; }
        else if (rotPhase < 0) { endY = ay + 6; endX = isLeft ? ax + 4 : ax - 4; }
        drawRect(isLeft ? 16 : 44, ay, 4, 6, colors.dark);
        ctx.strokeStyle = colors.base;
        ctx.lineWidth = 4 * pixelSize;
        ctx.beginPath();
        ctx.moveTo((isLeft ? 18 : 46) * pixelSize, (ay + 3) * pixelSize);
        ctx.lineTo((endX + 4) * pixelSize, (endY + 4) * pixelSize);
        ctx.stroke();
        drawRect(endX, endY, 8, 8, colors.base);
        drawRect(endX + 1, endY + 1, 6, 6, colors.highlight);
        drawRect(endX + 2, endY + 8, 1, 3, colors.dark);
        drawRect(endX + 5, endY + 8, 1, 3, colors.dark);
      };
      drawArm(true, leftArmRot);
      drawArm(false, rightArmRot);

      // 4. Neck
      drawRect(28, torsoY - 4 + headYOff, 8, 4 - headYOff, colors.shadow);
      drawRect(30, torsoY - 4 + headYOff, 4, 4 - headYOff, colors.highlight);

      // 5. Head
      const headX = 16;
      const headY = 12 + headYOff;
      drawRect(31, headY - 10, 2, 10, colors.highlight);
      drawRect(29, headY - 14, 6, 4, colors.accent);
      const ap = (Math.sin(dt / 100) + 1) / 2;
      drawRect(30 - ap, headY - 13 - ap, 4 + ap * 2, 2 + ap * 2, isThinking ? "#10b981" : colors.eye);
      drawRect(12, headY + 8, 4, 10, colors.base);
      drawRect(10, headY + 10, 2, 6, colors.highlight);
      drawRect(48, headY + 8, 4, 10, colors.base);
      drawRect(52, headY + 10, 2, 6, colors.highlight);
      drawRect(headX, headY, 32, 24, colors.base);
      drawRect(headX, headY, 32, 2, colors.highlight);
      drawRect(headX, headY, 2, 24, colors.highlight);
      drawRect(headX, headY + 22, 32, 2, colors.shadow);
      drawRect(headX + 30, headY, 2, 24, colors.shadow);

      // 6. Screen
      const screenX = 20;
      const screenY = headY + 4;
      drawRect(screenX, screenY, 24, 16, colors.screen);

      const drawEye = (cx: number, cy: number, type: string) => {
        const ex = cx - 2;
        const ey = cy - 2;
        if (isBlinking && !["angry", "happy", "love", "scared", "surprised"].includes(emotion)) {
          drawRect(ex, ey + 2, 5, 1, colors.eye);
          return;
        }
        if (type === "normal") {
          drawRect(ex, ey, 4, 4, colors.eye);
          drawRect(ex + 2, ey + 1, 1, 1, "#ffffff");
        } else if (type === "happy") {
          drawRect(ex, ey + 2, 1, 2, colors.eye);
          drawRect(ex + 1, ey + 1, 2, 1, colors.eye);
          drawRect(ex + 3, ey + 2, 1, 2, colors.eye);
        } else if (type === "sad") {
          drawRect(ex, ey + 1, 2, 1, colors.eye);
          drawRect(ex + 1, ey + 2, 2, 1, colors.eye);
          if (time % 2000 > 1000) drawRect(cx - 1, cy + 3 + (time % 1000) / 150, 2, 2, "#60a5fa");
        } else if (type === "angry") {
          drawRect(ex, ey, 2, 1, colors.eye);
          drawRect(ex + 1, ey + 1, 3, 2, colors.eye);
          drawRect(ex + 2, ey + 3, 2, 1, colors.eye);
        } else if (type === "surprised") {
          drawRect(ex, ey - 1, 4, 6, colors.eye);
          drawRect(ex + 1, ey, 2, 4, colors.screen);
        } else if (type === "love") {
          drawRect(ex - 1, ey - 1, 2, 2, colors.eye);
          drawRect(ex + 3, ey - 1, 2, 2, colors.eye);
          drawRect(ex - 2, ey + 1, 8, 2, colors.eye);
          drawRect(ex - 1, ey + 3, 6, 2, colors.eye);
          drawRect(ex + 1, ey + 5, 2, 2, colors.eye);
          drawRect(ex + 2, ey, 1, 1, "#ffffff");
        } else if (type === "dot") {
          drawRect(cx - 1, cy - 1, 2, 2, colors.eye);
        } else if (type === "wide") {
          drawRect(ex - 1, ey - 1, 6, 6, colors.eye);
          drawRect(ex + 2, ey + 1, 2, 2, "#ffffff");
        }
      };

      const leftEyeX = screenX + 6;
      const rightEyeX = screenX + 18;
      const eyeY = screenY + 7;

      if (isThinking && emotion !== "thinking") {
        const d1 = (Math.sin(dt / 200) + 1) / 2;
        const d2 = (Math.sin(dt / 200 + 1) + 1) / 2;
        const d3 = (Math.sin(dt / 200 + 2) + 1) / 2;
        drawRect(screenX + 6, eyeY, 2, 2, `rgba(16, 185, 129, ${d1})`);
        drawRect(screenX + 11, eyeY, 2, 2, `rgba(16, 185, 129, ${d2})`);
        drawRect(screenX + 16, eyeY, 2, 2, `rgba(16, 185, 129, ${d3})`);
      } else {
        switch (emotion) {
          case "happy": drawEye(leftEyeX, eyeY, "happy"); drawEye(rightEyeX, eyeY, "happy"); break;
          case "sad": drawEye(leftEyeX, eyeY + 2, "sad"); drawEye(rightEyeX, eyeY + 2, "sad"); break;
          case "angry": drawEye(leftEyeX, eyeY, "angry"); drawEye(rightEyeX, eyeY, "angry"); break;
          case "surprised": drawEye(leftEyeX, eyeY - 1, "surprised"); drawEye(rightEyeX, eyeY - 1, "surprised"); break;
          case "love": drawEye(leftEyeX, eyeY - 1, "love"); drawEye(rightEyeX, eyeY - 1, "love"); break;
          case "scared": drawEye(leftEyeX + (Math.random() * 2 - 1), eyeY, "dot"); drawEye(rightEyeX + (Math.random() * 2 - 1), eyeY, "dot"); break;
          case "confused": drawEye(leftEyeX, eyeY, "wide"); drawEye(rightEyeX, eyeY, "dot"); break;
          case "idea": drawEye(leftEyeX, eyeY - 1, "surprised"); drawEye(rightEyeX, eyeY - 1, "surprised"); break;
          case "tips": drawEye(leftEyeX, eyeY, "normal"); drawEye(rightEyeX, eyeY, "happy"); break;
          case "greeting": drawEye(leftEyeX, eyeY, "happy"); drawEye(rightEyeX, eyeY, "happy"); break;
          case "asking": drawEye(leftEyeX, eyeY, "wide"); drawEye(rightEyeX, eyeY - 1, "normal"); break;
          case "conversing": drawEye(leftEyeX, eyeY - 1, "normal"); drawEye(rightEyeX, eyeY - 1, "normal"); break;
          case "thinking":
            drawEye(leftEyeX, eyeY - 1, "normal");
            drawEye(rightEyeX, eyeY - 1, "normal");
            drawRect(screenX + 11, eyeY - 4 + Math.sin(dt / 150) * 2, 2, 2, colors.eye);
            break;
          default: drawEye(leftEyeX, eyeY, "normal"); drawEye(rightEyeX, eyeY, "normal"); break;
        }
        if (emotion === "conversing") {
          const wave1 = Math.abs(Math.sin(dt / 100));
          const wave2 = Math.abs(Math.cos(dt / 130));
          const wave3 = Math.abs(Math.sin(dt / 160));
          drawRect(screenX + 7, eyeY + 5, 2, 1 + wave1 * 3, colors.eye);
          drawRect(screenX + 11, eyeY + 4, 2, 1 + wave2 * 4, colors.eye);
          drawRect(screenX + 15, eyeY + 5, 2, 1 + wave3 * 3, colors.eye);
        }
      }

      if (emotion === "happy" || emotion === "love" || emotion === "greeting") {
        drawRect(screenX + 2, eyeY + 4, 4, 2, "#ec4899");
        drawRect(screenX + 18, eyeY + 4, 4, 2, "#ec4899");
      }

      ctx.restore();

      // Floor shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      const shadowWidth = 24 - Math.abs(globalYOff);
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height - 10, shadowWidth * pixelSize, 4 * pixelSize, 0, 0, Math.PI * 2);
      ctx.fill();

      // Particles
      particlesRef.current = P.filter((p) => p.life > 0);
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.type === "heart") {
          drawRect(p.x, p.y, 1, 1, "#f43f5e");
          drawRect(p.x + 2, p.y, 1, 1, "#f43f5e");
          drawRect(p.x - 1, p.y + 1, 5, 1, "#f43f5e");
          drawRect(p.x, p.y + 2, 3, 1, "#f43f5e");
          drawRect(p.x + 1, p.y + 3, 1, 1, "#f43f5e");
        } else if (p.type === "question") {
          drawRect(p.x, p.y, 3, 1, "#fbbf24");
          drawRect(p.x + 3, p.y + 1, 1, 2, "#fbbf24");
          drawRect(p.x + 1, p.y + 3, 2, 1, "#fbbf24");
          drawRect(p.x + 1, p.y + 5, 1, 1, "#fbbf24");
        } else if (p.type === "sweat") {
          drawRect(p.x, p.y, 1, 1, "#93c5fd");
          drawRect(p.x - 1, p.y + 1, 3, 2, "#93c5fd");
        } else if (p.type === "spark") {
          drawRect(p.x, p.y, 1, 3, "#fef08a");
          drawRect(p.x - 1, p.y + 1, 3, 1, "#fef08a");
        } else if (p.type === "star") {
          drawRect(p.x, p.y, 1, 1, "#67e8f9");
          drawRect(p.x - 1, p.y - 1, 1, 1, "#67e8f9");
          drawRect(p.x + 1, p.y - 1, 1, 1, "#67e8f9");
          drawRect(p.x - 1, p.y + 1, 1, 1, "#67e8f9");
          drawRect(p.x + 1, p.y + 1, 1, 1, "#67e8f9");
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        className="relative z-10 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      {/* Subtle CRT scanlines over the screen. */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-lg opacity-30 mix-blend-overlay"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0, rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.12) 100%)",
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}

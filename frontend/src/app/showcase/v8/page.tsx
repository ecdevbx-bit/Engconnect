"use client";
/* eslint-disable react/no-unescaped-entities */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  motion,
  MotionConfig,
  useReducedMotion,
  useInView,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "motion/react";
import confetti from "canvas-confetti";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Star,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Mic,
  Volume2,
  Quote,
  ChevronLeft,
  ChevronRight,
  Zap,
  MessageCircle,
  Play,
  TrendingUp,
  Brain,
} from "lucide-react";

import { PixelMascot } from "@/components/v3/PixelMascot";
import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import AccountChip from "@/components/layout/AccountChip";
import type { MascotEmotion } from "@/lib/emotion";

/* =====================================================================
 * V8 — "Neon Holo Synthwave"
 * A retro-future synthwave world: a perspective grid floor scrolling
 * toward the viewer, a banded horizon sun, drifting starfield, scanlines
 * + chromatic aberration, and the PixelMascot reborn as a flickering
 * neon HOLOGRAM — gaze-tracking, floating, glitching, with a mirrored
 * reflection, a projector light-cone and a talking waveform.
 * Palette: indigo #0b0420/#170a33, magenta #ff2bd6, cyan #16f5ff,
 * violet #7b5cff, sunset #ff7a3c (rare highlight).
 * =================================================================== */

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const C = {
  base1: "#0b0420",
  base2: "#170a33",
  mag: "#ff2bd6",
  cyan: "#16f5ff",
  violet: "#7b5cff",
  sun: "#ff7a3c",
} as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---- emotion choreography sequences (offset periods, always alive) ----
const HERO_SEQ: MascotEmotion[] = [
  "greeting",
  "happy",
  "idea",
  "surprised",
  "love",
  "conversing",
];
const REEL_SEQ: MascotEmotion[] = [
  "greeting",
  "happy",
  "idea",
  "surprised",
  "love",
  "thinking",
  "conversing",
  "tips",
  "asking",
  "confused",
];
const REEL_TILES: { e: MascotEmotion; label: string }[] = [
  { e: "greeting", label: "Greeting" },
  { e: "happy", label: "Happy" },
  { e: "idea", label: "Idea" },
  { e: "surprised", label: "Surprised" },
  { e: "love", label: "Love" },
  { e: "thinking", label: "Thinking" },
  { e: "conversing", label: "Talking" },
];

/* ----------------------------- data ----------------------------- */

const LESSONS: { tag: string; title: string }[] = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?" },
  { tag: "CULTURE", title: "How British tea became a ritual" },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk" },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind" },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk" },
  { tag: "WELLNESS", title: "Why your accent never fully disappears" },
  { tag: "NEWS", title: "When AI rewrote the office" },
];

const REVIEWS: { name: string; city: string; body: string }[] = [
  {
    name: "Priya R.",
    city: "Bengaluru",
    body: "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class.",
  },
  {
    name: "Anita K.",
    city: "Pune",
    body: "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way.",
  },
  {
    name: "Mehul S.",
    city: "Hyderabad",
    body: "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally.",
  },
  {
    name: "Rohan T.",
    city: "Delhi",
    body: "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. It's the first app that finally challenges me at the right level.",
  },
  {
    name: "Sneha M.",
    city: "Chennai",
    body: "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading.",
  },
  {
    name: "Karthik V.",
    city: "Coimbatore",
    body: "Wow… I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing.",
  },
];

const EC_ROWS = [
  "Unlimited AI speaking sessions",
  "Learn with content you actually like",
  "Unlimited feedback with detailed lesson reports",
  "A safe space to make mistakes",
];
const TUTOR_ROWS = [
  "Lessons around a tutor's schedule",
  "A one-size-fits-all curriculum",
  "Subjective feedback that doesn't fully reflect you",
  "Making mistakes can feel stressful",
];

/* ------------------------- gaze-tilt hook ------------------------- */

function useGazeTilt(enabled: boolean, max = 14) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotX = useSpring(rx, { stiffness: 90, damping: 16, mass: 0.6 });
  const rotY = useSpring(ry, { stiffness: 90, damping: 16, mass: 0.6 });

  useEffect(() => {
    if (!enabled) {
      rx.set(0);
      ry.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      ry.set(clamp(dx) * max);
      rx.set(clamp(dy) * -max);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, max, rx, ry]);

  return { ref, rotX, rotY };
}

/* ----------------------- emotion cycle hook ----------------------- */

function useEmotionCycle(seq: MascotEmotion[], ms: number, enabled: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(
      () => setI((v) => (v + 1) % seq.length),
      ms,
    );
    return () => window.clearInterval(id);
  }, [seq, ms, enabled]);
  return seq[i];
}

/* --------------------------- starfield ---------------------------- */

function Starfield({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    type S = { x: number; y: number; z: number; t: number };
    let stars: S[] = [];
    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      const n = Math.min(150, Math.floor(window.innerWidth / 9));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height * 0.78,
        z: Math.random(),
        t: Math.random() * Math.PI * 2,
      }));
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (const s of stars) {
        if (!reduced) {
          s.x -= 0.06 + s.z * 0.22;
          if (s.x < 0) s.x = cvs.width;
          s.t += 0.04 + s.z * 0.05;
        }
        const tw = reduced ? 0.75 : 0.55 + Math.sin(s.t) * 0.4;
        ctx.globalAlpha = (0.25 + s.z * 0.55) * tw;
        ctx.fillStyle = s.z > 0.6 ? C.cyan : C.mag;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 0.4 + s.z * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/* ------------------------- synth background ----------------------- */

function SynthBackground({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="v8-bg-base absolute inset-0" />
      <Starfield reduced={reduced} />
      <div className="v8-sun">
        <div className="v8-sun-bands" />
      </div>
      <div className="v8-horizon" />
      <div className="v8-grid-wrap">
        <div className="v8-grid" />
      </div>
      <div className="v8-vignette absolute inset-0" />
      <div className="v8-scanlines absolute inset-0" />
    </div>
  );
}

/* ----------------------------- glitch text ----------------------------- */

function GlitchText({
  text,
  className,
  as = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2";
}) {
  const Tag = as;
  return (
    <Tag className={cx("v8-glitch v8-chroma", className)} data-text={text}>
      {text}
    </Tag>
  );
}

/* ------------------------------ waveform ------------------------------ */

function Waveform({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <div
      className="flex h-9 items-end gap-[3px]"
      role="img"
      aria-label="AI voice waveform"
    >
      {Array.from({ length: 15 }).map((_, i) => (
        <span
          key={i}
          className={cx("v8-wave-bar", active && !reduced && "v8-wave-on")}
          style={
            {
              animationDelay: `${(i % 7) * 80}ms`,
              animationDuration: `${0.7 + (i % 5) * 0.12}s`,
              height: reduced ? `${24 + (i % 5) * 14}%` : undefined,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* --------------------------- the HOLOGRAM mascot --------------------------- */

function HoloMascot({
  emotion,
  isThinking = false,
  size = 200,
  gaze = true,
  reflection = true,
  cone = true,
  reduced,
  className,
}: {
  emotion: MascotEmotion;
  isThinking?: boolean;
  size?: number;
  gaze?: boolean;
  reflection?: boolean;
  cone?: boolean;
  reduced: boolean;
  className?: string;
}) {
  const tilt = useGazeTilt(gaze && !reduced);
  return (
    <div
      ref={tilt.ref}
      className={cx("v8-holo relative", className)}
      style={{ width: size }}
    >
      {cone && <div className="v8-cone" aria-hidden />}
      <motion.div
        className="v8-holo-tilt"
        style={{
          rotateX: tilt.rotX,
          rotateY: tilt.rotY,
          transformPerspective: 700,
        }}
      >
        <div className={reduced ? "" : "v8-holo-float"}>
          <div className={reduced ? "" : "v8-holo-glitch"}>
            <div className={cx("v8-holo-body", !reduced && "v8-holo-flicker")}>
              <PixelMascot
                emotion={emotion}
                isThinking={isThinking}
                size={size}
                paused={reduced}
              />
              <div className="v8-holo-scan" aria-hidden />
              <div className="v8-holo-split" aria-hidden />
            </div>
          </div>
        </div>
      </motion.div>
      {reflection && (
        <div className="v8-holo-reflect" aria-hidden>
          <PixelMascot
            emotion={emotion}
            isThinking={isThinking}
            size={size}
            paused={reduced}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ eyebrow ------------------------------ */

function Eyebrow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="v8-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em]">
      <span className="v8-spin text-[--v8-cyan]">{icon}</span>
      {children}
    </span>
  );
}

/* ------------------------------- CTAs ------------------------------- */

function PrimaryCTA({
  href,
  children,
  onHover,
  className,
}: {
  href: string;
  children: ReactNode;
  onHover?: (on: boolean) => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      className={cx(
        "v8-cta-primary group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-base font-extrabold text-[#0b0420]",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function GhostCTA({
  href,
  children,
  onHover,
  className,
}: {
  href: string;
  children: ReactNode;
  onHover?: (on: boolean) => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={cx(
        "v8-cta-ghost inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-base font-bold text-[#eafdff]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ------------------------------ Apple glyph (animated) ------------------------------ */

function AppleGlyph() {
  return (
    <svg
      viewBox="0 0 384 512"
      className="v8-applepulse h-5 w-5"
      aria-hidden
      fill="currentColor"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
    </svg>
  );
}

function StoreButton({
  glyph,
  top,
  label,
}: {
  glyph: ReactNode;
  top: string;
  label: string;
}) {
  return (
    <Link
      href="/signup"
      className="v8-store inline-flex min-h-[52px] items-center gap-3 rounded-2xl px-5 py-2 text-left"
    >
      <span className="text-[#16f5ff]">{glyph}</span>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-widest text-[#bfe9ff]/70">
          {top}
        </span>
        <span className="block text-sm font-extrabold text-[#eafdff]">
          {label}
        </span>
      </span>
    </Link>
  );
}

/* =====================================================================
 * NAV
 * =================================================================== */

function Nav() {
  return (
    <nav className="sticky top-0 z-40 w-full">
      <div className="v8-nav mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="ml-24 flex items-center gap-2 sm:ml-28 lg:ml-0">
          <span className="v8-logo-dot" aria-hidden />
          <span className="text-base font-extrabold tracking-tight text-[#eafdff] sm:text-lg">
            English{" "}
            <span className="v8-neon-cyan">Connection</span>
          </span>
        </div>
        <AccountChip />
      </div>
    </nav>
  );
}

/* =====================================================================
 * HERO
 * =================================================================== */

function Hero({ reduced }: { reduced: boolean }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const cycle = useEmotionCycle(HERO_SEQ, 2600, !reduced);
  const [override, setOverride] = useState<MascotEmotion | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // talking beat: toggle the speaking/thinking pulse + waveform
  useEffect(() => {
    if (reduced) return;
    let t = 0;
    const loop = () => {
      setSpeaking((s) => !s);
      t = window.setTimeout(loop, 2100);
    };
    t = window.setTimeout(loop, 1400);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const yMascot = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, reduced ? 1 : 0]);

  const emotion: MascotEmotion = reduced ? "greeting" : override ?? cycle;

  return (
    <header
      ref={heroRef}
      className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <div className="mb-5 flex justify-center lg:justify-start">
            <Eyebrow icon={<Sparkles className="h-3.5 w-3.5" />}>
              Live AI coach · 24/7
            </Eyebrow>
          </div>

          <h1 className="text-4xl font-black leading-[1.04] tracking-tight text-[#f4ecff] sm:text-5xl lg:text-6xl">
            English Connection,
            <br className="hidden sm:block" />{" "}
            <span className="v8-grad-text">your AI English coach</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base text-[#cdbdf2] sm:text-lg lg:mx-0">
            Speak out loud, get instant feedback, and watch your English
            light up — night after neon night.
          </p>

          {/* rating row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
            <span className="inline-flex items-center gap-2">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#16f5ff] text-[#16f5ff]"
                  />
                ))}
              </span>
              <span className="text-lg font-extrabold text-[#eafdff]">4.8</span>
            </span>
            <span className="h-4 w-px bg-white/20" aria-hidden />
            <span className="text-sm font-semibold text-[#cdbdf2]">
              <span className="v8-neon-magenta font-extrabold">1,00,000+</span>{" "}
              learners
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <PrimaryCTA
              href="/signup"
              onHover={(on) => setOverride(on ? "love" : null)}
            >
              Open webapp
            </PrimaryCTA>
            <GhostCTA
              href="/login"
              onHover={(on) => setOverride(on ? "greeting" : null)}
            >
              I already have an account
            </GhostCTA>
          </div>
        </motion.div>

        {/* hologram centerpiece */}
        <motion.div
          style={{ y: yMascot, opacity: fade }}
          className="relative flex flex-col items-center"
        >
          <div className="v8-holo-stage relative flex w-full max-w-sm flex-col items-center rounded-[28px] px-4 pb-6 pt-8">
            {/* speaking chip */}
            <div className="v8-speak-chip mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-[#eafdff]">
              <Mic className="h-3.5 w-3.5 text-[#16f5ff]" />
              K.AI is speaking
            </div>

            <HoloMascot
              emotion={emotion}
              isThinking={speaking}
              size={240}
              reduced={reduced}
            />

            <div className="mt-4">
              <Waveform active={speaking} reduced={reduced} />
            </div>

            <div className="mt-3 w-full max-w-xs">
              <AiPartnerDemo />
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}

/* =====================================================================
 * BIG TAGLINE
 * =================================================================== */

function Tagline({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  return (
    <section ref={ref} className="relative z-10 px-4 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={inView || reduced ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-4xl text-center"
      >
        <GlitchText
          as="h2"
          text="English learning has never been this fun."
          className="text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        />
      </motion.div>
    </section>
  );
}

/* =====================================================================
 * STEPS w/ demos
 * =================================================================== */

const STEPS: { n: string; title: string; demo: ReactNode }[] = [
  {
    n: "01",
    title: "Talk it out with your AI partner",
    demo: <AiPartnerDemo />,
  },
  {
    n: "02",
    title: "Rebuild real sentences in Jumble Words",
    demo: <JumbleDemo />,
  },
  {
    n: "03",
    title: "Speak, then see exactly what to fix",
    demo: <PronunciationDemo />,
  },
];

function StepBlock({
  step,
  reduced,
}: {
  step: (typeof STEPS)[number];
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="v8-step grid items-center gap-6 rounded-3xl p-5 sm:p-7 lg:grid-cols-[0.8fr_1.2fr]"
    >
      <div>
        <div className="v8-step-num text-5xl font-black sm:text-7xl">
          {step.n}
        </div>
        <h3 className="mt-2 text-2xl font-extrabold text-[#eafdff] sm:text-3xl">
          {step.title}
        </h3>
        <PrimaryCTA href="/signup" className="mt-5">
          Try now
        </PrimaryCTA>
      </div>
      <div className="v8-screen overflow-hidden rounded-2xl">{step.demo}</div>
    </motion.div>
  );
}

function Steps({ reduced }: { reduced: boolean }) {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <Eyebrow icon={<Zap className="h-3.5 w-3.5" />}>Three moves</Eyebrow>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#f4ecff] sm:text-4xl">
          From freeze to <span className="v8-neon-cyan">fluent</span>
        </h2>
      </div>
      <div className="flex flex-col gap-8">
        {STEPS.map((s) => (
          <StepBlock key={s.n} step={s} reduced={reduced} />
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
 * MASCOT EMOTIONS REEL
 * =================================================================== */

function EmotionReel({ reduced }: { reduced: boolean }) {
  const big = useEmotionCycle(REEL_SEQ, 1900, !reduced);
  const current: MascotEmotion = reduced ? "happy" : big;

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <Eyebrow icon={<Sparkles className="h-3.5 w-3.5" />}>
          Hologram reel
        </Eyebrow>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#f4ecff] sm:text-4xl">
          A coach with <span className="v8-neon-magenta">real feelings</span>
        </h2>
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        {/* big cycling holo */}
        <div className="v8-holo-stage relative flex flex-col items-center rounded-[28px] px-4 pb-8 pt-10">
          <HoloMascot emotion={current} size={220} reduced={reduced} />
          <div className="mt-2 h-7">
            <GlitchText
              text={cap(current)}
              className="text-xl font-black tracking-widest uppercase"
            />
          </div>
        </div>

        {/* small reel tiles */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {REEL_TILES.map((t) => (
            <div
              key={t.label}
              className="v8-reel-tile flex flex-col items-center gap-1 rounded-2xl p-3"
            >
              <HoloMascot
                emotion={reduced ? t.e : t.e}
                size={96}
                gaze={false}
                reflection={false}
                cone={false}
                reduced={reduced}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#bfe9ff]/80">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * LESSON CAROUSEL
 * =================================================================== */

function Lessons({ reduced }: { reduced: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    reduced ? [] : [Autoplay({ delay: 2800, stopOnInteraction: false })],
  );
  const prev = () => emblaApi?.scrollPrev();
  const next = () => emblaApi?.scrollNext();

  return (
    <section className="relative z-10 py-16">
      <div className="mx-auto mb-9 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow icon={<Sparkles className="h-3.5 w-3.5" />}>
              For you
            </Eyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#f4ecff] sm:text-4xl">
              Endless lessons,{" "}
              <span className="v8-neon-cyan">picked just for you</span>
            </h2>
            <p className="mt-3 max-w-xl text-[#cdbdf2]">
              Daily curated content tuned to what you struggle with most.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous lessons"
              className="v8-arrow inline-flex h-11 w-11 items-center justify-center rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next lessons"
              className="v8-arrow inline-flex h-11 w-11 items-center justify-center rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden px-4 sm:px-6" ref={emblaRef}>
        <div className="flex gap-5">
          {LESSONS.map((l) => (
            <article
              key={l.title}
              className="v8-lesson group relative flex min-h-[230px] w-[80%] shrink-0 flex-col justify-between rounded-3xl p-6 sm:w-[44%] lg:w-[31%]"
            >
              <span className="v8-tag inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                {l.tag}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold leading-snug text-[#eafdff]">
                {l.title}
              </h3>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#16f5ff]">
                <MessageCircle className="h-4 w-4" />
                Talk about this in English
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * WHY BENTO
 * =================================================================== */

function CefrBars({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const on = inView || reduced;
  const rows: { label: string; pct: number }[] = [
    { label: "B1", pct: 45 },
    { label: "B2", pct: 75 },
    { label: "C1", pct: 100 },
  ];
  return (
    <div ref={ref} className="mt-5 space-y-3">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-7 text-sm font-extrabold text-[#bfe9ff]">
            {r.label}
          </span>
          <div className="v8-bar-track h-3 flex-1 overflow-hidden rounded-full">
            <motion.div
              className="v8-bar-fill h-full rounded-full"
              initial={{ width: 0 }}
              animate={on ? { width: `${r.pct}%` } : {}}
              transition={{
                duration: reduced ? 0 : 1,
                delay: reduced ? 0 : i * 0.15,
                ease: "easeOut",
              }}
            />
          </div>
          <span className="w-10 text-right text-sm font-bold text-[#cdbdf2]">
            {r.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

function Gauge({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const on = inView || reduced;
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const off = CIRC * (1 - 0.89);
  return (
    <div ref={ref} className="mt-3 flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <defs>
            <linearGradient id="v8gauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={C.cyan} />
              <stop offset="1" stopColor={C.mag} />
            </linearGradient>
          </defs>
          <circle
            cx={70}
            cy={70}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={11}
          />
          <motion.circle
            cx={70}
            cy={70}
            r={R}
            fill="none"
            stroke="url(#v8gauge)"
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            transform="rotate(-90 70 70)"
            initial={{ strokeDashoffset: CIRC }}
            animate={on ? { strokeDashoffset: off } : {}}
            transition={{ duration: reduced ? 0 : 1.4, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[#eafdff]">89%</span>
          <span className="text-[10px] uppercase tracking-widest text-[#bfe9ff]/70">
            score
          </span>
        </div>
      </div>
      <div>
        <div className="text-xl font-extrabold text-[#eafdff]">Beautiful</div>
        <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#16f5ff]">
          <Volume2 className="h-4 w-4" />
          B.YOO·tih·Fuhl
        </div>
      </div>
    </div>
  );
}

function BentoCard({
  className,
  icon,
  title,
  desc,
  children,
  reduced,
}: {
  className?: string;
  icon: ReactNode;
  title: string;
  desc: string;
  children?: ReactNode;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cx("v8-bento flex flex-col rounded-3xl p-6", className)}
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#16f5ff] v8-bento-ic">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-[#eafdff]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#cdbdf2]">{desc}</p>
      {children}
    </motion.div>
  );
}

function Bento({ reduced }: { reduced: boolean }) {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <Eyebrow icon={<Sparkles className="h-3.5 w-3.5" />}>The edge</Eyebrow>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#f4ecff] sm:text-4xl">
          Why <span className="v8-neon-magenta">English Connection?</span>
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <BentoCard
          reduced={reduced}
          className="lg:col-span-2"
          icon={<TrendingUp className="h-5 w-5" />}
          title="See your English improve over time"
          desc="Regular level checks show you exactly how far you've come."
        >
          <CefrBars reduced={reduced} />
        </BentoCard>

        <BentoCard
          reduced={reduced}
          icon={<Volume2 className="h-5 w-5" />}
          title="Accurate pronunciation"
          desc="Pronounce every word right and sound natural."
        >
          <Gauge reduced={reduced} />
        </BentoCard>

        <BentoCard
          reduced={reduced}
          icon={<MessageCircle className="h-5 w-5" />}
          title="Learn real-world expressions"
          desc="Speak the way fluent people actually do — not how textbooks say."
        >
          <ul className="mt-4 space-y-2 text-sm font-semibold text-[#dcd0f6]">
            {[
              "10 expressions Indian professionals use daily",
              "Casual phrases for coffee chats",
              "Essential phrasal verbs for work",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16f5ff]" />
                {t}
              </li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard
          reduced={reduced}
          icon={<Brain className="h-5 w-5" />}
          title="Know exactly what to fix"
          desc="Specific feedback after every lesson — not vague pats on the back."
        >
          <div className="mt-4 space-y-2 text-sm">
            <div className="v8-said-wrong rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7aa8]">
                You said
              </span>
              <p className="text-[#ffd7e6]">
                I am understanding what you mean.
              </p>
            </div>
            <div className="v8-said-right rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#16f5ff]">
                Correct
              </span>
              <p className="text-[#d9fbff]">I understand what you mean.</p>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          reduced={reduced}
          icon={<Zap className="h-5 w-5" />}
          title="Turn mistakes into strengths"
          desc="The words you trip on become tomorrow's warm-up drills, so the same mistake never sneaks in twice."
        >
          <p className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-xs italic text-[#bfe9ff]">
            Practice speaking out loud to build a stronger connection between
            your brain and your mouth.
          </p>
        </BentoCard>
      </div>
    </section>
  );
}

/* =====================================================================
 * REVIEWS
 * =================================================================== */

function Reviews({ reduced }: { reduced: boolean }) {
  const stats: { num: string; label: string }[] = [
    { num: "1L+", label: "Happy users" },
    { num: "4.8", label: "Rating" },
    { num: "31K+", label: "Lessons" },
  ];
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <Eyebrow icon={<Quote className="h-3.5 w-3.5" />}>Real voices</Eyebrow>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#f4ecff] sm:text-4xl">
          Speak English with{" "}
          <span className="v8-neon-cyan">confidence</span>
        </h2>
      </div>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {REVIEWS.map((r, i) => (
          <motion.figure
            key={r.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.5,
              delay: reduced ? 0 : (i % 3) * 0.08,
            }}
            className="v8-review break-inside-avoid rounded-3xl p-6"
          >
            <div className="mb-3 flex">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className="h-4 w-4 fill-[#16f5ff] text-[#16f5ff]"
                />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed text-[#e6ddf7]">
              {r.body}
            </blockquote>
            <figcaption className="mt-4 text-sm font-bold text-[#eafdff]">
              {r.name}{" "}
              <span className="font-medium text-[#9f8fd0]">· {r.city}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="v8-stat rounded-2xl px-4 py-6 text-center"
          >
            <div className="v8-grad-text text-3xl font-black sm:text-4xl">
              {s.num}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#bfe9ff]/70">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
 * PRICING
 * =================================================================== */

function Pricing({ reduced }: { reduced: boolean }) {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <Eyebrow icon={<Zap className="h-3.5 w-3.5" />}>The math</Eyebrow>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#f4ecff] sm:text-4xl">
          Tutor-level results,{" "}
          <span className="v8-neon-magenta">no tutor-level fees</span>
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* English Connection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="v8-price-hot relative flex flex-col rounded-3xl p-7"
        >
          <span className="v8-tag-hot absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Best value
          </span>
          <h3 className="text-lg font-extrabold text-[#eafdff]">
            English Connection
          </h3>
          <div className="mt-2 flex items-end gap-1">
            <span className="v8-grad-text text-4xl font-black">₹399</span>
            <span className="pb-1 text-sm font-semibold text-[#cdbdf2]">
              /month
            </span>
          </div>
          <ul className="mt-6 flex-1 space-y-3">
            {EC_ROWS.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-sm font-semibold text-[#eafdff]"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full v8-check">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {r}
              </li>
            ))}
          </ul>
          <PrimaryCTA href="/signup" className="mt-7 w-full">
            Open the webapp
          </PrimaryCTA>
        </motion.div>

        {/* Private tutor */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.1 }}
          className="v8-price-cold flex flex-col rounded-3xl p-7"
        >
          <h3 className="text-lg font-extrabold text-[#cdbdf2]">
            Private tutor
          </h3>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-4xl font-black text-[#9f8fd0]">₹8,000</span>
            <span className="pb-1 text-sm font-semibold text-[#9f8fd0]">
              /month
            </span>
          </div>
          <ul className="mt-6 flex-1 space-y-3">
            {TUTOR_ROWS.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-sm font-medium text-[#b3a6d4]"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#ff7aa8]">
                  <X className="h-3.5 w-3.5" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

/* =====================================================================
 * FINAL CTA
 * =================================================================== */

function FinalCta({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const [emotion, setEmotion] = useState<MascotEmotion>("happy");

  useEffect(() => {
    if (!inView) return;
    if (!reduced) {
      confetti({
        particleCount: 130,
        spread: 80,
        startVelocity: 42,
        origin: { y: 0.7 },
        colors: [C.mag, C.cyan, C.violet, C.sun, "#ffffff"],
        disableForReducedMotion: true,
      });
    }
    setEmotion("love");
  }, [inView, reduced]);

  return (
    <section ref={ref} className="relative z-10 px-4 py-20 sm:py-28">
      <div className="v8-final mx-auto flex max-w-3xl flex-col items-center rounded-[36px] px-6 py-14 text-center">
        <HoloMascot emotion={emotion} size={170} reduced={reduced} />
        <h2 className="mt-6 text-4xl font-black tracking-tight text-[#f4ecff] sm:text-5xl">
          So, are you <span className="v8-grad-text">ready?</span>
        </h2>
        <div className="mt-8">
          <PrimaryCTA href="/signup">Open the webapp</PrimaryCTA>
        </div>

        <p className="mt-9 text-sm font-bold uppercase tracking-widest text-[#bfe9ff]/70">
          Or download the app
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <StoreButton
            glyph={<Play className="v8-applepulse h-5 w-5" />}
            top="Get it on"
            label="Google Play"
          />
          <StoreButton
            glyph={<AppleGlyph />}
            top="Download on the"
            label="App Store"
          />
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * FOOTER
 * =================================================================== */

function Footer() {
  const cols: { head: string; links: { label: string; href: string }[] }[] = [
    {
      head: "Webapp",
      links: [
        { label: "Open dashboard", href: "/signup" },
        { label: "Log in", href: "/login" },
        { label: "Practice library", href: "/signup" },
        { label: "Leaderboard", href: "/signup" },
      ],
    },
    {
      head: "Company",
      links: [
        { label: "About", href: "/signup" },
        { label: "Updates", href: "/signup" },
        { label: "Privacy", href: "/signup" },
        { label: "Terms", href: "/signup" },
      ],
    },
    {
      head: "Get the app",
      links: [
        { label: "Google Play", href: "/signup" },
        { label: "App Store", href: "/signup" },
      ],
    },
  ];
  return (
    <footer className="relative z-10 border-t border-white/10 px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="v8-logo-dot" aria-hidden />
            <span className="text-lg font-extrabold text-[#eafdff]">
              English Connection
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-[#9f8fd0]">
            Your AI English coach — built for India's ambitious learners.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.head}>
            <div className="text-xs font-black uppercase tracking-widest text-[#16f5ff]">
              {c.head}
            </div>
            <ul className="mt-4 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-[#cdbdf2] transition-colors hover:text-[#eafdff]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-[#9f8fd0] sm:flex-row">
        <span>© 2026 English Connection · Built for India's ambitious learners</span>
      </div>
    </footer>
  );
}

/* =====================================================================
 * PAGE
 * =================================================================== */

export default function Page() {
  const reduced = !!useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <style>{STYLES}</style>

      <Link
        href="/showcase"
        className="v8-backpill fixed left-3 top-3 z-50 inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-[#eafdff]"
      >
        ← All designs
      </Link>

      <div className="v8-root relative min-h-screen w-full overflow-x-hidden">
        <SynthBackground reduced={reduced} />

        <div className="relative z-10">
          <Nav />
          <Hero reduced={reduced} />
          <Tagline reduced={reduced} />
          <Steps reduced={reduced} />
          <EmotionReel reduced={reduced} />
          <Lessons reduced={reduced} />
          <Bento reduced={reduced} />
          <Reviews reduced={reduced} />
          <Pricing reduced={reduced} />
          <FinalCta reduced={reduced} />
          <Footer />
        </div>
      </div>
    </MotionConfig>
  );
}

/* =====================================================================
 * STYLES — all keyframes/classes namespaced v8-
 * =================================================================== */

const STYLES = `
.v8-root {
  --v8-cyan: ${C.cyan};
  --v8-mag: ${C.mag};
  --v8-violet: ${C.violet};
  --v8-sun: ${C.sun};
  color: #eafdff;
  background: #07021a;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

/* ---------- background ---------- */
.v8-bg-base {
  background:
    radial-gradient(120% 80% at 50% 6%, ${C.base2} 0%, ${C.base1} 52%, #07021a 100%);
}
.v8-sun {
  position: absolute; left: 50%; top: 45%; width: 340px; height: 340px;
  max-width: 78vw; max-height: 78vw;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(to top, ${C.mag} 0%, #ff5ca0 34%, ${C.sun} 70%, #ffd76b 100%);
  filter: drop-shadow(0 0 50px rgba(255,43,214,0.5));
}
.v8-sun-bands {
  position: absolute; left: 0; right: 0; bottom: 0; height: 56%;
  background: repeating-linear-gradient(to bottom, transparent 0 6px, rgba(11,4,32,0.94) 6px 12px);
}
.v8-horizon {
  position: absolute; left: 0; right: 0; top: 55%; height: 2px;
  background: linear-gradient(to right, transparent, ${C.cyan}, ${C.mag}, transparent);
  box-shadow: 0 0 26px 4px rgba(22,245,255,0.5);
}
.v8-grid-wrap {
  position: absolute; left: 0; right: 0; bottom: 0; height: 48vh;
  overflow: hidden; perspective: 320px; perspective-origin: 50% 0%;
}
.v8-grid {
  position: absolute; bottom: -20%; left: -50%; width: 200%; height: 170%;
  background-image:
    linear-gradient(rgba(22,245,255,0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,43,214,0.42) 1px, transparent 1px);
  background-size: 56px 56px;
  transform: rotateX(74deg);
  transform-origin: 50% 0%;
  -webkit-mask-image: linear-gradient(to top, #000 24%, transparent 92%);
  mask-image: linear-gradient(to top, #000 24%, transparent 92%);
}
.v8-vignette {
  background: radial-gradient(120% 92% at 50% 38%, transparent 38%, rgba(5,1,15,0.72) 100%);
}
.v8-scanlines {
  background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.16) 2px 3px);
  mix-blend-mode: multiply; opacity: 0.5;
}

/* ---------- neon text ---------- */
.v8-neon-cyan { color: #eafdff; text-shadow: 0 0 6px ${C.cyan}, 0 0 16px ${C.cyan}, 0 0 34px rgba(22,245,255,0.6); }
.v8-neon-magenta { color: #ffe6fa; text-shadow: 0 0 6px ${C.mag}, 0 0 16px ${C.mag}, 0 0 34px rgba(255,43,214,0.6); }
.v8-grad-text {
  background: linear-gradient(100deg, ${C.cyan}, ${C.violet} 45%, ${C.mag});
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 14px rgba(123,92,255,0.45));
}

/* chromatic aberration + occasional glitch */
.v8-chroma {
  color: #f4ecff;
  text-shadow: 2px 0 rgba(255,43,214,0.7), -2px 0 rgba(22,245,255,0.7), 0 0 22px rgba(123,92,255,0.45);
}
.v8-glitch { position: relative; display: inline-block; }
@media (prefers-reduced-motion: no-preference) {
  .v8-glitch { animation: v8-textglitch 5.5s steps(1) infinite; }
}
@keyframes v8-textglitch {
  0%, 96%, 100% { transform: translate(0,0); }
  96.6% { transform: translate(-3px, 0); }
  97.4% { transform: translate(3px, 0); }
  98.2% { transform: translate(-2px, 1px); }
  99% { transform: translate(2px, -1px); }
}

/* ---------- nav / pill ---------- */
.v8-nav {
  backdrop-filter: blur(10px);
  background: rgba(11,4,32,0.45);
  border-bottom: 1px solid rgba(22,245,255,0.12);
}
.v8-logo-dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, ${C.cyan} 45%, ${C.mag});
  box-shadow: 0 0 12px ${C.cyan}, 0 0 22px rgba(255,43,214,0.6);
  display: inline-block;
}
@media (prefers-reduced-motion: no-preference) {
  .v8-logo-dot { animation: v8-pulse 2.6s ease-in-out infinite; }
}
@keyframes v8-pulse { 0%,100% { box-shadow: 0 0 10px ${C.cyan}, 0 0 18px rgba(255,43,214,0.5); } 50% { box-shadow: 0 0 18px ${C.cyan}, 0 0 32px rgba(255,43,214,0.8); } }
.v8-backpill {
  background: rgba(11,4,32,0.7);
  border: 1px solid rgba(22,245,255,0.4);
  box-shadow: 0 0 16px rgba(22,245,255,0.3);
  backdrop-filter: blur(8px);
}
.v8-backpill:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 3px; }

/* ---------- eyebrow ---------- */
.v8-eyebrow {
  color: #bfe9ff;
  background: rgba(22,245,255,0.08);
  border: 1px solid rgba(22,245,255,0.3);
  box-shadow: 0 0 18px rgba(22,245,255,0.15) inset;
}
@media (prefers-reduced-motion: no-preference) {
  .v8-spin { display: inline-flex; animation: v8-spin 6s linear infinite; }
}
@keyframes v8-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

/* ---------- buttons ---------- */
.v8-cta-primary {
  background: linear-gradient(100deg, ${C.cyan}, ${C.mag});
  box-shadow: 0 0 22px rgba(22,245,255,0.45), 0 0 40px rgba(255,43,214,0.35);
  transition: transform 160ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms ease;
}
.v8-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(22,245,255,0.7), 0 0 56px rgba(255,43,214,0.55); }
.v8-cta-primary:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.v8-cta-ghost {
  background: rgba(123,92,255,0.08);
  border: 1px solid rgba(123,92,255,0.5);
  transition: transform 160ms ease, box-shadow 200ms ease, background 200ms ease;
}
.v8-cta-ghost:hover { background: rgba(123,92,255,0.18); box-shadow: 0 0 24px rgba(123,92,255,0.45); transform: translateY(-1px); }
.v8-cta-ghost:focus-visible { outline: 2px solid ${C.violet}; outline-offset: 3px; }

/* ---------- hologram ---------- */
.v8-holo { display: inline-block; }
.v8-holo-stage {
  background: linear-gradient(180deg, rgba(123,92,255,0.10), rgba(22,245,255,0.04));
  border: 1px solid rgba(22,245,255,0.22);
  box-shadow: 0 0 60px rgba(123,92,255,0.25) inset, 0 20px 60px rgba(255,43,214,0.12);
}
.v8-holo-tilt { transform-style: preserve-3d; will-change: transform; }
.v8-holo-body { position: relative; filter: drop-shadow(0 0 10px rgba(22,245,255,0.85)) drop-shadow(0 0 22px rgba(255,43,214,0.45)); }
.v8-holo-scan {
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(to bottom, rgba(22,245,255,0) 0px, rgba(22,245,255,0.16) 2px, rgba(22,245,255,0) 4px);
  mix-blend-mode: screen;
}
.v8-holo-split {
  position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; opacity: 0.4;
  background: linear-gradient(90deg, rgba(255,43,214,0.18), transparent 30%, transparent 70%, rgba(22,245,255,0.18));
}
.v8-cone {
  position: absolute; left: 50%; bottom: -4%; width: 78%; height: 116%;
  transform: translateX(-50%);
  background: linear-gradient(to top, rgba(22,245,255,0.26), rgba(123,92,255,0.06) 58%, transparent);
  clip-path: polygon(43% 100%, 57% 100%, 100% 0, 0 0);
  filter: blur(7px);
  z-index: 0;
}
.v8-holo-reflect {
  margin-top: -6px;
  transform: scaleY(-1);
  opacity: 0.28;
  filter: blur(1px) drop-shadow(0 0 10px rgba(22,245,255,0.5));
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 68%);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 68%);
  pointer-events: none;
}
@media (prefers-reduced-motion: no-preference) {
  .v8-holo-float { animation: v8-holofloat 5s ease-in-out infinite; }
  .v8-holo-glitch { animation: v8-hologlitch 6.4s steps(1) infinite; }
  .v8-holo-flicker { animation: v8-holoflicker 3.3s ease-in-out infinite; }
  .v8-cone { animation: v8-coneflick 4.7s ease-in-out infinite; }
}
@keyframes v8-holofloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.012); } }
@keyframes v8-hologlitch { 0%,90%,100% { transform: translate(0,0); } 91% { transform: translate(-3px,1px); } 93% { transform: translate(3px,-1px); } 95% { transform: translate(-2px,0); } }
@keyframes v8-holoflicker { 0%,100% { opacity: 1; } 48% { opacity: 0.92; } 52% { opacity: 0.86; } 56% { opacity: 1; } 80% { opacity: 0.94; } }
@keyframes v8-coneflick { 0%,100% { opacity: 0.9; } 50% { opacity: 0.55; } }

.v8-speak-chip {
  background: rgba(22,245,255,0.1);
  border: 1px solid rgba(22,245,255,0.3);
}

/* ---------- waveform ---------- */
.v8-wave-bar {
  width: 4px; height: 22%; min-height: 4px;
  border-radius: 3px;
  background: linear-gradient(to top, ${C.cyan}, ${C.mag});
  box-shadow: 0 0 8px rgba(22,245,255,0.7);
  align-self: flex-end;
  transition: height 0.25s ease;
}
@media (prefers-reduced-motion: no-preference) {
  .v8-wave-on { animation: v8-wave 0.8s ease-in-out infinite; }
}
@keyframes v8-wave { 0%,100% { height: 16%; } 50% { height: 100%; } }

/* ---------- steps ---------- */
.v8-step {
  background: linear-gradient(180deg, rgba(123,92,255,0.08), rgba(11,4,32,0.35));
  border: 1px solid rgba(123,92,255,0.22);
}
.v8-step-num { color: transparent; -webkit-text-stroke: 2px ${C.cyan}; text-shadow: 0 0 20px rgba(22,245,255,0.5); }
.v8-screen {
  background: rgba(7,2,22,0.55);
  border: 1px solid rgba(22,245,255,0.18);
  box-shadow: 0 0 40px rgba(123,92,255,0.18) inset;
}

/* ---------- reel ---------- */
.v8-reel-tile {
  background: rgba(22,245,255,0.05);
  border: 1px solid rgba(22,245,255,0.16);
}

/* ---------- arrows / lessons ---------- */
.v8-arrow {
  color: #eafdff;
  background: rgba(22,245,255,0.08);
  border: 1px solid rgba(22,245,255,0.32);
  transition: transform 150ms ease, box-shadow 200ms ease;
}
.v8-arrow:hover { box-shadow: 0 0 20px rgba(22,245,255,0.5); transform: translateY(-1px); }
.v8-arrow:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
.v8-lesson {
  background: linear-gradient(165deg, rgba(123,92,255,0.12), rgba(11,4,32,0.5));
  border: 1px solid rgba(255,43,214,0.22);
  transition: transform 200ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.v8-lesson:hover {
  transform: translateY(-4px);
  border-color: rgba(22,245,255,0.55);
  box-shadow: 0 0 34px rgba(255,43,214,0.25), 0 0 60px rgba(22,245,255,0.15);
}
.v8-tag {
  color: #0b0420;
  background: linear-gradient(100deg, ${C.cyan}, ${C.mag});
  box-shadow: 0 0 16px rgba(255,43,214,0.4);
}

/* ---------- bento ---------- */
.v8-bento {
  background: linear-gradient(180deg, rgba(123,92,255,0.09), rgba(11,4,32,0.4));
  border: 1px solid rgba(123,92,255,0.22);
  transition: border-color 220ms ease, box-shadow 220ms ease;
}
.v8-bento:hover { border-color: rgba(22,245,255,0.5); box-shadow: 0 0 34px rgba(22,245,255,0.16); }
.v8-bento-ic {
  background: rgba(22,245,255,0.1);
  border: 1px solid rgba(22,245,255,0.3);
  box-shadow: 0 0 16px rgba(22,245,255,0.25);
}
.v8-bar-track { background: rgba(255,255,255,0.08); }
.v8-bar-fill { background: linear-gradient(90deg, ${C.cyan}, ${C.mag}); box-shadow: 0 0 14px rgba(22,245,255,0.5); }
.v8-said-wrong { background: rgba(255,43,214,0.08); border: 1px solid rgba(255,43,214,0.28); }
.v8-said-right { background: rgba(22,245,255,0.08); border: 1px solid rgba(22,245,255,0.3); }

/* ---------- reviews / stats ---------- */
.v8-review {
  background: linear-gradient(180deg, rgba(123,92,255,0.08), rgba(11,4,32,0.4));
  border: 1px solid rgba(123,92,255,0.2);
}
.v8-stat {
  background: rgba(22,245,255,0.05);
  border: 1px solid rgba(22,245,255,0.2);
  box-shadow: 0 0 24px rgba(123,92,255,0.12) inset;
}

/* ---------- pricing ---------- */
.v8-price-hot {
  background: linear-gradient(180deg, rgba(255,43,214,0.12), rgba(22,245,255,0.05));
  border: 1px solid rgba(22,245,255,0.45);
  box-shadow: 0 0 50px rgba(255,43,214,0.18), 0 0 60px rgba(22,245,255,0.12);
}
.v8-price-cold {
  background: rgba(11,4,32,0.45);
  border: 1px solid rgba(255,255,255,0.1);
}
.v8-tag-hot { color: #0b0420; background: linear-gradient(100deg, ${C.cyan}, ${C.mag}); box-shadow: 0 0 18px rgba(255,43,214,0.5); }
.v8-check { color: #0b0420; background: linear-gradient(100deg, ${C.cyan}, ${C.mag}); }

/* ---------- final / store ---------- */
.v8-final {
  background: linear-gradient(180deg, rgba(123,92,255,0.14), rgba(11,4,32,0.5));
  border: 1px solid rgba(22,245,255,0.3);
  box-shadow: 0 0 70px rgba(255,43,214,0.18), 0 0 90px rgba(22,245,255,0.12) inset;
}
.v8-store {
  background: rgba(11,4,32,0.6);
  border: 1px solid rgba(22,245,255,0.32);
  transition: transform 160ms ease, box-shadow 200ms ease;
}
.v8-store:hover { transform: translateY(-2px); box-shadow: 0 0 26px rgba(22,245,255,0.4); }
.v8-store:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) {
  .v8-applepulse { animation: v8-applepulse 3s ease-in-out infinite; }
}
@keyframes v8-applepulse { 0%,100% { filter: drop-shadow(0 0 3px rgba(22,245,255,0.6)); } 50% { filter: drop-shadow(0 0 9px rgba(22,245,255,1)); } }

/* ---------- reduced motion: kill grid/scan/sun/star motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .v8-grid, .v8-sun, .v8-sun-bands, .v8-scanlines, .v8-glitch { animation: none !important; }
}
`;

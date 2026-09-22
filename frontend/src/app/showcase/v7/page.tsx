"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  MotionConfig,
  useScroll,
  useInView,
  useReducedMotion,
  useSpring,
  useMotionValue,
} from "motion/react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  ArrowUpRight,
  Star,
  Sparkles,
  Mic,
  MessageCircle,
  Quote,
  Check,
  X,
  Volume2,
  Target,
  TrendingUp,
  Wand2,
  BookOpen,
  Crown,
  GraduationCap,
} from "lucide-react";

import { PixelMascot } from "@/components/v3/PixelMascot";
import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import AccountChip from "@/components/layout/AccountChip";

/* ------------------------------------------------------------------ */
/*  Emotion vocabulary (structurally identical to MascotEmotion).      */
/* ------------------------------------------------------------------ */
const EMOTIONS = [
  "idle", "happy", "sad", "angry", "thinking", "surprised", "love",
  "scared", "confused", "idea", "tips", "greeting", "asking", "conversing",
] as const;
type Emo = (typeof EMOTIONS)[number];

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const CYCLE: Emo[] = ["greeting", "happy", "idea", "tips", "love", "conversing", "asking"];

function fireConfetti(reduce: boolean) {
  if (reduce) return;
  confetti({
    particleCount: 90,
    spread: 78,
    startVelocity: 38,
    origin: { y: 0.72 },
    scalar: 0.95,
    colors: ["#ff9e6d", "#c4b5fd", "#86efac", "#fff7ed", "#fbbf24"],
    disableForReducedMotion: true,
  });
}

/* ------------------------------------------------------------------ */
/*  Gaze tracking — leans + drifts the mascot toward the pointer.      */
/* ------------------------------------------------------------------ */
function useGaze(reduce: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mr = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 150, damping: 15, mass: 0.6 });
  const y = useSpring(my, { stiffness: 150, damping: 15, mass: 0.6 });
  const rotate = useSpring(mr, { stiffness: 110, damping: 13 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cxp = r.left + r.width / 2;
      const cyp = r.top + r.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cxp) / 320));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cyp) / 320));
      mx.set(dx * 16);
      my.set(dy * 11);
      mr.set(dx * 7);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my, mr]);

  return { ref, x, y, rotate };
}

/* ------------------------------------------------------------------ */
/*  ClayMascot — the alive, squishy buddy in a warm clay pod.          */
/* ------------------------------------------------------------------ */
function ClayMascot({
  size = 200,
  emotion,
  isThinking,
  aura = "var(--apricot)",
  cycle = true,
  bobDelay = "0s",
  className,
}: {
  size?: number;
  emotion?: Emo;
  isThinking?: boolean;
  aura?: string;
  cycle?: boolean;
  bobDelay?: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const gaze = useGaze(reduce);
  const [auto, setAuto] = useState<Emo>("greeting");

  useEffect(() => {
    if (reduce || emotion || !cycle) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % CYCLE.length;
      setAuto(CYCLE[i]);
    }, 2600);
    return () => clearInterval(id);
  }, [reduce, emotion, cycle]);

  const shown: Emo = emotion ?? (reduce ? "happy" : auto);

  return (
    <div
      ref={gaze.ref}
      className={cx("relative grid place-items-center", className)}
      style={{ width: size, height: size * 1.18 }}
    >
      {/* warm pulsing aura */}
      <div
        className="v7-aura-el pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: size * 1.05,
          height: size * 1.05,
          background: `radial-gradient(circle, ${aura} 0%, transparent 68%)`,
        }}
      />
      <motion.div
        className="relative z-10 grid h-full w-full place-items-center"
        style={{ x: gaze.x, y: gaze.y, rotate: gaze.rotate }}
      >
        <div
          className="v7-pod relative grid place-items-center"
          style={{ width: size * 0.96, height: size * 0.96, padding: size * 0.07 }}
        >
          <div className="v7-bob-el" style={{ animationDelay: bobDelay }}>
            <PixelMascot emotion={shown} isThinking={isThinking} paused={reduce} size={size * 0.82} />
          </div>
        </div>
      </motion.div>
      {/* squishing contact shadow */}
      <div
        className="v7-contact-el pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{ width: size * 0.5, height: size * 0.1, background: "rgba(214,140,99,0.42)", filter: "blur(5px)" }}
      />
    </div>
  );
}

/* A cameo that reacts to scrolling into view. */
function SectionCameo({
  active,
  idle = "conversing",
  size = 92,
  aura = "var(--lilac)",
  className,
}: {
  active: Emo;
  idle?: Emo;
  size?: number;
  aura?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, margin: "-10% 0px" });
  return (
    <div ref={ref} className={className}>
      <ClayMascot emotion={inView ? active : idle} size={size} aura={aura} />
    </div>
  );
}

/* Lightweight emotion chip (no pointer listener) for the emotions row. */
function EmotionChip({ emotion, label, delay }: { emotion: Emo; label: string; delay: string }) {
  return (
    <div className="v7-clay flex shrink-0 flex-col items-center gap-1 rounded-[28px] px-4 pb-3 pt-4">
      <div className="v7-pod grid h-[96px] w-[96px] place-items-center">
        <div className="v7-bob-el" style={{ animationDelay: delay }}>
          <PixelMascot emotion={emotion} size={78} />
        </div>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)]">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small UI atoms.                                                    */
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-[#ff9e6d] text-[#ff9e6d]" />
      ))}
    </div>
  );
}

function ClayCTA({
  href,
  children,
  primary,
  onHover,
  onLeave,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={onClick}
      className={cx(
        "v7-press group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--apricot)]/45",
        primary ? "v7-cta-primary text-[var(--ink-on-warm)]" : "v7-cta-ghost text-[var(--ink)]",
      )}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Bento internals.                                                   */
/* ------------------------------------------------------------------ */
function CEFRBars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6, once: true });
  const reduce = useReducedMotion() ?? false;
  const rows: Array<{ label: string; pct: number; color: string }> = [
    { label: "B1", pct: 45, color: "var(--mint)" },
    { label: "B2", pct: 75, color: "var(--lilac)" },
    { label: "C1", pct: 100, color: "var(--apricot)" },
  ];
  return (
    <div ref={ref} className="mt-5 flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-7 text-sm font-extrabold text-[var(--ink)]">{r.label}</span>
          <div className="v7-track h-3.5 flex-1 overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full"
              style={{ background: r.color }}
              initial={reduce ? false : { width: 0 }}
              animate={inView || reduce ? { width: `${r.pct}%` } : { width: 0 }}
              transition={{ duration: 1, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="w-10 text-right text-xs font-bold tabular-nums text-[var(--ink-soft)]">{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function PronGauge() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6, once: true });
  const reduce = useReducedMotion() ?? false;
  const R = 52;
  const C = 2 * Math.PI * R;
  const target = C * (1 - 0.89);
  return (
    <div ref={ref} className="mt-3 flex items-center gap-5">
      <div className="relative h-[140px] w-[140px]">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="v7-gauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff9e6d">
                <animate attributeName="stop-color" values="#ff9e6d;#c4b5fd;#ff9e6d" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#c4b5fd">
                <animate attributeName="stop-color" values="#c4b5fd;#86efac;#c4b5fd" dur="5s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(214,140,99,0.18)" strokeWidth="13" />
          <motion.circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="url(#v7-gauge)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={reduce ? false : { strokeDashoffset: C }}
            animate={inView || reduce ? { strokeDashoffset: target } : { strokeDashoffset: C }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-3xl font-extrabold text-[var(--ink)]">89%</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-extrabold text-[var(--ink)]">Beautiful</p>
        <p className="mt-1 font-mono text-sm tracking-tight text-[var(--ink-soft)]">B.YOO·tih·Fuhl</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--mint)]/40 px-3 py-1 text-xs font-bold text-[var(--ink)]">
          <Volume2 className="h-3.5 w-3.5" /> Natural
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Content data.                                                      */
/* ------------------------------------------------------------------ */
const STEPS = [
  { n: "01", title: "Talk it out with your AI partner", Demo: AiPartnerDemo, tall: true },
  { n: "02", title: "Rebuild real sentences in Jumble Words", Demo: JumbleDemo, tall: false },
  { n: "03", title: "Speak, then see exactly what to fix", Demo: PronunciationDemo, tall: false },
] as const;

const EMOTION_SHOW: Array<{ e: Emo; l: string }> = [
  { e: "greeting", l: "Greeting" },
  { e: "happy", l: "Happy" },
  { e: "idea", l: "Idea" },
  { e: "tips", l: "Tips" },
  { e: "love", l: "Love" },
  { e: "surprised", l: "Surprised" },
  { e: "conversing", l: "Talking" },
  { e: "thinking", l: "Thinking" },
];

const LESSONS = [
  { tag: "Motivation", title: "Why do I always feel stuck?" },
  { tag: "Culture", title: "How British tea became a ritual" },
  { tag: "Business", title: "How Pixar found its biggest risk" },
  { tag: "Interview", title: "Inside a Grammy winner's mind" },
  { tag: "Daily Life", title: "Five ways to actually master small talk" },
  { tag: "Wellness", title: "Why your accent never fully disappears" },
  { tag: "News", title: "When AI rewrote the office" },
];

const REVIEWS = [
  { name: "Priya R.", place: "Bengaluru", text: "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class." },
  { name: "Anita K.", place: "Pune", text: "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way." },
  { name: "Mehul S.", place: "Hyderabad", text: "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally." },
  { name: "Rohan T.", place: "Delhi", text: "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. It's the first app that finally challenges me at the right level." },
  { name: "Sneha M.", place: "Chennai", text: "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading." },
  { name: "Karthik V.", place: "Coimbatore", text: "Wow… I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing." },
];

const REVIEW_STATS = [
  { v: "1L+", l: "Happy users" },
  { v: "4.8", l: "Rating" },
  { v: "31K+", l: "Lessons" },
];

const PLAN_GOOD = [
  "Unlimited AI speaking sessions",
  "Learn with content you actually like",
  "Unlimited feedback with detailed lesson reports",
  "A safe space to make mistakes",
];
const PLAN_BAD = [
  "Lessons around a tutor's schedule",
  "A one-size-fits-all curriculum",
  "Subjective feedback that doesn't fully reflect you",
  "Making mistakes can feel stressful",
];

/* ------------------------------------------------------------------ */
/*  Animated store glyphs.                                             */
/* ------------------------------------------------------------------ */
function AppleGlyph() {
  const reduce = useReducedMotion() ?? false;
  return (
    <svg viewBox="0 0 384 512" className="h-6 w-6" aria-hidden>
      <motion.path
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={6}
        initial={reduce ? false : { pathLength: 0, fillOpacity: 0 }}
        animate={{ pathLength: 1, fillOpacity: 1 }}
        transition={{ pathLength: { duration: 1.4, ease: "easeInOut" }, fillOpacity: { delay: 1, duration: 0.5 } }}
      />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 512 512" className="h-6 w-6" aria-hidden>
      <defs>
        <linearGradient id="v7-play" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86efac">
            <animate attributeName="stop-color" values="#86efac;#ff9e6d;#c4b5fd;#86efac" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#c4b5fd">
            <animate attributeName="stop-color" values="#c4b5fd;#86efac;#ff9e6d;#c4b5fd" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <path d="M64 48v416l240-208L64 48z" fill="url(#v7-play)" />
      <path d="M304 256 384 326l64-37c22-13 22-45 0-58l-64-37-80 62z" fill="url(#v7-play)" opacity="0.8" />
    </svg>
  );
}

function StoreButton({ glyph, top, bottom }: { glyph: React.ReactNode; top: string; bottom: string }) {
  return (
    <Link
      href="/signup"
      className="v7-press v7-clay group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl px-5 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lilac)]/45"
    >
      <span className="v7-sheen pointer-events-none absolute inset-0" />
      <span className="relative text-[var(--ink)]">{glyph}</span>
      <span className="relative leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">{top}</span>
        <span className="block text-sm font-extrabold text-[var(--ink)]">{bottom}</span>
      </span>
    </Link>
  );
}

/* Dark device pod so the dark-themed live demos look intentional. */
function DevicePod({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="v7-device relative rounded-[34px] p-3 sm:p-4">
      <div className="mb-2.5 flex items-center gap-1.5 px-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]/80" />
        <span className="ml-2 truncate text-[11px] font-medium tracking-wide text-white/45">{label}</span>
      </div>
      <div className="overflow-hidden rounded-[26px]">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page.                                                              */
/* ------------------------------------------------------------------ */
export default function Page() {
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();

  const [heroEmotion, setHeroEmotion] = useState<Emo | undefined>(undefined);
  const [heroThinking, setHeroThinking] = useState(false);

  // Hero "typing beat" — pulse isThinking on a gentle cadence.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setHeroThinking((t) => !t), 3200);
    return () => clearInterval(id);
  }, [reduce]);

  // Embla lesson carousel.
  const autoplay = useRef(
    Autoplay({ delay: 2600, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    reduce ? [] : [autoplay.current],
  );

  // Final CTA confetti on entry.
  const finalRef = useRef<HTMLDivElement>(null);
  const finalInView = useInView(finalRef, { amount: 0.5, once: true });
  useEffect(() => {
    if (finalInView) fireConfetti(reduce);
  }, [finalInView, reduce]);

  return (
    <MotionConfig reducedMotion="user">
      <Style />
      <div className="v7-root relative min-h-screen w-full overflow-x-hidden text-[var(--ink)]">
        {/* floating background blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="v7-blob v7-blob-a" />
          <div className="v7-blob v7-blob-b" />
          <div className="v7-blob v7-blob-c" />
        </div>

        {/* scroll progress */}
        <motion.div
          className="fixed left-0 top-0 z-[60] h-1 w-full origin-left rounded-full"
          style={{
            scaleX: scrollYProgress,
            background: "linear-gradient(90deg, var(--apricot), var(--lilac), var(--mint))",
          }}
        />

        {/* fixed back pill */}
        <Link
          href="/showcase"
          className="v7-clay v7-press fixed left-4 top-4 z-50 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lilac)]/45"
        >
          <ArrowRight className="h-4 w-4 rotate-180" /> All designs
        </Link>

        {/* ===== NAV ===== */}
        <header className="relative z-40 flex justify-center px-4 pt-16 sm:pt-6">
          <nav className="v7-clay flex w-full max-w-3xl items-center justify-between gap-3 rounded-full py-2.5 pl-5 pr-2.5">
            <span className="flex items-center gap-2">
              <span className="v7-logo-ring relative grid h-8 w-8 place-items-center rounded-full">
                <Sparkles className="h-4 w-4 text-[var(--ink)]" />
              </span>
              <span className="text-sm font-extrabold tracking-tight sm:text-base">English Connection</span>
            </span>
            <AccountChip size="sm" />
          </nav>
        </header>

        {/* ===== HERO ===== */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-16">
          <div className="relative z-10 text-center lg:text-left">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold text-[var(--ink-soft)] shadow-sm ring-1 ring-[var(--apricot)]/20">
                <span className="v7-dot h-2 w-2 rounded-full bg-[var(--mint)]" /> Your AI English coach
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-balance text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
                English Connection, your{" "}
                <span className="v7-grad-text">AI English coach</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-md text-pretty text-base text-[var(--ink-soft)] sm:text-lg lg:mx-0">
                Speak, get instant feedback, and watch your English bloom — bright, friendly, and built for you.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-6 flex items-center justify-center gap-4 lg:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[var(--ink)]">4.8</span>
                  <Stars />
                </div>
                <span className="h-6 w-px bg-[var(--apricot)]/30" />
                <span className="text-sm font-bold text-[var(--ink-soft)]">
                  <span className="text-[var(--ink)]">1,00,000+</span> learners
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <ClayCTA
                  href="/signup"
                  primary
                  onHover={() => setHeroEmotion("love")}
                  onLeave={() => setHeroEmotion(undefined)}
                >
                  Open webapp
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ClayCTA>
                <ClayCTA
                  href="/login"
                  onHover={() => setHeroEmotion("happy")}
                  onLeave={() => setHeroEmotion(undefined)}
                >
                  I already have an account
                </ClayCTA>
              </div>
            </Reveal>
          </div>

          {/* mascot star + chat pod */}
          <div className="relative z-10 grid place-items-center">
            <ClayMascot
              size={250}
              emotion={heroEmotion}
              isThinking={heroThinking && !heroEmotion}
              aura="var(--apricot)"
            />
          </div>
        </section>

        {/* live AI demo pod under hero */}
        <section className="mx-auto max-w-3xl px-5 pb-4">
          <Reveal>
            <DevicePod label="English Connection · live AI partner">
              <div className="h-[540px]">
                <AiPartnerDemo />
              </div>
            </DevicePod>
          </Reveal>
        </section>

        {/* ===== BIG TAGLINE ===== */}
        <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
          <Reveal>
            <h2 className="text-balance text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              English learning has never been{" "}
              <span className="v7-grad-text">this fun.</span>
            </h2>
          </Reveal>
        </section>

        {/* ===== 3 STEPS ===== */}
        <section className="mx-auto max-w-6xl px-5 pb-8">
          <div className="flex flex-col gap-16 sm:gap-24">
            {STEPS.map(({ n, title, Demo, tall }, i) => (
              <div
                key={n}
                className={cx(
                  "grid items-center gap-8 lg:grid-cols-2 lg:gap-12",
                  i % 2 === 1 && "lg:[&>*:first-child]:order-2",
                )}
              >
                <Reveal y={30}>
                  <div>
                    <span className="v7-step-num text-6xl font-black sm:text-7xl">{n}</span>
                    <h3 className="mt-3 text-2xl font-black leading-snug tracking-tight sm:text-3xl">{title}</h3>
                    <div className="mt-6">
                      <ClayCTA href="/signup" primary>
                        Try now
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </ClayCTA>
                    </div>
                  </div>
                </Reveal>
                <Reveal y={30} delay={0.08}>
                  <DevicePod label={`Step ${n}`}>
                    {tall ? (
                      <div className="h-[540px]">
                        <Demo />
                      </div>
                    ) : (
                      <Demo />
                    )}
                  </DevicePod>
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        {/* ===== MASCOT EMOTIONS ===== */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="text-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--apricot)]">Meet your buddy</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                One mascot, a whole spectrum of feelings
              </h2>
            </Reveal>
          </div>
          {/* marquee row */}
          <div className="v7-marquee-mask relative mt-10 flex gap-5 overflow-hidden">
            <div className={cx("flex shrink-0 gap-5 pl-5", !reduce && "v7-marquee")}>
              {[...EMOTION_SHOW, ...EMOTION_SHOW].map((m, i) => (
                <EmotionChip key={i} emotion={m.e} label={m.l} delay={`${(i % 5) * 0.4}s`} />
              ))}
            </div>
          </div>
        </section>

        {/* ===== LESSON CAROUSEL ===== */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Endless lessons, picked just for you</h2>
              <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
                Daily curated content tuned to what you struggle with most.
              </p>
            </Reveal>
          </div>
          <div className="mt-8 overflow-hidden px-1" ref={emblaRef}>
            <div className="flex gap-5 px-5">
              {LESSONS.map((l, i) => (
                <article
                  key={l.title}
                  className="v7-clay v7-lesson group relative flex min-h-[230px] w-[78vw] shrink-0 flex-col justify-between rounded-[28px] p-6 sm:w-[340px]"
                >
                  <div>
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink)]"
                      style={{
                        background: [
                          "rgba(255,158,109,0.42)",
                          "rgba(196,181,253,0.5)",
                          "rgba(134,239,172,0.55)",
                        ][i % 3],
                      }}
                    >
                      {l.tag}
                    </span>
                    <h3 className="mt-4 text-xl font-black leading-snug tracking-tight">{l.title}</h3>
                  </div>
                  <Link
                    href="/signup"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)] transition-colors group-hover:text-[var(--apricot)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apricot)]/40"
                  >
                    <MessageCircle className="h-4 w-4" /> Talk about this in English
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== WHY BENTO ===== */}
        <section className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Why English Connection?</h2>
              <SectionCameo active="idea" idle="thinking" size={84} aura="var(--mint)" className="hidden shrink-0 sm:block" />
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {/* (a) FOCAL — bolder */}
              <Reveal className="lg:col-span-2">
                <div className="v7-clay v7-focal relative flex h-full flex-col overflow-hidden rounded-[34px] p-7">
                  <div className="flex items-center gap-2 text-[var(--ink-on-warm)]/85">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Progress</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black leading-snug text-[var(--ink-on-warm)] sm:text-3xl">
                    See your English improve over time
                  </h3>
                  <p className="mt-2 max-w-md text-[var(--ink-on-warm)]/80">
                    Regular level checks show you exactly how far you&apos;ve come.
                  </p>
                  <div className="mt-4 rounded-[24px] bg-white/85 p-5 backdrop-blur">
                    <CEFRBars />
                  </div>
                </div>
              </Reveal>

              {/* (b) gauge */}
              <Reveal delay={0.05}>
                <div className="v7-clay flex h-full flex-col rounded-[34px] p-7">
                  <div className="flex items-center gap-2 text-[var(--apricot)]">
                    <Mic className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Pronunciation</span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-snug">Accurate pronunciation</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Pronounce every word right and sound natural.
                  </p>
                  <PronGauge />
                </div>
              </Reveal>

              {/* (c) expressions */}
              <Reveal>
                <div className="v7-clay flex h-full flex-col rounded-[34px] p-7">
                  <div className="flex items-center gap-2 text-[var(--lilac)]">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Real talk</span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-snug">Learn real-world expressions</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Speak the way fluent people actually do — not how textbooks say.
                  </p>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {[
                      "10 expressions Indian professionals use daily",
                      "Casual phrases for coffee chats",
                      "Essential phrasal verbs for work",
                    ].map((t) => (
                      <li key={t} className="v7-inset flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[var(--ink)]">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--lilac)]/40">
                          <Check className="h-3 w-3 text-[var(--ink)]" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {/* (d) fix */}
              <Reveal delay={0.05}>
                <div className="v7-clay flex h-full flex-col rounded-[34px] p-7">
                  <div className="flex items-center gap-2 text-[var(--apricot)]">
                    <Target className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Feedback</span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-snug">Know exactly what to fix</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Specific feedback after every lesson — not vague pats on the back.
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5">
                    <div className="v7-inset rounded-2xl px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#d8694a]">You said</span>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink-soft)]">
                        &ldquo;I <span className="line-through decoration-[#e88a6e]">am understanding</span> what you mean.&rdquo;
                      </p>
                    </div>
                    <div className="flex justify-center text-[var(--apricot)]">
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </div>
                    <div className="rounded-2xl bg-[var(--mint)]/30 px-4 py-3 ring-1 ring-[var(--mint)]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2f8a55]">Correct</span>
                      <p className="mt-1 text-sm font-bold text-[var(--ink)]">&ldquo;I understand what you mean.&rdquo;</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* (e) mistakes */}
              <Reveal>
                <div className="v7-clay flex h-full flex-col rounded-[34px] p-7">
                  <div className="flex items-center gap-2 text-[var(--mint-deep)]">
                    <Wand2 className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Growth</span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-snug">Turn mistakes into strengths</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    The words you trip on become tomorrow&apos;s warm-up drills, so the same mistake never sneaks in twice.
                  </p>
                  <div className="v7-inset mt-auto flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm text-[var(--ink-soft)]">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--apricot)]" />
                    <span>
                      Practice speaking out loud to build a stronger connection between your brain and your mouth.
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== REVIEWS ===== */}
        <section className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="flex items-center gap-4">
              <SectionCameo active="surprised" idle="happy" size={88} aura="var(--apricot)" className="hidden shrink-0 sm:block" />
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Speak English with confidence</h2>
            </Reveal>

            <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
              {REVIEWS.map((r, i) => (
                <Reveal key={r.name} delay={(i % 3) * 0.05} className="break-inside-avoid">
                  <figure className="v7-clay rounded-[28px] p-6">
                    <Quote className="h-6 w-6 text-[var(--apricot)]/60" />
                    <blockquote className="mt-3 text-[15px] leading-relaxed text-[var(--ink)]">{r.text}</blockquote>
                    <figcaption className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-[var(--ink)]">{r.name}</p>
                        <p className="text-xs text-[var(--ink-soft)]">{r.place}</p>
                      </div>
                      <Stars />
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="mt-10 grid grid-cols-3 gap-4">
                {REVIEW_STATS.map((s) => (
                  <div key={s.l} className="v7-clay rounded-[24px] px-4 py-6 text-center">
                    <p className="v7-grad-text text-3xl font-black sm:text-4xl">{s.v}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--ink-soft)] sm:text-sm">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-5">
            <Reveal className="text-center">
              <h2 className="text-balance text-3xl font-black tracking-tight sm:text-5xl">
                Tutor-level results, no tutor-level fees
              </h2>
            </Reveal>

            <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
              {/* English Connection */}
              <Reveal>
                <div className="v7-clay v7-focal-soft relative overflow-hidden rounded-[34px] p-7">
                  <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-[var(--mint)]/40 px-3 py-1 text-xs font-extrabold text-[var(--ink)]">
                    <Crown className="h-3.5 w-3.5" /> Best value
                  </span>
                  <div className="flex items-center gap-2 text-[var(--apricot)]">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-extrabold">English Connection</span>
                  </div>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[var(--ink)] sm:text-5xl">₹399</span>
                    <span className="text-sm font-bold text-[var(--ink-soft)]">/month</span>
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {PLAN_GOOD.map((t) => (
                      <li key={t} className="flex items-start gap-3 text-[15px] font-semibold text-[var(--ink)]">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--mint)]/60">
                          <Check className="h-3 w-3 text-[var(--ink)]" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    <ClayCTA href="/signup" primary>
                      Open the webapp
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </ClayCTA>
                  </div>
                </div>
              </Reveal>

              {/* Private tutor */}
              <Reveal delay={0.06}>
                <div className="v7-clay relative rounded-[34px] p-7 opacity-90">
                  <div className="flex items-center gap-2 text-[var(--ink-soft)]">
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-sm font-extrabold">Private tutor</span>
                  </div>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[var(--ink-soft)] sm:text-5xl">₹8,000</span>
                    <span className="text-sm font-bold text-[var(--ink-soft)]">/month</span>
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {PLAN_BAD.map((t) => (
                      <li key={t} className="flex items-start gap-3 text-[15px] font-medium text-[var(--ink-soft)]">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e8b4a0]/40">
                          <X className="h-3 w-3 text-[#c2654a]" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section ref={finalRef} className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <div className="grid place-items-center">
              <ClayMascot
                size={210}
                emotion={finalInView ? "happy" : "greeting"}
                aura="var(--apricot)"
              />
            </div>
            <Reveal>
              <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">So, are you ready?</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-8 flex justify-center">
                <ClayCTA href="/signup" primary onClick={() => fireConfetti(reduce)}>
                  Open the webapp
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ClayCTA>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-8 text-sm font-bold text-[var(--ink-soft)]">Or download the app</p>
              <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <StoreButton glyph={<PlayGlyph />} top="Get it on" bottom="Google Play" />
                <StoreButton glyph={<AppleGlyph />} top="Download on the" bottom="App Store" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="relative mt-8 px-5 pb-12">
          <div className="mx-auto max-w-6xl">
            <div className="v7-clay rounded-[34px] p-8 sm:p-10">
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <span className="flex items-center gap-2">
                    <span className="v7-logo-ring grid h-8 w-8 place-items-center rounded-full">
                      <Sparkles className="h-4 w-4 text-[var(--ink)]" />
                    </span>
                    <span className="text-base font-extrabold tracking-tight">English Connection</span>
                  </span>
                  <p className="mt-3 max-w-xs text-sm text-[var(--ink-soft)]">
                    Your AI English coach — built for India&apos;s ambitious learners.
                  </p>
                </div>

                <FooterCol
                  title="Webapp"
                  links={[
                    { label: "Open dashboard", href: "/signup" },
                    { label: "Log in", href: "/login" },
                    { label: "Practice library", href: "#" },
                    { label: "Leaderboard", href: "#" },
                  ]}
                />
                <FooterCol
                  title="Company"
                  links={[
                    { label: "About", href: "#" },
                    { label: "Updates", href: "#" },
                    { label: "Privacy", href: "#" },
                    { label: "Terms", href: "#" },
                  ]}
                />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--ink-soft)]">Get the app</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <FooterLink href="#" icon={<BookOpen className="h-4 w-4" />} label="Google Play" />
                    <FooterLink href="#" icon={<BookOpen className="h-4 w-4" />} label="App Store" />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[var(--apricot)]/15 pt-6 text-center text-xs text-[var(--ink-soft)] sm:flex-row sm:text-left">
                <p>© 2026 English Connection · Built for India&apos;s ambitious learners</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--ink-soft)]">{title}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--apricot)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apricot)]/40"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="v7-inset inline-flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-[var(--ink)] transition-colors hover:text-[var(--apricot)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apricot)]/40"
    >
      {icon}
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Scoped styles + keyframes.                                         */
/* ------------------------------------------------------------------ */
function Style() {
  return (
    <style>{`
      .v7-root{
        --cream:#fff7ed; --cream2:#ffece0;
        --apricot:#ff9e6d; --apricot-deep:#f97b4d;
        --lilac:#c4b5fd; --mint:#86efac; --mint-deep:#3fae6e;
        --ink:#3b2f2a; --ink-soft:#6f5d52; --ink-on-warm:#3a160b;
        background:
          radial-gradient(1100px 700px at 15% -5%, #fff 0%, transparent 55%),
          radial-gradient(900px 600px at 100% 0%, #ffe7d6 0%, transparent 50%),
          linear-gradient(180deg, var(--cream) 0%, var(--cream2) 100%);
        background-attachment: fixed;
        -webkit-font-smoothing: antialiased;
      }

      /* globals.css forces h1–h6 to the dark-theme heading colour (#ecedf6 ≈
         white), which is invisible on this light cream theme. Override every
         heading to warm ink. :where() keeps specificity low so explicit
         gradient spans (.v7-grad-text) and the focal card still win where set. */
      .v7-root :where(h1, h2, h3, h4, h5, h6) { color: var(--ink); }
      /* …but the live demos render on DARK pods and rely on the light heading
         colour, so restore it for any heading inside a device pod. */
      .v7-device :where(h1, h2, h3, h4, h5, h6) { color: var(--heading); }

      /* claymorphic surfaces — light highlight TL + warm shadow BR */
      .v7-clay{
        background: linear-gradient(145deg, #fffdfb, #ffe9dc);
        box-shadow:
          -8px -8px 18px rgba(255,255,255,0.9),
          10px 12px 26px rgba(214,140,99,0.26);
      }
      .v7-inset{
        background: linear-gradient(145deg,#fff3ea,#fffdfb);
        box-shadow:
          inset 4px 4px 9px rgba(214,140,99,0.16),
          inset -4px -4px 9px rgba(255,255,255,0.95);
      }
      .v7-track{
        background:#fceadd;
        box-shadow: inset 3px 3px 6px rgba(214,140,99,0.22), inset -2px -2px 5px rgba(255,255,255,0.9);
      }
      .v7-pod{
        border-radius: 42% 42% 46% 46% / 44% 44% 52% 52%;
        background: radial-gradient(circle at 38% 30%, #fffdfb, #ffe2cf 78%);
        box-shadow:
          -7px -7px 16px rgba(255,255,255,0.92),
          9px 11px 24px rgba(214,140,99,0.30),
          inset 2px 2px 6px rgba(255,255,255,0.7),
          inset -3px -4px 9px rgba(214,140,99,0.16);
      }

      .v7-cta-primary{
        background: linear-gradient(145deg, #ffb083, var(--apricot-deep));
        box-shadow:
          -4px -4px 10px rgba(255,255,255,0.55),
          7px 9px 18px rgba(214,140,99,0.45),
          inset 1px 1px 2px rgba(255,255,255,0.5);
      }
      .v7-cta-ghost{
        background: linear-gradient(145deg,#fffdfb,#ffeaDC);
        box-shadow:
          -5px -5px 12px rgba(255,255,255,0.9),
          7px 9px 18px rgba(214,140,99,0.24);
      }
      .v7-press{ transition: transform .14s cubic-bezier(.34,1.56,.64,1); will-change: transform; }
      .v7-press:hover{ transform: translateY(-2px); }
      .v7-press:active{ transform: translateY(1px) scale(0.96); }

      .v7-grad-text{
        background: linear-gradient(110deg, var(--apricot-deep), var(--lilac) 55%, var(--mint-deep));
        -webkit-background-clip: text; background-clip: text; color: transparent;
        background-size: 220% 100%;
        animation: v7-grad 7s ease infinite;
      }
      @keyframes v7-grad{ 0%,100%{ background-position:0% 50%;} 50%{ background-position:100% 50%;} }

      .v7-step-num{
        background: linear-gradient(160deg, var(--apricot), var(--lilac));
        -webkit-background-clip:text; background-clip:text; color:transparent;
        opacity:.55;
      }

      .v7-logo-ring{
        background: conic-gradient(from 0deg, var(--apricot), var(--lilac), var(--mint), var(--apricot));
        animation: v7-spin 6s linear infinite;
        box-shadow: 0 4px 10px rgba(214,140,99,0.4);
      }
      @keyframes v7-spin{ to{ transform: rotate(360deg);} }

      .v7-focal{
        background: linear-gradient(145deg, #ffb487, #f97b4d 60%, #e9628f);
        box-shadow:
          -8px -8px 18px rgba(255,255,255,0.55),
          12px 14px 30px rgba(233,98,80,0.4);
      }
      .v7-focal-soft{
        background: linear-gradient(145deg, #fffaf6, #ffe3d2);
        box-shadow:
          -8px -8px 18px rgba(255,255,255,0.92),
          12px 14px 30px rgba(214,140,99,0.32);
        outline: 2px solid rgba(255,158,109,0.4); outline-offset:-2px;
      }

      .v7-device{
        background: linear-gradient(160deg, #161d2e, #0a0f1c);
        box-shadow:
          -6px -6px 16px rgba(255,255,255,0.55),
          14px 16px 34px rgba(86,60,45,0.34),
          inset 0 1px 0 rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.05);
      }

      .v7-sheen{
        background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%);
        transform: translateX(-120%);
        animation: v7-sheen 3.4s ease-in-out infinite;
      }
      @keyframes v7-sheen{ 0%,60%{ transform: translateX(-120%);} 100%{ transform: translateX(120%);} }

      .v7-lesson{ transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
      .v7-lesson:hover{ transform: translateY(-6px) rotate(-0.6deg); }

      /* mascot life */
      .v7-bob-el{ animation: v7-bob 3.4s ease-in-out infinite; transform-origin: 50% 90%; }
      @keyframes v7-bob{
        0%,100%{ transform: translateY(0) scaleX(1) scaleY(1); }
        25%{ transform: translateY(-7%) scaleX(0.96) scaleY(1.05); }
        50%{ transform: translateY(0) scaleX(1.04) scaleY(0.96); }
        75%{ transform: translateY(-3%) scaleX(0.99) scaleY(1.02); }
      }
      .v7-aura-el{ animation: v7-aura 3.6s ease-in-out infinite; }
      @keyframes v7-aura{ 0%,100%{ opacity:.5; transform: translate(-50%,-50%) scale(1);} 50%{ opacity:.85; transform: translate(-50%,-50%) scale(1.08);} }
      .v7-contact-el{ animation: v7-contact 3.4s ease-in-out infinite; transform-origin: center; }
      @keyframes v7-contact{ 0%,100%{ transform: translateX(-50%) scaleX(1); opacity:.42;} 50%{ transform: translateX(-50%) scaleX(1.25); opacity:.28;} }
      .v7-dot{ animation: v7-pulse 1.8s ease-in-out infinite; }
      @keyframes v7-pulse{ 0%,100%{ opacity:1; transform: scale(1);} 50%{ opacity:.5; transform: scale(.7);} }

      .v7-marquee{ animation: v7-marquee 26s linear infinite; }
      @keyframes v7-marquee{ from{ transform: translateX(0);} to{ transform: translateX(-50%);} }
      .v7-marquee-mask{ -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }

      .v7-blob{ position:absolute; border-radius:50%; filter: blur(60px); opacity:.5; }
      .v7-blob-a{ width:380px; height:380px; left:-120px; top:8%; background: radial-gradient(circle, var(--apricot), transparent 70%); animation: v7-float 16s ease-in-out infinite; }
      .v7-blob-b{ width:420px; height:420px; right:-140px; top:42%; background: radial-gradient(circle, var(--lilac), transparent 70%); animation: v7-float 20s ease-in-out infinite reverse; }
      .v7-blob-c{ width:340px; height:340px; left:30%; bottom:4%; background: radial-gradient(circle, var(--mint), transparent 70%); animation: v7-float 18s ease-in-out infinite; }
      @keyframes v7-float{ 0%,100%{ transform: translate(0,0) scale(1);} 33%{ transform: translate(40px,-30px) scale(1.08);} 66%{ transform: translate(-30px,20px) scale(0.96);} }

      @media (prefers-reduced-motion: reduce){
        .v7-bob-el, .v7-aura-el, .v7-contact-el, .v7-marquee, .v7-sheen,
        .v7-grad-text, .v7-logo-ring, .v7-blob, .v7-dot{
          animation: none !important;
        }
      }
    `}</style>
  );
}

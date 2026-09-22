"use client";

/* =========================================================================
   AESTHETIC MOVEMENT — "AURORA VERNACULAR" (a.k.a. the Dawn Chorus)
   -------------------------------------------------------------------------
   A calm, cinematic dialect of interface design that treats the screen as a
   night sky just before sunrise. Light is the protagonist: a living aurora —
   drawn frame-by-frame on a real <canvas> — drifts behind everything, brand
   colours folding through cyan, violet, rose and amber like slow weather.
   Content arrives the way dawn does — never snapped, always eased over long
   1.2–2.4s breaths, overlapping, unhurried. Surfaces are glass: they float,
   breathe and parallax to the eye, holding the working demos like lanterns.
   The recurring signature is the breathing aurora orb — a soft pulse of light
   that reappears section to section, the page's quiet heartbeat. Nothing
   shouts; the type is enormous yet whispered, and emotion is carried by the
   light itself.
   ========================================================================= */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Star,
  ArrowRight,
  ArrowUpRight,
  Check,
  X,
  Quote,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import AccountChip from "@/components/layout/AccountChip";

/* ----------------------------------------------------------------------- */
/*  Content                                                                 */
/* ----------------------------------------------------------------------- */

const LESSONS = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?", color: "#00e3fd" },
  { tag: "CULTURE", title: "How British tea became a ritual", color: "#f59e0b" },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk", color: "#b79fff" },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind", color: "#ff6c95" },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk", color: "#f97316" },
  { tag: "WELLNESS", title: "Why your accent never fully disappears", color: "#00e3fd" },
  { tag: "NEWS", title: "When AI rewrote the office", color: "#b79fff" },
] as const;

const REVIEWS = [
  {
    name: "Priya R.",
    city: "Bengaluru",
    text: "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class.",
  },
  {
    name: "Anita K.",
    city: "Pune",
    text: "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way.",
  },
  {
    name: "Mehul S.",
    city: "Hyderabad",
    text: "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally.",
  },
  {
    name: "Rohan T.",
    city: "Delhi",
    text: "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. It's the first app that finally challenges me at the right level.",
  },
  {
    name: "Sneha M.",
    city: "Chennai",
    text: "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading.",
  },
  {
    name: "Karthik V.",
    city: "Coimbatore",
    text: "Wow… I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing.",
  },
] as const;

const MASCOTS = [
  { src: "/mascots/happy.svg", name: "Happy", caption: "Celebrates every small win with you." },
  { src: "/mascots/calm.svg", name: "Calm", caption: "Keeps the pace gentle and steady." },
  { src: "/mascots/sad.svg", name: "Tender", caption: "Sits with you through the hard days." },
] as const;

const EC_ROWS = [
  "Unlimited AI speaking sessions",
  "Learn with content you actually like",
  "Unlimited feedback with detailed lesson reports",
  "A safe space to make mistakes",
] as const;

const TUTOR_ROWS = [
  "Lessons around a tutor's schedule",
  "A one-size-fits-all curriculum",
  "Subjective feedback that doesn't fully reflect you",
  "Making mistakes can feel stressful",
] as const;

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e3fd]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b13]";

/* ----------------------------------------------------------------------- */
/*  Scoped CSS (all v2- prefixed) + one refined display face               */
/* ----------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..500&display=swap');

.v2-display { font-family: 'Fraunces', 'Plus Jakarta Sans', ui-serif, Georgia, serif; font-optical-sizing: auto; }

.v2-glass {
  background: linear-gradient(155deg, rgba(255,255,255,0.065), rgba(255,255,255,0.012));
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(20px) saturate(155%);
  -webkit-backdrop-filter: blur(20px) saturate(155%);
  box-shadow: 0 44px 100px -55px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07);
}

.v2-aurora-text {
  background: linear-gradient(100deg,#00e3fd 0%,#b79fff 38%,#ff6c95 64%,#f59e0b 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

@keyframes v2-breathe { 0%,100%{ transform: translateY(0) scale(1);} 50%{ transform: translateY(-6px) scale(1.013);} }
.v2-breathe { animation: v2-breathe 7s ease-in-out infinite; }

@keyframes v2-float { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-14px);} }
.v2-float { animation: v2-float 9s ease-in-out infinite; }

@keyframes v2-float-slow { 0%,100%{ transform: translateY(0) rotate(0deg);} 50%{ transform: translateY(-22px) rotate(1.6deg);} }
.v2-float-slow { animation: v2-float-slow 14s ease-in-out infinite; }

@keyframes v2-orb { 0%,100%{ transform: scale(1); opacity:.5;} 50%{ transform: scale(1.14); opacity:.82;} }
.v2-orb { animation: v2-orb 8.5s ease-in-out infinite; }

@keyframes v2-twinkle { 0%,100%{ opacity:.18; transform: scale(.8);} 50%{ opacity:.9; transform: scale(1.15);} }
.v2-twinkle { animation: v2-twinkle 4s ease-in-out infinite; }

@keyframes v2-shimmer { to { background-position: 200% center; } }
.v2-shimmer { background-size: 200% auto; animation: v2-shimmer 9s linear infinite; }

@keyframes v2-ribbon-shift { 0%,100%{ transform: translateX(-2.5%);} 50%{ transform: translateX(2.5%);} }
.v2-ribbon-line { animation: v2-ribbon-shift 13s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .v2-breathe, .v2-float, .v2-float-slow, .v2-orb, .v2-twinkle, .v2-shimmer, .v2-ribbon-line {
    animation: none !important;
  }
}
`;

/* ----------------------------------------------------------------------- */
/*  Live aurora canvas — drifting brand-tinted ribbons (the signature)     */
/* ----------------------------------------------------------------------- */

type Ribbon = {
  baseY: number;
  amp: number;
  thick: number;
  freq: number;
  speed: number;
  phase: number;
  color: [number, number, number];
  alpha: number;
};

const RIBBONS: Ribbon[] = [
  { baseY: 0.3, amp: 0.05, thick: 0.16, freq: 0.006, speed: 0.16, phase: 0.0, color: [0, 227, 253], alpha: 0.3 },
  { baseY: 0.42, amp: 0.07, thick: 0.2, freq: 0.004, speed: 0.12, phase: 1.6, color: [183, 159, 255], alpha: 0.32 },
  { baseY: 0.55, amp: 0.06, thick: 0.22, freq: 0.005, speed: 0.1, phase: 3.1, color: [255, 108, 149], alpha: 0.22 },
  { baseY: 0.66, amp: 0.05, thick: 0.18, freq: 0.0045, speed: 0.14, phase: 4.7, color: [245, 158, 11], alpha: 0.26 },
  { baseY: 0.48, amp: 0.09, thick: 0.1, freq: 0.0035, speed: 0.08, phase: 2.2, color: [0, 227, 253], alpha: 0.18 },
];

const STATIC_AURORA =
  "radial-gradient(120% 80% at 20% 10%, rgba(0,227,253,0.18), transparent 55%)," +
  "radial-gradient(120% 90% at 80% 25%, rgba(183,159,255,0.2), transparent 55%)," +
  "radial-gradient(120% 90% at 60% 70%, rgba(255,108,149,0.14), transparent 55%)," +
  "radial-gradient(120% 90% at 30% 80%, rgba(245,158,11,0.14), transparent 55%)," +
  "linear-gradient(180deg,#0a0a12,#120f1c)";

function AuroraCanvas({ faint = false, className }: { faint?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let lastT = faint ? 1.5 : 2.4;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const alphaScale = faint ? 0.5 : 1;

    const drawFrame = (t: number) => {
      lastT = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0a0a12");
      bg.addColorStop(0.55, "#0d0b16");
      bg.addColorStop(1, "#120f1c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      const step = Math.max(8, w / 60);
      for (const r of RIBBONS) {
        const baseY = r.baseY * h;
        const amp = r.amp * h;
        const thick = r.thick * h;
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          const y =
            baseY +
            Math.sin(x * r.freq + t * r.speed + r.phase) * amp +
            Math.sin(x * r.freq * 0.5 - t * r.speed * 0.7) * amp * 0.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = w; x >= 0; x -= step) {
          const y =
            baseY +
            thick +
            Math.sin(x * r.freq + t * r.speed + r.phase + 0.6) * amp +
            Math.sin(x * r.freq * 0.5 - t * r.speed * 0.7) * amp * 0.5;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + thick + amp);
        const [cr, cg, cb] = r.color;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
        g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${r.alpha * alphaScale})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      drawFrame(lastT);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduced) {
      // Reduced motion: render a single static aurora frame, no loop.
      drawFrame(lastT);
      return () => window.removeEventListener("resize", resize);
    }

    const start = performance.now();
    const loop = (now: number) => {
      drawFrame((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced, faint]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ filter: `blur(${faint ? 44 : 66}px)` }}
    />
  );
}

/* ----------------------------------------------------------------------- */
/*  Small atmosphere pieces                                                */
/* ----------------------------------------------------------------------- */

function Orb({
  className,
  color,
  size = 360,
}: {
  className?: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className={`v2-orb pointer-events-none absolute rounded-full ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 50%, ${color}, transparent 68%)`,
        filter: "blur(36px)",
      }}
    />
  );
}

const STARS = [
  { left: "12%", top: "22%", d: "0s" },
  { left: "78%", top: "16%", d: "1.2s" },
  { left: "62%", top: "34%", d: "2.1s" },
  { left: "30%", top: "62%", d: "0.6s" },
  { left: "88%", top: "54%", d: "1.7s" },
  { left: "46%", top: "12%", d: "2.6s" },
  { left: "20%", top: "44%", d: "3.1s" },
];

function StarField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="v2-twinkle absolute h-[3px] w-[3px] rounded-full bg-white"
          style={{ left: s.left, top: s.top, animationDelay: s.d, boxShadow: "0 0 8px 1px rgba(255,255,255,0.7)" }}
        />
      ))}
    </div>
  );
}

function RibbonDivider() {
  return (
    <div aria-hidden className="relative mx-auto my-2 h-px w-full max-w-6xl overflow-visible px-6">
      <div
        className="v2-ribbon-line h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,227,253,0.35), rgba(183,159,255,0.5), rgba(255,108,149,0.35), transparent)",
          filter: "blur(0.5px)",
        }}
      />
    </div>
  );
}

function Reveal({
  children,
  y = 44,
  delay = 0,
  className,
}: {
  children: ReactNode;
  y?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan/90">
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------- */
/*  Bento internals — animated bars, gauge                                 */
/* ----------------------------------------------------------------------- */

function CefrBars() {
  const reduced = useReducedMotion();
  const bars = [
    { l: "B1", p: 45 },
    { l: "B2", p: 75 },
    { l: "C1", p: 100 },
  ];
  return (
    <div className="mt-6 flex flex-col gap-4">
      {bars.map((b, i) => (
        <div key={b.l} className="flex items-center gap-3">
          <span className="w-7 shrink-0 text-xs font-semibold text-heading">{b.l}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#00e3fd,#b79fff,#f59e0b)" }}
              initial={{ width: reduced ? `${b.p}%` : "0%" }}
              whileInView={{ width: `${b.p}%` }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.6, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-body">{b.p}%</span>
        </div>
      ))}
    </div>
  );
}

function PronGauge() {
  const reduced = useReducedMotion();
  const C = 2 * Math.PI * 42;
  const target = C * (1 - 0.89);
  return (
    <div className="mt-4 flex items-center gap-5">
      <div className="relative grid shrink-0 place-items-center">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#v2gauge)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: reduced ? target : C }}
            whileInView={{ strokeDashoffset: target }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="v2gauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00e3fd" />
              <stop offset="0.6" stopColor="#b79fff" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute font-display text-2xl font-bold text-heading">89%</span>
      </div>
      <div>
        <p className="v2-display text-2xl text-heading">Beautiful</p>
        <p className="mt-1 font-mono text-sm text-cyan">B.YOO·tih·Fuhl</p>
        <p className="mt-2 text-sm text-body">Pronounce every word right and sound natural.</p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Lesson carousel (embla, slow autoplay)                                 */
/* ----------------------------------------------------------------------- */

function LessonCarousel() {
  const reduced = useReducedMotion();
  const plugins = useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]),
    [reduced],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", dragFree: false }, plugins);
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y items-stretch">
          {LESSONS.map((l) => (
            <div
              key={l.title}
              className="relative min-w-0 shrink-0 grow-0 basis-[85%] pr-5 sm:basis-[47%] lg:basis-[32%]"
            >
              <article className="v2-glass flex h-full flex-col justify-between rounded-[26px] p-6">
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: l.color }}
                  >
                    {l.tag}
                  </span>
                  <h3 className="v2-display mt-4 text-[1.55rem] leading-tight text-heading">{l.title}</h3>
                </div>
                <div className="mt-8 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-sm font-medium text-body">
                  <MessageCircle className="h-4 w-4 shrink-0" style={{ color: l.color }} aria-hidden />
                  Talk about this in English
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous lesson"
          className={`v2-glass grid h-11 w-11 cursor-pointer place-items-center rounded-full text-heading transition-transform hover:scale-105 ${focus}`}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next lesson"
          className={`v2-glass grid h-11 w-11 cursor-pointer place-items-center rounded-full text-heading transition-transform hover:scale-105 ${focus}`}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Reviews — slow crossfade tide                                          */
/* ----------------------------------------------------------------------- */

function ReviewsTide() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % REVIEWS.length), 5400);
    return () => clearInterval(id);
  }, [reduced]);

  const r = REVIEWS[idx];

  return (
    <div className="relative mx-auto max-w-3xl">
      <Quote className="mx-auto mb-6 h-9 w-9 text-secondary-1/70" aria-hidden />
      <div className="relative min-h-[230px] sm:min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.figure
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="mb-5 flex justify-center gap-1" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary-1 text-primary-1" aria-hidden />
              ))}
            </div>
            <blockquote className="v2-display text-balance text-[1.5rem] leading-snug text-heading sm:text-[1.9rem]">
              “{r.text}”
            </blockquote>
            <figcaption className="mt-6 text-sm text-body">
              <span className="font-semibold text-heading">{r.name}</span>
              <span className="text-muted-foreground"> · {r.city}</span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-center gap-2.5">
        {REVIEWS.map((rev, i) => (
          <button
            key={rev.name}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show review from ${rev.name}`}
            aria-current={i === idx}
            className={`h-2 cursor-pointer rounded-full transition-all duration-500 ${focus} ${
              i === idx ? "w-7 bg-cyan" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Store buttons                                                          */
/* ----------------------------------------------------------------------- */

function StoreButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/signup"
        className={`v2-glass group flex items-center gap-3 rounded-2xl px-5 py-3 text-heading transition-transform hover:scale-[1.03] ${focus}`}
      >
        <svg viewBox="0 0 512 512" className="h-6 w-6" aria-hidden>
          <path d="M48 32 L300 256 L48 480 Z" fill="url(#v2gp)" />
          <defs>
            <linearGradient id="v2gp" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00e3fd" />
              <stop offset="0.5" stopColor="#b79fff" />
              <stop offset="1" stopColor="#ff6c95" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Get it on</span>
          <span className="block text-sm font-semibold">Google Play</span>
        </span>
      </Link>
      <Link
        href="/signup"
        className={`v2-glass group flex items-center gap-3 rounded-2xl px-5 py-3 text-heading transition-transform hover:scale-[1.03] ${focus}`}
      >
        <svg viewBox="0 0 384 512" className="h-6 w-6 fill-current" aria-hidden>
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Download on the</span>
          <span className="block text-sm font-semibold">App Store</span>
        </span>
      </Link>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Page                                                                   */
/* ----------------------------------------------------------------------- */

export default function Page() {
  const reduced = useReducedMotion();

  // Page-scroll parallax for the hero atmosphere.
  const { scrollY } = useScroll();
  const orbY = useTransform(scrollY, [0, 900], reduced ? [0, 0] : [0, -120]);
  const heroTextY = useTransform(scrollY, [0, 700], reduced ? [0, 0] : [0, 80]);

  // Pointer parallax — the hero slab drifts to the eye.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 40, damping: 18, mass: 0.6 });
  const slabX = useTransform(sx, [-1, 1], [16, -16]);
  const slabY = useTransform(sy, [-1, 1], [12, -12]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      px.set((e.clientX - cx) / cx);
      py.set((e.clientY - cy) / cy);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, px, py]);

  return (
    <MotionConfig reducedMotion="user">
      <style>{CSS}</style>

      {/* Fixed back-pill */}
      <Link
        href="/showcase"
        className={`v2-glass fixed left-4 top-4 z-50 rounded-full px-4 py-2 text-sm font-medium text-heading transition-transform hover:scale-105 ${focus}`}
      >
        ← All 5 designs
      </Link>

      <main className="relative min-h-screen w-full overflow-x-hidden bg-[#18181c] font-body text-body antialiased">
        {/* ================= HERO ================= */}
        <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <AuroraCanvas className="absolute inset-[-7%] h-[114%] w-[114%]" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_40%,rgba(10,10,18,0.7)_100%)]" />
          </div>
          <StarField />
          <motion.div style={{ y: orbY }} className="pointer-events-none absolute inset-0 -z-10">
            <Orb className="left-[-8%] top-[6%]" color="rgba(0,227,253,0.4)" size={420} />
            <Orb className="right-[-6%] top-[24%]" color="rgba(183,159,255,0.42)" size={480} />
            <Orb className="bottom-[-6%] left-[30%]" color="rgba(255,108,149,0.26)" size={380} />
          </motion.div>

          {/* Nav */}
          <header className="relative z-30 px-4 pt-20 sm:pt-8">
            <nav className="v2-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 sm:px-6">
              <Link href="/" className={`flex items-center gap-2.5 rounded-full ${focus}`} aria-label="English Connection home">
                <span className="v2-breathe relative grid h-9 w-9 place-items-center">
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{ background: "radial-gradient(circle,rgba(0,227,253,0.5),transparent 70%)", filter: "blur(6px)" }}
                  />
                  <Image src="/logo.svg" alt="" width={32} height={32} unoptimized className="relative" />
                </span>
                <span className="font-display text-[15px] font-semibold text-heading">English Connection</span>
              </Link>
              <AccountChip />
            </nav>
          </header>

          {/* Hero content */}
          <div className="relative z-20 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div style={{ y: heroTextY }}>
              <Reveal y={28}>
                <SectionLabel>Your dawn, your voice</SectionLabel>
              </Reveal>
              <Reveal delay={0.15} y={36}>
                <h1 className="v2-display mt-6 text-balance text-[clamp(2.6rem,7vw,5.4rem)] font-light leading-[1.02] text-heading">
                  English Connection,{" "}
                  <span className="v2-aurora-text v2-shimmer italic">your AI English coach</span>
                </h1>
              </Reveal>
              <Reveal delay={0.3} y={28}>
                <p className="mt-7 max-w-md text-lg leading-relaxed text-body">
                  Speak softly, learn deeply. A calm coach that listens, understands, and lights the way
                  forward — one quiet conversation at a time.
                </p>
              </Reveal>

              <Reveal delay={0.45} y={24}>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href="/signup"
                    className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-7 py-3.5 font-semibold text-[#160d04] shadow-[0_20px_50px_-18px_rgba(249,115,22,0.7)] transition-transform hover:scale-[1.04] ${focus}`}
                  >
                    Open webapp
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                  <Link
                    href="/login"
                    className={`v2-glass inline-flex items-center justify-center rounded-full px-7 py-3.5 font-semibold text-heading transition-transform hover:scale-[1.04] ${focus}`}
                  >
                    I already have an account
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.6} y={20}>
                <div className="mt-9 flex flex-wrap items-center gap-6 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 fill-primary-1 text-primary-1" aria-hidden />
                    <span className="font-semibold text-heading">4.8</span>
                    <span className="text-muted-foreground">rating</span>
                  </span>
                  <span className="h-4 w-px bg-white/15" aria-hidden />
                  <span>
                    <span className="font-semibold text-heading">1,00,000+</span>{" "}
                    <span className="text-muted-foreground">learners</span>
                  </span>
                </div>
              </Reveal>
            </motion.div>

            {/* Floating glass slab with the live AI demo */}
            <Reveal delay={0.4} y={56}>
              <motion.div style={{ x: slabX, y: slabY }} className="relative">
                <Orb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(183,159,255,0.4)" size={460} />
                <div className="v2-float relative">
                  <div className="v2-glass h-[540px] overflow-hidden rounded-[34px] p-3">
                    <AiPartnerDemo />
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </section>

        {/* ================= BIG TAGLINE ================= */}
        <section className="relative px-6 py-28 sm:py-36">
          <Orb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(0,227,253,0.16)" size={520} />
          <Reveal className="relative mx-auto max-w-4xl text-center">
            <h2 className="v2-display text-balance text-[clamp(2.2rem,6vw,4.4rem)] font-light leading-[1.08] text-heading">
              English learning has never been{" "}
              <span className="v2-aurora-text v2-shimmer italic">this fun.</span>
            </h2>
          </Reveal>
        </section>

        <RibbonDivider />

        {/* ================= 3 STEPS ================= */}
        <section className="relative px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-20 max-w-2xl">
              <SectionLabel>Three quiet steps</SectionLabel>
              <h2 className="v2-display mt-5 text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight text-heading">
                A practice that feels like a conversation, not a class.
              </h2>
            </Reveal>

            <div className="flex flex-col gap-28">
              {/* Step 01 */}
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                <Reveal className="order-2 lg:order-1">
                  <StepHeading n="01" title="Talk it out with your AI partner" />
                </Reveal>
                <Reveal y={56} delay={0.1} className="order-1 lg:order-2">
                  <SlabFloat>
                    <div className="v2-glass h-[560px] overflow-hidden rounded-[32px] p-3">
                      <AiPartnerDemo />
                    </div>
                  </SlabFloat>
                </Reveal>
              </div>

              {/* Step 02 */}
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                <Reveal y={56} className="order-1">
                  <SlabFloat color="rgba(0,227,253,0.34)">
                    <div className="v2-glass overflow-hidden rounded-[32px] p-3">
                      <JumbleDemo />
                    </div>
                  </SlabFloat>
                </Reveal>
                <Reveal delay={0.1} className="order-2">
                  <StepHeading n="02" title="Rebuild real sentences in Jumble Words" />
                </Reveal>
              </div>

              {/* Step 03 */}
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                <Reveal className="order-2 lg:order-1">
                  <StepHeading n="03" title="Speak, then see exactly what to fix" />
                </Reveal>
                <Reveal y={56} delay={0.1} className="order-1 lg:order-2">
                  <SlabFloat color="rgba(255,108,149,0.32)">
                    <div className="v2-glass overflow-hidden rounded-[32px] p-3">
                      <PronunciationDemo />
                    </div>
                  </SlabFloat>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MASCOTS ================= */}
        <section className="relative overflow-hidden px-6 py-28">
          <Orb className="left-[10%] top-[20%]" color="rgba(245,158,11,0.18)" size={360} />
          <Orb className="right-[12%] bottom-[10%]" color="rgba(183,159,255,0.22)" size={400} />
          <div className="relative mx-auto max-w-6xl text-center">
            <Reveal>
              <SectionLabel>A coach with a heart</SectionLabel>
              <h2 className="v2-display mx-auto mt-5 max-w-2xl text-balance text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight text-heading">
                A companion that feels what you feel.
              </h2>
            </Reveal>

            <div className="mt-20 grid grid-cols-1 gap-10 sm:grid-cols-3">
              {MASCOTS.map((m, i) => (
                <Reveal key={m.name} delay={i * 0.12} className="flex flex-col items-center">
                  <div className="relative">
                    <Orb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(0,227,253,0.3)" size={220} />
                    <div className="v2-glass v2-float relative grid h-40 w-40 place-items-center rounded-full" style={{ animationDelay: `${i * 0.8}s` }}>
                      <span className="v2-breathe block" style={{ animationDelay: `${i * 0.5}s` }}>
                        <Image src={m.src} alt={`${m.name} mascot`} width={110} height={110} unoptimized />
                      </span>
                    </div>
                  </div>
                  <h3 className="v2-display mt-7 text-2xl text-heading">{m.name}</h3>
                  <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-body">{m.caption}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <RibbonDivider />

        {/* ================= LESSON CAROUSEL ================= */}
        <section className="relative px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-12 max-w-2xl">
              <SectionLabel>Tuned to you</SectionLabel>
              <h2 className="v2-display mt-5 text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight text-heading">
                Endless lessons, picked just for you
              </h2>
              <p className="mt-4 text-lg text-body">
                Daily curated content tuned to what you struggle with most.
              </p>
            </Reveal>
            <Reveal y={50}>
              <LessonCarousel />
            </Reveal>
          </div>
        </section>

        {/* ================= WHY BENTO ================= */}
        <section className="relative overflow-hidden px-6 py-24">
          <Orb className="right-[-6%] top-[10%]" color="rgba(0,227,253,0.16)" size={460} />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="mb-12 max-w-2xl">
              <SectionLabel>Built for real progress</SectionLabel>
              <h2 className="v2-display mt-5 text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight text-heading">
                Why English Connection?
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
              {/* a — CEFR */}
              <Reveal className="md:col-span-3">
                <div className="v2-glass h-full rounded-[28px] p-7">
                  <h3 className="v2-display text-2xl text-heading">See your English improve over time</h3>
                  <p className="mt-2 text-sm text-body">
                    Regular level checks show you exactly how far you&apos;ve come.
                  </p>
                  <CefrBars />
                </div>
              </Reveal>

              {/* b — Gauge */}
              <Reveal delay={0.08} className="md:col-span-3">
                <div className="v2-glass h-full rounded-[28px] p-7">
                  <h3 className="v2-display text-2xl text-heading">Accurate pronunciation</h3>
                  <PronGauge />
                </div>
              </Reveal>

              {/* c — Expressions */}
              <Reveal className="md:col-span-2">
                <div className="v2-glass h-full rounded-[28px] p-7">
                  <h3 className="v2-display text-2xl text-heading">Learn real-world expressions</h3>
                  <p className="mt-2 text-sm text-body">
                    Speak the way fluent people actually do — not how textbooks say.
                  </p>
                  <ul className="mt-5 flex flex-col gap-3 text-sm">
                    {[
                      "10 expressions Indian professionals use daily",
                      "Casual phrases for coffee chats",
                      "Essential phrasal verbs for work",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-body">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" aria-hidden />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {/* d — Correction */}
              <Reveal delay={0.08} className="md:col-span-2">
                <div className="v2-glass h-full rounded-[28px] p-7">
                  <h3 className="v2-display text-2xl text-heading">Know exactly what to fix</h3>
                  <p className="mt-2 text-sm text-body">
                    Specific feedback after every lesson — not vague pats on the back.
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <div className="rounded-2xl border border-pink/20 bg-pink/5 p-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pink">
                        <X className="h-3.5 w-3.5" aria-hidden /> You said
                      </div>
                      <p className="text-sm text-body line-through decoration-pink/50">
                        I am understanding what you mean.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan">
                        <Check className="h-3.5 w-3.5" aria-hidden /> Correct
                      </div>
                      <p className="text-sm font-medium text-heading">I understand what you mean.</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* e — Mistakes */}
              <Reveal delay={0.16} className="md:col-span-2">
                <div className="v2-glass h-full rounded-[28px] p-7">
                  <h3 className="v2-display text-2xl text-heading">Turn mistakes into strengths</h3>
                  <p className="mt-2 text-sm text-body">
                    The words you trip on become tomorrow&apos;s warm-up drills, so the same mistake never
                    sneaks in twice.
                  </p>
                  <div className="mt-5 rounded-2xl border border-secondary-1/20 bg-secondary-1/[0.06] p-4 text-sm italic text-body">
                    Practice speaking out loud to build a stronger connection between your brain and your
                    mouth.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <RibbonDivider />

        {/* ================= REVIEWS ================= */}
        <section className="relative overflow-hidden px-6 py-28">
          <Orb className="left-1/2 top-1/3 -translate-x-1/2" color="rgba(183,159,255,0.18)" size={520} />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="mb-16 text-center">
              <SectionLabel>Voices at dawn</SectionLabel>
              <h2 className="v2-display mx-auto mt-5 max-w-2xl text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight text-heading">
                Speak English with confidence
              </h2>
            </Reveal>

            <Reveal>
              <ReviewsTide />
            </Reveal>

            <Reveal y={30} className="mt-20">
              <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4">
                {[
                  { n: "1L+", l: "Happy users" },
                  { n: "4.8", l: "Rating" },
                  { n: "31K+", l: "Lessons" },
                ].map((s) => (
                  <div key={s.l} className="v2-glass rounded-[24px] px-4 py-7 text-center">
                    <p className="v2-display v2-aurora-text text-[clamp(1.8rem,5vw,2.8rem)] font-medium">{s.n}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= PRICING ================= */}
        <section className="relative px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mb-14 text-center">
              <SectionLabel>Honest pricing</SectionLabel>
              <h2 className="v2-display mx-auto mt-5 max-w-2xl text-[clamp(2rem,5vw,3.4rem)] font-light leading-tight text-heading">
                Tutor-level results, no tutor-level fees
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* English Connection */}
              <Reveal y={50}>
                <div className="relative h-full overflow-hidden rounded-[30px] p-[1px]">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-80"
                    style={{ background: "linear-gradient(150deg,#00e3fd,#b79fff,#f59e0b)" }}
                  />
                  <div className="v2-glass relative h-full rounded-[29px] p-8">
                    <div className="flex items-center gap-2.5">
                      <span className="v2-breathe grid h-8 w-8 place-items-center">
                        <Image src="/logo.svg" alt="" width={28} height={28} unoptimized />
                      </span>
                      <span className="font-display font-semibold text-heading">English Connection</span>
                    </div>
                    <div className="mt-6 flex items-end gap-1.5">
                      <span className="v2-display text-5xl font-medium text-heading">₹399</span>
                      <span className="mb-1.5 text-sm text-muted-foreground">/month</span>
                    </div>
                    <ul className="mt-7 flex flex-col gap-3.5">
                      {EC_ROWS.map((row) => (
                        <li key={row} className="flex items-start gap-3 text-sm text-body">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan/15">
                            <Check className="h-3.5 w-3.5 text-cyan" aria-hidden />
                          </span>
                          {row}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-7 py-3.5 font-semibold text-[#160d04] transition-transform hover:scale-[1.02] ${focus}`}
                    >
                      Open the webapp
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </Reveal>

              {/* Private tutor */}
              <Reveal y={50} delay={0.1}>
                <div className="v2-glass h-full rounded-[30px] p-8 opacity-90">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-muted-foreground">
                      <X className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-display font-semibold text-body">Private tutor</span>
                  </div>
                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="v2-display text-5xl font-medium text-muted-foreground">₹8,000</span>
                    <span className="mb-1.5 text-sm text-muted-foreground">/month</span>
                  </div>
                  <ul className="mt-7 flex flex-col gap-3.5">
                    {TUTOR_ROWS.map((row) => (
                      <li key={row} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.05]">
                          <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        </span>
                        {row}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="relative isolate overflow-hidden px-6 py-32">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <AuroraCanvas faint className="absolute inset-[-7%] h-[114%] w-[114%]" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_30%,rgba(10,10,18,0.6)_100%)]" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="relative mx-auto mb-8 w-fit">
                <Orb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(245,158,11,0.4)" size={260} />
                <span className="v2-float relative block">
                  <span className="v2-breathe block">
                    <Image src="/mascots/happy.svg" alt="Happy mascot" width={132} height={132} unoptimized />
                  </span>
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="v2-display text-balance text-[clamp(2.4rem,6vw,4.2rem)] font-light leading-[1.05] text-heading">
                So, are you <span className="v2-aurora-text v2-shimmer italic">ready?</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/signup"
                  className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-8 py-4 text-lg font-semibold text-[#160d04] shadow-[0_24px_60px_-20px_rgba(249,115,22,0.7)] transition-transform hover:scale-[1.04] ${focus}`}
                >
                  Open the webapp
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-10 text-sm uppercase tracking-[0.3em] text-muted-foreground">Or download the app</p>
              <div className="mt-5 flex justify-center">
                <StoreButtons />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="relative border-t border-white/[0.07] px-6 py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="v2-breathe grid h-8 w-8 place-items-center">
                  <Image src="/logo.svg" alt="" width={28} height={28} unoptimized />
                </span>
                <span className="font-display font-semibold text-heading">English Connection</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-body">
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
            <FooterCol
              title="Get the app"
              links={[
                { label: "Google Play", href: "/signup" },
                { label: "App Store", href: "/signup" },
              ]}
            />
          </div>

          <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-2 border-t border-white/[0.07] pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 English Connection · Built for India&apos;s ambitious learners</span>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}

/* ----------------------------------------------------------------------- */
/*  Local layout helpers                                                   */
/* ----------------------------------------------------------------------- */

function StepHeading({ n, title }: { n: string; title: string }) {
  return (
    <div>
      <span className="v2-display v2-aurora-text text-6xl font-light sm:text-7xl">{n}</span>
      <h3 className="v2-display mt-5 max-w-md text-[clamp(1.7rem,3.5vw,2.6rem)] font-light leading-tight text-heading">
        {title}
      </h3>
      <Link
        href="/signup"
        className={`mt-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-heading transition-all hover:border-cyan/40 hover:bg-cyan/[0.07] ${focus}`}
      >
        Try now
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function SlabFloat({ children, color = "rgba(183,159,255,0.34)" }: { children: ReactNode; color?: string }) {
  return (
    <div className="relative">
      <Orb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color={color} size={420} />
      <div className="v2-float-slow relative">{children}</div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className={`rounded text-sm text-body transition-colors hover:text-cyan ${focus}`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

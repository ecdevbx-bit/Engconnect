"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Star, Check, X, ArrowUpRight, Mic, Quote, Play } from "lucide-react";
import confetti from "canvas-confetti";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import { MascotEmotionMarquee } from "@/components/landing/MascotEmotionMarquee";
import AccountChip from "@/components/layout/AccountChip";

/* ----------------------------------------------------------------------- */
/*  helpers + data                                                          */
/* ----------------------------------------------------------------------- */

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181c]";

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*<>/+=";

type Lesson = { tag: string; title: string };
const LESSONS: Lesson[] = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?" },
  { tag: "CULTURE", title: "How British tea became a ritual" },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk" },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind" },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk" },
  { tag: "WELLNESS", title: "Why your accent never fully disappears" },
  { tag: "NEWS", title: "When AI rewrote the office" },
];

type Review = { name: string; city: string; quote: string; big?: boolean };
const REVIEWS: Review[] = [
  {
    name: "Priya R.",
    city: "Bengaluru",
    big: true,
    quote:
      "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class.",
  },
  {
    name: "Anita K.",
    city: "Pune",
    quote:
      "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way.",
  },
  {
    name: "Mehul S.",
    city: "Hyderabad",
    quote:
      "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally.",
  },
  {
    name: "Rohan T.",
    city: "Delhi",
    big: true,
    quote:
      "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. It's the first app that finally challenges me at the right level.",
  },
  {
    name: "Sneha M.",
    city: "Chennai",
    quote:
      "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading.",
  },
  {
    name: "Karthik V.",
    city: "Coimbatore",
    quote:
      "Wow… I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing.",
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

const TICKER_A = [
  "LIVE TRANSCRIPTION",
  "SPEAK FREELY",
  "GET CORRECTED",
  "SOUND NATURAL",
  "PRACTICE DAILY",
  "ENGLISH CONNECTION",
];
const TICKER_B = [
  "4.8 ★ RATING",
  "1,00,000+ LEARNERS",
  "BUILT FOR INDIA",
  "₹399 / MONTH",
  "YOUR AI ENGLISH COACH",
  "NO TUTOR-LEVEL FEES",
];

/* ----------------------------------------------------------------------- */
/*  small primitives                                                        */
/* ----------------------------------------------------------------------- */

function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word masked reveal (editorial split-text). */
function SplitReveal({
  text,
  className,
  wordClass,
}: {
  text: string;
  className?: string;
  wordClass?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.08em" }}
        >
          <motion.span
            className={cx("inline-block", wordClass)}
            initial={reduce ? { y: 0 } : { y: "115%" }}
            animate={reduce || inView ? { y: 0 } : undefined}
            transition={{
              duration: 0.75,
              delay: reduce ? 0 : i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Live "transcribe / type-on" scramble that locks in left-to-right. */
function TranscribeText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = !!useReducedMotion();
  const [display, setDisplay] = useState<string>(reduce ? text : "");
  const [done, setDone] = useState<boolean>(reduce);

  useEffect(() => {
    if (reduce) {
      setDisplay(text);
      setDone(true);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const perChar = 34; // ms to settle each character
    const window = 7; // how many scrambling chars trail the boundary
    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const settled = Math.floor(elapsed / perChar);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") {
          out += " ";
          continue;
        }
        if (i < settled) out += ch;
        else if (i < settled + window)
          out += SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        else out += "";
      }
      setDisplay(out);
      if (settled <= text.length) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplay(text);
        setDone(true);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, reduce]);

  return (
    <span className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="relative inline-block">
        {/* invisible copy reserves the final layout so nothing reflows */}
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">
          {display}
          <span
            className="v1-caret"
            style={{ opacity: done ? 0 : 1 }}
            aria-hidden
          />
        </span>
      </span>
    </span>
  );
}

/** Infinite editorial ticker. */
function Marquee({
  items,
  reverse,
  className,
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className={cx("v1-mq-wrap", className)}>
      <div className={cx("v1-mq", reverse && "v1-mq-rev")}>
        {doubled.map((it, i) => (
          <span key={i} className="v1-mq-item">
            <span>{it}</span>
            <span className="v1-mq-dot" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

function Stars({ size = 14 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className="fill-[#f97316] text-[#f97316]" />
      ))}
    </span>
  );
}

function FloatMascot({
  src,
  alt,
  size,
  className,
  delay = 0,
  hidden = true,
}: {
  src: string;
  alt: string;
  size: number;
  className?: string;
  delay?: number;
  hidden?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.img
      src={src}
      alt={hidden ? "" : alt}
      aria-hidden={hidden}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ width: size, height: size }}
      animate={reduce ? undefined : { y: [0, -12, 0], rotate: [-3, 3, -3] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* ----------------------------------------------------------------------- */
/*  hero transcription console                                              */
/* ----------------------------------------------------------------------- */

const CONSOLE_LINES: { who: string; text: string; accent?: boolean }[] = [
  { who: "YOU", text: "I am understanding what you mean." },
  { who: "COACH", text: "Almost — try: I understand what you mean.", accent: true },
  { who: "YOU", text: "I understand what you mean." },
  { who: "COACH", text: "Perfect. Locked in.", accent: true },
];

function TranscriptConsole() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b20] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
      {!reduce && <div className="v1-scan" aria-hidden />}
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-body">
        <span className="flex items-center gap-2 text-heading">
          <span className="v1-rec" aria-hidden />
          Live transcript
        </span>
        <span className="tabular-nums text-muted-foreground">
          00:{mm}:{ss}
        </span>
      </div>

      {/* body */}
      <div className="px-4 py-5 sm:px-5">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          EN <span className="text-[#f97316]">⟶</span> COACH · channel 01
        </p>
        <ul className="space-y-3">
          {CONSOLE_LINES.map((l, i) => (
            <motion.li
              key={i}
              initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.25 + i * 0.55 }}
              className="grid grid-cols-[44px_1fr] items-start gap-3"
            >
              <span
                className={cx(
                  "mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em]",
                  l.accent ? "text-[#f97316]" : "text-muted-foreground"
                )}
              >
                {l.who}
              </span>
              <span
                className={cx(
                  "text-[13px] leading-snug sm:text-sm",
                  l.accent ? "text-heading" : "text-body"
                )}
              >
                {l.text}
                {i === CONSOLE_LINES.length - 1 && (
                  <span className="v1-caret v1-caret-sm" aria-hidden />
                )}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* waveform */}
        <div className="mt-6 flex items-end gap-1.5 border-t border-white/10 pt-4">
          {Array.from({ length: 28 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-1 flex-1 rounded-full bg-gradient-to-t from-[#f59e0b] to-[#f97316]"
              style={{ originY: 1, height: 22 }}
              animate={
                reduce
                  ? undefined
                  : { scaleY: [0.18, 1, 0.4, 0.85, 0.25] }
              }
              transition={{
                duration: 1.1 + (i % 5) * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.045,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  lesson carousel                                                         */
/* ----------------------------------------------------------------------- */

function LessonCarousel() {
  const reduce = useReducedMotion();
  const autoplayRef = useRef<ReturnType<typeof Autoplay> | null>(null);
  if (!autoplayRef.current) {
    autoplayRef.current = Autoplay({ delay: 2800, stopOnInteraction: false });
  }
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    reduce ? [] : [autoplayRef.current]
  );
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 px-1 py-1">
          {LESSONS.map((l, i) => (
            <article
              key={i}
              className="group relative min-w-[260px] max-w-[300px] flex-[0_0_82%] overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f24] p-6 transition-colors duration-300 hover:border-[#f97316]/60 sm:flex-[0_0_44%] lg:flex-[0_0_30%]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f97316]">
                  {l.tag}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3
                className="v1-serif mt-8 text-[1.65rem] leading-[1.05] text-heading"
                style={{ letterSpacing: "-0.01em" }}
              >
                {l.title}
              </h3>
              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-body">Talk about this in English</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-[#f97316] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous lessons"
          className={cx(
            "grid h-10 w-10 place-items-center rounded-full border border-white/15 text-heading transition-colors hover:border-[#f97316] hover:text-[#f97316]",
            FOCUS
          )}
        >
          <ArrowUpRight size={16} className="-rotate-[135deg]" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next lessons"
          className={cx(
            "grid h-10 w-10 place-items-center rounded-full border border-white/15 text-heading transition-colors hover:border-[#f97316] hover:text-[#f97316]",
            FOCUS
          )}
        >
          <ArrowUpRight size={16} className="rotate-45" />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  bento pieces                                                            */
/* ----------------------------------------------------------------------- */

function CefrBar({
  label,
  pct,
  delay,
}: {
  label: string;
  pct: number;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 font-mono text-xs text-body">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg,#f59e0b,#f97316)" }}
          initial={reduce ? { width: `${pct}%` } : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.1, ease: "easeOut", delay }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
}

function Gauge() {
  const reduce = useReducedMotion();
  const r = 54;
  const C = 2 * Math.PI * r;
  const pct = 0.89;
  return (
    <div className="relative grid h-[148px] w-[148px] place-items-center">
      <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
        <circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <motion.circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke="#f97316"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: reduce ? C * (1 - pct) : C }}
          whileInView={{ strokeDashoffset: C * (1 - pct) }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="v1-serif text-3xl text-heading">89%</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          accuracy
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  steps                                                                   */
/* ----------------------------------------------------------------------- */

const STEPS: { n: string; title: string; demo: ReactNode }[] = [
  { n: "01", title: "Talk it out with your AI partner", demo: <AiPartnerDemo /> },
  { n: "02", title: "Rebuild real sentences in Jumble Words", demo: <JumbleDemo /> },
  { n: "03", title: "Speak, then see exactly what to fix", demo: <PronunciationDemo /> },
];

/* ----------------------------------------------------------------------- */
/*  store glyphs                                                            */
/* ----------------------------------------------------------------------- */

function AppleGlyph() {
  return (
    <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 512 512" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  );
}

function StoreButton({
  glyph,
  top,
  bottom,
}: {
  glyph: ReactNode;
  top: string;
  bottom: string;
}) {
  return (
    <a
      href="/signup"
      className={cx(
        "group inline-flex items-center gap-3 rounded-xl border border-white/15 bg-[#1f1f24] px-4 py-2.5 text-heading transition-colors hover:border-[#f97316]/60",
        FOCUS
      )}
    >
      <span className="text-heading transition-transform duration-300 group-hover:scale-110">
        {glyph}
      </span>
      <span className="text-left leading-tight">
        <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {top}
        </span>
        <span className="block text-sm font-semibold">{bottom}</span>
      </span>
    </a>
  );
}

/* ----------------------------------------------------------------------- */
/*  section label                                                          */
/* ----------------------------------------------------------------------- */

function Kicker({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
      <span className="text-[#f97316]">§ {index}</span>
      <span className="h-px flex-1 bg-white/10" />
      <span>{label}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  PAGE                                                                     */
/* ----------------------------------------------------------------------- */

export default function Page() {
  const reduce = useReducedMotion();

  // hero parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const ghostY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  // final CTA confetti
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.5 });
  const fired = useRef(false);
  const burst = useCallback(() => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#f97316", "#f59e0b", "#ecedf6", "#b79fff"],
      disableForReducedMotion: true,
    });
  }, []);
  useEffect(() => {
    if (ctaInView && !fired.current && !reduce) {
      fired.current = true;
      burst();
    }
  }, [ctaInView, reduce, burst]);

  return (
    <div className="min-h-screen bg-[#18181c] font-body text-body antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..600&display=swap');

        .v1-serif{ font-family:'Fraunces', ui-serif, Georgia, serif; font-optical-sizing:auto; }
        .v1-serif-it{ font-family:'Fraunces', ui-serif, Georgia, serif; font-style:italic; }

        .v1-caret{
          display:inline-block; width:0.5ch; height:0.92em; margin-left:0.04em;
          translate:0 0.12em; background:#f97316; animation:v1-blink 1s steps(1) infinite;
        }
        .v1-caret-sm{ height:1em; width:0.42ch; }
        @keyframes v1-blink{ 0%,49%{opacity:1} 50%,100%{opacity:0} }

        .v1-rec{
          width:8px; height:8px; border-radius:9999px; background:#f97316;
          box-shadow:0 0 0 0 rgba(249,115,22,0.7); animation:v1-rec 1.6s ease-out infinite;
        }
        @keyframes v1-rec{
          0%{ box-shadow:0 0 0 0 rgba(249,115,22,0.55) }
          70%{ box-shadow:0 0 0 7px rgba(249,115,22,0) }
          100%{ box-shadow:0 0 0 0 rgba(249,115,22,0) }
        }

        .v1-scan{
          position:absolute; inset:0; pointer-events:none; z-index:5;
          background:linear-gradient(180deg, transparent, rgba(249,115,22,0.10), transparent);
          height:40%; animation:v1-scan 4.5s linear infinite;
        }
        @keyframes v1-scan{ 0%{ transform:translateY(-120%) } 100%{ transform:translateY(320%) } }

        .v1-mq-wrap{ overflow:hidden; width:100%; }
        .v1-mq{ display:flex; width:max-content; animation:v1-marquee 32s linear infinite; }
        .v1-mq-rev{ animation-direction:reverse; }
        .v1-mq-item{ display:flex; align-items:center; white-space:nowrap; }
        .v1-mq-dot{ width:6px; height:6px; border-radius:9999px; background:#f97316; margin:0 1.4rem; }
        @keyframes v1-marquee{ from{ transform:translateX(0) } to{ transform:translateX(-50%) } }

        @media (prefers-reduced-motion: reduce){
          .v1-mq{ animation:none; }
          .v1-scan{ animation:none; display:none; }
          .v1-caret{ animation:none; }
          .v1-rec{ animation:none; }
        }
      `}</style>

      {/* back pill */}
      <Link
        href="/showcase"
        className={cx(
          "fixed left-4 top-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#1f1f24]/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-body backdrop-blur transition-colors hover:border-[#f97316] hover:text-heading",
          FOCUS
        )}
      >
        ← All 5 designs
      </Link>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#18181c]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className={cx("flex items-center gap-2.5", FOCUS, "rounded-md")}
          >
            <motion.img
              src="/logo.svg"
              alt="English Connection"
              width={28}
              height={28}
              className="h-7 w-7"
              animate={reduce ? undefined : { rotate: [0, 6, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="v1-serif text-lg text-heading">English Connection</span>
          </Link>
          <AccountChip />
        </div>
      </header>

      {/* top ticker */}
      <div className="border-b border-white/10 bg-[#1b1b20] py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-body">
        <Marquee items={TICKER_A} />
      </div>

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative overflow-hidden border-b border-white/10"
      >
        {/* ghost word */}
        <motion.span
          aria-hidden
          style={reduce ? undefined : { y: ghostY }}
          className="v1-serif pointer-events-none absolute -right-6 top-10 select-none text-[28vw] font-semibold leading-none text-white/[0.025] sm:top-0"
        >
          EN
        </motion.span>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
          {/* left */}
          <div className="lg:col-span-7">
            <div className="mb-7 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-flex items-center gap-2 text-heading">
                <span className="v1-rec" aria-hidden /> Live
              </span>
              <span className="h-3 w-px bg-white/15" />
              <span>Issue 01</span>
              <span className="h-3 w-px bg-white/15" />
              <span>Your daily English broadcast</span>
            </div>

            <h1
              className="v1-serif font-semibold text-heading"
              style={{
                fontSize: "clamp(2.5rem, 8.2vw, 6.4rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.022em",
              }}
            >
              <TranscribeText text="English Connection, your AI English coach" />
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-body sm:text-lg">
              Speak. Get transcribed live. See exactly what to fix —{" "}
              <span className="v1-serif-it text-heading">in real time.</span>
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className={cx(
                  "group inline-flex items-center gap-2 rounded-full bg-[#f97316] px-6 py-3 text-sm font-semibold text-[#18181c] transition-transform duration-200 hover:scale-[1.03]",
                  FOCUS
                )}
              >
                Open webapp
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <Link
                href="/login"
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-heading transition-colors hover:border-[#f97316] hover:text-[#f97316]",
                  FOCUS
                )}
              >
                I already have an account
              </Link>
            </div>

            {/* stat row */}
            <div className="mt-12 flex flex-wrap items-end gap-8 border-t border-white/10 pt-7">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="v1-serif text-4xl text-heading">4.8</span>
                  <Stars />
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  average rating
                </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <span className="v1-serif text-4xl text-heading">1,00,000+</span>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  learners on board
                </div>
              </div>
            </div>
          </div>

          {/* right console */}
          <div className="relative lg:col-span-5">
            <Reveal delay={0.1}>
              <TranscriptConsole />
            </Reveal>
            <FloatMascot
              src="/mascots/happy.svg"
              alt="Happy mascot"
              size={84}
              delay={0.4}
              className="pointer-events-none absolute -right-3 -top-9 drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)] sm:-right-6"
            />
          </div>
        </div>
      </section>

      {/* BIG TAGLINE */}
      <section className="border-b border-white/10 bg-[#1b1b20] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.24em] text-[#f97316]">
            — the headline
          </p>
          <h2
            className="v1-serif font-medium text-heading"
            style={{
              fontSize: "clamp(2.2rem, 6.5vw, 5.2rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            <SplitReveal text="English learning has never been" />{" "}
            <SplitReveal text="this fun." wordClass="v1-serif-it text-[#f97316]" />
          </h2>
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Kicker index="01" label="The feature / three movements" />
        <Reveal>
          <h2 className="v1-serif text-3xl text-heading sm:text-4xl">
            How a five-minute lesson works
          </h2>
        </Reveal>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={cx(
                "grid items-center gap-8 lg:grid-cols-2 lg:gap-14",
                i % 2 === 1 && "lg:[&>*:first-child]:order-2"
              )}
            >
              <Reveal>
                <div className="flex items-start gap-5">
                  <span
                    className="v1-serif shrink-0 leading-none text-white/12"
                    style={{ fontSize: "clamp(3.5rem, 10vw, 6rem)" }}
                  >
                    {s.n}
                  </span>
                  <div className="pt-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#f97316]">
                      Step {s.n}
                    </span>
                    <h3 className="v1-serif mt-3 text-2xl leading-tight text-heading sm:text-[2rem]">
                      {s.title}
                    </h3>
                    <div className="mt-5 h-px w-16 bg-[#f97316]" />
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f24] p-2 sm:p-3">
                  {s.demo}
                </div>
              </Reveal>
            </div>
          ))}
        </div>

        <Reveal className="mt-16 flex justify-center">
          <Link
            href="/signup"
            className={cx(
              "group inline-flex items-center gap-2 rounded-full bg-[#f97316] px-7 py-3.5 text-sm font-semibold text-[#18181c] transition-transform duration-200 hover:scale-[1.03]",
              FOCUS
            )}
          >
            Try now
            <ArrowUpRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </Reveal>
      </section>

      {/* MASCOT EMOTIONS */}
      <section className="border-y border-white/10 bg-[#1b1b20] py-16">
        <div className="mx-auto mb-8 max-w-6xl px-4 sm:px-6">
          <Kicker index="02" label="Cast of characters" />
          <Reveal>
            <h2 className="v1-serif text-2xl text-heading sm:text-3xl">
              A coach with <span className="v1-serif-it text-[#f97316]">range</span>
            </h2>
          </Reveal>
        </div>
        <MascotEmotionMarquee />
      </section>

      {/* LESSON CAROUSEL */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Kicker index="03" label="Today's syndication" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <h2 className="v1-serif max-w-xl text-3xl leading-tight text-heading sm:text-[2.6rem]">
              Endless lessons, picked just for you
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-sm text-body">
              Daily curated content tuned to what you struggle with most.
            </p>
          </Reveal>
        </div>
        <div className="mt-12">
          <LessonCarousel />
        </div>
      </section>

      {/* WHY BENTO */}
      <section className="border-t border-white/10 bg-[#1b1b20] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Kicker index="04" label="The case for it" />
          <Reveal>
            <h2 className="v1-serif text-3xl text-heading sm:text-[2.8rem]">
              Why English Connection?
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-6">
            {/* (a) CEFR */}
            <Reveal className="lg:col-span-3">
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#1f1f24] p-7">
                <h3 className="v1-serif text-xl text-heading">
                  See your English improve over time
                </h3>
                <p className="mt-2 text-sm text-body">
                  Regular level checks show you exactly how far you've come.
                </p>
                <div className="mt-7 space-y-4">
                  <CefrBar label="B1" pct={45} delay={0.05} />
                  <CefrBar label="B2" pct={75} delay={0.2} />
                  <CefrBar label="C1" pct={100} delay={0.35} />
                </div>
              </div>
            </Reveal>

            {/* (b) gauge */}
            <Reveal className="lg:col-span-3" delay={0.05}>
              <div className="flex h-full flex-col items-center rounded-2xl border border-white/10 bg-[#1f1f24] p-7 text-center sm:flex-row sm:gap-6 sm:text-left">
                <Gauge />
                <div>
                  <h3 className="v1-serif text-xl text-heading">
                    Accurate pronunciation
                  </h3>
                  <p className="mt-2 text-sm text-body">
                    Pronounce every word right and sound natural.
                  </p>
                  <div className="mt-4 inline-flex flex-col items-center gap-1 sm:items-start">
                    <span className="v1-serif text-2xl text-heading">Beautiful</span>
                    <span className="font-mono text-xs text-[#f97316]">
                      B.YOO·tih·Fuhl
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* (c) expressions */}
            <Reveal className="lg:col-span-2" delay={0.05}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#1f1f24] p-7">
                <h3 className="v1-serif text-xl text-heading">
                  Learn real-world expressions
                </h3>
                <p className="mt-2 text-sm text-body">
                  Speak the way fluent people actually do — not how textbooks say.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "10 expressions Indian professionals use daily",
                    "Casual phrases for coffee chats",
                    "Essential phrasal verbs for work",
                  ].map((x) => (
                    <li key={x} className="flex items-start gap-2 text-sm text-body">
                      <Check size={15} className="mt-0.5 shrink-0 text-[#f97316]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* (d) what to fix */}
            <Reveal className="lg:col-span-2" delay={0.1}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#1f1f24] p-7">
                <h3 className="v1-serif text-xl text-heading">
                  Know exactly what to fix
                </h3>
                <p className="mt-2 text-sm text-body">
                  Specific feedback after every lesson — not vague pats on the back.
                </p>
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg border border-white/10 bg-[#26262c] p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      You said
                    </div>
                    <p className="mt-1 text-sm text-body">
                      I{" "}
                      <s className="text-[#ff6c95]/80 decoration-[#ff6c95]">
                        am understanding
                      </s>{" "}
                      what you mean.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/8 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#f97316]">
                      Correct
                    </div>
                    <p className="mt-1 text-sm text-heading">
                      I understand what you mean.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* (e) mistakes into strengths */}
            <Reveal className="lg:col-span-2" delay={0.15}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#1f1f24] p-7">
                <h3 className="v1-serif text-xl text-heading">
                  Turn mistakes into strengths
                </h3>
                <p className="mt-2 text-sm text-body">
                  The words you trip on become tomorrow's warm-up drills, so the same
                  mistake never sneaks in twice.
                </p>
                <div className="mt-auto flex items-start gap-3 rounded-lg border border-white/10 bg-[#26262c] p-3">
                  <Mic size={16} className="mt-0.5 shrink-0 text-[#f97316]" />
                  <p className="text-xs leading-relaxed text-body">
                    Practice speaking out loud to build a stronger connection between
                    your brain and your mouth.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* second ticker */}
      <div className="border-y border-white/10 bg-[#18181c] py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-body">
        <Marquee items={TICKER_B} reverse />
      </div>

      {/* REVIEWS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Kicker index="05" label="Letters from readers" />
        <Reveal>
          <h2 className="v1-serif text-3xl text-heading sm:text-[2.8rem]">
            Speak English with confidence
          </h2>
        </Reveal>

        <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={(i % 3) * 0.06}>
              <figure
                className={cx(
                  "rounded-2xl border border-white/10 bg-[#1f1f24] p-6 transition-colors duration-300 hover:border-[#f97316]/50",
                  r.big && "lg:border-[#f97316]/30"
                )}
              >
                <Quote
                  size={26}
                  className="mb-3 text-[#f97316]"
                  style={{ transform: "scaleX(-1)" }}
                  aria-hidden
                />
                <Stars size={13} />
                <blockquote
                  className={cx(
                    "mt-4 text-body",
                    r.big
                      ? "v1-serif text-xl leading-snug text-heading"
                      : "text-sm leading-relaxed"
                  )}
                >
                  {r.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-[0.12em]">
                  <span className="text-heading">{r.name}</span>
                  <span className="text-muted-foreground">· {r.city}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-[#1b1b20] py-8 text-center">
          {[
            { n: "1L+", l: "Happy users" },
            { n: "4.8", l: "Rating" },
            { n: "31K+", l: "Lessons" },
          ].map((s, i) => (
            <div
              key={s.l}
              className={cx(i < 2 && "border-r border-white/10")}
            >
              <div className="v1-serif text-3xl text-heading sm:text-4xl">{s.n}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-white/10 bg-[#1b1b20] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <Kicker index="06" label="Fact sheet / comparison" />
          <Reveal>
            <h2 className="v1-serif max-w-2xl text-3xl leading-tight text-heading sm:text-[2.8rem]">
              Tutor-level results, no tutor-level fees
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {/* EC */}
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-[#f97316]/40 bg-[#1f1f24] p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f97316]">
                    English Connection
                  </span>
                  <span className="rounded-full bg-[#f97316] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#18181c]">
                    Pick this
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="v1-serif text-5xl text-heading">₹399</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <ul className="mt-7 space-y-3.5">
                  {EC_ROWS.map((x) => (
                    <li key={x} className="flex items-start gap-3 border-t border-white/8 pt-3.5 text-sm text-heading first:border-t-0 first:pt-0">
                      <Check size={16} className="mt-0.5 shrink-0 text-[#f97316]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cx(
                    "group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] px-6 py-3 text-sm font-semibold text-[#18181c] transition-transform duration-200 hover:scale-[1.02]",
                    FOCUS
                  )}
                >
                  Open the webapp
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </div>
            </Reveal>

            {/* tutor */}
            <Reveal delay={0.08}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#18181c] p-7">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Private tutor
                </span>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="v1-serif text-5xl text-body">₹8,000</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <ul className="mt-7 space-y-3.5">
                  {TUTOR_ROWS.map((x) => (
                    <li key={x} className="flex items-start gap-3 border-t border-white/8 pt-3.5 text-sm text-muted-foreground first:border-t-0 first:pt-0">
                      <X size={16} className="mt-0.5 shrink-0 text-[#ff6c95]/70" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-full border border-white/10 px-6 py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  20× the price
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={ctaRef} className="relative overflow-hidden border-t border-white/10 px-4 py-24 text-center sm:px-6 sm:py-32">
        <FloatMascot
          src="/mascots/happy.svg"
          alt="Happy mascot, ready"
          size={104}
          hidden={false}
          className="mx-auto mb-8 drop-shadow-[0_14px_30px_rgba(0,0,0,0.5)]"
        />
        <Reveal>
          <h2
            className="v1-serif mx-auto max-w-3xl font-semibold text-heading"
            style={{
              fontSize: "clamp(2.4rem, 7vw, 5rem)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            So, are you <span className="v1-serif-it text-[#f97316]">ready?</span>
          </h2>
        </Reveal>

        <div className="mt-10 flex justify-center">
          <Link
            href="/signup"
            onClick={burst}
            className={cx(
              "group inline-flex items-center gap-2 rounded-full bg-[#f97316] px-8 py-4 text-base font-semibold text-[#18181c] transition-transform duration-200 hover:scale-[1.04]",
              FOCUS
            )}
          >
            Open the webapp
            <ArrowUpRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Or download the app
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <StoreButton glyph={<PlayGlyph />} top="Get it on" bottom="Google Play" />
          <StoreButton glyph={<AppleGlyph />} top="Download on the" bottom="App Store" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#1b1b20] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <motion.img
                  src="/logo.svg"
                  alt="English Connection"
                  width={26}
                  height={26}
                  className="h-6 w-6"
                  animate={reduce ? undefined : { rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="v1-serif text-base text-heading">
                  English Connection
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-body">
                Your AI English coach — built for India's ambitious learners.
              </p>
            </div>

            {[
              {
                title: "Webapp",
                links: [
                  { label: "Open dashboard", href: "/signup" },
                  { label: "Log in", href: "/login" },
                  { label: "Practice library", href: "/signup" },
                  { label: "Leaderboard", href: "/signup" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "/signup" },
                  { label: "Updates", href: "/signup" },
                  { label: "Privacy", href: "/signup" },
                  { label: "Terms", href: "/signup" },
                ],
              },
              {
                title: "Get the app",
                links: [
                  { label: "Google Play", href: "/signup" },
                  { label: "App Store", href: "/signup" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f97316]">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((lnk) => (
                    <li key={lnk.label}>
                      <Link
                        href={lnk.href}
                        className={cx(
                          "rounded text-sm text-body transition-colors hover:text-heading",
                          FOCUS
                        )}
                      >
                        {lnk.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 English Connection · Built for India's ambitious learners</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

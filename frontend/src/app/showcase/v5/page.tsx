"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useRef, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
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
  Trophy,
  Quote,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Zap,
  MessageCircle,
} from "lucide-react";

import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import AccountChip from "@/components/layout/AccountChip";

/* ------------------------------------------------------------------ */
/*  V5 — "Tactile OS — Neo-brutalist Bento"                            */
/*  A playful language-learning OS desktop: chunky sticker tiles,      */
/*  hard offset shadows, springy press, draggable widgets, confetti.   */
/* ------------------------------------------------------------------ */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const BRAND = {
  orange: "#f97316",
  cyan: "#00e3fd",
  purple: "#b79fff",
  pink: "#ff6c95",
  amber: "#f59e0b",
} as const;

const INK = "#0b0b0e";

function fireConfetti() {
  confetti({
    particleCount: 130,
    spread: 78,
    startVelocity: 42,
    origin: { y: 0.72 },
    colors: [BRAND.orange, BRAND.cyan, BRAND.purple, BRAND.pink, BRAND.amber],
    disableForReducedMotion: true,
  });
}

/* ----------------------------- primitives ------------------------- */

function Sticker({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} draggable={false} />;
}

/** An OS-style window/widget with a chunky title bar + traffic lights. */
function Win({
  title,
  accent = "#26262c",
  titleInk = "#0b0b0e",
  className,
  bodyClassName,
  children,
}: {
  title: string;
  accent?: string;
  titleInk?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("v5-tile overflow-hidden rounded-[1.6rem] bg-surface-1", className)}>
      <div
        className="flex items-center gap-2 border-b-[3px] border-black px-4 py-2.5"
        style={{ background: accent }}
      >
        <span className="flex shrink-0 gap-1.5" aria-hidden="true">
          <i className="block h-3.5 w-3.5 rounded-full border-2 border-black" style={{ background: BRAND.pink }} />
          <i className="block h-3.5 w-3.5 rounded-full border-2 border-black" style={{ background: BRAND.amber }} />
          <i className="block h-3.5 w-3.5 rounded-full border-2 border-black" style={{ background: BRAND.cyan }} />
        </span>
        <span className="v5-display truncate text-sm font-extrabold tracking-tight" style={{ color: titleInk }}>
          {title}
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/** Springy reveal-on-scroll wrapper (content stays visible under reduced motion). */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Primary tactile button — neo-brutal sticker with press-in. */
function PressLink({
  href,
  children,
  fill = BRAND.orange,
  ink = INK,
  onClick,
  className,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  fill?: string;
  ink?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cx(
        "v5-tile-sm v5-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-extrabold",
        className,
      )}
      style={{ background: fill, color: ink }}
    >
      {children}
    </Link>
  );
}

/* ----------------------------- data ------------------------------- */

const STEPS = [
  { n: "01", title: "Talk it out with your AI partner", accent: BRAND.orange, Demo: AiPartnerDemo },
  { n: "02", title: "Rebuild real sentences in Jumble Words", accent: BRAND.purple, Demo: JumbleDemo },
  { n: "03", title: "Speak, then see exactly what to fix", accent: BRAND.cyan, Demo: PronunciationDemo },
] as const;

const LESSONS = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?", color: BRAND.orange },
  { tag: "CULTURE", title: "How British tea became a ritual", color: BRAND.cyan },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk", color: BRAND.purple },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind", color: BRAND.pink },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk", color: BRAND.amber },
  { tag: "WELLNESS", title: "Why your accent never fully disappears", color: BRAND.cyan },
  { tag: "NEWS", title: "When AI rewrote the office", color: BRAND.purple },
] as const;

const EXPRESSIONS = [
  "10 expressions Indian professionals use daily",
  "Casual phrases for coffee chats",
  "Essential phrasal verbs for work",
] as const;

const REVIEWS = [
  {
    name: "Priya R.",
    city: "Bengaluru",
    color: BRAND.orange,
    body: "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class.",
  },
  {
    name: "Anita K.",
    city: "Pune",
    color: BRAND.cyan,
    body: "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way.",
  },
  {
    name: "Mehul S.",
    city: "Hyderabad",
    color: BRAND.purple,
    body: "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally.",
  },
  {
    name: "Rohan T.",
    city: "Delhi",
    color: BRAND.pink,
    body: "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. It's the first app that finally challenges me at the right level.",
  },
  {
    name: "Sneha M.",
    city: "Chennai",
    color: BRAND.amber,
    body: "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading.",
  },
  {
    name: "Karthik V.",
    city: "Coimbatore",
    color: BRAND.cyan,
    body: "Wow… I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing.",
  },
] as const;

const STATS = [
  { value: "1L+", label: "Happy users" },
  { value: "4.8", label: "Rating" },
  { value: "31K+", label: "Lessons" },
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

const CEFR = [
  { label: "B1", pct: 45, color: BRAND.amber },
  { label: "B2", pct: 75, color: BRAND.orange },
  { label: "C1", pct: 100, color: BRAND.cyan },
] as const;

const MASCOTS = [
  { src: "/mascots/happy.svg", label: "Happy", color: BRAND.orange },
  { src: "/mascots/calm.svg", label: "Calm", color: BRAND.cyan },
  { src: "/mascots/sad.svg", label: "Sad", color: BRAND.purple },
] as const;

/* ------------------------- store glyph buttons -------------------- */

function StoreButton({ kind, href }: { kind: "play" | "apple"; href: string }) {
  const label = kind === "play" ? "Google Play" : "App Store";
  const sub = kind === "play" ? "GET IT ON" : "DOWNLOAD ON THE";
  return (
    <Link
      href={href}
      aria-label={`${sub} ${label}`}
      className="v5-tile-sm v5-press inline-flex min-h-[48px] items-center gap-3 rounded-2xl bg-[#101014] px-4 py-2.5 text-left"
    >
      {kind === "play" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
          <path d="M3 3l16 9-16 9V3z" fill={BRAND.cyan} />
        </svg>
      ) : (
        <svg viewBox="0 0 384 512" className="h-6 w-6 shrink-0 fill-white" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
        </svg>
      )}
      <span className="leading-tight">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-body">{sub}</span>
        <span className="v5-display block text-sm font-extrabold text-heading">{label}</span>
      </span>
    </Link>
  );
}

/* ------------------------------ widgets --------------------------- */

function CefrBar({ label, pct, color, reduced }: { label: string; pct: number; color: string; reduced: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="v5-display text-sm font-extrabold text-heading">{label}</span>
        <span className="font-mono text-xs text-body">{pct}%</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full border-2 border-black bg-black/40">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, width: reduced ? `${pct}%` : undefined }}
          initial={reduced ? undefined : { width: 0 }}
          whileInView={reduced ? undefined : { width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function AccuracyGauge({ reduced }: { reduced: boolean }) {
  const ringProps = reduced
    ? { animate: { pathLength: 0.89 } }
    : {
        initial: { pathLength: 0 },
        whileInView: { pathLength: 0.89 },
        viewport: { once: true, amount: 0.6 },
        transition: { duration: 1.1, ease: "easeOut" as const },
      };
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#000" strokeOpacity={0.4} strokeWidth="13" />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={BRAND.cyan}
            strokeWidth="13"
            strokeLinecap="round"
            {...ringProps}
          />
        </svg>
        <span className="v5-display absolute inset-0 flex items-center justify-center text-xl font-extrabold text-heading">
          89%
        </span>
      </div>
      <div>
        <p className="v5-display text-lg font-extrabold text-heading">Beautiful</p>
        <p className="font-mono text-sm text-cyan">B.YOO·tih·Fuhl</p>
      </div>
    </div>
  );
}

/* ------------------------------ page ------------------------------ */

export default function Page() {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    reduced ? [] : [Autoplay({ delay: 2600, stopOnInteraction: false })],
  );

  // gentle infinite bob for stickers (disabled when reduced)
  const bob = reduced ? {} : { animate: { y: [0, -9, 0], rotate: [-2, 2, -2] }, transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const } };

  const youSaid = "I am understanding what you mean.";
  const corrected = "I understand what you mean.";

  return (
    <MotionConfig reducedMotion="user">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap');

        .v5-display { font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif; letter-spacing: -0.02em; }

        .v5-desk {
          background-color: #131317;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1.6px, transparent 1.6px);
          background-size: 24px 24px;
        }

        .v5-tile { border: 3px solid #000; box-shadow: 6px 6px 0 rgba(0,0,0,0.9); }
        .v5-tile-sm { border: 2px solid #000; box-shadow: 4px 4px 0 rgba(0,0,0,0.85); }

        .v5-press { transition: transform 160ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 160ms ease-out; }
        .v5-press:focus-visible { outline: 3px solid ${BRAND.cyan}; outline-offset: 3px; }

        @media (prefers-reduced-motion: no-preference) {
          .v5-press:hover { transform: translate(-1px,-1px); box-shadow: 8px 8px 0 rgba(0,0,0,0.9); }
          .v5-press:active { transform: translate(6px,6px); box-shadow: 0 0 0 rgba(0,0,0,0.9); }
          .v5-hoverlift { transition: transform 160ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 160ms ease-out; }
          .v5-hoverlift:hover { transform: translate(-2px,-2px); box-shadow: 9px 9px 0 rgba(0,0,0,0.9); }
        }

        @keyframes v5-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .v5-marquee { animation: v5-marquee 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .v5-marquee { animation: none; } }

        .v5-embla__container { display: flex; }
      `}</style>

      <div className="v5-desk min-h-screen w-full overflow-x-clip font-body text-body antialiased">
        {/* back pill */}
        <Link
          href="/showcase"
          className="v5-tile-sm v5-press fixed left-3 top-3 z-50 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#101014] px-4 py-2 text-sm font-extrabold text-heading"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All 5 designs
        </Link>

        <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-20 sm:px-6">
          {/* ============================= NAV ============================ */}
          <Reveal>
            <Win title="english-connection · desktop" accent={BRAND.amber}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <motion.div {...bob} className="grid h-11 w-11 place-items-center rounded-xl border-[3px] border-black bg-white">
                    <Sticker src="/logo.svg" alt="English Connection logo" className="h-7 w-7" />
                  </motion.div>
                  <span className="v5-display text-lg font-extrabold text-heading sm:text-xl">English Connection</span>
                </div>
                <AccountChip />
              </div>
            </Win>
          </Reveal>

          {/* ============================ HERO =========================== */}
          <Reveal className="mt-6" delay={0.05}>
            <Win title="welcome.app — your AI English coach" accent={BRAND.orange}>
              <div ref={heroRef} className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
                {/* copy */}
                <div className="relative z-10">
                  <span
                    className="v5-tile-sm inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold"
                    style={{ background: BRAND.cyan, color: INK }}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Your AI English coach
                  </span>
                  <h1 className="v5-display mt-4 text-4xl font-extrabold leading-[1.02] text-heading sm:text-5xl lg:text-6xl">
                    English Connection, your AI English coach
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span
                      className="v5-tile-sm inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold"
                      style={{ background: BRAND.amber, color: INK }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-black stroke-black" aria-hidden="true" />
                      ))}
                      <span className="ml-1">4.8</span>
                    </span>
                    <span
                      className="v5-tile-sm inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold"
                      style={{ background: BRAND.pink, color: INK }}
                    >
                      <Trophy className="h-4 w-4" aria-hidden="true" />
                      1,00,000+ learners
                    </span>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <PressLink href="/signup" onClick={fireConfetti} fill={BRAND.orange}>
                      Open webapp
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </PressLink>
                    <PressLink href="/login" fill="#101014" ink="#ecedf6">
                      I already have an account
                    </PressLink>
                  </div>
                </div>

                {/* live demo window */}
                <div className="relative z-10">
                  <Win title="K.AI — live demo" accent={BRAND.cyan} bodyClassName="bg-surface-2 p-2 sm:p-3">
                    <div className="overflow-hidden rounded-2xl">
                      <AiPartnerDemo />
                    </div>
                  </Win>
                </div>

                {/* draggable delight stickers (desktop only → no mobile overflow) */}
                <motion.div
                  aria-hidden="true"
                  drag={reduced ? false : true}
                  dragConstraints={heroRef}
                  dragElastic={0.12}
                  dragMomentum={false}
                  whileDrag={{ scale: 1.06, cursor: "grabbing" }}
                  className="v5-tile absolute left-[6%] top-[8%] z-20 hidden cursor-grab select-none rounded-2xl px-3 py-2 lg:block"
                  style={{ background: BRAND.purple, color: INK, rotate: -8 }}
                >
                  <motion.span {...bob} className="block">
                    <span className="flex items-center gap-1 text-xs font-extrabold">
                      <GripVertical className="h-4 w-4" aria-hidden="true" /> drag me
                    </span>
                    <span className="v5-display flex items-center gap-1 text-lg font-extrabold">
                      <Star className="h-4 w-4 fill-black stroke-black" aria-hidden="true" /> 4.8 rating
                    </span>
                  </motion.span>
                </motion.div>

                <motion.div
                  aria-hidden="true"
                  drag={reduced ? false : true}
                  dragConstraints={heroRef}
                  dragElastic={0.12}
                  dragMomentum={false}
                  whileDrag={{ scale: 1.08, cursor: "grabbing" }}
                  className="v5-tile absolute bottom-[6%] right-[4%] z-20 hidden cursor-grab select-none rounded-2xl p-2 lg:block"
                  style={{ background: BRAND.pink, rotate: 7 }}
                >
                  <span className="grid h-16 w-16 place-items-center">
                    <Sticker src="/mascots/happy.svg" alt="" className="h-14 w-14" />
                  </span>
                </motion.div>
              </div>
            </Win>
          </Reveal>

          {/* ========================= BIG TAGLINE ======================= */}
          <Reveal className="mt-10">
            <div
              className="v5-tile rounded-[1.6rem] px-6 py-8 text-center sm:py-12"
              style={{ background: BRAND.cyan }}
            >
              <p className="v5-display text-3xl font-extrabold leading-tight sm:text-5xl" style={{ color: INK }}>
                English learning has never been this fun.
              </p>
            </div>
          </Reveal>

          {/* =========================== STEPS =========================== */}
          <div className="mt-12 space-y-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.04}>
                <Win title={`step-${s.n}.app`} accent={s.accent}>
                  <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div>
                      <span
                        className="v5-display v5-tile-sm inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold"
                        style={{ background: s.accent, color: INK }}
                      >
                        {s.n}
                      </span>
                      <h3 className="v5-display mt-4 text-2xl font-extrabold text-heading sm:text-3xl">{s.title}</h3>
                      <div className="mt-5">
                        <PressLink href="/signup" fill={s.accent}>
                          Try now
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </PressLink>
                      </div>
                    </div>
                    <div className="v5-tile-sm overflow-hidden rounded-2xl bg-surface-2 p-2 sm:p-3">
                      <div className="overflow-hidden rounded-xl">
                        <s.Demo />
                      </div>
                    </div>
                  </div>
                </Win>
              </Reveal>
            ))}
          </div>

          {/* ======================= MASCOT EMOTIONS ===================== */}
          <Reveal className="mt-12">
            <Win title="mascots.app — K.AI feels it too" accent={BRAND.purple}>
              <div className="relative overflow-hidden">
                {/* marquee strip behind */}
                <div className="pointer-events-none flex w-[200%] py-6 opacity-30" aria-hidden="true">
                  <div className="v5-marquee flex w-1/2 justify-around">
                    {[...MASCOTS, ...MASCOTS].map((m, i) => (
                      <Sticker key={`a${i}`} src={m.src} alt="" className="h-12 w-12" />
                    ))}
                  </div>
                  <div className="v5-marquee flex w-1/2 justify-around">
                    {[...MASCOTS, ...MASCOTS].map((m, i) => (
                      <Sticker key={`b${i}`} src={m.src} alt="" className="h-12 w-12" />
                    ))}
                  </div>
                </div>
                {/* bouncy stickers */}
                <div className="relative grid grid-cols-1 gap-5 px-5 pb-7 pt-1 sm:grid-cols-3 sm:px-7">
                  {MASCOTS.map((m, i) => (
                    <div
                      key={m.label}
                      className="v5-tile-sm flex flex-col items-center gap-3 rounded-2xl px-4 py-6"
                      style={{ background: m.color }}
                    >
                      <motion.div
                        {...(reduced ? {} : { animate: { y: [0, -10, 0] }, transition: { duration: 2.2 + i * 0.3, repeat: Infinity, ease: "easeInOut" as const } })}
                      >
                        <Sticker src={m.src} alt={`${m.label} mascot`} className="h-20 w-20" />
                      </motion.div>
                      <span className="v5-display text-lg font-extrabold" style={{ color: INK }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Win>
          </Reveal>

          {/* ====================== LESSON CAROUSEL ====================== */}
          <Reveal className="mt-14">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="v5-display text-3xl font-extrabold text-heading sm:text-4xl">
                  Endless lessons, picked just for you
                </h2>
                <p className="mt-2 max-w-xl text-body">
                  Daily curated content tuned to what you struggle with most.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous lessons"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="v5-tile-sm v5-press grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-heading"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next lessons"
                  onClick={() => emblaApi?.scrollNext()}
                  className="v5-tile-sm v5-press grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-heading"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
              <div className="v5-embla__container -ml-4">
                {LESSONS.map((l) => (
                  <div key={l.title} className="min-w-0 shrink-0 grow-0 basis-[80%] pl-4 sm:basis-[46%] lg:basis-[31%]">
                    <div className="v5-tile v5-hoverlift flex h-full flex-col justify-between rounded-2xl p-5" style={{ background: l.color }}>
                      <div>
                        <span
                          className="inline-block rounded-md border-2 border-black bg-black px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider"
                          style={{ color: l.color }}
                        >
                          {l.tag}
                        </span>
                        <h3 className="v5-display mt-4 text-xl font-extrabold leading-snug" style={{ color: INK }}>
                          {l.title}
                        </h3>
                      </div>
                      <div className="mt-6 flex items-center gap-2 border-t-2 border-black/30 pt-3 text-sm font-extrabold" style={{ color: INK }}>
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Talk about this in English
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ========================= WHY BENTO ========================= */}
          <Reveal className="mt-16">
            <h2 className="v5-display mb-6 text-3xl font-extrabold text-heading sm:text-4xl">Why English Connection?</h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* (a) CEFR */}
              <div className="v5-tile rounded-[1.4rem] p-6 lg:col-span-2" style={{ background: BRAND.orange }}>
                <h3 className="v5-display text-xl font-extrabold" style={{ color: INK }}>See your English improve over time</h3>
                <p className="mt-1 text-sm font-semibold text-black/70">
                  Regular level checks show you exactly how far you've come.
                </p>
                <div className="v5-tile-sm mt-5 space-y-4 rounded-xl bg-[#16161a] p-5">
                  {CEFR.map((b) => (
                    <CefrBar key={b.label} label={b.label} pct={b.pct} color={b.color} reduced={!!reduced} />
                  ))}
                </div>
              </div>

              {/* (b) gauge */}
              <div className="v5-tile rounded-[1.4rem] p-6" style={{ background: BRAND.cyan }}>
                <h3 className="v5-display text-xl font-extrabold" style={{ color: INK }}>Accurate pronunciation</h3>
                <p className="mt-1 text-sm font-semibold text-black/70">
                  Pronounce every word right and sound natural.
                </p>
                <div className="v5-tile-sm mt-5 rounded-xl bg-[#16161a] p-5">
                  <AccuracyGauge reduced={!!reduced} />
                </div>
              </div>

              {/* (c) expressions */}
              <div className="v5-tile rounded-[1.4rem] p-6" style={{ background: BRAND.purple }}>
                <h3 className="v5-display text-xl font-extrabold" style={{ color: INK }}>Learn real-world expressions</h3>
                <p className="mt-1 text-sm font-semibold text-black/70">
                  Speak the way fluent people actually do — not how textbooks say.
                </p>
                <ul className="mt-5 space-y-2">
                  {EXPRESSIONS.map((e) => (
                    <li key={e} className="v5-tile-sm flex items-center gap-2 rounded-xl bg-[#16161a] px-3 py-2.5 text-sm font-semibold text-heading">
                      <Zap className="h-4 w-4 shrink-0 text-secondary-1" aria-hidden="true" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              {/* (d) correction */}
              <div className="v5-tile rounded-[1.4rem] p-6 lg:col-span-2" style={{ background: BRAND.pink }}>
                <h3 className="v5-display text-xl font-extrabold" style={{ color: INK }}>Know exactly what to fix</h3>
                <p className="mt-1 text-sm font-semibold text-black/70">
                  Specific feedback after every lesson — not vague pats on the back.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="v5-tile-sm rounded-xl bg-[#16161a] p-4">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-pink">
                      <X className="h-4 w-4" aria-hidden="true" /> You said
                    </span>
                    <p className="mt-2 font-mono text-sm text-body line-through decoration-pink decoration-2">{youSaid}</p>
                  </div>
                  <div className="v5-tile-sm rounded-xl bg-[#16161a] p-4">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-cyan">
                      <Check className="h-4 w-4" aria-hidden="true" /> Correct
                    </span>
                    <p className="mt-2 font-mono text-sm text-heading">{corrected}</p>
                  </div>
                </div>
              </div>

              {/* (e) note */}
              <div className="v5-tile rounded-[1.4rem] p-6" style={{ background: BRAND.amber }}>
                <h3 className="v5-display text-xl font-extrabold" style={{ color: INK }}>Turn mistakes into strengths</h3>
                <p className="mt-2 text-sm font-semibold text-black/80">
                  {"The words you trip on become tomorrow's warm-up drills, so the same mistake never sneaks in twice."}
                </p>
                <p className="v5-tile-sm mt-4 flex items-start gap-2 rounded-xl bg-[#16161a] p-3 text-xs font-semibold text-body">
                  <Mic className="mt-0.5 h-4 w-4 shrink-0 text-primary-1" aria-hidden="true" />
                  Practice speaking out loud to build a stronger connection between your brain and your mouth.
                </p>
              </div>
            </div>
          </Reveal>

          {/* ========================== REVIEWS ========================== */}
          <Reveal className="mt-16">
            <h2 className="v5-display mb-6 text-3xl font-extrabold text-heading sm:text-4xl">Speak English with confidence</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((r) => (
                <div key={r.name} className="v5-tile v5-hoverlift flex h-full flex-col rounded-2xl bg-surface-1 p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex gap-0.5" aria-label="5 out of 5 stars">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-4 w-4" aria-hidden="true" style={{ fill: r.color, stroke: r.color }} />
                      ))}
                    </span>
                    <Quote className="h-5 w-5" aria-hidden="true" style={{ color: r.color }} />
                  </div>
                  <p className="mt-3 grow text-sm leading-relaxed text-body">{r.body}</p>
                  <div className="mt-4 flex items-center gap-3 border-t-2 border-white/5 pt-3">
                    <span
                      className="v5-display grid h-10 w-10 place-items-center rounded-full border-2 border-black text-sm font-extrabold"
                      style={{ background: r.color, color: INK }}
                    >
                      {r.name.charAt(0)}
                    </span>
                    <span className="leading-tight">
                      <span className="v5-display block text-sm font-extrabold text-heading">{r.name}</span>
                      <span className="block text-xs text-body">{r.city}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="v5-tile-sm rounded-2xl px-3 py-5 text-center"
                  style={{ background: [BRAND.orange, BRAND.cyan, BRAND.purple][i], color: INK }}
                >
                  <p className="v5-display text-3xl font-extrabold sm:text-4xl">{s.value}</p>
                  <p className="text-xs font-extrabold uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* ========================== PRICING ========================== */}
          <Reveal className="mt-16">
            <h2 className="v5-display mb-6 text-3xl font-extrabold text-heading sm:text-4xl">
              Tutor-level results, no tutor-level fees
            </h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* EC */}
              <Win title="english-connection.plan ★ best value" accent={BRAND.orange}>
                <div className="p-6">
                  <div className="flex items-end gap-1">
                    <span className="v5-display text-4xl font-extrabold text-heading">₹399</span>
                    <span className="mb-1 text-sm text-body">/month</span>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {EC_ROWS.map((row) => (
                      <li key={row} className="flex items-start gap-3 text-sm text-heading">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-black" style={{ background: BRAND.cyan }}>
                          <Check className="h-4 w-4 stroke-black" aria-hidden="true" />
                        </span>
                        {row}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <PressLink href="/signup" onClick={fireConfetti} fill={BRAND.orange} className="w-full">
                      Open the webapp
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </PressLink>
                  </div>
                </div>
              </Win>

              {/* tutor */}
              <Win title="private-tutor.plan" accent={BRAND.amber}>
                <div className="p-6">
                  <div className="flex items-end gap-1">
                    <span className="v5-display text-4xl font-extrabold text-body">₹8,000</span>
                    <span className="mb-1 text-sm text-body">/month</span>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {TUTOR_ROWS.map((row) => (
                      <li key={row} className="flex items-start gap-3 text-sm text-body">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-black bg-surface-3">
                          <X className="h-4 w-4 stroke-pink" aria-hidden="true" />
                        </span>
                        {row}
                      </li>
                    ))}
                  </ul>
                </div>
              </Win>
            </div>
          </Reveal>

          {/* ========================= FINAL CTA ========================= */}
          <Reveal className="mt-16">
            <div className="v5-tile rounded-[1.8rem] px-6 py-10 text-center sm:py-14" style={{ background: BRAND.purple }}>
              <motion.div
                className="mx-auto w-fit"
                {...(reduced ? {} : { animate: { y: [0, -12, 0], rotate: [-3, 3, -3] }, transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const } })}
              >
                <Sticker src="/mascots/happy.svg" alt="Happy mascot" className="h-24 w-24" />
              </motion.div>
              <h2 className="v5-display mt-4 text-4xl font-extrabold sm:text-5xl" style={{ color: INK }}>
                So, are you ready?
              </h2>
              <div className="mt-7 flex justify-center">
                <PressLink href="/signup" onClick={fireConfetti} fill="#101014" ink="#ecedf6">
                  Open the webapp
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </PressLink>
              </div>
              <p className="mt-6 text-sm font-extrabold" style={{ color: INK }}>Or download the app</p>
              <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <StoreButton kind="play" href="/signup" />
                <StoreButton kind="apple" href="/signup" />
              </div>
            </div>
          </Reveal>

          {/* ========================== FOOTER =========================== */}
          <Reveal className="mt-12">
            <Win title="footer.sys" accent="#26262c" titleInk="#ecedf6">
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <motion.div {...bob} className="grid h-10 w-10 place-items-center rounded-xl border-[3px] border-black bg-white">
                      <Sticker src="/logo.svg" alt="English Connection logo" className="h-6 w-6" />
                    </motion.div>
                    <span className="v5-display text-lg font-extrabold text-heading">English Connection</span>
                  </div>
                  <p className="mt-3 max-w-xs text-sm text-body">
                    {"Your AI English coach — built for India's ambitious learners."}
                  </p>
                </div>

                <FooterCol
                  title="Webapp"
                  links={[
                    { label: "Open dashboard", href: "/signup" },
                    { label: "Log in", href: "/login" },
                    { label: "Practice library", href: "/signup" },
                    { label: "Leaderboard", href: "/signup" },
                  ]}
                />
                <FooterCol
                  title="Company"
                  links={[
                    { label: "About", href: "/signup" },
                    { label: "Updates", href: "/signup" },
                    { label: "Privacy", href: "/signup" },
                    { label: "Terms", href: "/signup" },
                  ]}
                />
                <div>
                  <h4 className="v5-display mb-3 text-sm font-extrabold uppercase tracking-wide text-heading">Get the app</h4>
                  <div className="flex flex-col gap-3">
                    <StoreButton kind="play" href="/signup" />
                    <StoreButton kind="apple" href="/signup" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-2 border-t-[3px] border-black px-6 py-4 text-xs text-body sm:flex-row sm:px-8">
                <span>{"© 2026 English Connection · Built for India's ambitious learners"}</span>
              </div>
            </Win>
          </Reveal>
        </div>
      </div>
    </MotionConfig>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="v5-display mb-3 text-sm font-extrabold uppercase tracking-wide text-heading">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="inline-flex min-h-[32px] items-center rounded-md text-sm text-body transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-cyan"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

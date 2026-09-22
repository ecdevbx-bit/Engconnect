"use client";
/* eslint-disable react/no-unescaped-entities */

/* =====================================================================
 * V6 — "Bioluminescent Abyss"
 * An oceanic, living, bioluminescent deep-sea world. The animated
 * PixelMascot is the star: it breathes, blinks, gaze-tracks the pointer,
 * cycles an emotion timeline, reacts to CTA hover + scroll, and trails a
 * pulsing aura with orbiting plankton. Surfaces glow from within; gooey
 * morphing blobs (SVG goo filter + SMIL path morph), drifting plankton
 * particles (canvas), caustic shimmer and liquid parallax fill the abyss.
 * Single self-contained client file. All @keyframes/classes prefixed v6-.
 * =================================================================== */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
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
  Waves,
  Trophy,
  Quote,
  Target,
  Repeat,
  BarChart3,
  Volume2,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sprout,
} from "lucide-react";

import { PixelMascot } from "@/components/v3/PixelMascot";
import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import AccountChip from "@/components/layout/AccountChip";

/* ----------------------------- palette ---------------------------- */

const C = {
  base: "#03161a",
  base2: "#04222b",
  lime: "#b6ff3a",
  coral: "#ff5a5f",
  violet: "#9a6bff",
  cyan: "#2ef2ff",
  heading: "#ecffff",
  body: "#a9d4d8",
  muted: "#6f9aa0",
  ink: "#03161a",
} as const;

const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");
type Vars = CSSProperties & Record<string, string | number>;

/* PixelMascot's emotion vocabulary, declared locally so the file is
 * self-contained. Identical union → assignable to the component prop. */
type Emo =
  | "idle" | "happy" | "sad" | "angry" | "thinking" | "surprised" | "love"
  | "scared" | "confused" | "idea" | "tips" | "greeting" | "asking" | "conversing";

/* -------------------- procedural blob geometry -------------------- */
/* Generate organic closed blob paths with a FIXED command structure so
 * SMIL <animate attributeName="d"> can morph seamlessly between frames. */
function blobPath(cxp: number, cyp: number, r: number, amp: number, seed: number): string {
  const n = 8;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + Math.sin(a * 3 + seed) * amp + Math.cos(a * 2 - seed * 1.3) * amp * 0.55;
    pts.push([cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr]);
  }
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + " Z";
}
const blobValues = (cxp: number, cyp: number, r: number, amp: number) =>
  [0, 1.7, 3.4, 0].map((s) => blobPath(cxp, cyp, r, amp, s)).join(";");

const HERO_BLOB_D = blobPath(100, 100, 72, 14, 0);
const HERO_BLOB_VALUES = blobValues(100, 100, 72, 14);
const LOGO_BLOB_D = blobPath(16, 16, 10.5, 2.6, 0);
const LOGO_BLOB_VALUES = blobValues(16, 16, 10.5, 2.6);

const SMIL_SPLINES = "0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1";

/* ------------------------- emotion timeline ----------------------- */
const HERO_TIMELINE: Array<{ emotion: Emo; thinking?: boolean; ms: number }> = [
  { emotion: "greeting", ms: 2600 },
  { emotion: "thinking", thinking: true, ms: 1900 },
  { emotion: "conversing", ms: 2600 },
  { emotion: "happy", ms: 2200 },
  { emotion: "idea", ms: 2200 },
  { emotion: "tips", ms: 2100 },
  { emotion: "love", ms: 2400 },
  { emotion: "surprised", ms: 1800 },
];

const ORBIT_DOTS = [
  { a: 0.4, r: 46, s: 6, c: C.cyan },
  { a: 2.0, r: 48, s: 4, c: C.lime },
  { a: 3.3, r: 44, s: 5, c: C.violet },
  { a: 4.7, r: 49, s: 3, c: C.cyan },
  { a: 5.7, r: 45, s: 4, c: C.lime },
];

const HERO_CAPTIONS = [
  "Let's warm up — tell me about your day.",
  'Nice! Now try: "I\'d like to add one quick point."',
  "Perfect pacing — you sound genuinely confident.",
];

/* ===================================================================
 * LivingMascot — gaze-tracking + breathing + emotion-cycling mascot
 * with a bioluminescent aura and orbiting plankton.
 * ================================================================ */
function LivingMascot({
  size,
  reduce,
  track = true,
  cycle = false,
  baseEmotion = "idle",
  override = null,
  aura = C.cyan,
  aura2 = C.lime,
  orbit = true,
  className,
}: {
  size: number;
  reduce: boolean;
  track?: boolean;
  cycle?: boolean;
  baseEmotion?: Emo;
  override?: { emotion: Emo; thinking?: boolean } | null;
  aura?: string;
  aura2?: string;
  orbit?: boolean;
  className?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!cycle || reduce) return;
    const id = setTimeout(
      () => setStep((s) => (s + 1) % HERO_TIMELINE.length),
      HERO_TIMELINE[step].ms,
    );
    return () => clearTimeout(id);
  }, [cycle, reduce, step]);

  const auto: { emotion: Emo; thinking?: boolean } =
    cycle && !reduce ? HERO_TIMELINE[step] : { emotion: baseEmotion };
  const active = override ?? auto;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 110, damping: 16, mass: 0.6 } as const;
  const rotX = useSpring(useTransform(my, [-1, 1], [12, -12]), spring);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-16, 16]), spring);
  const transX = useSpring(useTransform(mx, [-1, 1], [-14, 14]), spring);
  const transY = useSpring(useTransform(my, [-1, 1], [-12, 12]), spring);

  useEffect(() => {
    if (!track || reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [track, reduce, mx, my]);

  const auraSize = size * 1.75;

  return (
    <div
      className={cx("relative grid place-items-center", className)}
      style={{ width: size, height: size, perspective: 800 }}
    >
      {/* bioluminescent aura */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          width: auraSize,
          height: auraSize,
          background: `radial-gradient(circle, ${aura}55 0%, ${aura2}26 38%, transparent 70%)`,
          filter: "blur(10px)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.16, 1], opacity: [0.5, 0.92, 0.5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* orbiting plankton ring */}
      {orbit && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ width: auraSize * 0.9, height: auraSize * 0.9 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        >
          {ORBIT_DOTS.map((d, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                top: `${50 + Math.sin(d.a) * d.r}%`,
                left: `${50 + Math.cos(d.a) * d.r}%`,
                width: d.s,
                height: d.s,
                background: d.c,
                boxShadow: `0 0 ${d.s * 2.4}px ${d.c}`,
                transform: "translate(-50%,-50%)",
              }}
            />
          ))}
        </motion.div>
      )}

      {/* gaze tilt + breathing + bob */}
      <motion.div
        className="relative"
        style={
          track && !reduce
            ? { rotateX: rotX, rotateY: rotY, x: transX, y: transY }
            : undefined
        }
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.035, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <PixelMascot emotion={active.emotion} isThinking={!!active.thinking} size={size} />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ===================================================================
 * Background field: abyssal gradient + caustic shimmer + plankton canvas
 * ================================================================ */
function PlanktonCanvas({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const palette = [C.cyan, C.lime, C.violet, C.coral];

    type P = { x: number; y: number; r: number; vx: number; vy: number; a: number; c: string; ph: number };
    let parts: P[] = [];

    const seed = () => {
      const count = w < 640 ? 34 : 64;
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.6,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -(Math.random() * 0.28 + 0.05),
        a: Math.random() * 0.5 + 0.18,
        c: palette[Math.floor(Math.random() * palette.length)],
        ph: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx + Math.sin(t + p.ph) * 0.14;
        p.y += p.vy;
        if (p.y < -6) {
          p.y = h + 6;
          p.x = Math.random() * w;
        }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;
        const tw = (Math.sin(t * 2 + p.ph) + 1) / 2;
        ctx.globalAlpha = p.a * (0.35 + tw * 0.65);
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}

function BackgroundFX({ reduce }: { reduce: boolean }) {
  const { scrollYProgress } = useScroll();
  const driftY = useTransform(scrollYProgress, [0, 1], [0, -90]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* abyssal vertical gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% -10%, ${C.base2} 0%, ${C.base} 55%, #02101380 100%)`,
        }}
      />
      {/* deep glow pools */}
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y: driftY }}
      >
        <div
          className="absolute -left-24 top-[12%] h-[42vh] w-[42vh] rounded-full opacity-50"
          style={{ background: `radial-gradient(circle, ${C.cyan}33, transparent 70%)`, filter: "blur(40px)" }}
        />
        <div
          className="absolute right-[-12%] top-[42%] h-[48vh] w-[48vh] rounded-full opacity-40"
          style={{ background: `radial-gradient(circle, ${C.violet}33, transparent 70%)`, filter: "blur(50px)" }}
        />
        <div
          className="absolute bottom-[6%] left-[24%] h-[40vh] w-[40vh] rounded-full opacity-35"
          style={{ background: `radial-gradient(circle, ${C.lime}26, transparent 70%)`, filter: "blur(46px)" }}
        />
      </motion.div>
      {/* caustic shimmer */}
      <div
        className={cx("absolute inset-0 opacity-[0.18] mix-blend-screen", !reduce && "v6-caustic")}
        style={{
          background: `radial-gradient(40% 30% at 20% 30%, ${C.cyan}55, transparent 60%), radial-gradient(35% 28% at 70% 20%, ${C.lime}44, transparent 60%), radial-gradient(45% 34% at 60% 75%, ${C.violet}44, transparent 60%)`,
          backgroundSize: "160% 160%",
        }}
      />
      {/* plankton particles */}
      <PlanktonCanvas reduce={reduce} />
      {/* top + bottom vignette so text stays readable */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${C.base}cc 0%, transparent 18%, transparent 82%, ${C.base}cc 100%)` }}
      />
    </div>
  );
}

/* gooey morphing blob cluster (localized, decorative) */
function GooCluster({
  reduce,
  colors,
  className,
}: {
  reduce: boolean;
  colors: string[];
  className?: string;
}) {
  const fid = "v6goo-" + useId().replace(/:/g, "");
  const blobs = [
    { r: 46, x: 60, y: 72, dx: 16, dy: -18, d: 17 },
    { r: 56, x: 142, y: 92, dx: -18, dy: 12, d: 21 },
    { r: 38, x: 96, y: 144, dx: 12, dy: 14, d: 19 },
    { r: 30, x: 150, y: 52, dx: -12, dy: 12, d: 15 },
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ filter: "blur(4px)" }}
    >
      <defs>
        <filter id={fid}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix
            in="b"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
          />
        </filter>
      </defs>
      <g filter={`url(#${fid})`} opacity={0.5}>
        {blobs.map((b, i) => (
          <motion.circle
            key={i}
            r={b.r}
            fill={colors[i % colors.length]}
            initial={{ cx: b.x, cy: b.y }}
            animate={
              reduce
                ? { cx: b.x, cy: b.y }
                : { cx: [b.x, b.x + b.dx, b.x], cy: [b.y, b.y + b.dy, b.y] }
            }
            transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </g>
    </svg>
  );
}

/* morphing SMIL blob behind hero headline */
function MorphBlob({
  reduce,
  className,
  from = C.cyan,
  to = C.violet,
}: {
  reduce: boolean;
  className?: string;
  from?: string;
  to?: string;
}) {
  const gid = "v6mb-" + useId().replace(/:/g, "");
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={className} style={{ filter: "blur(2px)" }}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={HERO_BLOB_D} fill={`url(#${gid})`} opacity={0.85}>
        {!reduce && (
          <animate
            attributeName="d"
            dur="16s"
            repeatCount="indefinite"
            values={HERO_BLOB_VALUES}
            calcMode="spline"
            keyTimes="0;0.33;0.66;1"
            keySplines={SMIL_SPLINES}
          />
        )}
      </path>
    </svg>
  );
}

/* animated bioluminescent logo mark */
function Logo({ reduce }: { reduce: boolean }) {
  const gid = "v6lg-" + useId().replace(/:/g, "");
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center">
        <svg viewBox="0 0 32 32" className="h-9 w-9 drop-shadow-[0_0_8px_rgba(46,242,255,0.5)]" aria-hidden>
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor={C.cyan} />
              <stop offset="100%" stopColor={C.lime} />
              {!reduce && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="rotate"
                  from="0 16 16"
                  to="360 16 16"
                  dur="8s"
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
          </defs>
          <path d={LOGO_BLOB_D} fill={`url(#${gid})`}>
            {!reduce && (
              <animate
                attributeName="d"
                dur="9s"
                repeatCount="indefinite"
                values={LOGO_BLOB_VALUES}
                calcMode="spline"
                keyTimes="0;0.33;0.66;1"
                keySplines={SMIL_SPLINES}
              />
            )}
          </path>
        </svg>
        <motion.span
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{ background: C.ink }}
          animate={reduce ? undefined : { scale: [1, 1.45, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
      <span className="text-base font-bold tracking-tight" style={{ color: C.heading }}>
        English Connection
      </span>
    </span>
  );
}

/* fires a bioluminescent confetti burst */
function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    startVelocity: 44,
    origin: { y: 0.65 },
    colors: [C.cyan, C.lime, C.violet, C.coral],
    disableForReducedMotion: true,
    scalar: 0.9,
  });
}

/* ----------------------------- CTA links -------------------------- */
function CtaLink({
  href,
  children,
  variant = "primary",
  className,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  ariaLabel?: string;
}) {
  const base =
    "group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-bold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-[#03161a]";
  const styles: Record<string, Vars> = {
    primary: {
      background: `linear-gradient(120deg, ${C.cyan}, ${C.lime})`,
      color: C.ink,
      boxShadow: `0 0 26px ${C.cyan}55, inset 0 0 0 1px rgba(255,255,255,0.25)`,
    },
    secondary: {
      background: "rgba(255,255,255,0.04)",
      color: C.heading,
      boxShadow: `inset 0 0 0 1px ${C.cyan}44`,
    },
    ghost: { background: "transparent", color: C.body },
  };
  return (
    <Link
      href={href}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      aria-label={ariaLabel}
      className={cx(base, className)}
      style={styles[variant]}
    >
      {children}
    </Link>
  );
}

/* a glassy abyssal surface card */
function GlassCard({
  children,
  className,
  glow = C.cyan,
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[28px] border backdrop-blur-md",
        className,
      )}
      style={{
        borderColor: "rgba(120,220,235,0.12)",
        background: "linear-gradient(160deg, rgba(8,40,49,0.72), rgba(4,24,31,0.6))",
        boxShadow: `0 18px 60px -28px ${glow}66, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {children}
    </div>
  );
}

/* tells the floating companion which emotion to wear for this section */
function InViewSignal({ emotion, set }: { emotion: Emo; set: (e: Emo) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55 });
  useEffect(() => {
    if (inView) set(emotion);
  }, [inView, emotion, set]);
  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px" />;
}

function SectionEyebrow({ children, color = C.cyan }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
      style={{ color, background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <Waves className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  );
}

/* =========================== Nav =================================== */
function Nav({ reduce }: { reduce: boolean }) {
  return (
    <header className="relative z-30 mx-auto flex max-w-6xl items-center justify-between px-4 pb-2 pt-16 sm:pt-20">
      <Logo reduce={reduce} />
      <AccountChip />
    </header>
  );
}

/* =========================== Hero ================================== */
function Hero({ reduce }: { reduce: boolean }) {
  const [override, setOverride] = useState<{ emotion: Emo; thinking?: boolean } | null>(null);
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
      <GooCluster
        reduce={reduce}
        colors={[C.cyan, C.violet, C.lime, C.cyan]}
        className="pointer-events-none absolute -right-10 -top-10 h-[70vh] w-[70vh] opacity-50"
      />
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <div className="relative">
          <SectionEyebrow color={C.lime}>Your AI English coach</SectionEyebrow>
          <h1
            className="mt-5 text-balance text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: C.heading }}
          >
            English Connection,{" "}
            <span className={cx("v6-gradtext", !reduce && "v6-shimmer")}>your AI English coach</span>
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold"
              style={{ background: `${C.lime}1f`, color: C.lime, boxShadow: `inset 0 0 0 1px ${C.lime}40` }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4" style={{ fill: C.lime, stroke: C.lime }} aria-hidden />
              ))}
              <span className="ml-1">4.8</span>
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold"
              style={{ background: `${C.cyan}18`, color: C.cyan, boxShadow: `inset 0 0 0 1px ${C.cyan}40` }}
            >
              <Trophy className="h-4 w-4" aria-hidden />
              1,00,000+ learners
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink
              href="/signup"
              onClick={fireConfetti}
              onPointerEnter={() => setOverride({ emotion: "love" })}
              onPointerLeave={() => setOverride(null)}
            >
              Open webapp
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </CtaLink>
            <CtaLink href="/login" variant="secondary">
              I already have an account
            </CtaLink>
          </div>
        </div>

        {/* the star: hero mascot in a glowing tank */}
        <div className="relative">
          <MorphBlob
            reduce={reduce}
            from={C.cyan}
            to={C.violet}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-30"
          />
          <GlassCard className="px-6 py-8" glow={C.violet}>
            <div className="flex flex-col items-center">
              <LivingMascot
                size={224}
                reduce={reduce}
                cycle
                track
                baseEmotion="happy"
                override={override}
                aura={C.cyan}
                aura2={C.lime}
              />
              <LiveCaption reduce={reduce} />
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

/* char-by-char typewriter — remounted via `key` to restart on a new line.
 * State only advances inside the interval callback (no setState in effect body). */
function Typewriter({ text, reduce }: { text: string; reduce: boolean }) {
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 34);
    return () => clearInterval(id);
  }, [text, reduce]);
  return <>{text.slice(0, n)}</>;
}

/* hero "transcription" beat — a coach line types out, then rotates */
function LiveCaption({ reduce }: { reduce: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % HERO_CAPTIONS.length), 4400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mt-5 flex min-h-[58px] w-full items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: "rgba(3,22,26,0.7)", boxShadow: `inset 0 0 0 1px ${C.cyan}26` }}
    >
      <Mic className="h-4 w-4 shrink-0" style={{ color: C.cyan }} aria-hidden />
      <p className="text-sm" style={{ color: C.body }} aria-live="polite">
        <Typewriter key={i} text={HERO_CAPTIONS[i]} reduce={reduce} />
        {!reduce && <span className="v6-caret ml-0.5 inline-block" style={{ color: C.lime }}>|</span>}
      </p>
    </div>
  );
}

/* ======================== Big tagline ============================== */
function Tagline({ reduce }: { reduce: boolean }) {
  return (
    <section className="relative z-10 mx-auto mt-16 max-w-6xl px-4">
      <div
        className="relative overflow-hidden rounded-[32px] px-6 py-12 text-center sm:py-16"
        style={{
          background: `linear-gradient(120deg, ${C.violet}26, ${C.cyan}1f 55%, ${C.lime}1f)`,
          boxShadow: `inset 0 0 0 1px ${C.cyan}26`,
        }}
      >
        <GooCluster
          reduce={reduce}
          colors={[C.lime, C.cyan, C.violet, C.coral]}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        />
        <p
          className="relative text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          style={{ color: C.heading }}
        >
          English learning has never been{" "}
          <span className={cx("v6-gradtext", !reduce && "v6-shimmer")}>this fun.</span>
        </p>
      </div>
    </section>
  );
}

/* ============================ Steps =============================== */
const STEPS: Array<{ n: string; title: string; Demo: () => ReactNode; accent: string }> = [
  { n: "01", title: "Talk it out with your AI partner", Demo: AiPartnerDemo, accent: C.cyan },
  { n: "02", title: "Rebuild real sentences in Jumble Words", Demo: JumbleDemo, accent: C.violet },
  { n: "03", title: "Speak, then see exactly what to fix", Demo: PronunciationDemo, accent: C.lime },
];

function StepsSection({ reduce, react }: { reduce: boolean; react: (e: Emo) => void }) {
  return (
    <section className="relative z-10 mx-auto mt-20 max-w-6xl px-4">
      <InViewSignal emotion="conversing" set={react} />
      <div className="space-y-8">
        {STEPS.map((s, idx) => (
          <motion.div
            key={s.n}
            initial={reduce ? false : { opacity: 0, y: 36 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <GlassCard className="p-5 sm:p-7" glow={s.accent}>
              <div className={cx("grid gap-6 lg:grid-cols-2", idx % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
                <div className="flex flex-col justify-center">
                  <span
                    className="text-5xl font-black tracking-tighter sm:text-6xl"
                    style={{ color: s.accent, textShadow: `0 0 24px ${s.accent}66` }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold sm:text-3xl" style={{ color: C.heading }}>
                    {s.title}
                  </h3>
                  <div className="mt-6">
                    <CtaLink href="/signup" className="!min-h-[46px] !px-5 !text-sm">
                      Try now
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </CtaLink>
                  </div>
                </div>
                <div
                  className="overflow-hidden rounded-[22px]"
                  style={{ boxShadow: `inset 0 0 0 1px ${s.accent}26` }}
                >
                  <div className="min-h-[420px]">
                    <s.Demo />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ====================== Mascot emotions =========================== */
const EMOTION_SHOWCASE: Array<{ e: Emo; label: string }> = [
  { e: "happy", label: "Happy" },
  { e: "love", label: "Love" },
  { e: "idea", label: "Idea" },
  { e: "surprised", label: "Surprised" },
  { e: "thinking", label: "Thinking" },
  { e: "greeting", label: "Greeting" },
  { e: "conversing", label: "Conversing" },
  { e: "tips", label: "Tips" },
  { e: "sad", label: "Sad" },
];

function EmotionsSection({ reduce, react }: { reduce: boolean; react: (e: Emo) => void }) {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reduce) return;
    const id = setInterval(() => setIdx((v) => (v + 1) % EMOTION_SHOWCASE.length), 2200);
    return () => clearInterval(id);
  }, [auto, reduce]);

  const current = EMOTION_SHOWCASE[idx];

  return (
    <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4">
      <InViewSignal emotion="happy" set={react} />
      <div className="mb-8 text-center">
        <SectionEyebrow color={C.violet}>Meet K.AI</SectionEyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.heading }}>
          A coach with a whole{" "}
          <span className={cx("v6-gradtext", !reduce && "v6-shimmer")}>spectrum of feeling</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: C.muted }}>
          Tap an emotion — watch it breathe, blink and emote in real time.
        </p>
      </div>

      <GlassCard className="p-6 sm:p-10" glow={C.violet}>
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <div className="grid place-items-center">
            <LivingMascot
              size={240}
              reduce={reduce}
              track
              baseEmotion={current.e}
              aura={C.violet}
              aura2={C.cyan}
            />
            <p
              className="mt-2 text-sm font-bold uppercase tracking-[0.3em]"
              style={{ color: C.cyan }}
              aria-live="polite"
            >
              {current.label}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 lg:max-w-md">
            {EMOTION_SHOWCASE.map((em, i) => {
              const on = i === idx;
              return (
                <button
                  key={em.e}
                  type="button"
                  onClick={() => {
                    setIdx(i);
                    setAuto(false);
                  }}
                  aria-pressed={on}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03161a]"
                  style={
                    on
                      ? { background: `linear-gradient(120deg, ${C.cyan}, ${C.lime})`, color: C.ink }
                      : { background: "rgba(255,255,255,0.04)", color: C.body, boxShadow: `inset 0 0 0 1px ${C.cyan}26` }
                  }
                >
                  {em.label}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}

/* ========================= Lessons carousel ======================= */
const LESSONS: Array<{ tag: string; title: string; color: string }> = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?", color: C.lime },
  { tag: "CULTURE", title: "How British tea became a ritual", color: C.violet },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk", color: C.cyan },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind", color: C.coral },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk", color: C.lime },
  { tag: "WELLNESS", title: "Why your accent never fully disappears", color: C.violet },
  { tag: "NEWS", title: "When AI rewrote the office", color: C.cyan },
];

function LessonsSection({ reduce, react }: { reduce: boolean; react: (e: Emo) => void }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    reduce ? [] : [Autoplay({ delay: 2600, stopOnInteraction: false })],
  );

  return (
    <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4">
      <InViewSignal emotion="tips" set={react} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow color={C.cyan}>Daily lessons</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.heading }}>
            Endless lessons, picked just for you
          </h2>
          <p className="mt-3 max-w-xl text-base" style={{ color: C.muted }}>
            Daily curated content tuned to what you struggle with most.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous lessons"
            onClick={() => emblaApi?.scrollPrev()}
            className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03161a]"
            style={{ color: C.cyan, boxShadow: `inset 0 0 0 1px ${C.cyan}33` }}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next lessons"
            onClick={() => emblaApi?.scrollNext()}
            className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03161a]"
            style={{ color: C.cyan, boxShadow: `inset 0 0 0 1px ${C.cyan}33` }}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {LESSONS.map((l) => (
            <div key={l.title} className="min-w-0 shrink-0 grow-0 basis-[80%] sm:basis-[46%] lg:basis-[31%]">
              <GlassCard className="flex h-full flex-col p-6" glow={l.color}>
                <span
                  className="self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: l.color, background: `${l.color}14`, boxShadow: `inset 0 0 0 1px ${l.color}40` }}
                >
                  {l.tag}
                </span>
                <h3 className="mt-5 flex-1 text-xl font-bold leading-snug" style={{ color: C.heading }}>
                  {l.title}
                </h3>
                <div
                  className="mt-6 flex items-center gap-2 border-t pt-4 text-sm font-semibold"
                  style={{ color: l.color, borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Talk about this in English
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================== Why bento ============================ */
const CEFR = [
  { label: "B1", pct: 45 },
  { label: "B2", pct: 75 },
  { label: "C1", pct: 100 },
];

function CefrBars({ reduce }: { reduce: boolean }) {
  return (
    <div className="mt-5 space-y-3">
      {CEFR.map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-7 text-sm font-bold" style={{ color: C.cyan }}>
            {b.label}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.cyan}, ${C.lime})`, boxShadow: `0 0 12px ${C.cyan}88` }}
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${b.pct}%` }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
            />
          </div>
          <span className="w-10 text-right text-xs font-semibold" style={{ color: C.muted }}>
            {b.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

function Gauge({ reduce }: { reduce: boolean }) {
  const gid = "v6gauge-" + useId().replace(/:/g, "");
  const r = 52;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - 0.89);
  return (
    <div className="mt-4 flex items-center gap-5">
      <div className="relative grid h-36 w-36 place-items-center">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.cyan} />
              <stop offset="100%" stopColor={C.lime} />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
          <motion.circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={reduce ? { strokeDashoffset: target } : { strokeDashoffset: circ }}
            whileInView={{ strokeDashoffset: target }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${C.cyan})` }}
          />
        </svg>
        <div className="absolute grid place-items-center text-center">
          <span className="text-3xl font-black" style={{ color: C.heading }}>
            89%
          </span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: C.heading }}>
          Beautiful
        </p>
        <p className="mt-1 text-sm tracking-wide" style={{ color: C.lime }}>
          B.YOO·tih·Fuhl
        </p>
      </div>
    </div>
  );
}

function BentoSection({ reduce, react }: { reduce: boolean; react: (e: Emo) => void }) {
  return (
    <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4">
      <InViewSignal emotion="idea" set={react} />
      <div className="mb-10 text-center">
        <SectionEyebrow color={C.lime}>Why us</SectionEyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.heading }}>
          Why English Connection?
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* (a) improvement over time — spans 2 on lg */}
        <BentoCard className="lg:col-span-2" glow={C.cyan} icon={<BarChart3 className="h-5 w-5" />} iconColor={C.cyan}>
          <h3 className="text-xl font-bold" style={{ color: C.heading }}>
            See your English improve over time
          </h3>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            Regular level checks show you exactly how far you've come.
          </p>
          <CefrBars reduce={reduce} />
        </BentoCard>

        {/* (b) pronunciation gauge */}
        <BentoCard glow={C.lime} icon={<Volume2 className="h-5 w-5" />} iconColor={C.lime}>
          <h3 className="text-xl font-bold" style={{ color: C.heading }}>
            Accurate pronunciation
          </h3>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            Pronounce every word right and sound natural.
          </p>
          <Gauge reduce={reduce} />
        </BentoCard>

        {/* (c) real-world expressions */}
        <BentoCard glow={C.violet} icon={<Sparkles className="h-5 w-5" />} iconColor={C.violet}>
          <h3 className="text-xl font-bold" style={{ color: C.heading }}>
            Learn real-world expressions
          </h3>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            Speak the way fluent people actually do — not how textbooks say.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              "10 expressions Indian professionals use daily",
              "Casual phrases for coffee chats",
              "Essential phrasal verbs for work",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm" style={{ color: C.body }}>
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.violet }} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </BentoCard>

        {/* (d) know exactly what to fix */}
        <BentoCard glow={C.coral} icon={<Target className="h-5 w-5" />} iconColor={C.coral}>
          <h3 className="text-xl font-bold" style={{ color: C.heading }}>
            Know exactly what to fix
          </h3>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            Specific feedback after every lesson — not vague pats on the back.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl p-3" style={{ background: `${C.coral}12`, boxShadow: `inset 0 0 0 1px ${C.coral}33` }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.coral }}>
                You said
              </span>
              <p className="mt-1 text-sm line-through" style={{ color: C.body }}>
                "I am understanding what you mean."
              </p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: `${C.lime}12`, boxShadow: `inset 0 0 0 1px ${C.lime}33` }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.lime }}>
                Correct
              </span>
              <p className="mt-1 text-sm font-semibold" style={{ color: C.heading }}>
                "I understand what you mean."
              </p>
            </div>
          </div>
        </BentoCard>

        {/* (e) mistakes into strengths */}
        <BentoCard glow={C.lime} icon={<Sprout className="h-5 w-5" />} iconColor={C.lime}>
          <h3 className="text-xl font-bold" style={{ color: C.heading }}>
            Turn mistakes into strengths
          </h3>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            The words you trip on become tomorrow's warm-up drills, so the same mistake never sneaks in twice.
          </p>
          <div className="mt-5 flex items-start gap-2 rounded-2xl p-3 text-sm" style={{ background: "rgba(255,255,255,0.03)", color: C.body, boxShadow: `inset 0 0 0 1px ${C.lime}26` }}>
            <Repeat className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.lime }} aria-hidden />
            Practice speaking out loud to build a stronger connection between your brain and your mouth.
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

function BentoCard({
  children,
  className,
  glow,
  icon,
  iconColor,
}: {
  children: ReactNode;
  className?: string;
  glow: string;
  icon: ReactNode;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      <GlassCard className="h-full p-6" glow={glow}>
        <span
          className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl"
          style={{ color: iconColor, background: `${iconColor}14`, boxShadow: `inset 0 0 0 1px ${iconColor}40` }}
          aria-hidden
        >
          {icon}
        </span>
        {children}
      </GlassCard>
    </motion.div>
  );
}

/* ============================ Reviews ============================= */
const REVIEWS = [
  { name: "Priya R.", city: "Bengaluru", body: "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class." },
  { name: "Anita K.", city: "Pune", body: "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way." },
  { name: "Mehul S.", city: "Hyderabad", body: "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally." },
  { name: "Rohan T.", city: "Delhi", body: "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. It's the first app that finally challenges me at the right level." },
  { name: "Sneha M.", city: "Chennai", body: "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading." },
  { name: "Karthik V.", city: "Coimbatore", body: "Wow… I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing." },
];
const REVIEW_STATS = [
  { value: "1L+", label: "Happy users", color: C.cyan },
  { value: "4.8", label: "Rating", color: C.lime },
  { value: "31K+", label: "Lessons", color: C.violet },
];

function ReviewsSection({ react }: { react: (e: Emo) => void }) {
  return (
    <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4">
      <InViewSignal emotion="surprised" set={react} />
      <div className="mb-10 text-center">
        <SectionEyebrow color={C.cyan}>Loved across India</SectionEyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.heading }}>
          Speak English with confidence
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: "easeOut" }}
          >
            <GlassCard className="flex h-full flex-col p-6" glow={C.cyan}>
              <Quote className="h-6 w-6" style={{ color: `${C.cyan}88` }} aria-hidden />
              <div className="mt-3 flex gap-0.5" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-4 w-4" style={{ fill: C.lime, stroke: C.lime }} aria-hidden />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: C.body }}>
                {r.body}
              </p>
              <div className="mt-5 flex items-center gap-3 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold"
                  style={{ background: `linear-gradient(120deg, ${C.cyan}, ${C.violet})`, color: C.ink }}
                  aria-hidden
                >
                  {r.name[0]}
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: C.heading }}>
                    {r.name}
                  </p>
                  <p className="text-xs" style={{ color: C.muted }}>
                    {r.city}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {REVIEW_STATS.map((s) => (
          <GlassCard key={s.label} className="py-6 text-center" glow={s.color}>
            <p className="text-3xl font-black sm:text-4xl" style={{ color: s.color, textShadow: `0 0 22px ${s.color}55` }}>
              {s.value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              {s.label}
            </p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

/* ============================ Pricing ============================= */
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

function PricingSection({ reduce, react }: { reduce: boolean; react: (e: Emo) => void }) {
  return (
    <section className="relative z-10 mx-auto mt-24 max-w-5xl px-4">
      <InViewSignal emotion="love" set={react} />
      <div className="mb-10 text-center">
        <SectionEyebrow color={C.lime}>Pricing</SectionEyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.heading }}>
          Tutor-level results, no tutor-level fees
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* English Connection */}
        <div className="relative">
          <MorphBlob
            reduce={reduce}
            from={C.cyan}
            to={C.lime}
            className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-30"
          />
          <GlassCard className="relative h-full p-7" glow={C.cyan}>
            <span
              className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
              style={{ background: `linear-gradient(120deg, ${C.cyan}, ${C.lime})`, color: C.ink }}
            >
              Recommended
            </span>
            <h3 className="mt-4 text-xl font-bold" style={{ color: C.heading }}>
              English Connection
            </h3>
            <p className="mt-2">
              <span className="text-4xl font-black" style={{ color: C.heading }}>₹399</span>
              <span className="text-sm" style={{ color: C.muted }}>/month</span>
            </p>
            <ul className="mt-6 space-y-3">
              {EC_ROWS.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm" style={{ color: C.body }}>
                  <span
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                    style={{ background: `${C.lime}1f` }}
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" style={{ color: C.lime }} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <CtaLink href="/signup" onClick={fireConfetti} className="w-full">
                Open the webapp
                <ArrowRight className="h-5 w-5" aria-hidden />
              </CtaLink>
            </div>
          </GlassCard>
        </div>

        {/* Private tutor */}
        <GlassCard className="h-full p-7" glow={C.coral}>
          <span
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.05)", color: C.muted, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
          >
            The old way
          </span>
          <h3 className="mt-4 text-xl font-bold" style={{ color: C.heading }}>
            Private tutor
          </h3>
          <p className="mt-2">
            <span className="text-4xl font-black" style={{ color: C.muted }}>₹8,000</span>
            <span className="text-sm" style={{ color: C.muted }}>/month</span>
          </p>
          <ul className="mt-6 space-y-3">
            {TUTOR_ROWS.map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm" style={{ color: C.muted }}>
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                  style={{ background: `${C.coral}1f` }}
                  aria-hidden
                >
                  <X className="h-3.5 w-3.5" style={{ color: C.coral }} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}

/* ====================== App store glyphs ========================= */
function AppleGlyph({ reduce }: { reduce: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 384 512"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden
      animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
    </motion.svg>
  );
}

function GooglePlayGlyph({ reduce }: { reduce: boolean }) {
  const gid = "v6gp-" + useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="3" y1="2" x2="21" y2="22">
          <stop offset="0%" stopColor={C.cyan} />
          <stop offset="50%" stopColor={C.lime} />
          <stop offset="100%" stopColor={C.violet} />
          {!reduce && (
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="6s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
      </defs>
      <path d="M4 3.5 L20 12 L4 20.5 Z" fill={`url(#${gid})`} />
    </svg>
  );
}

function StoreButton({ glyph, sub, label }: { glyph: ReactNode; sub: string; label: string }) {
  return (
    <Link
      href="/signup"
      aria-label={`${sub} ${label}`}
      className="inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03161a]"
      style={{ background: "rgba(255,255,255,0.04)", color: C.heading, boxShadow: `inset 0 0 0 1px ${C.cyan}33` }}
    >
      <span style={{ color: C.heading }}>{glyph}</span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
          {sub}
        </span>
        <span className="block text-sm font-bold">{label}</span>
      </span>
    </Link>
  );
}

/* ============================ Final CTA =========================== */
function FinalSection({ reduce, react }: { reduce: boolean; react: (e: Emo) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    if (inView && !reduce) fireConfetti();
  }, [inView, reduce]);

  return (
    <section ref={ref} className="relative z-10 mx-auto mt-24 max-w-4xl px-4">
      <InViewSignal emotion="happy" set={react} />
      <div
        className="relative overflow-hidden rounded-[36px] px-6 py-14 text-center"
        style={{
          background: `linear-gradient(160deg, ${C.violet}22, ${C.cyan}1a 55%, ${C.lime}1a)`,
          boxShadow: `inset 0 0 0 1px ${C.cyan}33, 0 30px 80px -40px ${C.violet}99`,
        }}
      >
        <GooCluster
          reduce={reduce}
          colors={[C.cyan, C.lime, C.violet, C.coral]}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        />
        <div className="relative flex flex-col items-center">
          <LivingMascot
            size={180}
            reduce={reduce}
            cycle
            track
            baseEmotion="love"
            aura={C.lime}
            aura2={C.cyan}
          />
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: C.heading }}>
            So, are you{" "}
            <span className={cx("v6-gradtext", !reduce && "v6-shimmer")}>ready?</span>
          </h2>
          <div className="mt-8">
            <CtaLink href="/signup" onClick={fireConfetti}>
              <Heart className="h-5 w-5" aria-hidden />
              Open the webapp
              <ArrowRight className="h-5 w-5" aria-hidden />
            </CtaLink>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
            Or download the app
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <StoreButton glyph={<GooglePlayGlyph reduce={reduce} />} sub="GET IT ON" label="Google Play" />
            <StoreButton glyph={<AppleGlyph reduce={reduce} />} sub="Download on the" label="App Store" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================= Footer ============================= */
const FOOTER_WEBAPP: Array<[string, string]> = [
  ["Open dashboard", "/signup"],
  ["Log in", "/login"],
  ["Practice library", "/signup"],
  ["Leaderboard", "/signup"],
];
const FOOTER_COMPANY: Array<[string, string]> = [
  ["About", "#"],
  ["Updates", "#"],
  ["Privacy", "#"],
  ["Terms", "#"],
];

function Footer({ reduce }: { reduce: boolean }) {
  const linkCls =
    "inline-flex min-h-[32px] items-center rounded-md text-sm transition-colors hover:text-[#2ef2ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03161a]";
  return (
    <footer className="relative z-10 mx-auto mt-24 max-w-6xl px-4 pb-16">
      <div className="border-t pt-12" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo reduce={reduce} />
            <p className="mt-4 max-w-xs text-sm" style={{ color: C.muted }}>
              Your AI English coach — built for India's ambitious learners.
            </p>
          </div>

          <FooterCol title="Webapp" links={FOOTER_WEBAPP} linkCls={linkCls} />
          <FooterCol title="Company" links={FOOTER_COMPANY} linkCls={linkCls} />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.cyan }}>
              Get the app
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <StoreButton glyph={<GooglePlayGlyph reduce={reduce} />} sub="GET IT ON" label="Google Play" />
              <StoreButton glyph={<AppleGlyph reduce={reduce} />} sub="Download on the" label="App Store" />
            </div>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-2 border-t pt-6 text-center text-xs sm:flex-row sm:text-left"
          style={{ borderColor: "rgba(255,255,255,0.08)", color: C.muted }}
        >
          <p>© 2026 English Connection · Built for India's ambitious learners</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  linkCls,
}: {
  title: string;
  links: Array<[string, string]>;
  linkCls: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.cyan }}>
        {title}
      </p>
      <ul className="mt-4 space-y-1.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className={linkCls} style={{ color: C.body }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ====================== Floating companion ======================= */
function Companion({ emotion, reduce }: { emotion: Emo; reduce: boolean }) {
  return (
    <AnimatePresence>
      <motion.div
        key="companion"
        aria-hidden
        className="fixed bottom-5 right-5 z-40 hidden md:block"
        initial={{ opacity: 0, y: 24, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 160, damping: 18 }}
      >
        <div
          className="rounded-3xl p-2 backdrop-blur-md"
          style={{ background: "rgba(4,34,43,0.7)", boxShadow: `0 0 30px ${C.cyan}33, inset 0 0 0 1px ${C.cyan}26` }}
        >
          <LivingMascot
            size={92}
            reduce={reduce}
            track={false}
            baseEmotion={emotion}
            orbit={false}
            aura={C.lime}
            aura2={C.cyan}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================== Page ============================= */
export default function Page() {
  const reduce = !!useReducedMotion();
  const [companion, setCompanion] = useState<Emo>("greeting");

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="v6-root relative min-h-screen w-full overflow-x-hidden"
        style={{ background: C.base, color: C.body }}
      >
        <style>{`
          .v6-root { -webkit-font-smoothing: antialiased; }
          .v6-gradtext {
            background-image: linear-gradient(110deg, ${C.cyan}, ${C.lime} 40%, ${C.violet} 80%, ${C.cyan});
            background-size: 220% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .v6-shimmer { animation: v6-shimmer-x 7s linear infinite; }
          @keyframes v6-shimmer-x {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          .v6-caustic { animation: v6-caustic-pan 22s ease-in-out infinite; }
          @keyframes v6-caustic-pan {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
          }
          .v6-caret { animation: v6-caret 1s steps(1) infinite; }
          @keyframes v6-caret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

          @media (prefers-reduced-motion: reduce) {
            .v6-root *, .v6-root *::before, .v6-root *::after {
              animation-duration: 0.001ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}</style>

        {/* fixed background field */}
        <BackgroundFX reduce={reduce} />

        {/* back-to-gallery pill */}
        <Link
          href="/showcase"
          className="fixed left-3 top-3 z-50 inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03161a]"
          style={{ background: "rgba(4,34,43,0.7)", color: C.heading, boxShadow: `inset 0 0 0 1px ${C.cyan}40` }}
        >
          <ArrowRight className="h-4 w-4 rotate-180" aria-hidden />
          All designs
        </Link>

        {/* content */}
        <main className="relative">
          <Nav reduce={reduce} />
          <Hero reduce={reduce} />
          <Tagline reduce={reduce} />
          <StepsSection reduce={reduce} react={setCompanion} />
          <EmotionsSection reduce={reduce} react={setCompanion} />
          <LessonsSection reduce={reduce} react={setCompanion} />
          <BentoSection reduce={reduce} react={setCompanion} />
          <ReviewsSection react={setCompanion} />
          <PricingSection reduce={reduce} react={setCompanion} />
          <FinalSection reduce={reduce} react={setCompanion} />
          <Footer reduce={reduce} />
        </main>

        {/* recurring mascot cameo */}
        <Companion emotion={companion} reduce={reduce} />
      </div>
    </MotionConfig>
  );
}

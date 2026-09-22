"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion, MotionConfig, useScroll, useTransform, useInView, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  Phone,
  Star,
  X,
} from "lucide-react";
import AccountChip from "@/components/layout/AccountChip";
import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import { MascotEmotionMarquee } from "@/components/landing/MascotEmotionMarquee";

/* =====================================================================
 * Landing — English Connection marketing homepage.
 *
 * Section order mirrors the reference flow: nav → curved hero card with
 * mascot-phone overlap → big centered tagline → scroll-pinned 3-step
 * feature column → horizontal lesson carousel → bento Why grid → reviews
 * + stats → pricing comparison → final app-icon CTA → footer.
 *
 * All copy is original to English Connection. Top sections lead with the webapp
 * CTA (signup/login); native-app store buttons appear only in the final
 * CTA and footer secondary row.
 * =================================================================== */

export default function Landing() {
  // reducedMotion="user" makes every framer-motion animation on the page honor
  // the visitor's OS "reduce motion" setting (transform/scale/slide become
  // instant, opacity fades stay). The non-framer motion — carousel autoplay,
  // hero mic pulse, the review card slam — is gated separately via
  // useReducedMotion() in the relevant components below.
  return (
    <MotionConfig reducedMotion="user">
      <div className="text-body">
        <LandingNav />
        <Hero />
        <BigTagline />
        <PinnedSteps />
        <MascotEmotionMarquee />
        <LessonCarousel />
        <WhyBento />
        <Reviews />
        <Pricing />
        <FinalCTA />
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}

/* ───────────────────────── Top nav ───────────────────────── */

function LandingNav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="glass mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="English Connection"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-lg font-bold text-heading">English Connection</span>
        </Link>

        <nav className="flex items-center gap-2 md:gap-3">
          <AccountChip size="sm" />
        </nav>
      </div>
    </header>
  );
}

/* ───────────────────────── 1. Hero ───────────────────────── */

function Hero() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 pb-10 pt-10 md:px-8 md:pt-16">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative overflow-visible rounded-[36px] bg-gradient-to-br from-[#f59e0b] via-[#f97316] to-[#ea580c] p-7 shadow-[0_30px_80px_-30px_rgba(249,115,22,0.6)] md:p-12"
      >
        <div className="grid items-center gap-6 md:grid-cols-[1.1fr_0.9fr]">
          {/* Left: copy */}
          <div className="text-white">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              English Connection,
              <br />
              your AI English coach
            </h1>

            <div className="mt-7 flex flex-wrap items-center gap-6 text-white/95">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-[#ffd166] text-[#ffd166]" />
                <span className="text-xl font-bold">4.8</span>
                <span className="text-xs uppercase tracking-wider opacity-80">
                  rating
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">1,00,000+</span>
                <span className="text-xs uppercase tracking-wider opacity-80">
                  learners
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#6b4cff] shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#f97316]"
              >
                Open webapp <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#f97316]"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Right: phone mockup with mascot overflowing */}
          <HeroPhone />
        </div>
      </motion.div>
    </section>
  );
}

function HeroPhone() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto h-[440px] w-[260px] md:h-[500px] md:w-[280px]">
      {/* Mascot peeking out from the top */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute -top-16 left-1/2 z-20 -translate-x-1/2"
      >
        <Image
          src="/mascots/happy.svg"
          alt=""
          width={160}
          height={160}
          className="h-32 w-32 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:h-40 md:w-40"
          aria-hidden
        />
      </motion.div>

      {/* Phone body */}
      <div className="absolute inset-0 rounded-[44px] border-[6px] border-[#1a1a22] bg-[#0b0e14] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1a1a22]" />
        {/* Screen */}
        <div className="absolute inset-2 overflow-hidden rounded-[36px] bg-gradient-to-b from-[#1c1f2c] to-[#0e1118]">
          <div className="flex h-full flex-col p-4 pt-10">
            {/* Chat bubble from user */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="ml-auto mt-2 max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-3 py-2 text-[11px] font-medium text-[#0b0e14]"
            >
              I want to speak English{" "}
              <span className="rounded bg-white/40 px-1.5 py-0.5 font-bold">
                fluently
              </span>
            </motion.div>

            {/* AI suggestion bubble */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-3 rounded-2xl rounded-tl-md bg-white/95 px-3 py-2 text-[11px] text-[#1a1a22] shadow-lg"
            >
              <div className="font-semibold">fluently →</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded bg-[#b79fff]/20 px-1.5 py-0.5 font-semibold text-[#6b4cff]">
                  smoothly
                </span>
                <span className="rounded bg-[#b79fff]/20 px-1.5 py-0.5 font-semibold text-[#6b4cff]">
                  clearly
                </span>
                <span className="rounded bg-[#b79fff]/20 px-1.5 py-0.5 font-semibold text-[#6b4cff]">
                  +3
                </span>
              </div>
            </motion.div>

            <div className="flex-1" />

            {/* Mic button */}
            <div className="mb-2 flex justify-center">
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : {
                        boxShadow: [
                          "0 0 0 0 rgba(249,115,22,0.5)",
                          "0 0 0 12px rgba(249,115,22,0)",
                        ],
                      }
                }
                transition={reduce ? undefined : { duration: 1.6, repeat: Infinity }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316]"
              >
                <Mic className="h-5 w-5 text-[#0b0e14]" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 2. Big tagline ───────────────────────── */

function BigTagline() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-24 text-center md:px-8 md:py-32">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-heading md:text-5xl"
      >
        English learning has never been{" "}
        <span className="bg-gradient-to-r from-[#f59e0b] via-[#00e3fd] to-[#ff6c95] bg-clip-text text-transparent">
          this fun.
        </span>
      </motion.h2>
    </section>
  );
}

/* ───────────────────────── 3. Scroll-pinned 3-step feature ───────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Talk it out with your AI partner",
  },
  {
    n: "02",
    title: "Rebuild real sentences in Jumble Words",
  },
  {
    n: "03",
    title: "Speak, then see exactly what to fix",
  },
];

function PinnedSteps() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (p) => {
      const idx = Math.min(2, Math.max(0, Math.floor(p * 3)));
      setActive(idx);
    });
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative mx-auto max-w-[1280px] px-5 md:px-8"
      style={{ height: "260vh" }}
    >
      <div className="sticky top-0 grid h-screen items-center gap-10 md:grid-cols-2">
        {/* Left: text steps */}
        <div className="space-y-12 md:space-y-16">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`transition-all duration-500 ${
                active === i ? "opacity-100" : "opacity-25"
              }`}
            >
              <div className="font-mono text-xs text-muted-foreground">
                {s.n} / 03
              </div>
              <h3 className="mt-2 text-2xl font-extrabold text-heading md:text-4xl">
                {s.title}
              </h3>
            </div>
          ))}
        </div>

        {/* Right: live, self-animating product demo per step */}
        <div className="flex items-center justify-center">
          <StepDemo active={active} />
        </div>
      </div>
    </section>
  );
}

// The live showcase — each scroll step reveals the REAL product UI driving
// itself: AI Partner (auto-typing chat), Jumble Words (self-assembling board),
// Pronunciation Trainer (Listen → Speak → Feedback loop). Only the active demo
// is mounted, so its animation restarts fresh as you scroll to it.
function StepDemo({ active }: { active: number }) {
  return (
    <div className="flex h-[660px] w-full max-w-[460px] flex-col justify-center gap-4">
      {active === 0 && <AiPartnerDemo />}
      {active === 1 && <JumbleDemo />}
      {active === 2 && <PronunciationDemo />}

      {/* The "Try now" CTA lives OUTSIDE the demo card, with a distinct ghost
          outline so it reads as a real call-to-action, not a demo control. */}
      {active !== 0 && (
        <Link
          href="/signup"
          className="group inline-flex items-center justify-center gap-2 self-center rounded-full border border-primary/50 bg-primary/10 px-8 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-[#0b0e14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Try now
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      )}
    </div>
  );
}

/* ───────────────────────── 4. Lesson carousel ───────────────────────── */

const LESSONS = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?", grad: "from-[#ffd166] to-[#ff8c5a]" },
  { tag: "CULTURE", title: "How British tea became a ritual", grad: "from-[#7cd1ff] to-[#b79fff]" },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk", grad: "from-[#ffafcc] to-[#ff6c95]" },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind", grad: "from-[#b5ead7] to-[#7cd1ff]" },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk", grad: "from-[#caffbf] to-[#b5ead7]" },
  { tag: "WELLNESS", title: "Why your accent never fully disappears", grad: "from-[#ffadad] to-[#ffd166]" },
  { tag: "NEWS", title: "When AI rewrote the office", grad: "from-[#bdb2ff] to-[#a0c4ff]" },
];

function LessonCarousel() {
  const reduce = useReducedMotion();
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "center", containScroll: false },
    // Honor reduced-motion: no auto-advancing carousel for those visitors.
    reduce ? [] : [Autoplay({ delay: 3200, stopOnInteraction: false })],
  );

  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-[1280px] px-5 text-center md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-extrabold text-heading md:text-5xl"
        >
          Endless lessons, picked just for you
        </motion.h2>
        <p className="mt-3 text-body md:text-lg">
          Daily curated content tuned to what you struggle with most.
        </p>
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-5 px-5 md:px-8">
            {LESSONS.map((l, i) => (
              <article
                key={i}
                className={`relative flex h-[280px] w-[210px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${l.grad} p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-2`}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                  {l.tag}
                </div>
                <h3 className="text-base font-bold leading-snug text-black">
                  {l.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-black/70">
                  <Phone className="h-3 w-3" /> Talk about this in English
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Center phone overlay */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[320px] w-[180px] -translate-x-1/2 -translate-y-1/2 md:block">
          <div className="h-full w-full rounded-[36px] border-[5px] border-[#1a1a22] bg-[#0b0e14] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
            <div className="absolute left-1/2 top-1 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1a1a22]" />
            <div className="absolute inset-1.5 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1c1f2c] to-[#0e1118]">
              <Image
                src="/mascots/calm.svg"
                alt=""
                width={100}
                height={100}
                className="h-24 w-24"
                aria-hidden
              />
              <div className="px-3 text-center text-[10px] text-muted-foreground">
                What do you want to learn today?
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 5. Why bento grid ───────────────────────── */

function WhyBento() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center text-3xl font-extrabold text-heading md:text-5xl"
      >
        Why English Connection?
      </motion.h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:grid-rows-[auto_auto]">
        {/* Card 1 — Track progress */}
        <Reveal className="c-box md:col-span-1">
          <div className="flex h-full flex-col rounded-3xl p-7">
            <h3 className="text-xl font-bold text-heading">
              See your English improve over time
            </h3>
            <p className="mt-2 text-sm text-body">
              Regular level checks show you exactly how far you&rsquo;ve come.
            </p>
            <div className="mt-auto flex h-32 items-end gap-3 pt-6">
              {[
                { l: "B1", h: 45 },
                { l: "B2", h: 75 },
                { l: "C1", h: 100 },
              ].map((b) => (
                <div key={b.l} className="flex flex-1 flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${b.h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#f59e0b] to-[#f97316]"
                  />
                  <span className="text-xs font-bold text-heading">{b.l}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Card 2 — Pronunciation */}
        <Reveal className="c-box md:col-span-1">
          <div className="flex h-full flex-col items-center rounded-3xl p-7 text-center">
            <h3 className="self-start text-xl font-bold text-heading">
              Accurate pronunciation
            </h3>
            <p className="mt-2 self-start text-sm text-body">
              Pronounce every word right and sound natural.
            </p>
            <PronunciationGauge />
          </div>
        </Reveal>

        {/* Card 3 — Real-world expressions (wide) */}
        <Reveal className="c-box md:col-span-1">
          <div className="flex h-full flex-col rounded-3xl p-7">
            <h3 className="text-xl font-bold text-heading">
              Learn real-world expressions
            </h3>
            <p className="mt-2 text-sm text-body">
              Speak the way fluent people actually do — not how textbooks say.
            </p>
            <div className="mt-5 space-y-2">
              {[
                "10 expressions Indian professionals use daily",
                "Casual phrases for coffee chats",
                "Essential phrasal verbs for work",
              ].map((s) => (
                <div
                  key={s}
                  className="rounded-xl bg-surface-2/60 px-3 py-2 text-xs text-heading"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Card 4 — Know what to fix */}
        <Reveal className="c-box md:col-span-1">
          <div className="flex h-full flex-col rounded-3xl p-7">
            <h3 className="text-xl font-bold text-heading">
              Know exactly what to fix
            </h3>
            <p className="mt-2 text-sm text-body">
              Specific feedback after every lesson — not vague pats on the back.
            </p>
            <div className="mt-5 space-y-2">
              <div className="rounded-xl bg-[#ff6c95]/15 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#ff6c95]">
                  <X className="h-3.5 w-3.5" strokeWidth={3} /> You said
                </div>
                <div className="mt-1 text-body">
                  &quot;I am understanding what you mean.&quot;
                </div>
              </div>
              <div className="rounded-xl bg-cyan/15 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-cyan">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Correct
                </div>
                <div className="mt-1 text-body">
                  &quot;I understand what you mean.&quot;
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Card 5 — Turn mistakes into strengths (wide) */}
        <Reveal className="c-box md:col-span-2">
          <div className="flex h-full flex-col rounded-3xl p-7">
            <h3 className="text-xl font-bold text-heading">
              Turn mistakes into strengths
            </h3>
            <p className="mt-2 max-w-md text-sm text-body">
              The words you trip on become tomorrow&rsquo;s warm-up drills, so
              the same mistake never sneaks in twice.
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-gradient-to-br from-[#f59e0b]/20 to-[#00e3fd]/10 p-5 text-sm font-medium text-heading">
              <Star className="mt-0.5 h-4 w-4 shrink-0 fill-[#00e3fd] text-[#00e3fd]" />
              <span>
                Practice speaking out loud to build a stronger connection between
                your brain and your mouth. Speaking will feel more natural.
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PronunciationGauge() {
  return (
    <div className="mt-4 flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="h-24 w-44">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="157"
          initial={{ strokeDashoffset: 157 }}
          whileInView={{ strokeDashoffset: 157 - (157 * 0.89) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="gauge-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#b79fff" />
            <stop offset="100%" stopColor="#00e3fd" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-3 text-2xl font-extrabold text-heading">89%</div>
      <div className="mt-2 text-2xl font-bold">
        <span className="text-heading">Beau</span>
        <span className="text-cyan">ti</span>
        <span className="text-heading">ful</span>
      </div>
      <div className="mt-1 flex gap-2 text-[10px] font-mono text-muted-foreground">
        <span>B.YOO</span>
        <span>·</span>
        <span className="text-cyan">tih</span>
        <span>·</span>
        <span>Fuhl</span>
      </div>
    </div>
  );
}

/* small fade-up wrapper */
function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── 6. Reviews ───────────────────────── */

const QUOTES = [
  {
    q: "After a 5-minute lesson, English Connection tells me what I did, what I missed, and how to improve. Way more motivating than my old class.",
    name: "Priya R.",
    meta: "Bengaluru",
  },
  {
    q: "I'm a mom in my 40s teaching at a school. I tried lots of apps — English Connection feels more effective because it makes me actually speak in a structured way.",
    name: "Anita K.",
    meta: "Pune",
  },
  {
    q: "Even when my sentences aren't perfect, English Connection understands me and keeps the conversation going. Unlike other apps where I freeze, I practice naturally.",
    name: "Mehul S.",
    meta: "Hyderabad",
  },
  {
    q: "I reached a point where I could chat comfortably while studying abroad — that genuinely surprised me. English Connection is the first app I finally challenges me at the right level.",
    name: "Rohan T.",
    meta: "Delhi",
  },
  {
    q: "It feels like talking to a friend on the phone. The voice AI catches things I never would have caught reading.",
    name: "Sneha M.",
    meta: "Chennai",
  },
  {
    q: "Wow… you're telling me I can study English using videos I actually like just by pasting a link? Genuinely thought I'd dropped my old class for nothing.",
    name: "Karthik V.",
    meta: "Coimbatore",
  },
];

/* Card-stack testimonials: cards rush in from the right, "hit the left
 * wall", then bounce back and fan out into a stack. Front card is active;
 * prev/next (and ← → keys) page through the deck. */
function Reviews() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: false, margin: "-120px" });
  const reduce = useReducedMotion();

  const [active, setActive] = useState(0);
  // entrance phases: "hidden" → "wall" (slam left) → "settled" (fan out)
  const [phase, setPhase] = useState<"hidden" | "wall" | "settled">("hidden");
  const [interactive, setInteractive] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Replay the entrance sequence every time the section scrolls into view;
  // reset to the hidden state when it leaves so the next approach starts fresh.
  useEffect(() => {
    if (!inView) {
      setPhase("hidden");
      setInteractive(false);
      setActive(0);
      return;
    }
    // Reduced motion: skip the slam-in choreography, show the settled deck.
    if (reduce) {
      setPhase("settled");
      setInteractive(true);
      return;
    }
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(250);
      if (cancelled) return;
      setPhase("wall");
      await wait(550);
      if (cancelled) return;
      setPhase("settled");
      await wait(750);
      if (cancelled) return;
      setInteractive(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [inView, reduce]);

  const next = useCallback(
    () => setActive((p) => (p + 1 < QUOTES.length ? p + 1 : p)),
    [],
  );
  const prev = useCallback(() => setActive((p) => (p > 0 ? p - 1 : p)), []);

  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactive, next, prev]);

  const cardStyle = (index: number): React.CSSProperties => {
    const diff = index - active;
    // Reduced motion: render the settled fan with no transition — paging still
    // works, the deck just snaps into place instead of sliding/springing.
    if (reduce) {
      const xMul = isMobile ? 56 : 200;
      return {
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translateX(${diff * xMul}px) translateY(${diff * 7}px) rotate(${-2 + diff * 3.5}deg) scale(${1 - Math.abs(diff) * 0.04})`,
        transition: "none",
        pointerEvents: interactive ? "auto" : "none",
        zIndex: 40 - diff,
        opacity: diff < 0 || diff > 4 ? 0 : 1 - diff * 0.08,
      };
    }
    // Cards are anchored to the container's left edge; the transforms push
    // them rightward, so the deck fans out from the left wall.
    const base: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      opacity: 1,
      // All settled cards accept pointer events so any of them can be hovered.
      pointerEvents: interactive ? "auto" : "none",
      transition: "all 0.85s cubic-bezier(0.2, 0.8, 0.2, 1)",
    };

    // Waiting off-screen to the right, tilted.
    if (phase === "hidden") {
      return {
        ...base,
        opacity: 0,
        transform: `translateX(${900 + index * 60}px) rotate(16deg) scale(1)`,
        transition: "all 0.55s cubic-bezier(0.25, 1, 0.5, 1)",
        zIndex: QUOTES.length - index,
      };
    }

    // Hit the left wall — only the first card lands flush; the rest stack
    // back off it with a growing offset, slight overshoot for the "hit".
    if (phase === "wall") {
      return {
        ...base,
        transform: `translateX(${index * 26}px) translateY(${index * 5}px) rotate(${-5 + index * 1.5}deg) scale(1)`,
        transition: `all 0.55s cubic-bezier(0.34, 1.4, 0.5, 1) ${index * 45}ms`,
        zIndex: QUOTES.length - index,
      };
    }

    // Settled: active card pinned at the left wall, the rest scatter
    // rightward across the full container width, increasingly staggered.
    const xMul = isMobile ? 56 : 200;
    const x = diff * xMul;
    const y = diff * 7;
    const rot = -2 + diff * 3.5;
    const scale = 1 - Math.abs(diff) * 0.04;
    const isHovered = hovered === index;
    // Each card lands on its own clock — further cards settle a beat later —
    // and overshoots slightly, so the stack springs into place card-by-card
    // instead of moving as one rigid block. Hover responds instantly.
    const delay = isHovered ? 0 : Math.abs(diff) * 60;
    return {
      ...base,
      transform: `translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
      transition: `transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, opacity 0.5s ease ${delay}ms, filter 0.3s ease`,
      // Hovered card jumps above the whole stack.
      zIndex: isHovered ? 50 : 40 - diff,
      // Cards already navigated past (diff < 0) slide off the left and fade.
      opacity: isHovered ? 1 : diff < 0 || diff > 4 ? 0 : 1 - diff * 0.08,
      filter: isHovered || diff === 0 ? "none" : "brightness(0.94)",
    };
  };

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-[1280px] overflow-hidden px-5 py-20 md:px-8"
    >
      <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl font-extrabold text-heading md:text-left md:text-5xl"
        >
          Speak English with confidence
        </motion.h2>

        <div className="flex gap-3">
          <button
            onClick={prev}
            disabled={!interactive || active === 0}
            aria-label="Previous testimonial"
            className="c-box flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-heading transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            disabled={!interactive || active === QUOTES.length - 1}
            aria-label="Next testimonial"
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14] shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative h-[460px] w-full">
        {QUOTES.map((t, i) => (
          <div
            key={i}
            style={cardStyle(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            className="c-box flex h-full w-[280px] flex-col rounded-[28px] p-7 sm:w-[320px] md:w-[340px]"
          >
            <div className="mb-6 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  className="h-5 w-5 fill-[#ffd166] text-[#ffd166]"
                />
              ))}
            </div>
            <blockquote className="flex-1 text-lg font-medium leading-relaxed text-body">
              &ldquo;{t.q}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#00e3fd] text-sm font-bold text-[#0b0e14]">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <div className="text-sm font-semibold text-heading">
                  {t.name}
                </div>
                <div className="text-xs text-muted-foreground">{t.meta}</div>
              </div>
            </figcaption>
          </div>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-3 gap-5 text-center">
        {[
          { v: "1L+", l: "Happy users" },
          { v: "4.8", l: "Rating" },
          { v: "31K+", l: "Lessons" },
        ].map((s) => (
          <div key={s.l}>
            <div className="bg-gradient-to-r from-[#f59e0b] to-[#00e3fd] bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
              {s.v}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── 7. Pricing ───────────────────────── */

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

function Pricing() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-8">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-14 max-w-3xl text-center text-3xl font-extrabold leading-tight text-heading md:text-5xl"
      >
        Tutor-level results,
        <br />
        no tutor-level fees
      </motion.h2>

      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        {/* English Connection */}
        <Reveal>
          <div className="relative rounded-3xl bg-gradient-to-br from-[#f59e0b] via-[#f97316] to-[#ea580c] p-8 text-white shadow-[0_30px_60px_-25px_rgba(249,115,22,0.7)]">
            <div className="text-2xl font-bold">English Connection</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold">₹399</span>
              <span className="text-lg opacity-80">/ month</span>
            </div>
            <ul className="mt-7 space-y-4">
              {EC_ROWS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7CFFB3]">
                    <Check className="h-3 w-3 text-[#0b0e14]" strokeWidth={3} />
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#6b4cff] shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#f97316]"
            >
              Open the webapp <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        {/* Private tutor */}
        <Reveal>
          <div className="c-box h-full rounded-3xl p-8">
            <div className="text-2xl font-bold text-muted-foreground">
              Private tutor
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-[#ff6c95]">
                ₹8,000
              </span>
              <span className="text-lg text-muted-foreground">/ month</span>
            </div>
            <ul className="mt-7 space-y-4">
              {TUTOR_ROWS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm text-body">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff6c95]">
                    <X className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 8. Final CTA ───────────────────────── */

function FinalCTA() {
  return (
    <section className="mx-auto flex max-w-[1280px] flex-col items-center px-5 py-24 text-center md:px-8 md:py-32">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        <Image
          src="/mascots/happy.svg"
          alt=""
          width={140}
          height={140}
          className="h-32 w-32 drop-shadow-[0_15px_30px_rgba(249,115,22,0.4)]"
          aria-hidden
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 text-4xl font-extrabold text-heading md:text-6xl"
      >
        So, are you ready?
      </motion.h2>

      {/* Webapp primary CTA */}
      <Link
        href="/signup"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-9 py-4 text-base font-bold text-[#0b0e14] shadow-[0_15px_40px_rgba(249,115,22,0.4)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Open the webapp <ArrowRight className="h-5 w-5" />
      </Link>

      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
        Or download the app
      </p>

      {/* Secondary app store buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#"
          className="inline-flex items-center gap-3 rounded-xl bg-[#0b0e14] px-5 py-3 text-white ring-1 ring-white/10 transition-colors hover:bg-[#15181f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <GooglePlayLogo className="h-6 w-6" />
          <div className="text-left leading-tight">
            <div className="text-[10px] opacity-70">GET IT ON</div>
            <div className="text-sm font-bold">Google Play</div>
          </div>
        </a>
        <a
          href="#"
          className="inline-flex items-center gap-3 rounded-xl bg-[#0b0e14] px-5 py-3 text-white ring-1 ring-white/10 transition-colors hover:bg-[#15181f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <AppleLogo className="h-6 w-6" />
          <div className="text-left leading-tight">
            <div className="text-[10px] opacity-70">Download on the</div>
            <div className="text-sm font-bold">App Store</div>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ───────────────────────── 9. Footer ───────────────────────── */

function LandingFooter() {
  return (
    <footer className="c-box border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="English Connection"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-heading">English Connection</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-body">
            Your AI English coach — built for India&rsquo;s ambitious learners.
          </p>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-heading">
            Webapp
          </div>
          <ul className="mt-4 space-y-2 text-sm text-body">
            <li>
              <Link href="/signup" className="hover:text-heading">
                Open dashboard
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-heading">
                Log in
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-heading">
                Practice library
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-heading">
                Leaderboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-heading">
            Company
          </div>
          <ul className="mt-4 space-y-2 text-sm text-body">
            <li>
              <Link href="#" className="hover:text-heading">
                About
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-heading">
                Updates
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-heading">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-heading">
                Terms
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-heading">
            Get the app
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b0e14] px-3 py-2 text-xs text-white ring-1 ring-white/10 transition-colors hover:bg-[#15181f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <GooglePlayLogo className="h-4 w-4" />
              <span>
                <span className="opacity-70">Get it on</span>{" "}
                <span className="font-bold">Google Play</span>
              </span>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b0e14] px-3 py-2 text-xs text-white ring-1 ring-white/10 transition-colors hover:bg-[#15181f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <AppleLogo className="h-4 w-4" />
              <span>
                <span className="opacity-70">Download on</span>{" "}
                <span className="font-bold">App Store</span>
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground md:px-8">
          <span>© 2026 English Connection · Built for India&rsquo;s ambitious learners</span>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── Brand glyphs ───────────────────────── */
// Real store wordmark icons — replace the earlier placeholder Sparkles icon so
// the app-store buttons read as genuine store badges (UI checklist: no stand-in
// icons). Decorative, so aria-hidden; the adjacent text labels carry meaning.

function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" aria-hidden className={className} fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
    </svg>
  );
}

function GooglePlayLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={className}>
      <path fill="#00d4ff" d="M48 59.5c-3.2 3.4-5 8.7-5 15.6v362c0 6.9 1.8 12.2 5 15.6l1.2 1.2 202.9-202.9v-4.8L49.2 58.3 48 59.5z" />
      <path fill="#ffd400" d="M319.7 324.6l-67.6-67.6v-4.8l67.6-67.6 1.5.9 80.1 45.5c22.9 13 22.9 34.3 0 47.3l-80.1 45.5-1.5.8z" />
      <path fill="#ff3333" d="M321.2 323.7L252.1 254.6 48 458.7c7.5 8 20 9 34.1 1l239.1-136z" />
      <path fill="#48ff48" d="M321.2 185.5L82.1 49.6C68 41.5 55.5 42.5 48 50.5l204.1 204.1 69.1-69.1z" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, type ComponentType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { CONTACT_NUMBERS, telLink, formatNumber } from "@/config/contact";
import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { KaiFigure } from "@/components/landing/KaiFigure";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import { MascotEmotionMarquee } from "@/components/landing/MascotEmotionMarquee";
import PlatformInsights from "@/components/landing/PlatformInsights";
import AccountChip from "@/components/layout/AccountChip";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ShowcaseV4() {
  const root = useRef<HTMLDivElement>(null);
  const stepsSection = useRef<HTMLDivElement>(null);
  const stepsTrack = useRef<HTMLDivElement>(null);
  const reviewsSection = useRef<HTMLDivElement>(null);
  const reviewsViewport = useRef<HTMLDivElement>(null);
  const reviewsTrack = useRef<HTMLDivElement>(null);

  // ── Progress scrubber: tracks the whole film via window scroll ──
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  const reduced = useReducedMotion();
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    reduced ? [] : [Autoplay({ delay: 2400, stopOnInteraction: false, stopOnMouseEnter: true })],
  );

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const conditions = (ctx.conditions ?? {}) as Record<string, boolean>;
          const isDesktop = !!conditions.isDesktop;
          const reduce = !!conditions.reduce;

          // Generic fade-up reveals run in BOTH modes (content always ends visible).
          makeReveals(scope, reduce);

          // ── REDUCED MOTION: no pin/scrub/horizontal. Plain fade-ups. ──
          if (reduce) {
            gsap.from(".v4-tagline", {
              opacity: 0,
              y: 10,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: { trigger: ".v4-tagline", start: "top 85%", once: true },
            });
            gsap.utils.toArray<HTMLElement>(".v4-step-panel", scope).forEach((p) =>
              gsap.from(p, {
                opacity: 0,
                y: 16,
                duration: 0.5,
                ease: "power2.out",
                scrollTrigger: { trigger: p, start: "top 85%", once: true },
              }),
            );
            return;
          }

          // ── FULL MOTION ──

          // Hero choreographed page-load timeline
          gsap.set(".v4-mask-line", { yPercent: 115 });
          gsap.set([".v4-hero-eyebrow", ".v4-hero-stat", ".v4-hero-cta"], { autoAlpha: 0, y: 22 });
          gsap.set(".v4-hero-demo", { autoAlpha: 0, x: 70, y: 24 });
          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          intro
            .to(".v4-hero-eyebrow", { autoAlpha: 1, y: 0, duration: 0.5 })
            .to(".v4-mask-line", { yPercent: 0, duration: 0.95, stagger: 0.12, ease: "expo.out" }, "-=0.2")
            .to(".v4-hero-stat", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.5")
            .to(".v4-hero-cta", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.35")
            .to(".v4-hero-demo", { autoAlpha: 1, x: 0, y: 0, duration: 1.0, ease: "expo.out" }, "-=0.8");

          // Tagline: masked word-by-word reveal
          gsap.from(".v4-tagline-word", {
            yPercent: 120,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.05,
            scrollTrigger: { trigger: ".v4-tagline", start: "top 72%", once: true },
          });

          // 3 STEPS — desktop: pinned horizontal act; mobile: stacked fade-up
          const sec = stepsSection.current;
          const track = stepsTrack.current;
          if (isDesktop && sec && track) {
            const horiz = gsap.to(track, {
              x: () => -(track.scrollWidth - sec.clientWidth),
              ease: "none",
              scrollTrigger: {
                trigger: sec,
                start: "top top",
                end: () => "+=" + (track.scrollWidth - sec.clientWidth),
                pin: true,
                scrub: 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });
            gsap.utils.toArray<HTMLElement>(".v4-step-panel", track).forEach((panel) => {
              const meta = panel.querySelector<HTMLElement>(".v4-step-meta");
              if (meta) {
                gsap.fromTo(
                  meta,
                  { yPercent: 14 },
                  {
                    yPercent: -14,
                    ease: "none",
                    scrollTrigger: {
                      trigger: panel,
                      containerAnimation: horiz,
                      start: "left right",
                      end: "right left",
                      scrub: true,
                    },
                  },
                );
              }
            });
          } else {
            gsap.utils.toArray<HTMLElement>(".v4-step-panel", scope).forEach((p) =>
              gsap.from(p, {
                opacity: 0,
                y: 28,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: { trigger: p, start: "top 82%", once: true },
              }),
            );
          }

          // Reviews scrub past horizontally (non-pinned, clipped)
          const rsec = reviewsSection.current;
          const rtrack = reviewsTrack.current;
          const rview = reviewsViewport.current;
          if (rsec && rtrack && rview) {
            gsap.fromTo(
              rtrack,
              { x: 0 },
              {
                x: () => -(rtrack.scrollWidth - rview.clientWidth),
                ease: "none",
                scrollTrigger: { trigger: rsec, start: "top 65%", end: "bottom top", scrub: 1, invalidateOnRefresh: true },
              },
            );
          }

          // Stats count up on enter
          gsap.utils.toArray<HTMLElement>("[data-count]", scope).forEach(countUp);
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="force-dark relative min-h-screen overflow-x-hidden bg-[#18181c] font-body text-body antialiased">
      <style>{STYLES}</style>

      {/* Cinematic dark-stage backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="v4-float absolute -left-32 top-24 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="v4-pulse absolute right-[-10%] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#00e3fd]/8 blur-[140px]" />
        <div className="v4-float absolute bottom-24 left-1/3 h-80 w-80 rounded-full bg-[#b79fff]/8 blur-[130px]" />

        {/* Extra ambient fill up top — warm blurred bubbles + soft light streaks
            so the hero never reads as empty dark space. */}
        <div className="v4-float absolute left-1/3 -top-16 h-72 w-72 rounded-full bg-[#f97316]/12 blur-[120px]" />
        <div className="v4-pulse absolute left-[12%] top-[14%] h-64 w-64 rounded-full bg-[#f59e0b]/10 blur-[110px]" />
        <div className="v4-float absolute right-1/3 -top-10 h-80 w-80 rounded-full bg-[#fb923c]/8 blur-[130px]" />
        <div className="absolute left-[18%] -top-10 h-72 w-px rotate-[20deg] bg-gradient-to-b from-transparent via-white/15 to-transparent blur-[2px]" />
        <div className="absolute left-[42%] -top-16 h-80 w-px rotate-[12deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-[2px]" />
        <div className="absolute right-[26%] -top-12 h-72 w-px -rotate-[16deg] bg-gradient-to-b from-transparent via-[#f59e0b]/25 to-transparent blur-[2px]" />
      </div>

      {/* Fixed top: progress scrubber + nav */}
      <div className="fixed inset-x-0 top-0 z-50">
        <motion.div
          aria-hidden="true"
          className="v4-progress h-[3px] w-full origin-left bg-gradient-to-r from-[#f59e0b] to-[#f97316]"
          style={{ scaleX, transformOrigin: "0% 50%" }}
        />
        <nav className="flex items-center justify-between gap-2 border-b border-white/[0.04] bg-[#18181c]/75 px-3 py-2 backdrop-blur-md sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/" className={`group flex shrink-0 items-center gap-2.5 ${FOCUS} rounded-full`}>
              <span className="inline-flex">
                <Image src="/logo.svg" alt="English Connection logo" width={34} height={34} className="h-[34px] w-[34px]" />
              </span>
              <span className="text-base font-bold text-heading transition-colors group-hover:text-primary sm:text-lg">
                English Connection
              </span>
            </Link>
          </div>
          <AccountChip size="sm" />
        </nav>
      </div>

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center gap-10 px-5 pb-16 pt-28 lg:flex-row lg:gap-12 lg:pt-32">
        <div className="w-full lg:flex-1">
          <h1 className="v4-kinetic text-4xl font-extrabold leading-[1.05] tracking-tight text-heading sm:text-5xl lg:text-6xl">
            <span className="v4-mask">
              <span className="v4-mask-line block">English Connection,</span>
            </span>
            <span className="v4-mask">
              <span className="v4-mask-line block">
                your{" "}
                <span className="bg-gradient-to-r from-[#f59e0b] to-[#f97316] bg-clip-text text-transparent">
                  AI English coach
                </span>
              </span>
            </span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="v4-hero-stat flex items-center gap-2">
              <Stars />
              <span className="text-sm font-semibold text-heading">
                <span data-count="4.9" data-decimals="1">4.9</span> rating
              </span>
            </div>
            <div className="v4-hero-stat text-sm font-semibold text-heading">
              1,00,000+ <span className="text-body">learners</span>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={`v4-hero-cta ${BTN_PRIMARY}`}>
              Open webapp <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={`v4-hero-cta ${BTN_SECONDARY}`}>
              I already have an account
            </Link>
          </div>
        </div>

        <div className="v4-hero-demo relative w-full lg:flex-1">
          <div className="mx-auto flex h-[520px] w-full max-w-[440px] sm:h-[560px]">
            <KaiFigure />
          </div>
        </div>
      </section>

      {/* ───────────────────────── BIG TAGLINE ───────────────────────── */}
      <section className="v4-tagline mx-auto max-w-5xl px-5 py-24 text-center sm:py-32">
        <h2 className="v4-kinetic text-3xl font-extrabold leading-tight tracking-tight text-heading sm:text-5xl lg:text-6xl">
          {"English learning has never been this fun.".split(" ").map((word, i) => (
            <span key={i} className="v4-mask-inline mr-[0.28em]">
              <span className="v4-tagline-word inline-block">{word}</span>
            </span>
          ))}
        </h2>
      </section>

      {/* ───────────────────────── 3 STEPS (pinned horizontal act) ───────────────────────── */}
      <section ref={stepsSection} className="v4-steps-section relative lg:h-screen lg:overflow-hidden">
        <div ref={stepsTrack} className="v4-steps-track flex flex-col lg:h-screen lg:flex-row">
          {STEPS.map((s) => (
            <article
              key={s.n}
              className="v4-step-panel flex w-full shrink-0 flex-col items-center justify-center gap-8 px-6 py-20 lg:h-screen lg:w-screen lg:flex-row lg:gap-16 lg:px-20"
            >
              <div className="v4-step-meta w-full max-w-md lg:flex-1">
                <span className="v4-kinetic block text-7xl font-bold text-primary/30 lg:text-8xl">{s.n}</span>
                <span className="v4-kinetic mt-2 block text-sm font-bold uppercase tracking-[0.22em] text-primary sm:text-base">
                  {s.label}
                </span>
                <h3 className="mt-1 text-2xl font-extrabold leading-tight text-heading sm:text-3xl lg:text-4xl">
                  {s.title}
                </h3>
                <Link href="/signup" className={`mt-6 ${BTN_PRIMARY}`}>
                  Try now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex w-full max-w-[560px] justify-center lg:flex-1">
                <div className="relative flex h-[520px] w-full max-w-[520px] sm:h-[560px]">
                  <div className="v4-pulse absolute -inset-5 -z-10 rounded-[40px] bg-primary/10 blur-3xl" />
                  <s.Demo />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────────────────── MASCOT EMOTIONS ───────────────────────── */}
      <section data-reveal className="mx-auto max-w-6xl px-5 py-16">
        <MascotEmotionMarquee />
      </section>

      {/* ───────── LESSON CAROUSEL (hidden — curated content not ready yet) ───────── */}
      <section className="mx-auto hidden max-w-7xl px-5 py-20">
        <div data-reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <ComingSoonBadge />
          <h2 className="v4-kinetic mt-4 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
            Endless lessons, picked just for you
          </h2>
          <p className="mt-3 text-body">Daily curated content tuned to what you struggle with most.</p>
        </div>
        <div data-reveal className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y pr-4">
            {LESSONS.map((l) => (
              <div key={l.title} className="min-w-0 flex-[0_0_85%] pl-4 sm:flex-[0_0_52%] lg:flex-[0_0_380px]">
                <div className="group flex h-full min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-1 p-7 transition-transform duration-300 hover:-translate-y-1.5">
                  <span className={`text-xs font-bold uppercase tracking-[0.18em] ${l.color}`}>{l.tag}</span>
                  <h4 className="mt-3 text-xl font-bold leading-snug text-heading">{l.title}</h4>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-body transition-colors group-hover:text-primary">
                    Talk about this in English
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── WHY BENTO ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <h2 data-reveal className="v4-kinetic text-center text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
          Why English Connection?
        </h2>
        <p data-reveal className="mx-auto mt-3 max-w-2xl text-center text-body">
          A peek inside — track your XP, level and streak, climb the leaderboard, and get the
          coaching that keeps you improving.
        </p>
        <div data-reveal className="mt-10">
          <PlatformInsights />
        </div>
      </section>

      {/* ───────────────────────── REVIEWS (horizontal scrub) ───────────────────────── */}
      <section ref={reviewsSection} className="py-20">
        <h2 data-reveal className="v4-kinetic mx-auto max-w-3xl px-5 text-center text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
          Speak English with confidence
        </h2>
        <div ref={reviewsViewport} className="v4-reviews-viewport mt-12 overflow-hidden">
          <div ref={reviewsTrack} className="v4-reviews-track flex gap-5 px-6 lg:px-12">
            {REVIEWS.map((r) => (
              <article
                key={r.name}
                className="v4-review-card flex w-[280px] shrink-0 flex-col gap-4 rounded-2xl border border-white/[0.06] bg-surface-1 p-6 sm:w-[340px]"
              >
                <Stars />
                <p className="text-sm leading-relaxed text-body">{r.body}</p>
                <div className="mt-auto">
                  <div className="text-sm font-bold text-heading">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div data-reveal className="mx-auto mt-12 grid max-w-md grid-cols-2 gap-4 px-5 text-center">
          {REVIEW_STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
              <div
                className="v4-kinetic text-3xl font-bold text-primary sm:text-4xl"
                data-count={s.count}
                data-suffix={s.suffix ?? ""}
                data-decimals={s.decimals ?? "0"}
              >
                {s.count}
                {s.suffix ?? ""}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── FINAL CTA ───────────────────────── */}
      <section data-reveal className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h2 className="v4-kinetic text-4xl font-extrabold tracking-tight text-heading sm:text-5xl">So, are you ready?</h2>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link href="/signup" className={BTN_PRIMARY}>
            Open the webapp <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-body">Or download the app</p>
            <ComingSoonBadge />
          </div>
          <div className="flex flex-col gap-3 opacity-60 sm:flex-row">
            <StoreButton kind="play" />
            <StoreButton kind="apple" />
          </div>
        </div>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-surface-1/40">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex">
                  <Image src="/logo.svg" alt="English Connection logo" width={26} height={26} className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold text-heading">English Connection</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-body">
                Your AI English coach — built for India&apos;s ambitious learners.
              </p>
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reach us
                </p>
                <p className="mt-1 text-xs text-body">Call, text, or WhatsApp us:</p>
                <div className="mt-2 space-y-1">
                  {CONTACT_NUMBERS.map((n) => (
                    <a
                      key={n}
                      href={telLink(n)}
                      className="block text-sm font-semibold text-heading hover:text-primary"
                    >
                      {formatNumber(n)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <FooterCol title="Webapp" links={FOOTER_WEBAPP} />
            <FooterCol title="Company" links={FOOTER_COMPANY} />
            <FooterCol title="Get the app" links={FOOTER_APP} />
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 English Connection · Built for India&apos;s ambitious learners</span>
            <span>Made by Bharatrix Pvt. Ltd.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181c]";

const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-6 py-3 text-sm font-bold text-[#0b0e14] shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.03] active:scale-95 ${FOCUS}`;

const BTN_SECONDARY = `inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-surface-2/60 px-6 py-3 text-sm font-semibold text-heading transition-colors hover:bg-surface-2 ${FOCUS}`;

const STEPS: { n: string; label: string; title: string; Demo: ComponentType }[] = [
  { n: "01", label: "AI Partner", title: "Talk it out with your AI partner", Demo: AiPartnerDemo },
  { n: "02", label: "Jumble Words", title: "Rebuild real sentences in Jumble Words", Demo: JumbleDemo },
  { n: "03", label: "Pronunciation Agent", title: "Speak, then see exactly what to fix", Demo: PronunciationDemo },
];

const LESSONS: { tag: string; title: string; color: string }[] = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?", color: "text-primary-1" },
  { tag: "CULTURE", title: "How British tea became a ritual", color: "text-cyan" },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk", color: "text-secondary-1" },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind", color: "text-pink" },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk", color: "text-primary" },
  { tag: "WELLNESS", title: "Why your accent never fully disappears", color: "text-cyan" },
  { tag: "NEWS", title: "When AI rewrote the office", color: "text-primary-1" },
];

const REVIEW_STATS: { count: string; suffix?: string; decimals?: string; label: string }[] = [
  { count: "1", suffix: "L+", label: "Happy users" },
  { count: "4.9", decimals: "1", label: "Rating" },
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

const FOOTER_WEBAPP = [
  { label: "Open dashboard", href: "/signup" },
  { label: "Log in", href: "/login" },
  { label: "Practice library", href: "#" },
  { label: "Leaderboard", href: "#" },
];

const FOOTER_COMPANY = [
  { label: "About", href: "/about" },
  { label: "Updates", href: "/updates" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const FOOTER_APP = [
  { label: "Google Play", href: "https://play.google.com/" },
  { label: "App Store", href: "https://www.apple.com/app-store/" },
];

function makeReveals(scope: HTMLElement, reduce: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-reveal]", scope).forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: reduce ? 8 : 28,
      duration: reduce ? 0.4 : 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count ?? "0");
  const decimals = Number(el.dataset.decimals ?? "0");
  const suffix = el.dataset.suffix ?? "";
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 1.4,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
    onUpdate: () => {
      el.textContent = obj.v.toFixed(decimals) + suffix;
    },
  });
}

function Stars() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current text-[#f59e0b]" aria-hidden="true" />
      ))}
    </span>
  );
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
      <Sparkles className="h-3 w-3" aria-hidden="true" /> Coming soon
    </span>
  );
}

function StoreButton({ kind }: { kind: "play" | "apple" }) {
  const isApple = kind === "apple";
  return (
    <a
      href={isApple ? "https://www.apple.com/app-store/" : "https://play.google.com/"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isApple ? "Download on the App Store" : "Get it on Google Play"}
      className={`inline-flex items-center gap-3 rounded-xl border border-white/10 bg-surface-2/60 px-5 py-3 transition-colors hover:bg-surface-2 ${FOCUS}`}
    >
      {isApple ? (
        <svg viewBox="0 0 384 512" className="h-6 w-6 fill-heading" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 512 512" className="h-6 w-6" aria-hidden="true">
          <path d="M48 24v464l232-232z" fill="#f59e0b" />
          <path d="M48 24l232 232 80-80z" fill="#00e3fd" />
          <path d="M48 488l232-232 80 80z" fill="#ff6c95" />
          <path d="M360 176l80 80-80 80 64-40c24-15 24-65 0-80z" fill="#f97316" />
        </svg>
      )}
      <span className="text-left">
        <span className="block text-[10px] text-muted-foreground">{isApple ? "Download on the" : "Get it on"}</span>
        <span className="block text-sm font-bold text-heading">{isApple ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-heading">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className={`rounded text-sm text-body transition-colors hover:text-primary ${FOCUS}`}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
.v4-kinetic { font-family: 'Space Grotesk', var(--font-display, 'Plus Jakarta Sans'), sans-serif; }
.v4-mask { display: block; overflow: hidden; }
.v4-mask-inline { display: inline-block; overflow: hidden; vertical-align: bottom; }
@keyframes v4-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes v4-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes v4-pulse { 0%,100% { opacity: .5; } 50% { opacity: .95; } }
.v4-float { animation: v4-float 7s ease-in-out infinite; }
.v4-bob { animation: v4-bob 3.2s ease-in-out infinite; }
.v4-pulse { animation: v4-pulse 4s ease-in-out infinite; }
@media (min-width: 400px) { .xs\\:inline { display: inline; } .xs\\:hidden { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .v4-float, .v4-bob, .v4-pulse { animation: none !important; }
  .v4-steps-track { flex-direction: column !important; height: auto !important; transform: none !important; }
  .v4-steps-section { height: auto !important; overflow: visible !important; }
  .v4-step-panel { width: 100% !important; height: auto !important; }
  .v4-reviews-track { flex-wrap: wrap !important; transform: none !important; justify-content: center; }
  .v4-reviews-viewport { overflow: visible !important; }
}
`;

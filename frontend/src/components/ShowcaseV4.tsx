import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Coffee,
  GraduationCap,
  MessageCircle,
  Mic,
  Plane,
  Sparkles,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";

import { CONTACT_NUMBERS, telLink, formatNumber } from "@/config/contact";
import {
  AI_PARTNER_LANGUAGES,
  AI_PARTNER_LEVELS,
  AI_PARTNER_SCENARIOS,
  AI_PARTNER_VOICES,
} from "@/lib/aiPartnerOptions";
import AccountChip from "@/components/layout/AccountChip";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { KaiFigure } from "@/components/landing/KaiFigure";
import { LazyDemo, type LazyDemoKind } from "@/components/landing/LazyDemos";
import { MascotEmotionMarquee } from "@/components/landing/MascotEmotionMarquee";
import PlatformInsights from "@/components/landing/PlatformInsights";
import { ReviewsSwipe, StepsSwipe } from "@/components/landing/ScrollSwipe";
import { LANDING_CSS } from "@/components/landing/landingStyles";

// The public landing page (rendered by app/page.tsx for logged-out visitors).
//
// Editorial layout — big confident type, asymmetric/bento sections, the real
// product UI in frosted-glass frames — over a softly lit gradient stage, in
// BOTH themes (follows the next-themes toggle: orange on dark, Lumina blue on
// light). Copy is specific and product-true: the Hindi/Tamil/… phrases are
// K.AI's own (server/gemini/tutorPrompt.ts), the "WENZ-day" respelling is the
// Pronunciation Coach's syllables/native-script output (server/gemini/scoring.ts).
//
// A Server Component on purpose: static content ships as plain HTML. Client
// code is limited to the nav (theme toggle + account chip), the lazily mounted
// demos (landing/LazyDemos) and the two scroll swipes (landing/ScrollSwipe —
// GSAP is imported on demand, never for reduced motion). Everything else
// animates with CSS (landing/landingStyles).

// Display face for the big headings — self-hosted by next/font (no render-
// blocking Google Fonts @import), exposed as --ff-kinetic.
const kinetic = Space_Grotesk({ subsets: ["latin"], variable: "--ff-kinetic", display: "swap" });

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const INDIAN_LANGUAGES = AI_PARTNER_LANGUAGES.length - 1; // minus "English only"

export default function ShowcaseV4() {
  return (
    <div
      className={`lp ${kinetic.variable} relative isolate min-h-dvh overflow-x-clip bg-background font-body text-body antialiased`}
    >
      <style>{LANDING_CSS}</style>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-surface-1 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-heading"
      >
        Skip to content
      </a>

      {/* Ambient stage: a few soft radial "orbs" + a faint grid near the top. */}
      <div aria-hidden="true" className="lp-bg">
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-orb lp-orb-c" />
        <div className="lp-orb lp-orb-d" />
        <div className="lp-grid" />
      </div>

      {/* ───────────────────────── NAV (frosted, floating) ───────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="lp-progress" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-5">
          <nav
            aria-label="Main"
            className="lp-glass-strong lp-blur flex h-16 items-center justify-between gap-2 rounded-2xl px-2 sm:px-3"
          >
            <Link
              href="/"
              aria-label="English Connection — home"
              className="group flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 rounded-xl px-1"
            >
              <Image src="/logo.svg" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
              <span className="hidden text-lg font-bold text-heading transition-colors duration-200 group-hover:text-primary sm:inline">
                English Connection
              </span>
            </Link>
            <ul className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-body transition-colors duration-200 hover:bg-heading/5 hover:text-heading"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="lp-nav-tools flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <AccountChip size="sm" />
            </div>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* ───────────────────────── HERO ───────────────────────── */}
        <section
          aria-labelledby="hero-title"
          className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-28 sm:pt-36 lg:min-h-[100svh] lg:grid-cols-12 lg:gap-8 lg:pb-20"
        >
          <div className="lg:col-span-7">
            <p className="lp-rise text-xs font-bold uppercase tracking-[0.16em] text-primary sm:text-sm sm:tracking-[0.24em]">
              English Connection · K.AI voice tutor
            </p>
            <h1
              id="hero-title"
              className="lp-kinetic mt-5 text-[3.1rem] font-bold leading-[0.98] text-heading min-[400px]:text-[3.5rem] sm:text-7xl lg:text-[5.6rem]"
            >
              {/* One masked block (not per-line spans) so phones wrap it naturally. */}
              <span className="lp-mask">
                <span>
                  Speak English with a tutor that <span className="lp-grad-text">talks back.</span>
                </span>
              </span>
            </h1>
            <p className="lp-rise mt-7 max-w-xl text-lg leading-relaxed text-body sm:text-xl" style={delay(140)}>
              Just talk. K.AI answers out loud, captions both of you, and fixes your grammar
              mid-conversation — in English, or mixed with Hindi, Tamil, Bengali and {INDIAN_LANGUAGES - 3}{" "}
              more Indian languages.
            </p>
            <div className="lp-rise mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6" style={delay(200)}>
              <Link href="/signup" className="lp-btn lp-btn-primary px-7">
                Start talking — free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full text-sm font-semibold text-heading underline decoration-heading/25 underline-offset-4 transition-colors duration-200 hover:decoration-primary"
              >
                I already have an account
              </Link>
            </div>
            <p className="lp-rise mt-5 text-sm text-body" style={delay(240)}>
              20 free minutes with K.AI every week · Sign in with Google or email
            </p>
            <div
              className="lp-rise mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6"
              style={delay(280)}
            >
              <div className="flex items-center gap-2">
                <Stars />
                <span className="text-sm font-semibold text-heading">4.9 rating</span>
              </div>
              <span className="h-4 w-px bg-heading/15" aria-hidden="true" />
              <div className="text-sm font-semibold text-heading">
                1,00,000+ <span className="font-medium text-body">learners</span>
              </div>
            </div>
          </div>

          <HeroVisual />
        </section>

        {/* ───────────────────────── BENTO: what a fix looks like ───────────────────────── */}
        <section id="features" aria-labelledby="fix-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <h2
              id="fix-title"
              className="lp-kinetic lp-reveal text-4xl font-bold leading-[1.02] text-heading sm:text-6xl lg:col-span-7"
            >
              Every mistake comes back as a fix you can use.
            </h2>
            <p className="lp-reveal text-base leading-relaxed text-body sm:text-lg lg:col-span-5">
              Grammar, pronunciation, word order — you don&apos;t just get marked wrong. You see the right
              version, why it&apos;s right, and you say it again.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            {/* Pronunciation — the big tile */}
            <article className="lp-glass lp-reveal relative overflow-hidden rounded-[28px] p-6 sm:p-8 md:col-span-4 md:row-span-2">
              <TileLabel>Pronunciation Coach</TileLabel>
              <p className="lp-kinetic mt-8 text-[3.4rem] font-bold leading-none text-heading min-[400px]:text-6xl sm:text-8xl">
                Wednesday
              </p>
              <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-3">
                <p className="lp-kinetic text-3xl font-bold text-primary sm:text-4xl">
                  WENZ<span className="text-body">-day</span>
                </p>
                <p className="text-2xl font-semibold text-heading sm:text-3xl" lang="hi">
                  वेन्ज़-डे
                </p>
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_250px] lg:items-end">
                <p className="max-w-md text-sm leading-relaxed text-body sm:text-base">
                  Every word you read aloud gets a verdict, the stressed syllable in capitals, and the same sounds
                  spelled in your own script. An Indian accent is fine — only sounds that change the word are
                  flagged.
                </p>
                <div className="rounded-2xl border border-border bg-surface-2/70 p-4">
                  <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                    Needs work
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-heading">
                    You said &ldquo;wed-nes-day&rdquo;. Say &ldquo;WENZ-day&rdquo; — the first d is silent.
                  </p>
                </div>
              </div>
            </article>

            {/* Jumble */}
            <article className="lp-glass lp-reveal rounded-[28px] p-6 md:col-span-2">
              <TileLabel>Jumble Words</TileLabel>
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Scrambled words">
                {["worked", "I", "bank", "have", "a", "in"].map((w) => (
                  <li
                    key={w}
                    className="rounded-lg border border-border bg-surface-2/70 px-2.5 py-1.5 text-sm font-semibold text-heading"
                  >
                    {w}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-2 text-base font-bold text-heading">
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />I have worked in a bank.
              </p>
              <p className="mt-3 text-sm text-body">Tap the words into order. Stuck? The coach drops a hint.</p>
            </article>

            {/* Talk time */}
            <article className="lp-glass lp-reveal rounded-[28px] p-6 md:col-span-2">
              <TileLabel>AI Partner</TileLabel>
              <p className="lp-kinetic mt-4 text-6xl font-bold leading-none text-heading">
                20<span className="ml-1 text-2xl text-body">min</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-body">
                of free conversation with K.AI every week — with XP for every minute you talk. Pro makes it 20
                minutes every day.
              </p>
            </article>

            {/* Corrections in your language */}
            <article className="lp-glass lp-reveal rounded-[28px] p-6 sm:p-8 md:col-span-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <TileLabel>Mixed-language mode</TileLabel>
                  <p className="mt-3 max-w-xl text-lg font-semibold leading-snug text-heading sm:text-xl">
                    &ldquo;One small correction&rdquo; — in the language you think in.
                  </p>
                </div>
                <p className="max-w-sm text-sm text-body">About 70% English, 30% yours, always in Roman script.</p>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {CORRECTION_PHRASES.map((p) => (
                  <li
                    key={p.lang}
                    className="inline-flex items-baseline gap-2 rounded-full border border-border bg-surface-2/60 px-4 py-2 text-sm"
                  >
                    <span className="font-semibold text-primary">{p.lang}</span>
                    <span className="text-heading">{p.line}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {/* ───────────────────────── HOW IT WORKS: the scroll swipe ───────────────────────── */}
        <section aria-labelledby="how-title" className="mx-auto max-w-7xl scroll-mt-24 px-5">
          <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
            <div className="lp-reveal lg:col-span-7">
              <TileLabel>How it works</TileLabel>
              <h2 id="how-title" className="lp-kinetic mt-3 scroll-mt-28 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                Talk. Build. Pronounce.
              </h2>
            </div>
            <p className="lp-reveal text-base leading-relaxed text-body sm:text-lg lg:col-span-5">
              Three short drills, one progress bar. Keep scrolling to watch each one run.
            </p>
          </div>
        </section>

        <section id="how-it-works" aria-label="The three drills" className="lp-swipe relative">
          <div data-swipe-track>
            {STEPS.map((s, i) => (
              <article
                key={s.id}
                id={s.id}
                data-swipe-panel
                aria-labelledby={`${s.id}-title`}
                className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:py-16 lg:py-20"
              >
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div data-col className={`lp-reveal max-w-xl ${i % 2 ? "lg:order-2" : ""}`}>
                    <div data-swipe-meta>
                      <div className="flex items-baseline gap-3">
                        <span className="lp-kinetic text-6xl font-bold text-primary/30 lg:text-7xl" aria-hidden="true">
                          {s.n}
                        </span>
                        <span className="text-sm font-bold uppercase tracking-[0.22em] text-primary">{s.label}</span>
                      </div>
                      <h3
                        id={`${s.id}-title`}
                        className="lp-kinetic mt-3 text-3xl font-bold leading-[1.05] text-heading sm:text-4xl lg:text-5xl"
                      >
                        {s.title}
                      </h3>
                      <p className="mt-5 text-base leading-relaxed text-body sm:text-lg">{s.body}</p>
                      <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-border pt-6">
                        {s.facts.map((f) => (
                          <div key={f.k}>
                            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-body">{f.k}</dt>
                            <dd className="mt-1 text-sm font-semibold leading-snug text-heading">{f.v}</dd>
                          </div>
                        ))}
                      </dl>
                      <Link href="/signup" className="lp-btn lp-btn-glass mt-8">
                        {s.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                  <div data-col className={`relative mx-auto w-full max-w-[540px] ${i % 2 ? "lg:order-1" : ""}`}>
                    <div
                      data-swipe-frame
                      className="flex h-[var(--frame-h)] w-full"
                      style={{ "--frame-h": `${s.frameH}px` } as CSSProperties}
                    >
                      <LazyDemo kind={s.kind} className="flex h-full w-full" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <StepsSwipe targetId="how-it-works" />

        {/* ───────────────────────── SET UP EACH CONVERSATION ───────────────────────── */}
        <section id="languages" aria-labelledby="setup-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lp-reveal lg:col-span-5">
              <TileLabel>Before every conversation</TileLabel>
              <h2 id="setup-title" className="lp-kinetic mt-3 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                Choose how K.AI talks to you.
              </h2>
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8">
                {SETUP_STATS.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse border-t border-border pt-4">
                    <dt className="mt-1 text-sm font-semibold text-body">{s.label}</dt>
                    <dd className="lp-kinetic text-5xl font-bold text-heading sm:text-6xl">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid gap-4 lg:col-span-7">
              <div className="lp-glass lp-reveal rounded-[28px] p-6 sm:p-8">
                <h3 className="text-lg font-bold text-heading">Language</h3>
                <p className="mt-1 text-sm text-body">English only, or English mixed with your language.</p>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Languages">
                  {AI_PARTNER_LANGUAGES.map((l) => (
                    <li
                      key={l.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-heading"
                    >
                      <span
                        aria-hidden="true"
                        className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                      >
                        {l.native}
                      </span>
                      {l.id === "English" ? "English only" : l.id}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="lp-glass lp-reveal rounded-[28px] p-6 md:col-span-3">
                  <h3 className="text-lg font-bold text-heading">Practice mode</h3>
                  <ul className="mt-4 grid gap-2.5 min-[400px]:grid-cols-2">
                    {AI_PARTNER_SCENARIOS.map((sc) => {
                      const Icon = SCENARIO_ICONS[sc.id] ?? MessageCircle;
                      return (
                        <li key={sc.id} className="flex items-center gap-2.5 text-sm font-medium text-heading">
                          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          {stripLeadingEmoji(sc.label)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="lp-glass lp-reveal rounded-[28px] p-6 md:col-span-2">
                  <h3 className="text-lg font-bold text-heading">Level &amp; voice</h3>
                  <p className="mt-3 text-sm leading-relaxed text-body">
                    {AI_PARTNER_LEVELS.map((l) => l.label).join(" · ")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-body">{VOICE_FEELS} — female and male voices.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── K.AI REACTS (mascot emotions) ───────────────────────── */}
        <section aria-labelledby="care-title" className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lp-reveal lg:col-span-7">
              <TileLabel>Made to care</TileLabel>
              <h2 id="care-title" className="lp-kinetic mt-3 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                K.AI&apos;s face moves with the conversation.
              </h2>
            </div>
            <p className="lp-reveal text-base leading-relaxed text-body sm:text-lg lg:col-span-5">
              It grins at a good answer, puzzles over a tricky one and calms you down when you&apos;re nervous.
              Tap a feeling to see it.
            </p>
          </div>
          <div className="mt-12">
            <MascotEmotionMarquee bare />
          </div>
        </section>

        {/* ───────────────────────── PROGRESS (in-app preview marquee) ───────────────────────── */}
        <section id="progress" aria-labelledby="progress-title" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 lg:grid-cols-12 lg:items-end">
            <div className="lp-reveal lg:col-span-7">
              <TileLabel>Your progress</TileLabel>
              <h2 id="progress-title" className="lp-kinetic mt-3 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                Proof you&apos;re getting better.
              </h2>
            </div>
            <p className="lp-reveal text-base leading-relaxed text-body sm:text-lg lg:col-span-5">
              XP and levels, a daily streak, badges at every milestone and a weekly leaderboard — here&apos;s the
              inside of the app.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-[1440px]">
            <PlatformInsights />
          </div>
        </section>

        {/* ───────────────────────── REVIEWS (scroll swipe) ───────────────────────── */}
        <section id="reviews" aria-labelledby="reviews-title" className="lp-reviews py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 lg:grid-cols-12 lg:items-end">
            <div className="lp-reveal lg:col-span-8">
              <TileLabel>Learners</TileLabel>
              <h2 id="reviews-title" className="lp-kinetic mt-3 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                Heard in Bengaluru, Pune, Delhi and Chennai.
              </h2>
            </div>
            <dl className="lp-reveal flex gap-3 lg:col-span-4 lg:justify-end">
              {REVIEW_STATS.map((s) => (
                <div key={s.label} className="lp-glass flex min-w-[120px] flex-col-reverse rounded-2xl px-5 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-body">{s.label}</dt>
                  <dd className="lp-kinetic text-3xl font-bold text-primary">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div data-swipe-viewport className="mt-12">
            <ul data-swipe-track aria-label="Reviews" className="flex w-max gap-5 px-5 pb-2 lg:px-12">
              {REVIEWS.map((r) => (
                <li key={r.name} className="w-[280px] shrink-0 sm:w-[340px]">
                  <figure className="lp-glass flex h-full flex-col gap-4 rounded-[28px] p-6">
                    <Stars />
                    <blockquote className="text-[0.95rem] leading-relaxed text-heading">
                      <p>&ldquo;{r.body}&rdquo;</p>
                    </blockquote>
                    <figcaption className="mt-auto flex items-center gap-3 border-t border-border pt-4">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary"
                      >
                        {r.name[0]}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-heading">{r.name}</span>
                        <span className="block text-xs text-body">{r.city}</span>
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <ReviewsSwipe targetId="reviews" />

        {/* ───────────────────────── PLANS ───────────────────────── */}
        <section id="plans" aria-labelledby="plans-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lp-reveal lg:col-span-5">
              <TileLabel>Plans</TileLabel>
              <h2 id="plans-title" className="lp-kinetic mt-3 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                20 minutes a week, free. 20 a day on Pro.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-body sm:text-lg">
                Jumble Words, Pronunciation and K.AI all work on the free plan. Pro takes the daily caps off and
                gives you K.AI every day.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              <article aria-labelledby="plan-free" className="lp-glass lp-reveal flex flex-col rounded-[28px] p-6 sm:p-8">
                <h3 id="plan-free" className="text-sm font-bold uppercase tracking-[0.2em] text-body">
                  Free
                </h3>
                <p className="lp-kinetic mt-3 text-4xl font-bold text-heading">
                  20 min<span className="text-xl text-body"> / week</span>
                </p>
                <p className="mt-1 text-sm text-body">with K.AI</p>
                <ul className="mb-8 mt-6 space-y-2.5 border-t border-border pt-5 text-sm text-heading">
                  <li>Daily Jumble Words</li>
                  <li>Daily Pronunciation practice</li>
                  <li>XP, levels, streaks &amp; badges</li>
                </ul>
                <Link href="/signup" className="lp-btn lp-btn-primary mt-auto">
                  Start talking — free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>

              <article
                aria-labelledby="plan-pro"
                className="lp-glass-strong lp-reveal relative flex flex-col rounded-[28px] p-6 ring-1 ring-primary/40 sm:p-8"
              >
                <h3 id="plan-pro" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> Pro
                </h3>
                <p className="lp-kinetic mt-3 text-4xl font-bold text-heading">
                  20 min<span className="text-xl text-body"> / day</span>
                </p>
                <p className="mt-1 text-sm text-body">with K.AI</p>
                <ul className="mb-8 mt-6 space-y-2.5 border-t border-border pt-5 text-sm text-heading">
                  <li>No daily cap on Jumble Words</li>
                  <li>No daily cap on Pronunciation</li>
                  <li>Your streak, XP &amp; badges carry over</li>
                </ul>
                <Link href="/pro" className="lp-btn lp-btn-glass mt-auto">
                  See Pro <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ───────────────────────── FINAL CTA ───────────────────────── */}
        <section aria-labelledby="ready-title" className="mx-auto max-w-7xl px-5 pb-24 pt-8">
          <div className="lp-glass-strong lp-reveal relative overflow-hidden rounded-[36px] px-6 py-14 sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full"
              style={{ background: "radial-gradient(closest-side, var(--lp-orb-a), transparent)" }}
            />
            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <h2 id="ready-title" className="lp-kinetic text-4xl font-bold leading-[1.02] text-heading sm:text-6xl">
                  Say your first sentence to K.AI today.
                </h2>
                <p className="mt-5 max-w-lg text-base text-body sm:text-lg">
                  A free account with Google or email is all it takes.
                </p>
              </div>
              <div className="flex flex-col gap-4 lg:col-span-4 lg:items-end">
                <Link href="/signup" className="lp-btn lp-btn-primary px-7">
                  Open the webapp <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-heading underline decoration-heading/25 underline-offset-4 transition-colors duration-200 hover:decoration-primary"
                >
                  Log in
                </Link>
              </div>
            </div>
            <div className="relative mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex flex-wrap items-center gap-2 text-sm text-body">
                Android and iOS apps <ComingSoonBadge />
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <StoreButton kind="play" />
                <StoreButton kind="apple" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="lp-glass rounded-none border-x-0 border-b-0">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="" width={26} height={26} className="h-6 w-6" />
                <span className="text-sm font-bold text-heading">English Connection</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-body">
                Spoken-English practice with K.AI, Jumble Words and the Pronunciation Coach.
              </p>
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-body">Reach us</p>
                <p className="mt-1 text-xs text-body">Call, text, or WhatsApp us:</p>
                <ul className="mt-1">
                  {CONTACT_NUMBERS.map((n) => (
                    <li key={n}>
                      <a
                        href={telLink(n)}
                        className="inline-flex min-h-11 items-center rounded text-sm font-semibold text-heading transition-colors duration-200 hover:text-primary"
                      >
                        {formatNumber(n)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <FooterCol title="Webapp" links={FOOTER_WEBAPP} />
            <FooterCol title="Company" links={FOOTER_COMPANY} />
            <FooterCol title="Get the app" links={FOOTER_APP} />
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-body sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 English Connection</span>
            <span>Made by Bharatrix Pvt. Ltd.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── content ───────────────────────── */

const NAV_LINKS = [
  { label: "How it works", href: "#how-title" },
  { label: "Languages", href: "#languages" },
  { label: "Plans", href: "#plans" },
];

// K.AI's own "one small correction" phrase per language (server/gemini/tutorPrompt.ts).
const CORRECTION_PHRASES = [
  { lang: "Hindi", line: "Ek choti si correction" },
  { lang: "Tamil", line: "Oru chinna correction" },
  { lang: "Bengali", line: "Ekta choto correction" },
  { lang: "Telugu", line: "Oka chinna correction" },
  { lang: "Marathi", line: "Ek chotishi correction" },
  { lang: "Gujarati", line: "Ek nani correction" },
];

// `frameH` = the demo's fixed box height (fixed so lazy mounting never shifts
// the page; on desktop the pinned swipe caps it to the viewport).
const STEPS: {
  id: string;
  n: string;
  label: string;
  title: string;
  body: string;
  facts: { k: string; v: string }[];
  cta: string;
  kind: LazyDemoKind;
  frameH: number;
}[] = [
  {
    id: "ai-partner",
    n: "01",
    label: "AI Partner",
    title: "Talk it out with K.AI.",
    body: "Pick a practice mode — casual chat, a job interview, IELTS or TOEFL, travel, the office — then just talk. K.AI replies out loud when you pause, and you can cut in any time.",
    facts: [
      { k: "Hands-free", v: "It waits while you think" },
      { k: "Captions", v: "Live, for both of you" },
      { k: "Rewards", v: "XP for every minute" },
    ],
    cta: "Talk to K.AI",
    kind: "ai",
    frameH: 580,
  },
  {
    id: "jumble-words",
    n: "02",
    label: "Jumble Words",
    title: "Build the sentence, move the train.",
    body: "Tap scrambled words into order. Every word becomes a coach — get the order right and the train leaves the station; get it wrong and it derails.",
    facts: [
      { k: "Hints", v: "From your AI coach" },
      { k: "Combo", v: "Right answers in a row" },
      { k: "Rewards", v: "XP per sentence" },
    ],
    cta: "Play Jumble Words",
    kind: "jumble",
    frameH: 600,
  },
  {
    id: "pronunciation",
    n: "03",
    label: "Pronunciation Coach",
    title: "Hear exactly where a word slipped.",
    body: "Read a sentence aloud. You get a score, a word-by-word check and a tip for each word that needs work — spelled the way it sounds.",
    facts: [
      { k: "Score", v: "For every attempt" },
      { k: "Breakdown", v: "Word by word" },
      { k: "Accent", v: "Never penalised" },
    ],
    cta: "Try it free",
    kind: "pronunciation",
    frameH: 690,
  },
];

const SETUP_STATS = [
  { value: String(INDIAN_LANGUAGES), label: "Indian languages to mix in" },
  { value: String(AI_PARTNER_SCENARIOS.length), label: "practice modes" },
  { value: String(AI_PARTNER_LEVELS.length), label: "levels" },
  { value: String(AI_PARTNER_VOICES.length), label: "voices" },
];

const SCENARIO_ICONS: Record<string, LucideIcon> = {
  "General Conversation": Coffee,
  "Job Interview": BriefcaseBusiness,
  "IELTS Speaking": GraduationCap,
  "Travel & Daily Life": Plane,
  "Office & Workplace": Building2,
  "Grammar Workout": Target,
};

// Scenario labels carry a leading emoji for the in-app picker; the landing uses
// SVG icons instead (no emoji as icons).
function stripLeadingEmoji(label: string) {
  return label.replace(/^[^\p{L}\p{N}]+/u, "");
}

// "Breezy, firm, youthful, bright and more" — straight from the voice list.
const VOICE_FEELS = (() => {
  const feels = [...new Set(AI_PARTNER_VOICES.map((v) => v.feel.toLowerCase()))].slice(0, 4);
  const text = feels.join(", ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} and more`;
})();

const REVIEW_STATS: { value: string; label: string }[] = [
  { value: "1L+", label: "Happy users" },
  { value: "4.9", label: "Rating" },
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
  { label: "How it works", href: "#how-title" },
  { label: "Plans", href: "#plans" },
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

/* ───────────────────────── pieces ───────────────────────── */

// K.AI over its glow, with one frosted live-caption card showing a real kind of
// exchange (Hindi + English mode — K.AI's actual correction phrases).
function HeroVisual() {
  return (
    <div className="lp-pop relative mx-auto w-full max-w-[460px] lg:col-span-5 lg:max-w-none" style={delay(120)}>
      <div className="relative mx-auto aspect-square w-full max-w-[460px]">
        <KaiFigure />
      </div>
      <figure
        aria-label="Example: K.AI correcting a sentence"
        className="lp-glass-strong lp-blur relative z-10 -mt-24 rounded-3xl p-4 sm:-mt-28 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Live captions
          </span>
          <span>Hindi + English · Job interview</span>
        </div>
        <div className="mt-4 space-y-2.5 text-sm leading-relaxed sm:text-[0.95rem]">
          <p className="rounded-2xl rounded-bl-md bg-surface-2/80 px-4 py-2.5 text-heading">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-body">You</span>I{" "}
            <span className="lp-slip">am work</span> in a bank since 2019.
          </p>
          <p className="rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5 text-heading">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-primary">K.AI</span>
            Ek choti si correction — &ldquo;I <span className="lp-fix">have worked</span>{" "}
            in a bank since 2019.&rdquo; Ab ek baar sahi wala boliye.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-body">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
            <Mic className="h-4 w-4" />
          </span>
          Hands-free · K.AI answers when you pause
        </div>
      </figure>
    </div>
  );
}

function TileLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{children}</p>;
}

function Stars() {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="lp-star h-4 w-4" aria-hidden="true" />
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
      aria-label={isApple ? "App Store (coming soon)" : "Google Play (coming soon)"}
      className="lp-btn-glass inline-flex min-h-12 items-center gap-3 rounded-xl px-5 py-2.5 transition-transform duration-200 hover:-translate-y-px"
    >
      {isApple ? (
        <svg viewBox="0 0 384 512" className="h-6 w-6 fill-heading" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 512 512" className="h-6 w-6" aria-hidden="true">
          <path d="M48 24v464l232-232z" fill="#f59e0b" />
          <path d="M48 24l232 232 80-80z" fill="#00b8d4" />
          <path d="M48 488l232-232 80 80z" fill="#ff6c95" />
          <path d="M360 176l80 80-80 80 64-40c24-15 24-65 0-80z" fill="#f97316" />
        </svg>
      )}
      <span className="text-left">
        <span className="block text-[10px] text-body">{isApple ? "Download on the" : "Get it on"}</span>
        <span className="block text-sm font-bold text-heading">{isApple ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-wider text-heading">{title}</h2>
      <ul className="mt-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="inline-flex min-h-11 items-center rounded text-sm text-body transition-colors duration-200 hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { ArrowRight, Sparkles, Star, Timer } from "lucide-react";

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
import { FigurePlayer } from "@/components/landing/FigurePlayer";
import { MascotEmotionMarquee } from "@/components/landing/MascotEmotionMarquee";
import { ReviewsSwipe, StepsSwipe } from "@/components/landing/ScrollSwipe";
import { LANDING_CSS } from "@/components/landing/landingStyles";
import { FIGURE_CSS } from "@/components/landing/figures/figureStyles";
import { HeroCall } from "@/components/landing/figures/HeroCall";
import { FlowDiagram } from "@/components/landing/figures/FlowDiagram";
import { CallTimeline } from "@/components/landing/figures/CallTimeline";
import { JumbleFigure } from "@/components/landing/figures/JumbleFigure";
import { PronunciationFigure } from "@/components/landing/figures/PronunciationFigure";
import { LanguageOrbit, LevelLadder, ModeGrid, VoiceBars } from "@/components/landing/figures/SetupFigures";
import { BadgeShelf, Podium, StreakDots, XpRing } from "@/components/landing/figures/ProgressFigures";
import { PlansCompare } from "@/components/landing/figures/PlansCompare";
import { Wave, cssVars } from "@/components/landing/figures/Wave";

// The public landing page (rendered by app/page.tsx for logged-out visitors).
//
// Owner's brief: explain the product with diagrams and figures, as little text
// as possible (plus: glass, light, keep the scroll swipe). So each section is one
// short heading (≤ 6 words), at most one line, and a figure that carries the
// meaning: the hero call card, the 3-step flow, a call timeline (hands-free),
// jumble chips sorting themselves, the pronunciation pipeline, the level
// staircase, the language orbit, progress widgets and a same-scale Free/Pro
// comparison. Figure labels stay ≤ 3 words; every figure has role="img" and a
// full aria-label, so screen readers still get the whole explanation.
//
// A Server Component on purpose: the figures are plain HTML/SVG animated by CSS
// (landing/figures/figureStyles). Client code is limited to the nav (theme
// toggle + account chip), FigurePlayer (starts a figure's animation when it's on
// screen), the mascot emotion picker and the two scroll swipes (landing/
// ScrollSwipe — GSAP is imported on demand, never for reduced motion).

// Display face for the big headings — self-hosted by next/font (no render-
// blocking Google Fonts @import), exposed as --ff-kinetic.
const kinetic = Space_Grotesk({ subsets: ["latin"], variable: "--ff-kinetic", display: "swap" });

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// showLearn: the Learn library is public (admin switch ON, D-042) — adds it to
// the header and footer, which also gives search engines a path to the lessons.
export default function ShowcaseV4({ showLearn = false }: { showLearn?: boolean }) {
  const navLinks = showLearn ? [...NAV_LINKS, { label: "Learn", href: "/learn" }] : NAV_LINKS;
  const webappLinks = showLearn ? [...FOOTER_WEBAPP, { label: "Learn English free", href: "/learn" }] : FOOTER_WEBAPP;
  return (
    <div
      className={`lp ${kinetic.variable} relative isolate min-h-dvh overflow-x-clip bg-background font-body text-body antialiased`}
    >
      <style>{LANDING_CSS + FIGURE_CSS}</style>
      <FigurePlayer />

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
              {navLinks.map((l) => (
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
            <p className="lp-rise inline-flex items-center gap-2 rounded-full border border-border bg-surface-1/40 px-3.5 py-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="lp-tag text-heading">Hands-free voice tutor</span>
            </p>
            <h1
              id="hero-title"
              className="lp-kinetic mt-6 text-[3.1rem] font-bold leading-[0.98] text-heading min-[400px]:text-[3.5rem] sm:text-7xl lg:text-[5.6rem]"
            >
              {/* One masked block (not per-line spans) so phones wrap it naturally. */}
              <span className="lp-mask">
                <span>
                  Speak English. <span className="lp-grad-text">K.AI talks back.</span>
                </span>
              </span>
            </h1>
            <p className="lp-rise mt-7 max-w-xl text-lg leading-relaxed text-body sm:text-xl" style={delay(140)}>
              Just talk. It answers out loud and fixes your English.
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
            <div
              className="lp-rise mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6"
              style={delay(260)}
            >
              <div className="flex items-center gap-2">
                <Stars />
                <span className="text-sm font-semibold text-heading">4.9 rating</span>
              </div>
              <span className="hidden h-4 w-px bg-heading/15 sm:block" aria-hidden="true" />
              <div className="text-sm font-semibold text-heading">
                1,00,000+ <span className="font-medium text-body">learners</span>
              </div>
              <span className="hidden h-4 w-px bg-heading/15 sm:block" aria-hidden="true" />
              <div className="flex items-center gap-1.5 text-sm font-semibold text-heading">
                <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
                20 min free <span className="font-medium text-body">/ week</span>
              </div>
            </div>
          </div>

          <div className="lp-pop relative mx-auto w-full max-w-[460px] lg:col-span-5 lg:max-w-none" style={delay(120)}>
            <div className="relative mx-auto aspect-square w-full max-w-[460px]">
              <KaiFigure />
            </div>
            <HeroCall className="relative z-10 -mt-28 sm:-mt-32" />
          </div>
        </section>

        {/* ───────────────────────── HOW IT WORKS: the loop ───────────────────────── */}
        <section id="how" aria-labelledby="how-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:py-28">
          <SectionTitle id="how-title">How it works</SectionTitle>
          <div className="lp-reveal mt-12">
            <FlowDiagram />
          </div>
        </section>

        {/* ───────────────────────── THE THREE DRILLS: the scroll swipe ───────────────────────── */}
        <section id="drills" aria-label="The three drills" className="lp-swipe relative">
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
                      <p className="mt-5 text-base leading-relaxed text-body sm:text-lg">{s.line}</p>
                      <Link href="/signup" className="lp-btn lp-btn-glass mt-8">
                        {s.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                  <div data-col className={`relative mx-auto w-full max-w-[540px] ${i % 2 ? "lg:order-1" : ""}`}>
                    <div
                      data-swipe-frame
                      className="flex w-full items-center"
                      style={{ "--frame-h": `${s.frameH}px` } as CSSProperties}
                    >
                      <s.Figure />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <StepsSwipe targetId="drills" />

        {/* ───────────────────────── SET UP EACH CALL ───────────────────────── */}
        <section aria-labelledby="setup-title" className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <SectionTitle id="setup-title">Tune K.AI before every call.</SectionTitle>
          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <SetupTile value={AI_PARTNER_LEVELS.length} label="Levels" className="lg:col-span-7">
              <LevelLadder />
            </SetupTile>
            <SetupTile
              id="languages"
              value={AI_PARTNER_LANGUAGES.length}
              label="Languages"
              className="lg:col-span-5 lg:col-start-8 lg:row-start-1"
            >
              <LanguageOrbit />
            </SetupTile>
            <SetupTile value={AI_PARTNER_SCENARIOS.length} label="Practice modes" className="lg:col-span-7">
              <ModeGrid />
            </SetupTile>
            <SetupTile value={AI_PARTNER_VOICES.length} label="Voices" className="lg:col-span-5 lg:col-start-8 lg:row-start-2">
              <VoiceBars />
            </SetupTile>
          </div>
        </section>

        {/* ───────────────────────── K.AI REACTS (mascot emotions) ───────────────────────── */}
        <section aria-labelledby="care-title" className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <SectionTitle id="care-title">K.AI reacts as you talk.</SectionTitle>
          <div className="mt-12">
            <MascotEmotionMarquee bare />
          </div>
        </section>

        {/* ───────────────────────── PROGRESS ───────────────────────── */}
        <section id="progress" aria-labelledby="progress-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:py-28">
          <SectionTitle id="progress-title">Proof you&apos;re getting better.</SectionTitle>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <ProgressTile label="XP & levels">
              <XpRing />
            </ProgressTile>
            <ProgressTile label="Daily streak">
              <StreakDots />
            </ProgressTile>
            <ProgressTile label="Badges">
              <BadgeShelf />
            </ProgressTile>
            <ProgressTile label="Weekly leaderboard">
              <Podium />
            </ProgressTile>
          </div>
        </section>

        {/* ───────────────────────── REVIEWS (scroll swipe) ───────────────────────── */}
        <section id="reviews" aria-labelledby="reviews-title" className="lp-reviews py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <SectionTitle id="reviews-title">In their own words.</SectionTitle>
            </div>
            <dl className="lp-reveal flex gap-3 lg:col-span-4 lg:justify-end">
              {REVIEW_STATS.map((s) => (
                <div key={s.label} className="lp-glass flex min-w-[120px] flex-col-reverse rounded-2xl px-5 py-3">
                  <dt className="lp-tag text-body">{s.label}</dt>
                  <dd className="lp-kinetic text-3xl font-bold text-primary">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div data-swipe-viewport className="mt-12">
            <ul data-swipe-track aria-label="Reviews" className="flex w-max gap-5 px-5 pb-2 lg:px-12">
              {REVIEWS.map((r) => (
                <li key={r.name} className="w-[280px] shrink-0 sm:w-[340px]">
                  <figure className="lp-glass flex h-full flex-col gap-5 rounded-[28px] p-6">
                    <svg viewBox="0 0 32 24" className="h-6 w-8 fill-primary/60" aria-hidden="true">
                      <path d="M0 24V14C0 6 4 1 12 0l1 4c-4 1-6 4-6 8h6v12H0zm19 0V14c0-8 4-13 12-14l1 4c-4 1-6 4-6 8h6v12H19z" />
                    </svg>
                    <blockquote className="lp-kinetic text-xl font-semibold leading-snug text-heading">
                      <p>&ldquo;{r.quote}&rdquo;</p>
                    </blockquote>
                    <figcaption className="mt-auto flex items-center gap-3 border-t border-border pt-4">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary"
                      >
                        {r.name[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-heading">{r.name}</span>
                        <span className="block text-xs text-body">{r.city}</span>
                      </span>
                      <Stars />
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
            <div className="lg:col-span-4">
              <SectionTitle id="plans-title">Start free. Talk more on Pro.</SectionTitle>
            </div>
            <div className="lg:col-span-8">
              <PlansCompare />
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
                  Say your first sentence today.
                </h2>
                <p className="mt-5 max-w-lg text-base text-body sm:text-lg">Free with Google or email.</p>
              </div>
              <div className="flex flex-col gap-4 lg:col-span-4 lg:items-end">
                <Link href="/signup" className="lp-btn lp-btn-primary px-7">
                  Open the webapp <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-heading underline decoration-heading/25 underline-offset-4 transition-colors duration-200 hover:decoration-primary"
                >
                  Log in
                </Link>
              </div>
            </div>
            {/* A voice line as the divider — the product in one shape. */}
            <div data-fig aria-hidden="true" className="relative mt-12 opacity-60">
              <Wave n={72} seed={13} live spread className="text-primary" style={cssVars({ "--wh": "40px", "--sp": "1300ms" })} />
            </div>
            <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <FooterCol title="Webapp" links={webappLinks} />
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

// The three drills in the scroll swipe. `frameH` caps the figure's box on
// desktop, where the pinned swipe fits each panel to the viewport.
const STEPS: {
  id: string;
  n: string;
  label: string;
  title: string;
  line: string;
  cta: string;
  Figure: ComponentType;
  frameH: number;
}[] = [
  {
    id: "ai-partner",
    n: "01",
    label: "AI Partner",
    title: "Talk. K.AI answers when you pause.",
    line: "Cut in anytime. The only button is mute.",
    cta: "Talk to K.AI",
    Figure: CallTimeline,
    frameH: 520,
  },
  {
    id: "jumble-words",
    n: "02",
    label: "Jumble Words",
    title: "Tap the words into order.",
    line: "Stuck? Take a hint.",
    cta: "Play Jumble Words",
    Figure: JumbleFigure,
    frameH: 520,
  },
  {
    id: "pronunciation",
    n: "03",
    label: "Pronunciation Coach",
    title: "See exactly which word slipped.",
    line: "Syllables, your own script, and a listen button.",
    cta: "Try it free",
    Figure: PronunciationFigure,
    frameH: 560,
  },
];

const REVIEW_STATS: { value: string; label: string }[] = [
  { value: "1L+", label: "Happy users" },
  { value: "4.9", label: "Rating" },
];

// Verbatim lines from the learners' reviews (the owner's existing testimonials),
// cut to the one sentence that says it — pull quotes, not paraphrases.
const REVIEWS: { name: string; city: string; quote: string }[] = [
  { name: "Priya R.", city: "Bengaluru", quote: "Way more motivating than my old class." },
  { name: "Anita K.", city: "Pune", quote: "It makes me actually speak in a structured way." },
  { name: "Mehul S.", city: "Hyderabad", quote: "Unlike other apps where I freeze, I practice naturally." },
  { name: "Rohan T.", city: "Delhi", quote: "It's the first app that finally challenges me at the right level." },
  { name: "Sneha M.", city: "Chennai", quote: "It feels like talking to a friend on the phone." },
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

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="lp-kinetic lp-reveal max-w-3xl scroll-mt-28 text-4xl font-bold leading-[1.02] text-heading sm:text-6xl"
    >
      {children}
    </h2>
  );
}

// One choice from the session start card: a big count + a figure of it.
function SetupTile({
  id,
  value,
  label,
  className,
  children,
}: {
  id?: string;
  value: number;
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className={`lp-glass lp-reveal flex scroll-mt-28 flex-col rounded-[28px] p-6 sm:p-8 ${className}`}>
      <h3 className="flex items-baseline gap-3">
        <span className="lp-kinetic text-5xl font-bold leading-none text-heading sm:text-6xl">{value}</span>
        <span className="lp-tag text-primary">{label}</span>
      </h3>
      <div className="mt-8 flex flex-1 items-center justify-center">{children}</div>
    </article>
  );
}

function ProgressTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article className="lp-glass lp-reveal flex min-w-0 flex-col rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
      <h3 className="lp-tag text-primary">{label}</h3>
      <div className="mt-5 flex min-h-[150px] flex-1 items-center justify-center sm:mt-6 sm:min-h-[210px]">{children}</div>
    </article>
  );
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
              className="inline-flex min-h-11 min-w-11 items-center rounded text-sm text-body transition-colors duration-200 hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

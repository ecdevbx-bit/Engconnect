"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

/* =====================================================================
 * Showcase gallery — five complete landing-page revamps, each authored
 * through a different Claude design skill. This index lets you preview
 * and compare all five, plus the current production landing.
 * Each preview tile is a tiny animated "poster" of that variant's world.
 * =================================================================== */

type Variant = {
  id: string;
  href: string;
  index: string;
  title: string;
  skill: string;
  blurb: string;
  poster: (reduce: boolean) => React.ReactNode;
};

const VARIANTS: Variant[] = [
  {
    id: "v1",
    href: "/showcase/v1",
    index: "01",
    title: "Editorial Transmission",
    skill: "frontend-design · Anthropic",
    blurb:
      "A language-magazine front page meets a live transcription console. Oversized kinetic serif type, hairline rules, running tickers — boldness spent entirely on typography.",
    poster: (reduce) => <PosterEditorial reduce={reduce} />,
  },
  {
    id: "v2",
    href: "/showcase/v2",
    index: "02",
    title: "Aurora Vernacular",
    skill: "canvas-design · Anthropic",
    blurb:
      "A named aesthetic movement: the screen as the sky before sunrise. A live canvas aurora drifts behind breathing glass slabs; everything arrives like dawn.",
    poster: (reduce) => <PosterAurora reduce={reduce} />,
  },
  {
    id: "v3",
    href: "/showcase/v3",
    index: "03",
    title: "Spatial / Orbit",
    skill: "webgl-3d-design · claudedesignskills",
    blurb:
      "Deep-space depth on a live three.js backdrop — a wireframe knot orbiting a glowing core inside a brand-tinted particle field, with cursor-reactive tilt.",
    poster: (reduce) => <PosterOrbit reduce={reduce} />,
  },
  {
    id: "v4",
    href: "/showcase/v4",
    index: "04",
    title: "The Reel",
    skill: "web-animation-design",
    blurb:
      "The whole page is one cinematic scroll film: GSAP-pinned acts, a horizontal step sequence, scrubbed reveals and count-ups — orange as the spotlight.",
    poster: (reduce) => <PosterReel reduce={reduce} />,
  },
  {
    id: "v5",
    href: "/showcase/v5",
    index: "05",
    title: "Tactile OS",
    skill: "ui-ux-pro-max",
    blurb:
      "A playful language-learning desktop. Neo-brutalist windows, chunky borders and hard offset shadows, draggable sticker tiles, press-in springs and confetti.",
    poster: (reduce) => <PosterTactile reduce={reduce} />,
  },
  {
    id: "v6",
    href: "/showcase/v6",
    index: "06",
    title: "Bioluminescent Abyss",
    skill: "color-expert + mascot-motion",
    blurb:
      "A living deep-sea world that glows from within — gooey morphing blobs, drifting plankton, an OKLCH teal/lime/coral palette, and the AI mascot as a gaze-tracking bioluminescent companion.",
    poster: (reduce) => <PosterAbyss reduce={reduce} />,
  },
  {
    id: "v7",
    href: "/showcase/v7",
    index: "07",
    title: "Sunrise Clay",
    skill: "impeccable + mascot-motion",
    blurb:
      "A bold light-mode departure — warm claymorphic pillows, double shadows, springy jelly physics, and a squash-and-stretch clay buddy that leans toward your cursor.",
    poster: (reduce) => <PosterClay reduce={reduce} />,
  },
  {
    id: "v8",
    href: "/showcase/v8",
    index: "08",
    title: "Neon Holo Synthwave",
    skill: "mascot-motion + web-animation",
    blurb:
      "Retro-future neon — a scrolling perspective grid, scanlines and glitch, with the AI mascot projected as a flickering hologram that talks with a live waveform.",
    poster: (reduce) => <PosterSynth reduce={reduce} />,
  },
];

export default function ShowcasePage() {
  const reduce = !!useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <main className="min-h-screen bg-[#18181c] text-body">
      <style>{galleryCss}</style>

      {/* ambient drifting glows */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            style={{ y: glowY }}
            className="pointer-events-none fixed -left-40 top-0 -z-0 h-[480px] w-[480px] rounded-full bg-[#f97316]/15 blur-[120px]"
          />
          <div
            aria-hidden
            className="gx-float pointer-events-none fixed right-[-10rem] top-1/3 -z-0 h-[420px] w-[420px] rounded-full bg-[#b79fff]/12 blur-[120px]"
          />
          <div
            aria-hidden
            className="gx-float-slow pointer-events-none fixed bottom-0 left-1/3 -z-0 h-[360px] w-[360px] rounded-full bg-[#00e3fd]/10 blur-[120px]"
          />
        </>
      )}

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#18181c]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="" width={28} height={28} className="gx-spin-soft h-7 w-7" aria-hidden />
            <span className="font-bold text-heading">English Connection</span>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm font-semibold text-heading transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Current landing →
          </Link>
        </div>
      </header>

      {/* hero */}
      <section ref={heroRef} className="relative z-10 mx-auto max-w-[1180px] px-5 pb-10 pt-16 md:px-8 md:pt-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Eight skills · eight worlds
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-tight text-heading md:text-6xl"
        >
          The landing page,
          <br />
          reimagined{" "}
          <span className="bg-gradient-to-r from-[#f59e0b] via-[#00e3fd] to-[#b79fff] bg-clip-text text-transparent">
            eight different ways.
          </span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-5 max-w-2xl text-base text-body md:text-lg"
        >
          Every section of English Connection — hero, live demos, lessons, the why-bento,
          reviews, pricing — rebuilt from scratch in five distinct aesthetics, each
          authored through a different Claude design skill. Same content, completely
          different experience. Open any one full-screen.
        </motion.p>
      </section>

      {/* variant grid */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-5 pb-28 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {VARIANTS.map((v, i) => (
            <motion.div
              key={v.id}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.08 }}
              className={i === 0 ? "md:col-span-2" : ""}
            >
              <Link
                href={v.href}
                className="group block overflow-hidden rounded-3xl border border-white/[0.08] bg-surface-1 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181c]"
              >
                <div className={`relative ${i === 0 ? "h-64 md:h-80" : "h-56"} w-full overflow-hidden`}>
                  {v.poster(reduce)}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0c0f]/70 via-transparent to-transparent" />
                  <div className="absolute left-5 top-5 font-mono text-xs tracking-widest text-white/70">
                    {v.index} / 08
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 p-6">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                      {v.skill}
                    </div>
                    <h2 className="mt-1.5 text-2xl font-extrabold text-heading">{v.title}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-body">{v.blurb}</p>
                  </div>
                  <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-[#0b0e14]">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-muted-foreground">
          Built with eight design skills — official <span className="text-heading">frontend-design</span> &
          <span className="text-heading"> canvas-design</span>, plus
          <span className="text-heading"> webgl-3d-design</span>,
          <span className="text-heading"> web-animation-design</span>,
          <span className="text-heading"> ui-ux-pro-max</span>,
          <span className="text-heading"> color-expert</span>,
          <span className="text-heading"> impeccable</span> and
          <span className="text-heading"> mascot-motion</span>. Pick a favourite and it can
          become the new <span className="font-mono text-heading">/</span>.
        </p>
      </section>
    </main>
  );
}

/* ───────────────────────── Animated posters ───────────────────────── */

function PosterEditorial({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#101012]">
      <div className="absolute inset-0 flex flex-col justify-center px-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-primary/80">§ ENGLISH CONNECTION</div>
        <div
          className="mt-1 font-extrabold uppercase leading-[0.85] tracking-tight text-heading"
          style={{ fontSize: "clamp(2.4rem,7vw,5rem)", fontFamily: "Georgia, serif" }}
        >
          Speak<br />Fluently
        </div>
        <div className="mt-3 h-px w-2/3 bg-white/15" />
      </div>
      {/* ticker */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-white/10 bg-black/40 py-1.5">
        <div className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 ${reduce ? "" : "gx-ticker"}`}>
          4.8 rating · 1,00,000+ learners · AI partner · jumble words · pronunciation · 4.8 rating · 1,00,000+ learners ·
        </div>
      </div>
    </div>
  );
}

function PosterAurora({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#0a0b14]">
      <div className={`absolute -inset-10 ${reduce ? "" : "gx-aurora"}`}
        style={{
          background:
            "radial-gradient(60% 50% at 30% 30%, rgba(0,227,253,0.5), transparent 60%)," +
            "radial-gradient(55% 45% at 70% 40%, rgba(183,159,255,0.5), transparent 60%)," +
            "radial-gradient(50% 50% at 50% 75%, rgba(245,158,11,0.4), transparent 60%)",
          filter: "blur(36px)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`h-24 w-24 rounded-full border border-white/20 ${reduce ? "" : "gx-breathe"}`}
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18), transparent 70%)" }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-6 text-center text-sm font-medium tracking-wide text-white/80"
        style={{ fontFamily: "Georgia, serif" }}>
        learning, like dawn
      </div>
    </div>
  );
}

function PosterOrbit({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07080d]">
      {/* particle dots */}
      {Array.from({ length: 26 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full bg-white/60"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            height: 2 + (i % 3),
            width: 2 + (i % 3),
            opacity: 0.25 + (i % 5) * 0.12,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative h-40 w-40 ${reduce ? "" : "gx-orbit"}`} style={{ transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 rounded-full border-2 border-[#f97316]/70" style={{ transform: "rotateX(70deg)" }} />
          <div className="absolute inset-2 rounded-full border-2 border-[#00e3fd]/60" style={{ transform: "rotateY(70deg)" }} />
          <div className="absolute inset-[38%] rounded-full bg-[#00e3fd]/70 blur-[2px]" />
        </div>
      </div>
    </div>
  );
}

function PosterReel({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#0c0c0f]">
      <div className="absolute inset-0 flex items-center gap-3 px-6">
        {[0, 1, 2].map((n) => (
          <div
            key={n}
            className={`flex h-32 flex-1 flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 ${reduce ? "" : "gx-reel"}`}
            style={{ animationDelay: `${n * 0.4}s` }}
          >
            <span className="font-mono text-[10px] text-primary">0{n + 1}</span>
            <span className="text-[11px] font-bold text-heading">
              {["Talk it out", "Rebuild it", "Fix it"][n]}
            </span>
          </div>
        ))}
      </div>
      {/* scrubber */}
      <div className="absolute bottom-5 left-6 right-6 h-1 rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-primary ${reduce ? "w-1/2" : "gx-scrub"}`} />
      </div>
    </div>
  );
}

function PosterTactile({ reduce }: { reduce: boolean }) {
  const tiles = [
    { c: "#f97316", t: "AI", r: -4 },
    { c: "#00e3fd", t: "Aa", r: 3 },
    { c: "#b79fff", t: "★", r: -2 },
    { c: "#ff6c95", t: "♥", r: 5 },
  ];
  return (
    <div className="absolute inset-0 bg-[#1d1d22]"
      style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        {tiles.map((tile, i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-[#0b0e14] ${reduce ? "" : "gx-bob"}`}
            style={{
              background: tile.c,
              border: "3px solid #000",
              boxShadow: "5px 5px 0 0 #000",
              transform: `rotate(${tile.r}deg)`,
              animationDelay: `${i * 0.18}s`,
            }}
          >
            {tile.t}
          </div>
        ))}
      </div>
    </div>
  );
}

function PosterAbyss({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(120% 100% at 50% 0%, #06343f, #03161a 70%)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 30% 40%, rgba(46,242,255,0.22), transparent 60%), radial-gradient(50% 45% at 72% 65%, rgba(182,255,58,0.18), transparent 60%)" }} />
      {Array.from({ length: 22 }).map((_, i) => (
        <span key={i} aria-hidden className={`absolute rounded-full ${reduce ? "" : "gx-float"}`}
          style={{ left: `${(i * 41) % 100}%`, top: `${(i * 29) % 100}%`, height: 3 + (i % 3), width: 3 + (i % 3), background: i % 3 ? "#2ef2ff" : "#b6ff3a", opacity: 0.5, boxShadow: "0 0 8px currentColor", animationDelay: `${i * 0.3}s` }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`h-28 w-28 rounded-full ${reduce ? "" : "gx-breathe"}`} style={{ background: "radial-gradient(circle at 50% 40%, rgba(46,242,255,0.5), rgba(154,107,255,0.25) 60%, transparent 72%)", filter: "blur(2px)" }} />
      </div>
      <div className="absolute inset-x-0 bottom-5 text-center text-sm font-semibold tracking-wide" style={{ color: "#b6ff3a" }}>a living companion in the deep</div>
    </div>
  );
}

function PosterClay({ reduce }: { reduce: boolean }) {
  const blobs = [
    { c: "#ff9e6d", l: "22%", t: "30%", s: 70 },
    { c: "#c4b5fd", l: "60%", t: "26%", s: 56 },
    { c: "#86efac", l: "44%", t: "56%", s: 48 },
  ];
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #fff7ed, #ffece0)" }}>
      {blobs.map((b, i) => (
        <div key={i} className={reduce ? "" : "gx-bob"} aria-hidden
          style={{ position: "absolute", left: b.l, top: b.t, height: b.s, width: b.s, borderRadius: "42% 58% 55% 45%", background: b.c,
            boxShadow: "-6px -6px 14px rgba(255,255,255,0.9), 8px 10px 20px rgba(214,150,110,0.45)", animationDelay: `${i * 0.25}s` }} />
      ))}
      <div className="absolute inset-x-0 bottom-5 text-center text-sm font-bold" style={{ color: "#3b2f2a" }}>soft, warm &amp; alive</div>
    </div>
  );
}

function PosterSynth({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(#0b0420, #170a33)" }}>
      <div className="absolute left-1/2 top-6 h-20 w-20 -translate-x-1/2 rounded-full" style={{ background: "linear-gradient(#ff7a3c, #ff2bd6)", boxShadow: "0 0 40px rgba(255,43,214,0.6)" }} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden" style={{ perspective: "200px" }}>
        <div className={reduce ? "" : "gx-grid"} style={{ position: "absolute", inset: "-50% 0 0 0", transform: "rotateX(70deg)", transformOrigin: "bottom",
          backgroundImage: "linear-gradient(#16f5ff55 1px, transparent 1px), linear-gradient(90deg, #16f5ff55 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-3xl font-black tracking-tight ${reduce ? "" : "gx-flicker"}`} style={{ color: "#16f5ff", textShadow: "0 0 12px #16f5ff, 0 0 24px #ff2bd6" }}>HOLO</div>
      </div>
    </div>
  );
}

const galleryCss = `
@keyframes gx-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.gx-ticker { display:inline-block; animation: gx-ticker 14s linear infinite; }
@keyframes gx-float { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-26px); } }
.gx-float { animation: gx-float 14s ease-in-out infinite; }
.gx-float-slow { animation: gx-float 20s ease-in-out infinite; }
@keyframes gx-aurora { 0%,100%{ transform: translate3d(-4%,-2%,0) scale(1); } 50%{ transform: translate3d(4%,3%,0) scale(1.1); } }
.gx-aurora { animation: gx-aurora 12s ease-in-out infinite; }
@keyframes gx-breathe { 0%,100%{ transform: scale(1); opacity:.85; } 50%{ transform: scale(1.12); opacity:1; } }
.gx-breathe { animation: gx-breathe 5s ease-in-out infinite; }
@keyframes gx-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.gx-orbit { animation: gx-orbit 18s linear infinite; }
@keyframes gx-reel { 0%,100%{ transform: translateY(6px); opacity:.7; } 50%{ transform: translateY(-6px); opacity:1; } }
.gx-reel { animation: gx-reel 2.4s ease-in-out infinite; }
@keyframes gx-scrub { 0%{ width: 8%; } 100%{ width: 92%; } }
.gx-scrub { animation: gx-scrub 3.2s ease-in-out infinite alternate; }
@keyframes gx-bob { 0%,100%{ transform: translateY(0) rotate(var(--r,0)); } 50%{ transform: translateY(-8px); } }
.gx-bob { animation: gx-bob 2.6s ease-in-out infinite; }
@keyframes gx-spin-soft { 0%,100%{ transform: rotate(-6deg); } 50%{ transform: rotate(6deg); } }
.gx-spin-soft { animation: gx-spin-soft 6s ease-in-out infinite; }
@keyframes gx-grid { from { background-position: 0 0; } to { background-position: 0 26px; } }
.gx-grid { animation: gx-grid 1.1s linear infinite; }
@keyframes gx-flicker { 0%,100%{ opacity:1; } 47%{ opacity:1; } 50%{ opacity:.55; } 53%{ opacity:1; } 80%{ opacity:.8; } }
.gx-flicker { animation: gx-flicker 2.8s steps(1,end) infinite; }
@media (prefers-reduced-motion: reduce) {
  .gx-ticker,.gx-float,.gx-float-slow,.gx-aurora,.gx-breathe,.gx-orbit,.gx-reel,.gx-scrub,.gx-bob,.gx-spin-soft,.gx-grid,.gx-flicker { animation: none !important; }
}
`;

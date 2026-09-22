"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  motion,
  MotionConfig,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
  useMotionValue,
} from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, ArrowRight, Check, X, Quote, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

import { AiPartnerDemo } from "@/components/landing/AiPartnerDemo";
import { JumbleDemo } from "@/components/landing/JumbleDemo";
import { PronunciationDemo } from "@/components/landing/PronunciationDemo";
import AccountChip from "@/components/layout/AccountChip";

/* =====================================================================
   V3 — "Spatial / Orbit"
   Immersive deep-space 3D depth. A live three.js backdrop (drifting
   brand-tinted particle field + slowly rotating wireframe TorusKnot)
   reacts to cursor (lerped tilt) and scroll. Sections float on parallax
   depth layers; cards do 3D pointer tilt; mascots orbit a glowing core.
   Feature-detects WebGL and honours prefers-reduced-motion by swapping
   the live loop for a static brand-gradient poster. Single file, all
   CSS namespaced `v3-`.
   ===================================================================== */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181c]";

const BRAND_CONFETTI = ["#f59e0b", "#f97316", "#00e3fd", "#b79fff", "#ff6c95"];

/* -------------------------------------------------------------------- */
/*  Live three.js deep-space backdrop                                   */
/* -------------------------------------------------------------------- */

function DeepSpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // On reduced-motion the loop never starts — the static poster below
    // the transparent canvas remains the visible backdrop.
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Feature-detect WebGL on a throwaway canvas before committing. On
    // failure we simply bail: the canvas stays transparent and the brand
    // gradient poster underneath shows through.
    const probe = document.createElement("canvas");
    const supported = !!(probe.getContext("webgl2") || probe.getContext("webgl"));
    if (!supported) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const w = () => canvas.clientWidth || window.innerWidth;
    const h = () => canvas.clientHeight || window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w(), h(), false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w() / h(), 0.1, 100);
    camera.position.z = 9;

    // Tilt group — the cursor lerps this whole cluster.
    const group = new THREE.Group();
    scene.add(group);

    // The memorable spatial motif: a glowing wireframe torus knot.
    const knotGeo = new THREE.TorusKnotGeometry(2.05, 0.52, 170, 26, 2, 3);
    const knotMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    group.add(knot);

    // Inner cyan core for volumetric depth.
    const coreGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00e3fd,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Drifting brand-tinted particle field.
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 1400 : 3200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xf59e0b),
      new THREE.Color(0xf97316),
      new THREE.Color(0x00e3fd),
      new THREE.Color(0xb79fff),
      new THREE.Color(0xff6c95),
    ];
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: isMobile ? 0.05 : 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // Pointer + scroll reactive state.
    const pointer = { x: 0, y: 0 };
    let scrollT = 0;
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scrollT = window.scrollY / Math.max(window.innerHeight, 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      if (!renderer) return;
      renderer.setSize(w(), h(), false);
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      points.rotation.y = t * 0.015;
      points.rotation.x = Math.sin(t * 0.05) * 0.1;

      // Base spin + scroll-driven rotation of the motif.
      knot.rotation.y = t * 0.16 + scrollT * Math.PI;
      knot.rotation.z = t * 0.05;
      core.rotation.x = -t * 0.25;
      core.rotation.y = t * 0.2;

      // Cursor-reactive tilt — lerp toward the pointer, never snap.
      const tx = pointer.y * 0.32;
      const ty = pointer.x * 0.42;
      group.rotation.x += (tx - group.rotation.x) * 0.04;
      group.rotation.y += (ty - group.rotation.y) * 0.04;
      group.scale.setScalar(1 + Math.sin(t * 0.8) * 0.02);

      if (renderer) renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      knotGeo.dispose();
      knotMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer?.dispose();
    };
  }, [reduce]);

  return (
    <div aria-hidden className="v3-bg-fixed">
      <div className="v3-poster absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Motion helpers                                                      */
/* -------------------------------------------------------------------- */

function Parallax({ children, speed = 40, className }: { children: ReactNode; speed?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function TiltCard({ children, className, max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 18, mass: 0.4 });
  const sry = useSpring(ry, { stiffness: 160, damping: 18, mass: 0.4 });

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * max);
    ry.set(px * max);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------- */
/*  Small UI atoms                                                      */
/* -------------------------------------------------------------------- */

function GradText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={`v3-grad-text ${className ?? ""}`}>{children}</span>;
}

function StarRow({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
      ))}
    </div>
  );
}

function PrimaryCta({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-6 py-3 text-sm font-bold text-[#18181c] shadow-[0_8px_30px_-8px_rgba(249,115,22,0.7)] transition-transform hover:-translate-y-0.5 ${FOCUS_RING}`}
    >
      {children}
    </Link>
  );
}

function GhostCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-heading backdrop-blur-md transition-colors hover:bg-white/[0.08] ${FOCUS_RING}`}
    >
      {children}
    </Link>
  );
}

function SectionHead({ kicker, title, sub }: { kicker?: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {kicker && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">{kicker}</p>
      )}
      <h2 className="v3-display text-3xl font-bold text-heading md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-base text-body md:text-lg">{sub}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  App-store buttons                                                   */
/* -------------------------------------------------------------------- */

function StoreButton({ kind }: { kind: "google" | "apple" }) {
  const top = kind === "google" ? "GET IT ON" : "Download on the";
  const label = kind === "google" ? "Google Play" : "App Store";
  return (
    <a
      href="#"
      aria-label={label}
      className={`inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 backdrop-blur-md transition-colors hover:bg-white/[0.09] ${FOCUS_RING}`}
    >
      {kind === "apple" ? (
        <svg viewBox="0 0 384 512" className="h-6 w-6 fill-heading" aria-hidden>
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 92.5c30.5-36.2 27.7-69.2 26.8-81-26.9 1.6-58 18.4-75.7 39.1-19.5 22.2-31 49.7-28.5 80.4 29.1 2.2 55.6-12.7 77.4-38.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 340 512" className="h-6 w-6" aria-hidden>
          <defs>
            <linearGradient id="v3-gp-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00e3fd" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#ff6c95" />
            </linearGradient>
          </defs>
          <path d="M40 36 L300 256 L40 476 Z" fill="url(#v3-gp-grad)" />
        </svg>
      )}
      <span className="flex flex-col text-left leading-none">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{top}</span>
        <span className="text-sm font-semibold text-heading">{label}</span>
      </span>
    </a>
  );
}

/* -------------------------------------------------------------------- */
/*  Content data                                                        */
/* -------------------------------------------------------------------- */

const LESSONS = [
  { tag: "MOTIVATION", title: "Why do I always feel stuck?", accent: "#f59e0b" },
  { tag: "CULTURE", title: "How British tea became a ritual", accent: "#00e3fd" },
  { tag: "BUSINESS", title: "How Pixar found its biggest risk", accent: "#b79fff" },
  { tag: "INTERVIEW", title: "Inside a Grammy winner's mind", accent: "#ff6c95" },
  { tag: "DAILY LIFE", title: "Five ways to actually master small talk", accent: "#f97316" },
  { tag: "WELLNESS", title: "Why your accent never fully disappears", accent: "#00e3fd" },
  { tag: "NEWS", title: "When AI rewrote the office", accent: "#b79fff" },
];

const REVIEWS = [
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

/* -------------------------------------------------------------------- */
/*  Orbiting mascot cluster                                             */
/* -------------------------------------------------------------------- */

const ORBIT = [
  { src: "/mascots/happy.svg", label: "Happy", caption: "Celebrates your wins" },
  { src: "/mascots/calm.svg", label: "Calm", caption: "Steadies your nerves" },
  { src: "/mascots/sad.svg", label: "Gentle", caption: "Sits with your setbacks" },
];

function MascotOrbit() {
  return (
    <div className="v3-persp mx-auto flex h-[400px] w-full max-w-[460px] items-center justify-center">
      <div className="v3-ring relative h-full w-full">
        {/* Glowing core */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="v3-anim-pulse grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] shadow-[0_0_60px_-6px_rgba(249,115,22,0.9)]">
            <Sparkles className="h-9 w-9 text-[#18181c]" aria-hidden />
          </div>
        </div>
        {ORBIT.map((m, i) => (
          <div
            key={m.label}
            className="v3-orbit-item"
            style={{ animationDelay: `${-(20 / ORBIT.length) * i}s` }}
          >
            <div className="flex w-[108px] flex-col items-center text-center">
              <div className="grid h-[88px] w-[88px] place-items-center rounded-3xl border border-white/10 bg-surface-1/60 backdrop-blur-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt="" aria-hidden className="h-14 w-14" />
              </div>
              <p className="mt-2 text-sm font-bold text-heading">{m.label}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{m.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Lesson coverflow carousel                                           */
/* -------------------------------------------------------------------- */

function LessonCarousel() {
  const reduce = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", containScroll: false },
    reduce ? [] : [Autoplay({ delay: 2600, stopOnInteraction: false })],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const apply = () => {
      const root = emblaApi.rootNode().getBoundingClientRect();
      const center = root.left + root.width / 2;
      const half = root.width / 2 || 1;
      for (const node of emblaApi.slideNodes()) {
        const inner = node.firstElementChild as HTMLElement | null;
        if (!inner) continue;
        const rect = node.getBoundingClientRect();
        const nc = rect.left + rect.width / 2;
        const signed = Math.max(-1, Math.min(1, (nc - center) / half));
        const t = Math.abs(signed);
        inner.style.transform = `perspective(1200px) rotateY(${(-signed * 32).toFixed(1)}deg) scale(${(1 - t * 0.18).toFixed(3)})`;
        inner.style.opacity = (1 - t * 0.5).toFixed(3);
        node.style.zIndex = String(Math.round(100 - t * 100));
      }
    };
    if (reduce) return;
    apply();
    emblaApi.on("scroll", apply).on("reInit", apply);
    return () => {
      emblaApi.off("scroll", apply).off("reInit", apply);
    };
  }, [emblaApi, reduce]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y py-6">
          {LESSONS.map((l) => (
            <div key={l.title} className="relative flex-[0_0_82%] px-2 sm:flex-[0_0_56%] md:flex-[0_0_36%]">
              <div className="v3-glass flex h-[260px] flex-col justify-between rounded-3xl p-6 will-change-transform">
                <div>
                  <span
                    className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: l.accent, backgroundColor: `${l.accent}1f` }}
                  >
                    {l.tag}
                  </span>
                  <h3 className="v3-display mt-5 text-2xl font-bold leading-snug text-heading">{l.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: l.accent }}>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Talk about this in English
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous lesson"
          onClick={() => emblaApi?.scrollPrev()}
          className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/[0.04] text-heading transition-colors hover:bg-white/[0.1] ${FOCUS_RING}`}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next lesson"
          onClick={() => emblaApi?.scrollNext()}
          className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/[0.04] text-heading transition-colors hover:bg-white/[0.1] ${FOCUS_RING}`}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Bento animated widgets                                              */
/* -------------------------------------------------------------------- */

function CefrBar({ label, pct }: { label: string; pct: number }) {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-body">
        <span>{label}</span>
        <span className="text-heading">{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f97316]"
          initial={reduce ? false : { width: 0 }}
          whileInView={reduce ? undefined : { width: `${pct}%` }}
          style={reduce ? { width: `${pct}%` } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function Gauge89() {
  const reduce = useReducedMotion();
  const r = 54;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - 0.89);
  return (
    <div className="relative grid place-items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-surface-3" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          stroke="url(#v3-gauge)"
          strokeDasharray={C}
          initial={reduce ? false : { strokeDashoffset: C }}
          whileInView={reduce ? undefined : { strokeDashoffset: offset }}
          style={reduce ? { strokeDashoffset: offset } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="v3-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="v3-display text-2xl font-bold text-heading">89%</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">match</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Page                                                                */
/* -------------------------------------------------------------------- */

export default function Page() {
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div className="v3-root relative min-h-screen overflow-x-hidden font-body text-body antialiased">
        {/* Scoped styles + one display font */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');

          .v3-root { background:#18181c; }
          .v3-display { font-family:'Space Grotesk', var(--font-display, system-ui), sans-serif; letter-spacing:-0.02em; }

          .v3-bg-fixed { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; display:block; }
          .v3-poster {
            background:
              radial-gradient(circle at 22% 18%, rgba(245,158,11,0.16), transparent 42%),
              radial-gradient(circle at 80% 26%, rgba(0,227,253,0.12), transparent 42%),
              radial-gradient(circle at 50% 90%, rgba(183,159,255,0.14), transparent 50%),
              #0c0c10;
          }
          .v3-vignette {
            position:fixed; inset:0; z-index:1; pointer-events:none;
            background: radial-gradient(125% 90% at 50% 8%, transparent 38%, rgba(8,8,12,0.62) 100%);
          }
          .v3-glass { background: rgba(31,31,36,0.58); backdrop-filter: blur(16px); border:1px solid rgba(255,255,255,0.08); }
          .v3-grad-text {
            background:linear-gradient(92deg,#f59e0b,#f97316 45%,#ff6c95);
            -webkit-background-clip:text; background-clip:text; color:transparent;
          }
          .v3-persp { perspective:1200px; }

          @keyframes v3-spin-slow { to { transform: rotate(360deg); } }
          @keyframes v3-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
          @keyframes v3-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes v3-pulse { 0%,100%{transform:scale(1); opacity:.92} 50%{transform:scale(1.08); opacity:1} }
          @keyframes v3-logo-glow {
            0%,100%{filter:drop-shadow(0 0 6px rgba(249,115,22,.55))}
            50%{filter:drop-shadow(0 0 16px rgba(249,115,22,.95))}
          }
          @keyframes v3-ring-tilt {
            0%,100%{transform:rotateX(16deg) rotateY(-12deg)}
            50%{transform:rotateX(16deg) rotateY(12deg)}
          }
          @keyframes v3-orbit {
            from { transform: rotate(0) translateX(var(--r)) rotate(0); }
            to   { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
          }

          .v3-anim-float { animation: v3-float 6s ease-in-out infinite; }
          .v3-anim-bob { animation: v3-bob 3.4s ease-in-out infinite; }
          .v3-anim-pulse { animation: v3-pulse 3s ease-in-out infinite; }
          .v3-anim-logo { animation: v3-logo-glow 3s ease-in-out infinite; }

          .v3-ring { transform-style:preserve-3d; animation: v3-ring-tilt 9s ease-in-out infinite; }
          .v3-orbit-item {
            position:absolute; top:50%; left:50%;
            width:108px; margin-left:-54px; margin-top:-66px;
            --r:104px;
            animation: v3-orbit 20s linear infinite;
          }
          @media (min-width:480px){ .v3-orbit-item{ --r:128px; } }
          @media (min-width:768px){ .v3-orbit-item{ --r:152px; } }

          @media (prefers-reduced-motion: reduce){
            .v3-anim-float,.v3-anim-bob,.v3-anim-pulse,.v3-anim-logo,.v3-ring,.v3-orbit-item{ animation:none !important; }
          }
        `}</style>

        <DeepSpaceCanvas />
        <div className="v3-vignette" aria-hidden />

        {/* Back to gallery */}
        <Link
          href="/showcase"
          className={`fixed left-3 top-3 z-50 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-semibold text-heading backdrop-blur-md transition-colors hover:bg-black/60 ${FOCUS_RING}`}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> All 5 designs
        </Link>

        {/* Content layer */}
        <div className="relative z-10">
          {/* NAV */}
          <header className="sticky top-0 z-40">
            <nav className="relative mx-auto flex max-w-[1180px] items-center justify-end px-5 py-3.5 md:px-8">
              <Link
                href="/"
                aria-label="English Connection home"
                className={`absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full ${FOCUS_RING}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" aria-hidden className="v3-anim-logo h-8 w-8" />
                <span className="v3-display hidden text-base font-bold text-heading sm:inline">
                  English Connection
                </span>
              </Link>
              <AccountChip />
            </nav>
          </header>

          {/* HERO */}
          <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-2 md:gap-8 md:px-8 md:pb-28 md:pt-20">
            <Reveal>
              <div className="text-center md:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-body backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00e3fd]" /> Live AI speaking coach
                </span>
                <h1 className="v3-display mt-5 text-4xl font-bold leading-[1.05] text-heading sm:text-5xl md:text-6xl">
                  English Connection, your <GradText>AI English coach</GradText>
                </h1>
                <p className="mx-auto mt-5 max-w-md text-base text-body md:mx-0 md:text-lg">
                  Speak from day one. Get instant, specific feedback. Learn with the things you
                  actually love — all inside a floating, immersive practice space.
                </p>

                <div className="mt-6 flex items-center justify-center gap-5 md:justify-start">
                  <div className="flex items-center gap-2">
                    <StarRow />
                    <span className="text-sm font-bold text-heading">4.8</span>
                  </div>
                  <div className="h-5 w-px bg-white/15" />
                  <span className="text-sm font-semibold text-body">
                    <span className="text-heading">1,00,000+</span> learners
                  </span>
                </div>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
                  <PrimaryCta href="/signup">
                    Open webapp <ArrowRight className="h-4 w-4" aria-hidden />
                  </PrimaryCta>
                  <GhostCta href="/login">I already have an account</GhostCta>
                </div>
              </div>
            </Reveal>

            {/* Floating AI partner panel over the WebGL scene */}
            <div className="v3-persp">
              <Parallax speed={reduce ? 0 : 30}>
                <div className="relative mx-auto w-full max-w-[400px]">
                  <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[44px] bg-gradient-to-br from-[#f97316]/30 via-[#b79fff]/15 to-[#00e3fd]/25 blur-2xl" />
                  <TiltCard max={9} className="v3-anim-float">
                    <div className="h-[540px] rounded-[30px]">
                      <AiPartnerDemo />
                    </div>
                  </TiltCard>
                </div>
              </Parallax>
            </div>
          </section>

          {/* BIG TAGLINE */}
          <section className="px-5 py-16 md:py-24">
            <Reveal>
              <p className="v3-display mx-auto max-w-4xl text-center text-3xl font-bold leading-tight text-heading sm:text-4xl md:text-6xl">
                English learning has never been <GradText>this fun.</GradText>
              </p>
            </Reveal>
          </section>

          {/* 3 STEPS */}
          <section className="mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-20">
            <SectionHead kicker="How it works" title="Three steps to speaking with confidence" />
            <div className="flex flex-col gap-16 md:gap-24">
              {[
                { n: "01", title: "Talk it out with your AI partner", demo: <AiPartnerDemo />, fixed: true },
                { n: "02", title: "Rebuild real sentences in Jumble Words", demo: <JumbleDemo />, fixed: false },
                { n: "03", title: "Speak, then see exactly what to fix", demo: <PronunciationDemo />, fixed: false },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className={`grid items-center gap-8 md:grid-cols-2 md:gap-12 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
                >
                  <Reveal>
                    <div className="text-center md:text-left">
                      <span className="v3-display text-6xl font-bold text-white/10">{s.n}</span>
                      <h3 className="v3-display mt-2 text-2xl font-bold text-heading md:text-4xl">{s.title}</h3>
                      <div className="mt-6 flex justify-center md:justify-start">
                        <PrimaryCta href="/signup">
                          Try now <ArrowRight className="h-4 w-4" aria-hidden />
                        </PrimaryCta>
                      </div>
                    </div>
                  </Reveal>
                  <div className="v3-persp">
                    <Parallax speed={reduce ? 0 : 22}>
                      <TiltCard max={6} className="mx-auto w-full max-w-[420px]">
                        {s.fixed ? <div className="h-[540px]">{s.demo}</div> : s.demo}
                      </TiltCard>
                    </Parallax>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MASCOT ORBIT */}
          <section className="mx-auto max-w-[1180px] overflow-hidden px-5 py-20 md:px-8 md:py-28">
            <SectionHead
              kicker="Made to care"
              title={<>An AI that <GradText>feels it with you</GradText></>}
              sub="Your coach reads the moment and reacts — celebrating wins, steadying nerves, and staying right beside you through every slip."
            />
            <Reveal>
              <MascotOrbit />
            </Reveal>
          </section>

          {/* LESSON CAROUSEL */}
          <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
            <SectionHead
              kicker="For you, daily"
              title="Endless lessons, picked just for you"
              sub="Daily curated content tuned to what you struggle with most."
            />
            <LessonCarousel />
          </section>

          {/* WHY BENTO */}
          <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
            <SectionHead kicker="The difference" title={<>Why <GradText>English Connection?</GradText></>} />
            <div className="v3-persp grid gap-5 md:grid-cols-6">
              {/* (a) CEFR progress */}
              <Reveal className="md:col-span-3">
                <TiltCard max={5} className="v3-glass h-full rounded-3xl p-7">
                  <h3 className="v3-display text-xl font-bold text-heading">See your English improve over time</h3>
                  <p className="mt-2 text-sm text-body">
                    Regular level checks show you exactly how far you&apos;ve come.
                  </p>
                  <div className="mt-6 space-y-4">
                    <CefrBar label="B1" pct={45} />
                    <CefrBar label="B2" pct={75} />
                    <CefrBar label="C1" pct={100} />
                  </div>
                </TiltCard>
              </Reveal>

              {/* (b) Pronunciation gauge */}
              <Reveal className="md:col-span-3">
                <TiltCard max={5} className="v3-glass flex h-full flex-col rounded-3xl p-7">
                  <h3 className="v3-display text-xl font-bold text-heading">Accurate pronunciation</h3>
                  <p className="mt-2 text-sm text-body">Pronounce every word right and sound natural.</p>
                  <div className="mt-4 flex items-center gap-5">
                    <Gauge89 />
                    <div>
                      <p className="v3-display text-2xl font-bold text-heading">Beautiful</p>
                      <p className="font-mono text-sm text-[#00e3fd]">B.YOO·tih·Fuhl</p>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>

              {/* (c) Expressions */}
              <Reveal className="md:col-span-2">
                <TiltCard max={6} className="v3-glass h-full rounded-3xl p-7">
                  <h3 className="v3-display text-xl font-bold text-heading">Learn real-world expressions</h3>
                  <p className="mt-2 text-sm text-body">
                    Speak the way fluent people actually do — not how textbooks say.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[
                      "10 expressions Indian professionals use daily",
                      "Casual phrases for coffee chats",
                      "Essential phrasal verbs for work",
                    ].map((e) => (
                      <li key={e} className="flex items-start gap-2.5 text-sm text-body">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00e3fd]" aria-hidden />
                        {e}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </Reveal>

              {/* (d) Know what to fix */}
              <Reveal className="md:col-span-2">
                <TiltCard max={6} className="v3-glass h-full rounded-3xl p-7">
                  <h3 className="v3-display text-xl font-bold text-heading">Know exactly what to fix</h3>
                  <p className="mt-2 text-sm text-body">
                    Specific feedback after every lesson — not vague pats on the back.
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-[#ff6c95]/30 bg-[#ff6c95]/10 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff6c95]">You said</p>
                      <p className="mt-1 text-sm text-body line-through decoration-[#ff6c95]/70">
                        I am understanding what you mean.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#00e3fd]/30 bg-[#00e3fd]/10 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#00e3fd]">Correct</p>
                      <p className="mt-1 text-sm text-heading">I understand what you mean.</p>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>

              {/* (e) Mistakes into strengths */}
              <Reveal className="md:col-span-2">
                <TiltCard max={6} className="v3-glass flex h-full flex-col justify-between rounded-3xl p-7">
                  <div>
                    <h3 className="v3-display text-xl font-bold text-heading">Turn mistakes into strengths</h3>
                    <p className="mt-2 text-sm text-body">
                      The words you trip on become tomorrow&apos;s warm-up drills, so the same mistake
                      never sneaks in twice.
                    </p>
                  </div>
                  <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs italic text-muted-foreground">
                    Practice speaking out loud to build a stronger connection between your brain and
                    your mouth.
                  </p>
                </TiltCard>
              </Reveal>
            </div>
          </section>

          {/* REVIEWS */}
          <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
            <SectionHead kicker="Loved across India" title={<>Speak English with <GradText>confidence</GradText></>} />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((r, i) => (
                <Reveal key={r.name} delay={(i % 3) * 0.05}>
                  <div className="v3-glass flex h-full flex-col rounded-3xl p-6">
                    <Quote className="h-7 w-7 text-[#f97316]/60" aria-hidden />
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-body">{r.body}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-heading">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.city}</p>
                      </div>
                      <StarRow />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { v: "1L+", l: "Happy users" },
                { v: "4.8", l: "Rating" },
                { v: "31K+", l: "Lessons" },
              ].map((s) => (
                <div key={s.l} className="v3-glass rounded-3xl p-5 text-center">
                  <p className="v3-display text-3xl font-bold text-heading md:text-4xl">
                    <GradText>{s.v}</GradText>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.l}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PRICING */}
          <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
            <SectionHead kicker="Pricing" title={<>Tutor-level results, <GradText>no tutor-level fees</GradText></>} />
            <div className="v3-persp grid gap-6 md:grid-cols-2">
              {/* English Connection */}
              <Reveal>
                <TiltCard max={5} className="relative h-full overflow-hidden rounded-3xl border border-[#f97316]/40 bg-surface-1/70 p-8 backdrop-blur-xl">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#f97316]/25 blur-3xl" />
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" alt="" aria-hidden className="h-7 w-7" />
                    <span className="v3-display text-lg font-bold text-heading">English Connection</span>
                  </div>
                  <p className="mt-5">
                    <span className="v3-display text-4xl font-bold text-heading">₹399</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {EC_ROWS.map((row) => (
                      <li key={row} className="flex items-start gap-3 text-sm text-body">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316]">
                          <Check className="h-3 w-3 text-[#18181c]" aria-hidden />
                        </span>
                        {row}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <PrimaryCta href="/signup">
                      Open the webapp <ArrowRight className="h-4 w-4" aria-hidden />
                    </PrimaryCta>
                  </div>
                </TiltCard>
              </Reveal>

              {/* Private tutor */}
              <Reveal delay={0.05}>
                <TiltCard max={5} className="h-full rounded-3xl border border-white/10 bg-surface-1/40 p-8 backdrop-blur-xl">
                  <span className="v3-display text-lg font-bold text-muted-foreground">Private tutor</span>
                  <p className="mt-5">
                    <span className="v3-display text-4xl font-bold text-muted-foreground">₹8,000</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {TUTOR_ROWS.map((row) => (
                      <li key={row} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-3">
                          <X className="h-3 w-3 text-[#ff6c95]" aria-hidden />
                        </span>
                        {row}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </Reveal>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="mx-auto max-w-[1180px] px-5 py-20 md:px-8 md:py-28">
            <Reveal>
              <div className="v3-glass relative overflow-hidden rounded-[36px] px-6 py-16 text-center md:py-20">
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
                  <div className="absolute left-1/4 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-[#f97316]/25 blur-3xl" />
                  <div className="absolute right-1/4 bottom-0 h-56 w-56 translate-x-1/2 rounded-full bg-[#00e3fd]/20 blur-3xl" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mascots/happy.svg" alt="" aria-hidden className="v3-anim-bob mx-auto h-24 w-24" />
                <h2 className="v3-display mt-6 text-3xl font-bold text-heading md:text-5xl">
                  So, are you <GradText>ready?</GradText>
                </h2>
                <div className="mt-8 flex justify-center">
                  <PrimaryCta
                    href="/signup"
                    onClick={() => {
                      if (!reduce) confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: BRAND_CONFETTI });
                    }}
                  >
                    Open the webapp <ArrowRight className="h-4 w-4" aria-hidden />
                  </PrimaryCta>
                </div>
                <p className="mt-8 text-sm text-muted-foreground">Or download the app</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <StoreButton kind="google" />
                  <StoreButton kind="apple" />
                </div>
              </div>
            </Reveal>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md">
            <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.svg" alt="" aria-hidden className="h-7 w-7" />
                  <span className="v3-display text-base font-bold text-heading">English Connection</span>
                </div>
                <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                  Your AI English coach — built for India&apos;s ambitious learners.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-heading">Webapp</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/signup" className={`text-muted-foreground transition-colors hover:text-heading ${FOCUS_RING}`}>Open dashboard</Link></li>
                  <li><Link href="/login" className={`text-muted-foreground transition-colors hover:text-heading ${FOCUS_RING}`}>Log in</Link></li>
                  <li><a href="#" className={`text-muted-foreground transition-colors hover:text-heading ${FOCUS_RING}`}>Practice library</a></li>
                  <li><a href="#" className={`text-muted-foreground transition-colors hover:text-heading ${FOCUS_RING}`}>Leaderboard</a></li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-heading">Company</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {["About", "Updates", "Privacy", "Terms"].map((c) => (
                    <li key={c}><a href="#" className={`text-muted-foreground transition-colors hover:text-heading ${FOCUS_RING}`}>{c}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-heading">Get the app</p>
                <div className="mt-4 flex flex-col gap-3">
                  <StoreButton kind="google" />
                  <StoreButton kind="apple" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:px-8">
                <p>© 2026 English Connection · Built for India&apos;s ambitious learners</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}

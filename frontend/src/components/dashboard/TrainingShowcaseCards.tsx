"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, Zap } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { cn } from "@/lib/utils";
import { useWordBankEnabled } from "@/lib/featureFlags";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import TrainEngine from "@/components/jumbleWordsComponent/TrainEngine";
import { PixelMascot } from "@/components/v3/PixelMascot";

// The dashboard "Trainings" cards, reimagined as horizontal rectangles: a
// bespoke illustration fills each card, then a blue gradient + a *progressive*
// blur is laid over it — the blur is maxed and constant across the left 40%
// (so the title/CTA stay crisp-readable) and eases down to ~20% of that max at
// the right edge, where each illustration's focal point sits and shows through.

// The blur layer's mask doubles as its opacity ramp: 1.0 over the left 40%
// (full blur), then down to 0.2 at the far right (≈20% of max blur).
const BLUR_MASK =
  "linear-gradient(to right, #000 0%, #000 40%, rgba(0,0,0,0.2) 100%)";
// Per-card accent gradient — strong on the left (under the text), fading right
// so the illustration shows through. Each card keeps its own colour.
// Per-card tints driven by theme-aware CSS vars (see globals.css): the original
// muted accents in dark, vibrant Lumina color blocks in light.
const TINTS = {
  jumble: "var(--tint-jumble)",
  pron: "var(--tint-pron)",
  ai: "var(--tint-ai)",
  lead: "var(--tint-lead)",
  wordbank: "var(--tint-wordbank)",
} as const;

// On hover the card drops its accent for a neutral dark-grey wash + lighter blur.
const DARK_TINT =
  "linear-gradient(to right, rgba(17,24,39,0.85) 0%, rgba(31,41,55,0.62) 40%, rgba(31,41,55,0.16) 100%)";
const BLUR_MAX = 9; // px; eased to ~80% on hover

// True when the device has a real hovering pointer (a mouse/trackpad). Touch
// devices report false — we use that to choose hover-driven vs always-on
// animations. Updates live if the capability changes (e.g. a mouse is paired).
function useHasHover() {
  const [hasHover, setHasHover] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHasHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return hasHover;
}

// True below the md breakpoint (< 768px) — drives mobile-only spacing tweaks
// in the train scene (where inline styles can't use responsive classes).
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

// Free/Pro status pill, top-right of each card — same white-pill look as the
// /v3/premium PRO badge. `tier` is data-driven (see CARDS) so the free↔pro
// state can later be wired to the user's plan / a feature flag.
function TierBadge({ tier }: { tier: "free" | "pro" }) {
  return tier === "pro" ? (
    <span className="absolute right-3.5 top-3.5 z-20 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-gray-900 shadow-sm">
      PRO
    </span>
  ) : (
    <span className="absolute right-3.5 top-3.5 z-20 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white ring-1 ring-white/30 backdrop-blur-sm">
      FREE
    </span>
  );
}

function ShowcaseCard({
  href,
  title,
  subtitle,
  tint,
  Scene,
  active,
  tier = "free",
  onClick,
}: {
  href: string;
  title: string;
  subtitle: string;
  tint: string;
  Scene: React.ComponentType<{ hovered: boolean }>;
  active?: boolean;
  tier?: "free" | "pro";
  // Lets a caller intercept the navigation (the AI Partner card cancels it and
  // pops the "we're upgrading" modal while the feature is flag-gated off).
  onClick?: (e: React.MouseEvent) => void;
}) {
  const hasHover = useHasHover();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // `active` (mobile carousel) is the currently-centered slide: driving the
  // scene off it makes the one-shot intros (ring count-up, podium grow) REPLAY
  // each time the card scrolls into view, and keeps the looping scenes running
  // while shown. Without it (desktop grid): mouse → hover-driven; touch (no
  // hover) → always-on. A tap always flashes the dark wash as feedback.
  const animate = active !== undefined ? active : hasHover ? hovered : true;
  const darkTint = hasHover ? hovered : pressed;
  const blur = animate ? BLUR_MAX * 0.8 : BLUR_MAX;

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="group relative block h-[210px] overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_10px_28px_-8px_rgba(20,28,46,0.3)] transition-transform hover:scale-[1.01] dark:shadow-none md:h-[190px]"
    >
      {/* Illustration — animates on hover (mouse) or continuously (touch) */}
      <div className="absolute inset-0">
        <Scene hovered={animate} />
      </div>

      {/* Progressive blur — max & constant for the left 40%, easing to 20% at
          the right. Lightens by 20% on hover. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          maskImage: BLUR_MASK,
          WebkitMaskImage: BLUR_MASK,
          transition: "backdrop-filter 250ms ease",
        }}
      />

      {/* Tint — per-card accent normally, neutral dark-grey on hover */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: darkTint ? DARK_TINT : tint, transition: "background 250ms ease" }}
      />

      {/* Free/Pro status pill */}
      <TierBadge tier={tier} />

      {/* Content */}
      <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-between p-6 md:p-5">
        <div>
          <h3 className="text-2xl font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] md:text-base">
            {title}
          </h3>
          <p className="mt-1.5 text-base text-white/80 md:mt-1 md:text-sm">{subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-base font-semibold text-white transition-transform group-hover:translate-x-1 md:gap-1 md:text-sm">
          Start <ArrowRight className="h-5 w-5 md:h-4 md:w-4" />
        </span>
      </div>
    </Link>
  );
}

// Tiny rail-car coaches for the Jumble card — the same look as the game's
// TrainBand coaches (roof, lit windows, the word, spinning wheels), scaled to
// ride beside this card's 0.45 engine. Colours mirror the game's coach palette
// so the two trains feel like one world.
const MINI_COACHES = [
  { roof: "linear-gradient(#7a5da0,#3a2555)", body: "linear-gradient(#5D3A7A,#2D1942)", text: "#f0ecff" },
  { roof: "linear-gradient(#3a9eaa,#184f56)", body: "linear-gradient(#297A85,#113D42)", text: "#e6fbff" },
  { roof: "linear-gradient(#c0824a,#6a3e1c)", body: "linear-gradient(#9C6339,#4F2D14)", text: "#fff0dd" },
] as const;

const COACH_WHEEL =
  "radial-gradient(circle at 50% 50%,#999 0 1.5px,transparent 1.5px)," +
  "conic-gradient(from 0deg,#555 0deg,#333 45deg,#555 90deg,#333 135deg,#555 180deg,#333 225deg,#555 270deg,#333 315deg,#555 360deg)";

function MiniCoach({ word, index }: { word: string; index: number }) {
  const pal = MINI_COACHES[index % MINI_COACHES.length];
  return (
    <div className="flex flex-col items-center">
      {/* roof — slightly wider than the body, like the game's coaches */}
      <div
        className="h-[4px] w-[calc(100%+5px)] rounded-t-[3px] rounded-b-[1px] border border-black/35"
        style={{ background: pal.roof }}
      />
      {/* body: lit windows + the word */}
      <div
        className="flex min-w-[34px] flex-col items-center gap-[2px] rounded-[3px] border border-black/40 px-1.5 pb-[3px] pt-[2px] shadow"
        style={{ background: pal.body, color: pal.text }}
      >
        <div className="flex gap-[2px]">
          {[0, 1, 2].map((k) => (
            <span
              key={k}
              className="h-[5px] w-[6px] rounded-[1px] border border-black/30"
              style={{ background: "linear-gradient(180deg,rgba(164,222,232,0.7),rgba(90,143,192,0.35))" }}
            />
          ))}
        </div>
        <span className="text-[7px] font-extrabold leading-none tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          {word}
        </span>
      </div>
      {/* wheels — spin on hover (paused with the rest of the scene at rest) */}
      <div className="-mt-px flex gap-[13px]">
        {[0, 1].map((k) => (
          <span
            key={k}
            className="h-[7px] w-[7px] rounded-full border border-[#0A0A0A] animate-[spin-wheel_0.5s_linear_infinite]"
            style={{ background: COACH_WHEEL }}
          />
        ))}
      </div>
    </div>
  );
}

// 1 — Jumble Words: a little train hauling word-coaches past a green signal.
export function JumbleScene({ hovered }: { hovered: boolean }) {
  // Treadmill effect: while hovered, slide the sleeper ties left so the
  // (stationary) train reads as moving — the same ground motion as the game's
  // track. Frozen in place when not hovered, like the rest of this card.
  const isMobile = useIsMobile();
  const sleepersRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    if (!hovered) return;
    const el = sleepersRef.current;
    if (!el) return;
    let raf = 0;
    let last = 0;
    const SPEED = 90; // px/s the ground slides
    const PERIOD = 26; // one tie + gap — wrap here to keep it seamless
    const tick = (ts: number) => {
      if (last) {
        posRef.current -= (SPEED * (ts - last)) / 1000;
        if (posRef.current <= -PERIOD) posRef.current += PERIOD;
        el.style.backgroundPositionX = `${posRef.current}px`;
      }
      last = ts;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered]);

  return (
    <div className={cn("absolute inset-0 bg-[#0a1018]", !hovered && "[&_*]:![animation-play-state:paused]")}>
      {/* track + sleepers */}
      <div className="absolute inset-x-0 bottom-7 h-[3px] bg-gradient-to-b from-[#9aa0a8] to-[#4b4f57]" />
      <div
        ref={sleepersRef}
        className="absolute inset-x-0 bottom-[18px] h-2 opacity-40"
        style={{ backgroundImage: "repeating-linear-gradient(90deg,#3D2920 0 8px,transparent 8px 26px)" }}
      />
      {/* buffer-stop signal — the same one from the game's train world. Red
          ("stop") at rest, flipping to green ("go") on hover via the real
          .train-buffer / --go classes (the lights cross-fade via their CSS
          transition). Scaled and re-anchored to the end of this card's track. */}
      <div
        className={cn("train-buffer", hovered && "train-buffer--go")}
        style={{ right: isMobile ? 4 : 10, bottom: 52, transform: "scale(0.58)", transformOrigin: "right bottom" }}
      />
      {/* word coaches + engine (engine leads on the right) */}
      <div className="absolute bottom-[24px] right-12 flex items-end gap-0.5 md:gap-1">
        {["English", "speak", "I"].map((w, i) => (
          <MiniCoach key={w} word={w} index={i} />
        ))}
        <div className="relative -ml-1" style={{ width: 72, height: 54 }}>
          <div className="absolute bottom-0 left-0 origin-bottom-left scale-[0.45]">
            <TrainEngine />
          </div>
        </div>
      </div>
    </div>
  );
}

// 2 — Pronunciation: the scored-feedback card — accuracy ring + word chips.
export function PronunciationScene({ hovered }: { hovered: boolean }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const TARGET = 92;
  const START = 50;
  // Rests at a full 92% green ring; on hover it snaps to 50% and sweeps/counts
  // back up to 92%. rAF-driven so the label can tick along with the ring.
  const [pct, setPct] = useState(TARGET);
  const pctRef = useRef(TARGET);

  useEffect(() => {
    const to = TARGET;
    const from = hovered ? START : pctRef.current;
    const duration = hovered ? 950 : 420;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const v = from + (to - from) * easeOut(p);
      pctRef.current = v;
      setPct(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered]);

  return (
    <div className={cn("absolute inset-0 bg-[#0a1018]", !hovered && "[&_*]:![animation-play-state:paused]")}>
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
        {/* accuracy ring */}
        <div className="relative h-[86px] w-[86px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke="#34d399"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-white">
            {Math.round(pct)}%
          </span>
        </div>
        {/* word chips */}
        <div className="flex max-w-[150px] flex-wrap justify-center gap-1">
          {([
            ["sophisticated", "ok"],
            ["often", "ok"],
            ["quick", "warn"],
          ] as const).map(([w, kind]) => (
            <span
              key={w}
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[9px] font-semibold",
                kind === "ok"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300",
              )}
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3 — AI Partner: a chat snippet, the mascot front-and-centre, XP ticking up.
export function AiPartnerScene({ hovered }: { hovered: boolean }) {
  return (
    <div className={cn("absolute inset-0 bg-[#0a1018]", !hovered && "[&_*]:![animation-play-state:paused]")}>
      {/* mascot — the focal point, far right; frozen until hovered */}
      <div className="absolute right-3 -translate-y-1/2" style={{ top: "calc(50% + 20px)" }}>
        <PixelMascot emotion="happy" size={66} paused={!hovered} />
      </div>
      {/* chat bubbles */}
      <div className="absolute left-[38%] top-5 flex w-[150px] flex-col gap-1.5">
        <div className="self-start rounded-2xl rounded-bl-sm bg-white/12 px-2.5 py-1.5 text-[10px] leading-snug text-white/85 dark:bg-surface-2 dark:text-heading">
          Try: &ldquo;I&apos;d like to add a point.&rdquo;
        </div>
        <div className="self-end rounded-2xl rounded-br-sm bg-black/35 px-2.5 py-1.5 text-[10px] leading-snug text-white dark:bg-primary/25 dark:text-heading">
          I&apos;d like to add a point.
        </div>
      </div>
      {/* XP gain */}
      <div className="absolute bottom-3 left-[38%] inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
        <Zap className="h-3 w-3" /> +40 XP
      </div>
    </div>
  );
}

// 4 — Leaderboard: weekly top-3 podium with a crown + per-player stats.
const PODIUM = [
  { rank: 3, name: "Rup", xp: "1500", h: 34, color: "#b45309" },
  { rank: 1, name: "Aadi", xp: "2400", h: 62, color: "#f59e0b" },
  { rank: 2, name: "Amit", xp: "1800", h: 44, color: "#9ca3af" },
] as const;

export function LeaderboardScene({ hovered }: { hovered: boolean }) {
  // Rests with the podium fully grown and the crown shown. On hover the bars
  // snap to 0 and grow back up; once fully grown the crown pops onto rank 1.
  const [t, setT] = useState(1);
  const tRef = useRef(1);

  useEffect(() => {
    const to = 1;
    const from = hovered ? 0 : tRef.current;
    const duration = hovered ? 800 : 360;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const v = from + (to - from) * easeOut(p);
      tRef.current = v;
      setT(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered]);

  // Crown only once the bars have fully risen (and at rest, where t === 1).
  const showCrown = t >= 0.999;

  return (
    <div className={cn("absolute inset-0 bg-[#0a1018]", !hovered && "[&_*]:![animation-play-state:paused]")}>
      <div className="absolute bottom-3 right-4 flex items-end gap-2">
        {PODIUM.map((p) => (
          <div key={p.rank} className="flex w-[52px] flex-col items-center gap-0.5">
            <span className="flex h-4 items-center justify-center text-sm leading-none">
              {p.rank === 1 ? (
                <span
                  className="transition-all duration-300 ease-out"
                  style={{
                    opacity: showCrown ? 1 : 0,
                    transform: showCrown ? "scale(1) translateY(0)" : "scale(0.4) translateY(4px)",
                  }}
                >
                  👑
                </span>
              ) : null}
            </span>
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-[#0b0e14]"
              style={{ background: p.color }}
            >
              {p.name[0]}
            </span>
            <span className="text-[10px] font-semibold text-white">{p.name}</span>
            <span className="text-[9px] text-white/60">{p.xp} XP</span>
            <div
              className="mt-0.5 w-full overflow-hidden rounded-t bg-gradient-to-t from-white/[0.06] to-white/25"
              style={{ height: p.h * t }}
            >
              <div className="pt-1 text-center text-[11px] font-black text-white">{p.rank}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5 — Word Bank: a small stack of saved word-tiles that fan out on hover.
export function WordBankScene({ hovered }: { hovered: boolean }) {
  const words = ["eloquent", "vivid", "nuance"];
  return (
    <div className="absolute inset-0 bg-[#0a1018]">
      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-end gap-1.5">
        {words.map((w, i) => (
          <span
            key={w}
            className="rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-transform duration-500"
            style={{
              transform: hovered ? `translateX(${i * -7}px)` : "translateX(0)",
              transitionDelay: `${i * 60}ms`,
            }}
          >
            {w}
          </span>
        ))}
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white/70">
          <BookMarked className="h-3.5 w-3.5" /> saved
        </span>
      </div>
    </div>
  );
}

// Shared card list — used by both the desktop grid and the mobile carousel.
// The corner badge's free/pro state comes from the caller's `isPro` (the
// user's plan), applied uniformly to every card below. The Word Bank card is
// flag-gated off in both mappers below (WORD_BANK_HREF), so it only appears
// once the englishconnection-word-bank flag is switched on.
const WORD_BANK_HREF = "/dashboard/word-bank";
const AI_PARTNER_HREF = "/dashboard/ai-partner";
const CARDS = [
  { href: "/dashboard/jumble", title: "Jumble Words", subtitle: "Build sentences", tint: TINTS.jumble, Scene: JumbleScene },
  { href: "/dashboard/pronunciation", title: "Pronunciation", subtitle: "Train your speech", tint: TINTS.pron, Scene: PronunciationScene },
  { href: AI_PARTNER_HREF, title: "AI Partner", subtitle: "Practice speaking", tint: TINTS.ai, Scene: AiPartnerScene },
  { href: "/dashboard/leaderboard", title: "Leaderboard", subtitle: "See where you rank", tint: TINTS.lead, Scene: LeaderboardScene },
  { href: WORD_BANK_HREF, title: "Word Bank", subtitle: "Save & practice words", tint: TINTS.wordbank, Scene: WordBankScene },
] as const;

// Tablet + desktop (≥ md): the full 2-/4-up grid.
export function TrainingShowcaseCards({ isPro = false }: { isPro?: boolean }) {
  const tier = isPro ? "pro" : "free";
  const wordBankOn = useWordBankEnabled();
  const { guard } = useAIPartnerGate();
  const cards = wordBankOn ? CARDS : CARDS.filter((c) => c.href !== WORD_BANK_HREF);
  return (
    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <ShowcaseCard
          key={c.title}
          {...c}
          tier={tier}
          onClick={c.href === AI_PARTNER_HREF ? guard : undefined}
        />
      ))}
    </div>
  );
}

// Mobile (< md): one full-width card at a time in an infinite, auto-advancing
// carousel. Swipe/drag left-right to move; autoplay keeps it looping on its own
// and resumes after a manual swipe.
export function TrainingShowcaseCarousel({ isPro = false }: { isPro?: boolean }) {
  const tier = isPro ? "pro" : "free";
  const wordBankOn = useWordBankEnabled();
  const { guard } = useAIPartnerGate();
  const cards = wordBankOn ? CARDS : CARDS.filter((c) => c.href !== WORD_BANK_HREF);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 3000, stopOnInteraction: false })],
  );
  // Track the centered slide so each card replays its intro as it scrolls in.
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="overflow-hidden md:hidden" ref={emblaRef}>
      <div className="flex">
        {cards.map((c, i) => (
          <div key={c.title} className="min-w-0 flex-[0_0_100%]">
            {/* active replays this card's intro whenever it becomes centered */}
            <ShowcaseCard
              {...c}
              active={i === selected}
              tier={tier}
              onClick={c.href === AI_PARTNER_HREF ? guard : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

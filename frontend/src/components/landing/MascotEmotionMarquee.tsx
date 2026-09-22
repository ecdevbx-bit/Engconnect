"use client";

import { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";

// Infinite, center-focused emotion showcase. The whole MascotEmotion range is
// scrolled past a fixed centre: the middle mascot is crisp, and each step out
// (left/right) gets progressively blurred, smaller, and dimmer — underlining
// how much the coach reads and reacts to how the learner feels.

const EMOTIONS: { emotion: MascotEmotion; label: string; caption: string }[] = [
  { emotion: "greeting", label: "Greeting", caption: "Welcomes you back" },
  { emotion: "happy", label: "Happy", caption: "Celebrates your wins" },
  { emotion: "love", label: "Proud", caption: "Roots for you" },
  { emotion: "idea", label: "Idea", caption: "Sparks new angles" },
  { emotion: "tips", label: "Tips", caption: "Shares gentle nudges" },
  { emotion: "surprised", label: "Surprised", caption: "Cheers breakthroughs" },
  { emotion: "thinking", label: "Thinking", caption: "Works it through with you" },
  { emotion: "asking", label: "Curious", caption: "Asks to understand you" },
  { emotion: "conversing", label: "Talking", caption: "Keeps the chat flowing" },
  { emotion: "confused", label: "Confused", caption: "Sits with the tricky bits" },
  { emotion: "sad", label: "Gentle", caption: "Feels your setbacks" },
  { emotion: "scared", label: "Nervous", caption: "Steadies your nerves" },
  { emotion: "angry", label: "Determined", caption: "Never gives up on you" },
  { emotion: "idle", label: "Present", caption: "Always here for you" },
];

export function MascotEmotionMarquee() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", containScroll: false },
    [Autoplay({ delay: 1900, stopOnInteraction: false })],
  );

  // Recompute per-slide focus (blur / scale / opacity) from each slide's
  // distance to the viewport centre. Runs on every scroll frame so the focus
  // glides smoothly as slides pass through the middle.
  const applyFocus = useCallback(() => {
    if (!emblaApi) return;
    const root = emblaApi.rootNode().getBoundingClientRect();
    const center = root.left + root.width / 2;
    const half = root.width / 2 || 1;

    for (const node of emblaApi.slideNodes()) {
      const inner = node.firstElementChild as HTMLElement | null;
      if (!inner) continue;
      const rect = node.getBoundingClientRect();
      const nodeCenter = rect.left + rect.width / 2;
      // 0 at the centre → 1 near the edges.
      const t = Math.min(1, Math.abs(nodeCenter - center) / (half * 0.9));
      inner.style.filter = `blur(${(t * t * 8).toFixed(2)}px)`;
      inner.style.transform = `scale(${(1 - t * 0.34).toFixed(3)})`;
      inner.style.opacity = (1 - t * 0.72).toFixed(3);
      node.style.zIndex = String(Math.round(100 - t * 100));
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    applyFocus();
    emblaApi.on("scroll", applyFocus).on("reInit", applyFocus);
    return () => {
      emblaApi.off("scroll", applyFocus).off("reInit", applyFocus);
    };
  }, [emblaApi, applyFocus]);

  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-[1280px] px-5 text-center md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Made to care
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-heading md:text-5xl">
          An AI that feels it with you
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-body md:text-lg">
          Your coach reads the moment and reacts — celebrating wins, steadying
          nerves, and staying right beside you through every slip.
        </p>
      </div>

      {/* Edge fade so the blurred tails dissolve into the page. */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y items-center py-6">
            {EMOTIONS.map((e) => (
              <div
                key={e.emotion}
                className="relative flex-[0_0_64%] sm:flex-[0_0_40%] md:flex-[0_0_20%]"
              >
                <div className="mx-2 flex flex-col items-center will-change-transform md:mx-3">
                  <div className="grid aspect-square w-full max-w-[180px] place-items-center rounded-[28px] c-box">
                    <PixelMascot emotion={e.emotion} size={132} />
                  </div>
                  <p className="mt-4 text-base font-bold text-heading">{e.label}</p>
                  <p className="text-sm text-muted-foreground">{e.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent md:w-40" />
      </div>
    </section>
  );
}

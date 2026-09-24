"use client";

import { useEffect } from "react";

// FigurePlayer — the only script behind the landing's figures (they are plain
// server-rendered HTML/SVG animated by CSS). It watches every `[data-fig]` and
// sets `data-play` while the figure is on screen, which is what switches its
// CSS animations on (landing/figures/figureStyles). So:
//   • a figure's little story starts from the beginning when you reach it,
//   • nothing animates off screen,
//   • without JS or with reduced motion, figures simply show their finished
//     state (the un-animated styles ARE the end state).
// Renders nothing.
export function FigurePlayer() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const figs = document.querySelectorAll<HTMLElement>(".lp [data-fig]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          // Start once a good part is visible; stop only when fully gone, so a
          // small scroll never restarts a figure mid-story.
          if (e.isIntersecting && e.intersectionRatio >= 0.25) el.dataset.play = "";
          else if (!e.isIntersecting) delete el.dataset.play;
        }
      },
      { threshold: [0, 0.25] },
    );
    figs.forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, []);

  return null;
}

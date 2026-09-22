"use client";

import { useLayoutEffect } from "react";

// ScrollSwipe — the landing's two scroll-scrubbed horizontal "swipes" (the
// owner's favourite bit of the previous landing), restored with the same GSAP
// ScrollTrigger settings:
//   • StepsSwipe   — desktop (>= 1024px) only: the feature section pins and its
//                    three panels slide sideways as you scroll (scrub 1), with a
//                    gentle vertical parallax on each panel's copy.
//   • ReviewsSwipe — every width: the review cards drift sideways as the
//                    section scrolls past (scrub 1, not pinned).
//
// To keep the page light, GSAP is NOT in the initial bundle: it is imported on
// demand (desktop: right after mount for the pinned act; reviews: when the
// section gets close) and never for prefers-reduced-motion. Until it runs — or
// if it never does — the markup keeps its static layout (stacked panels; a
// natively scrollable review row), so nothing is ever hidden. The swipe layout
// is switched on with `data-swipe="on"` (CSS in landingStyles). These
// components render nothing; they drive server-rendered markup found by id.

type Gsap = typeof import("gsap").gsap;

let loader: Promise<Gsap> | null = null;

function loadGsap(): Promise<Gsap> {
  if (!loader) {
    loader = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, st]) => {
      g.gsap.registerPlugin(st.ScrollTrigger);
      // Lazy sections can change the page height after triggers are measured;
      // re-measure (debounced) whenever the document resizes.
      let t: ReturnType<typeof setTimeout> | undefined;
      new ResizeObserver(() => {
        clearTimeout(t);
        t = setTimeout(() => st.ScrollTrigger.refresh(), 200);
      }).observe(document.body);
      return g.gsap;
    });
  }
  return loader;
}

const DESKTOP = "(min-width: 1024px)";
const REDUCE = "(prefers-reduced-motion: reduce)";
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Pinned horizontal act for the feature panels (desktop only). */
export function StepsSwipe({ targetId }: { targetId: string }) {
  // Layout effect so the cleanup (which unwraps GSAP's pin-spacer) runs before
  // React removes the DOM.
  useLayoutEffect(() => {
    const sec = document.getElementById(targetId);
    const track = sec?.querySelector<HTMLElement>("[data-swipe-track]");
    if (!sec || !track) return;

    const desktop = window.matchMedia(DESKTOP);
    const reduce = window.matchMedia(REDUCE);
    let revert: (() => void) | undefined;
    let cancelled = false;
    let started = false;

    // Start once the conditions first hold; after that gsap.matchMedia takes
    // over (it reverts/re-applies as the window crosses the breakpoint).
    const maybeStart = () => {
      if (started || !desktop.matches || reduce.matches) return;
      started = true;
      void setupSteps(sec, track).then((r) => {
        if (cancelled) r();
        else revert = r;
      });
    };
    maybeStart();
    desktop.addEventListener("change", maybeStart);
    reduce.addEventListener("change", maybeStart);

    return () => {
      cancelled = true;
      desktop.removeEventListener("change", maybeStart);
      reduce.removeEventListener("change", maybeStart);
      revert?.();
    };
  }, [targetId]);

  return null;
}

async function setupSteps(sec: HTMLElement, track: HTMLElement): Promise<() => void> {
  const gsap = await loadGsap();
  const panels = gsap.utils.toArray<HTMLElement>("[data-swipe-panel]", track);
  let range: { start: number; end: number } | null = null;

  const mm = gsap.matchMedia();
  mm.add({ isDesktop: DESKTOP, motionOk: MOTION_OK }, (ctx) => {
    const { isDesktop, motionOk } = (ctx.conditions ?? {}) as Record<string, boolean>;
    if (!isDesktop || !motionOk) return;

    sec.dataset.swipe = "on";
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
    range = horiz.scrollTrigger ?? null;

    // Copy drifts up a touch as each panel crosses the screen.
    panels.forEach((panel) => {
      const meta = panel.querySelector<HTMLElement>("[data-swipe-meta]");
      if (!meta) return;
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
    });

    return () => {
      range = null;
      delete sec.dataset.swipe;
    };
  });

  // In-page links to a panel (#jumble-words…) can't scroll to a panel that is
  // translated sideways — jump to that panel's point in the pinned act instead.
  const ids = panels.map((p) => p.id).filter(Boolean);
  const onClick = (e: MouseEvent) => {
    if (!range) return;
    const a = (e.target as Element | null)?.closest?.("a[href^='#']");
    const i = a ? ids.indexOf(a.getAttribute("href")!.slice(1)) : -1;
    if (i < 0) return;
    e.preventDefault();
    const top = range.start + ((range.end - range.start) * i) / Math.max(1, ids.length - 1);
    window.scrollTo({ top, behavior: window.matchMedia(REDUCE).matches ? "auto" : "smooth" });
    history.replaceState(null, "", `#${ids[i]}`);
  };
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
    mm.revert();
  };
}

/** Review cards scrubbing sideways as the section scrolls past (all widths). */
export function ReviewsSwipe({ targetId }: { targetId: string }) {
  useLayoutEffect(() => {
    const sec = document.getElementById(targetId);
    const view = sec?.querySelector<HTMLElement>("[data-swipe-viewport]");
    const track = sec?.querySelector<HTMLElement>("[data-swipe-track]");
    if (!sec || !view || !track || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia(REDUCE).matches) return; // keep the plain, scrollable row

    let revert: (() => void) | undefined;
    let cancelled = false;

    // Only fetch GSAP when the reviews are getting close.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void loadGsap().then((gsap) => {
          if (cancelled) return;
          const mm = gsap.matchMedia();
          mm.add(MOTION_OK, () => {
            sec.dataset.swipe = "on";
            view.scrollLeft = 0;
            gsap.fromTo(
              track,
              { x: 0 },
              {
                x: () => -(track.scrollWidth - view.clientWidth),
                ease: "none",
                scrollTrigger: { trigger: sec, start: "top 65%", end: "bottom top", scrub: 1, invalidateOnRefresh: true },
              },
            );
            return () => {
              delete sec.dataset.swipe;
            };
          });
          revert = () => mm.revert();
        });
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(sec);

    return () => {
      cancelled = true;
      io.disconnect();
      revert?.();
    };
  }, [targetId]);

  return null;
}

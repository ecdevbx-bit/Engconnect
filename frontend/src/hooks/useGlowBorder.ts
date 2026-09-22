"use client";

import { useEffect, useRef } from "react";

/**
 * useGlowBorder — pointer-following glow border for `.glass-glow` panels.
 *
 * Returns a ref to attach to a containing element. While the pointer moves over
 * that container, the single nearest `.glass-glow` descendant lights up: the
 * hook computes the angle from that card's centre toward the pointer (via
 * `Math.atan2`) and writes it to `--glow-start`, and sets `--glow-opacity`.
 * Every other card fades its glow out.
 *
 * Usage:
 *   const ref = useGlowBorder();
 *   <section ref={ref}> …cards with the `glass-glow` class… </section>
 */
export function useGlowBorder<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;

    function handleMove(e: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cards = container!.querySelectorAll<HTMLElement>(".glass-glow");
        if (cards.length === 0) return;

        let nearest: HTMLElement | null = null;
        let nearestDist = Infinity;

        cards.forEach((card) => {
          const r = card.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          // distance from pointer to the card's nearest edge point
          const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
          const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
          const dist = Math.hypot(dx, dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = card;
          }
          // angle from card centre toward the pointer
          const angle =
            (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
          card.style.setProperty("--glow-start", String(angle - 45));
        });

        cards.forEach((card) => {
          const lit = card === nearest && nearestDist < 220;
          card.style.setProperty("--glow-opacity", lit ? "1" : "0");
        });
      });
    }

    function handleLeave() {
      cancelAnimationFrame(raf);
      container!
        .querySelectorAll<HTMLElement>(".glass-glow")
        .forEach((card) => card.style.setProperty("--glow-opacity", "0"));
    }

    window.addEventListener("pointermove", handleMove);
    container.addEventListener("pointerleave", handleLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return ref;
}

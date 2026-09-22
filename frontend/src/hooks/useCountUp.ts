"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — animates a number toward `target` whenever it changes.
 * Used for the score readout so XP gains tick up instead of snapping.
 */
export function useCountUp(target: number, duration = 650) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;
    if (from === to) return;

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

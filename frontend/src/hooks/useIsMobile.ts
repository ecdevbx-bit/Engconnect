"use client";

import { useEffect, useState } from "react";

// Shared "is this a small (mobile) viewport" hook. Mirrors the matchMedia
// pattern duplicated in TrainingShowcaseCards / ActivityHeatmap / etc. Defaults
// to the Tailwind md breakpoint (<768px). Starts false so SSR + first paint are
// stable; flips on mount once we can read the media query.
export function useIsMobile(query = "(max-width: 767px)"): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return isMobile;
}

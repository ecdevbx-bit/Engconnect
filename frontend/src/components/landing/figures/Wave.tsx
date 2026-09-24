import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

// A row of rounded bars that reads as speech. Heights are deterministic (a
// seeded sine mix under a soft envelope), so the server HTML is stable and two
// waves with different seeds never look identical. With `live`, each bar
// breathes (CSS `lp-talk`, transform only) — but only while its figure is on
// screen (`[data-play]`, set by landing/FigurePlayer) and never for reduced
// motion. Colour comes from `currentColor`; size from --wh (height), --bw (bar
// width) and --gap, all overridable through `style`.
export function Wave({
  n = 28,
  seed = 1,
  live = false,
  spread = false,
  className,
  style,
}: {
  n?: number;
  seed?: number;
  live?: boolean;
  /** Spread the bars across the full width (timeline segments). */
  spread?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("lp-wave", spread && "lp-wave-spread", className)}
      data-live={live ? "" : undefined}
      style={style}
    >
      {bars(n, seed).map((h, i) => (
        <i key={i} style={{ "--h": h, "--i": i } as CSSProperties} />
      ))}
    </span>
  );
}

/** Typed inline CSS custom properties: `style={cssVars({ "--wh": "26px" })}`. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}

export function bars(n: number, seed: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const env = Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 0.55);
    const v = Math.abs(Math.sin(i * 1.73 + seed) * Math.cos(i * 0.41 + seed * 2.3));
    return Math.round((0.16 + 0.84 * env * (0.3 + 0.7 * v)) * 1000) / 1000;
  });
}

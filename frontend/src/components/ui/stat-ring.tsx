import { cn } from "@/lib/utils";

/**
 * StatRing — a number inside a progress circle ("12 min", "2/3"), the
 * picture-first way to show an amount (D-071: numbers and shapes, not
 * sentences). `value` is 0..1 of the ring that is filled. Pure SVG + CSS.
 */
export function StatRing({
  value,
  label,
  unit,
  size = 64,
  stroke = 7,
  color = "var(--primary)",
  ariaLabel,
  className,
}: {
  value: number;
  label: string;
  unit?: string;
  size?: number;
  stroke?: number;
  color?: string;
  ariaLabel: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className="relative flex flex-col items-center leading-none" aria-hidden>
        <span className="font-display font-extrabold text-heading tabular-nums" style={{ fontSize: Math.round(size * 0.3) }}>
          {label}
        </span>
        {unit && (
          <span className="mt-0.5 font-bold text-muted-foreground" style={{ fontSize: Math.max(11, Math.round(size * 0.17)) }}>
            {unit}
          </span>
        )}
      </span>
    </span>
  );
}

/** Seconds → the ring's number + unit: "12" "min", or "45" "sec" under a minute. */
export function minutesLabel(seconds: number): { label: string; unit: string } {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return { label: String(s), unit: "sec" };
  return { label: String(Math.floor(s / 60)), unit: "min" };
}

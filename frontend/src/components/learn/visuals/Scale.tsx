import type { ScaleVisual } from "@/content/learn/types";

import { Inline, plain } from "../Inline";
import { TONE } from "../palette";

// A strength meter per item — certainty, formality, likelihood, price… Each
// row: the phrase, then a bar filled to its value on the low → high scale.
export function Scale({ v }: { v: ScaleVisual }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground" aria-hidden>
        <span>{v.low}</span>
        <span className="h-1.5 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #8b5cf6, var(--primary))", opacity: 0.55 }} />
        <span className="text-heading">{v.high}</span>
      </div>
      <ul className="space-y-3">
        {v.items.map((it, i) => {
          const color = it.tone ? TONE[it.tone] : undefined;
          return (
            <li key={i} className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_40%] sm:items-center">
              <div>
                <p className="text-[15px] font-semibold leading-snug text-heading">
                  <Inline text={it.text} />
                </p>
                {it.note && <p className="text-xs text-muted-foreground">{it.note}</p>}
              </div>
              <div
                role="img"
                aria-label={`${plain(it.text)}: about ${Math.round(it.value)}% toward “${v.high}”`}
                className="relative h-2.5 rounded-full bg-surface-3"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.max(3, Math.min(100, it.value))}%`,
                    background: color ?? "linear-gradient(90deg, #8b5cf6, var(--primary))",
                  }}
                />
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-1 bg-heading"
                  style={{ left: `${Math.max(3, Math.min(97, it.value))}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

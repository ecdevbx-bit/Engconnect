import { ArrowRight } from "lucide-react";

import type { TransformVisual } from "@/content/learn/types";

import { Inline } from "../Inline";

// Before → after pairs (active → passive, direct → reported…). Short word
// pairs (go → went) pack into a grid of tiles; sentences get one row each —
// side by side on wider screens, "before" over "→ after" on a phone.
export function Transform({ v }: { v: TransformVisual }) {
  const compact = v.pairs.every((p) => !p.note && p.from.length <= 14 && p.to.length <= 14);

  const header = (
    <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      <span>{v.from}</span>
      <ArrowRight className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span className="sr-only">becomes</span>
      <span className="text-heading">{v.to}</span>
    </p>
  );

  if (compact) {
    return (
      <div>
        {header}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {v.pairs.map((p, i) => (
            <li key={i} className="flex items-center justify-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[15px]">
              <span className="text-body">
                <Inline text={p.from} />
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span className="sr-only">becomes</span>
              <span className="font-bold text-heading">
                <Inline text={p.to} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      {header}
      <ul className="divide-y divide-border">
        {v.pairs.map((p, i) => (
          <li
            key={i}
            className="grid gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"
          >
            <span className="text-[15px] leading-snug text-body">
              <Inline text={p.from} />
            </span>
            <ArrowRight className="hidden h-4 w-4 text-primary sm:block" aria-hidden />
            <span className="flex gap-1.5 text-[15px] font-semibold leading-snug text-heading">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:hidden" aria-hidden />
              <span className="sr-only">becomes </span>
              <span>
                <Inline text={p.to} />
              </span>
            </span>
            {p.note && (
              <span className="text-xs text-muted-foreground sm:col-span-3">
                <Inline text={p.note} strongClass="font-bold text-heading" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

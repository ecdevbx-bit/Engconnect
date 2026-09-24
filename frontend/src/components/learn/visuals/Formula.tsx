import type { FormulaVisual } from "@/content/learn/types";

import { Inline } from "../Inline";
import { ROLE, tint } from "../palette";

// A grammar pattern as chips joined by "+" (or "→" for steps). Semantic text,
// so a screen reader reads it in order ("subject plus have / has plus …").
export function Formula({ v }: { v: FormulaVisual }) {
  const join = v.join ?? "+";
  return (
    <div className="space-y-4">
      {v.rows.map((row, ri) => (
        <div key={ri} className={ri > 0 ? "border-t border-border pt-4" : ""}>
          {row.label && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{row.label}</p>
          )}
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {row.parts.map((p, pi) => (
              <span key={pi} className="inline-flex items-center gap-1.5">
                {pi > 0 && (
                  <>
                    <span className="text-base font-bold text-muted-foreground" aria-hidden>
                      {join}
                    </span>
                    <span className="sr-only">{join === "+" ? " plus " : " then "}</span>
                  </>
                )}
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold leading-tight text-heading"
                  style={tint(ROLE[p.role].color)}
                >
                  {p.label && (
                    <span className="rounded bg-heading/10 px-1 text-[10px] font-black uppercase tracking-wide text-heading">
                      {p.label}
                    </span>
                  )}
                  {p.text}
                </span>
              </span>
            ))}
          </p>
          {row.example && (
            <p className="mt-2.5 text-[15px] leading-relaxed text-body">
              <span className="sr-only">Example: </span>
              <Inline text={row.example} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

import type { BlocksVisual, Chip, Role } from "@/content/learn/types";

import { ROLE, tint } from "../palette";

// A sentence as coloured role chips. The first row names every chip's role;
// later rows only name chips with a custom label or a role not seen yet, and a
// legend underneath ties the colours together.

const chipLabel = (c: Chip) => c.label ?? ROLE[c.role].label;

export function Blocks({ v }: { v: BlocksVisual }) {
  // Which chips get a visible role name (decided up front, in reading order).
  const used: Role[] = [];
  const named = v.rows.map((row, ri) =>
    row.chips.map((c) => {
      const isNew = !used.includes(c.role);
      if (isNew) used.push(c.role);
      return ri === 0 || !!c.label || isNew;
    }),
  );

  const aria = v.rows
    .map((r) => r.chips.map((c) => `${chipLabel(c)}: ${c.text}`).join(", ") + (r.note ? ` (${r.note})` : ""))
    .join(". ");

  return (
    <div role="img" aria-label={`Sentence parts. ${aria}.`} className="space-y-3">
      {v.rows.map((row, ri) => (
        <div key={ri} className="flex flex-wrap items-start gap-x-1.5 gap-y-2">
          {row.chips.map((c, ci) => {
            return (
              <span key={ci} className="inline-flex flex-col items-center gap-1">
                <span
                  className="rounded-lg border px-2.5 py-1.5 text-[15px] font-semibold leading-tight text-heading"
                  style={tint(ROLE[c.role].color)}
                >
                  {c.text}
                </span>
                {/* keep label height on rows that name something, so chips stay aligned */}
                {named[ri].some(Boolean) && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground ${named[ri][ci] ? "" : "invisible"}`}
                  >
                    {chipLabel(c)}
                  </span>
                )}
              </span>
            );
          })}
          {row.note && (
            <span className={`self-center text-xs italic text-muted-foreground ${named[ri].some(Boolean) ? "pb-4" : ""}`}>— {row.note}</span>
          )}
        </div>
      ))}
      {v.rows.length > 1 && used.length > 1 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3" aria-hidden>
          {used.map((r) => (
            <span key={r} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm border" style={tint(ROLE[r].color, 45, 80)} />
              {ROLE[r].label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Small constructors so lesson files read like content, not like JSON.
// Chip specs are "CODE:text" joined by "|", e.g. "S:Priya|V:drinks|O:chai".
// A custom label goes in brackets: "X(how often):always".
// Codes: S subject · V verb · H helper · O object · T time · P place ·
// C complement · Q question word · N negative · L link · X other.
// Bad specs throw at import time so a typo can't reach a page silently.

import type {
  BlocksVisual,
  Chip,
  Example,
  FormulaVisual,
  Question,
  Role,
  ScaleVisual,
  TableVisual,
  TimelineMark,
  TimelineVisual,
  Tone,
  TransformVisual,
} from "./types";

const CODES: Record<string, Role> = {
  S: "subject",
  V: "verb",
  H: "helper",
  O: "object",
  T: "time",
  P: "place",
  C: "complement",
  Q: "question",
  N: "negative",
  L: "link",
  X: "other",
};

export function chips(spec: string): Chip[] {
  return spec.split("|").map((part) => {
    const m = /^\s*([A-Z])(?:\(([^)]+)\))?:(.+)$/.exec(part);
    const role = m ? CODES[m[1]] : undefined;
    if (!m || !role || !m[3].trim()) throw new Error(`learn: bad chip "${part}" in "${spec}"`);
    return m[2] ? { text: m[3].trim(), role, label: m[2].trim() } : { text: m[3].trim(), role };
  });
}

/** Rows of role chips. A row may end with " // note". */
export function blocks(rows: string[], caption?: string): BlocksVisual {
  return {
    type: "blocks",
    rows: rows.map((r) => {
      const [spec, note] = r.split(" // ");
      return note ? { chips: chips(spec), note: note.trim() } : { chips: chips(spec) };
    }),
    ...(caption ? { caption } : {}),
  };
}

type FormulaRow = FormulaVisual["rows"][number];

export function f(spec: string, example?: string, label?: string): FormulaRow {
  return { parts: chips(spec), ...(example ? { example } : {}), ...(label ? { label } : {}) };
}

export function formula(rows: FormulaRow[], opts: { caption?: string; join?: string } = {}): FormulaVisual {
  return { type: "formula", rows, ...opts };
}

export function table(head: string[], rows: string[][], opts: { caption?: string; peer?: boolean } = {}): TableVisual {
  for (const r of rows) {
    if (r.length !== head.length) throw new Error(`learn: table row has ${r.length} cells, head has ${head.length}: ${r.join(" / ")}`);
  }
  return { type: "table", head, rows, ...opts };
}

/** A table whose columns are equals (a vs an, many vs much). */
export const peer = (head: string[], rows: string[][]): TableVisual => table(head, rows, { peer: true });

export function transform(from: string, to: string, pairs: [string, string, string?][], caption?: string): TransformVisual {
  return {
    type: "transform",
    from,
    to,
    pairs: pairs.map(([a, b, note]) => (note ? { from: a, to: b, note } : { from: a, to: b })),
    ...(caption ? { caption } : {}),
  };
}

export function timeline(marks: TimelineMark[], opts: { now?: number; caption?: string } = {}): TimelineVisual {
  return { type: "timeline", marks, ...opts };
}

type MarkOpts = { tone?: Tone; side?: "top" | "bottom" };

export const pt = (at: number, label: string, o: MarkOpts = {}): TimelineMark => ({ kind: "point", at, label, ...o });
export const span = (from: number, to: number, label: string, o: MarkOpts & { arrow?: boolean } = {}): TimelineMark => ({
  kind: "span",
  from,
  to,
  label,
  ...o,
});
export const rep = (from: number, to: number, label: string, o: MarkOpts & { count?: number } = {}): TimelineMark => ({
  kind: "repeat",
  from,
  to,
  label,
  ...o,
});

export function scale(low: string, high: string, items: [string, number, string?][], caption?: string): ScaleVisual {
  return {
    type: "scale",
    low,
    high,
    items: items.map(([text, value, note]) => (note ? { text, value, note } : { text, value })),
    ...(caption ? { caption } : {}),
  };
}

export const ex = (right: string, wrong?: string, note?: string): Example => ({
  right,
  ...(wrong ? { wrong } : {}),
  ...(note ? { note } : {}),
});

export const q = (question: string, options: string[], answer: number, why: string): Question => ({
  q: question,
  options,
  answer,
  why,
});

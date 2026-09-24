import { Fragment, type ReactNode } from "react";

// Inline markdown for lesson strings: **bold** (the grammar point, in the
// accent colour) and *italic* (example words). Deliberately tiny instead of a
// full markdown parser: table cells like "+ s" or "1 · Interview" would turn
// into lists there. Safe in server and client components (no hooks).
const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*/g;

export function Inline({ text, strongClass = "font-bold text-primary" }: { text: string; strongClass?: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(<Fragment key={k++}>{text.slice(last, i)}</Fragment>);
    if (m[1] !== undefined) out.push(<strong key={k++} className={strongClass}>{m[1]}</strong>);
    else out.push(<em key={k++} className="italic">{m[2]}</em>);
    last = i + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

/** Plain text (for aria-labels and JSON-LD): markers removed. */
export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { SearchItem } from "./navTypes";
import { ProMark } from "./ProMark";

// Title search over the PUBLIC index only (titles, summaries, track names).
// Results render inline under the box — no floating popover to position.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function LearnSearch({ items, onNavigate }: { items: SearchItem[]; onNavigate?: () => void }) {
  const id = useId();
  const [q, setQ] = useState("");

  const index = useMemo(() => items.map((it) => ({ it, hay: norm(`${it.title} ${it.summary} ${it.track}`) })), [items]);
  const terms = norm(q).split(" ").filter(Boolean);
  const results = terms.length ? index.filter(({ hay }) => terms.every((t) => hay.includes(t))).slice(0, 8) : [];

  return (
    <div role="search">
      <label htmlFor={id} className="sr-only">
        Search lessons
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQ("");
          }}
          placeholder="Search lessons…"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-9 pr-3 text-sm text-heading placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {terms.length > 0 && (
        <div className="mt-2" aria-live="polite">
          {results.length ? (
            <ul className="space-y-1">
              {results.map(({ it }) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={() => {
                      setQ("");
                      onNavigate?.();
                    }}
                    className="flex min-h-11 flex-col justify-center rounded-lg px-3 py-1.5 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-heading">
                      <span className="min-w-0 flex-1 truncate">{it.title}</span>
                      {it.pro && <ProMark locked={it.locked} />}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{it.track}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">No lessons match “{q.trim()}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

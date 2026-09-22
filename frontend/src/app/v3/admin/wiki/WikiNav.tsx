"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Group = { label: string; pages: { id: string; title: string; href: string }[] };

// Wiki sidebar: search + grouped page list. On phones it collapses into a
// "Browse pages" disclosure above the article.
export default function WikiNav({ groups, currentId }: { groups: Group[]; currentId: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      pages: needle ? g.pages.filter((p) => `${p.title} ${p.id}`.toLowerCase().includes(needle)) : g.pages,
    }))
    .filter((g) => g.pages.length);

  const list = (
    <div className="space-y-5">
      <label className="relative block">
        <span className="sr-only">Search wiki pages</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pages"
          className="h-11 w-full rounded-xl border border-white/[0.08] bg-surface-2/50 pl-9 pr-3 text-base text-heading placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none md:text-sm"
        />
      </label>
      {filtered.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{g.label}</p>
          <ul className="space-y-0.5">
            {g.pages.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.href}
                  aria-current={p.id === currentId ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-2 py-2 text-sm transition-colors",
                    p.id === currentId
                      ? "bg-primary/15 font-semibold text-primary"
                      : "text-body hover:bg-surface-2/70 hover:text-heading",
                  )}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!filtered.length && <p className="px-2 text-sm text-muted-foreground">No page matches “{q}”.</p>}
    </div>
  );

  return (
    <>
      <details className="rounded-2xl border border-white/[0.08] bg-surface-2/30 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-heading">
          Browse pages
        </summary>
        <div className="border-t border-white/[0.06] p-3">{list}</div>
      </details>
      <nav aria-label="Wiki pages" className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1 lg:block">
        {list}
      </nav>
    </>
  );
}

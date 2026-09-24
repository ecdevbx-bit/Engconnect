import { Check, Lightbulb, X } from "lucide-react";

import type { Example, Section } from "@/content/learn/types";

import { Inline } from "./Inline";
import { Visual } from "./visuals/Visual";

// One lesson section: heading → one-liner → visual → ✓/✗ examples → tip.
// Server component: nothing here ships JavaScript.
export function LessonSection({ section, n, id }: { section: Section; n: number; id: string }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-20 space-y-4">
      <h2 id={id} className="flex items-start gap-3 text-xl font-bold leading-snug text-heading sm:text-2xl">
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-extrabold text-primary"
          aria-hidden
        >
          {n}
        </span>
        <span>{section.heading}</span>
      </h2>
      {section.text && (
        <p className="text-[15px] leading-relaxed text-body sm:text-base">
          <Inline text={section.text} />
        </p>
      )}
      {section.visual && <Visual visual={section.visual} />}
      {section.examples && section.examples.length > 0 && <Examples items={section.examples} />}
      {section.tip && <Tip text={section.tip} />}
    </section>
  );
}

function Examples({ items }: { items: Example[] }) {
  return (
    <ul className="space-y-2" aria-label="Examples">
      {items.map((e, i) => (
        <li key={i} className="c-box rounded-xl px-4 py-3">
          {e.wrong && (
            <p className="flex items-start gap-2.5 text-[15px] leading-snug text-muted-foreground">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" strokeWidth={3} aria-hidden />
              <span>
                <span className="sr-only">Not: </span>
                <Inline text={e.wrong} strongClass="font-bold" />
              </span>
            </p>
          )}
          <p className={`flex items-start gap-2.5 text-[15px] font-medium leading-snug text-heading ${e.wrong ? "mt-1.5" : ""}`}>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} aria-hidden />
            <span>
              <span className="sr-only">{e.wrong ? "Say: " : "Example: "}</span>
              <Inline text={e.right} />
            </span>
          </p>
          {e.note && (
            <p className="mt-1 pl-[26px] text-xs leading-relaxed text-muted-foreground">
              <Inline text={e.note} strongClass="font-bold text-heading" />
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <aside
      className="flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{
        backgroundColor: "color-mix(in oklab, #f59e0b 10%, transparent)",
        borderColor: "color-mix(in oklab, #f59e0b 35%, transparent)",
      }}
      aria-label="Tip for Indian learners"
    >
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p className="text-sm leading-relaxed text-heading">
        <span className="font-bold">Indian learner tip · </span>
        <Inline text={text} strongClass="font-bold" />
      </p>
    </aside>
  );
}

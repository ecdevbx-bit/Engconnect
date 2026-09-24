"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import type { Question } from "@/content/learn/types";
import { cn } from "@/lib/utils";

import { Inline } from "./Inline";

// "Quick check" — pick an option, see right/wrong + why at once, score at the
// end, retry. Only ever rendered for lessons the viewer may fully see (the
// server never passes a locked lesson's questions here).
export default function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const done = answered === questions.length;

  const pick = (qi: number, oi: number) =>
    setPicked((prev) => (prev[qi] !== null ? prev : prev.map((p, i) => (i === qi ? oi : p))));

  return (
    <section aria-labelledby="quick-check" className="c-box rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="quick-check" className="text-xl font-bold text-heading sm:text-2xl">
          Quick check
        </h2>
        <span className="text-xs font-semibold text-muted-foreground" aria-hidden>
          {answered}/{questions.length}
        </span>
      </div>

      <ol className="mt-5 space-y-6">
        {questions.map((q, qi) => {
          const choice = picked[qi];
          const isAnswered = choice !== null;
          const right = choice === q.answer;
          return (
            <li key={qi}>
              <p className="flex gap-2 text-[15px] font-semibold leading-snug text-heading" id={`q-${qi}`}>
                <span className="text-muted-foreground">{qi + 1}.</span>
                <span>
                  <Inline text={q.q} strongClass="font-bold" />
                </span>
              </p>
              <div role="group" aria-labelledby={`q-${qi}`} className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isChosen = oi === choice;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => pick(qi, oi)}
                      aria-pressed={isChosen}
                      aria-disabled={isAnswered}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-[15px] leading-snug transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        !isAnswered && "border-border bg-surface-2 text-heading hover:border-primary/60",
                        isAnswered && isCorrect && "border-emerald-500/70 bg-emerald-500/15 font-semibold text-heading",
                        isAnswered && isChosen && !isCorrect && "border-destructive/70 bg-destructive/10 text-heading",
                        isAnswered && !isChosen && !isCorrect && "cursor-default border-border bg-surface-2 text-muted-foreground opacity-60",
                        isAnswered && "cursor-default",
                      )}
                    >
                      <span className="flex-1">
                        <Inline text={opt} strongClass="font-bold" />
                      </span>
                      {isAnswered && isCorrect && (
                        <>
                          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} aria-hidden />
                          <span className="sr-only">(correct answer)</span>
                        </>
                      )}
                      {isAnswered && isChosen && !isCorrect && (
                        <>
                          <X className="h-4 w-4 shrink-0 text-destructive" strokeWidth={3} aria-hidden />
                          <span className="sr-only">(your answer, not correct)</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              <div aria-live="polite">
                {isAnswered && (
                  <p className={cn("mt-2.5 text-sm leading-relaxed", right ? "text-heading" : "text-body")}>
                    <span className={cn("font-bold", right ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                      {right ? "Correct. " : "Not quite. "}
                    </span>
                    <Inline text={q.why} strongClass="font-bold text-heading" />
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div aria-live="polite">
        {done && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-xl bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex gap-1" aria-hidden>
                {questions.map((q, i) => (
                  <span
                    key={i}
                    className={cn("h-2.5 w-6 rounded-full", picked[i] === q.answer ? "bg-emerald-500" : "bg-destructive/70")}
                  />
                ))}
              </span>
              <p className="text-sm font-semibold text-heading">
                You got {score} of {questions.length}.{" "}
                <span className="font-normal text-body">
                  {score === questions.length ? "Nailed it." : score >= questions.length - 1 ? "Nearly there." : "Read the visuals once more."}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPicked(questions.map(() => null))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-1 px-4 text-sm font-semibold text-heading hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

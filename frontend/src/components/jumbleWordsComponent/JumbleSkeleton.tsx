"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholder for the Jumble board. Mirrors the real MainLayout
// structure — header, left board card (control bar + prompt + word yard +
// sentence zone), and the right rail (progress + coach) — so the page does
// not jump when the question batch arrives.

// A pool of fake word tiles with varied widths, like shuffled words.
const POOL_TILE_WIDTHS = ["w-20", "w-28", "w-16", "w-24", "w-14", "w-24"];

export default function JumbleSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Header — icon, title, question count, how-to-play */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto h-8 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left — the board ── */}
        <div className="c-box overflow-hidden rounded-2xl">
          {/* Control bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-6 py-4">
            <Skeleton className="h-3 min-w-[180px] flex-1 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>

          {/* Prompt */}
          <div className="px-6 pt-6">
            <Skeleton className="h-6 w-3/4" />
          </div>

          {/* Word yard (pool) */}
          <div className="px-6 pt-6">
            <Skeleton className="mb-3 h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              {POOL_TILE_WIDTHS.map((w, i) => (
                <Skeleton key={i} className={`h-11 ${w} rounded-lg`} />
              ))}
            </div>
          </div>

          {/* Sentence build zone */}
          <div className="px-6 pb-8 pt-6">
            <Skeleton className="mb-3 h-3 w-28" />
            <div className="flex min-h-[88px] flex-wrap content-start gap-2 rounded-xl border border-dashed border-white/[0.08] p-4">
              <Skeleton className="h-11 w-24 rounded-lg" />
              <Skeleton className="h-11 w-16 rounded-lg" />
              <Skeleton className="h-11 w-20 rounded-lg" />
            </div>
          </div>
        </div>

        {/* ── Right — side rail ── */}
        <div className="flex flex-col gap-6">
          {/* Progress card */}
          <div className="c-box rounded-2xl p-6">
            <Skeleton className="h-5 w-28" />
            <div className="flex flex-col items-center gap-2 py-5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2/50 px-4 py-3">
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-2.5 w-2.5 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* AI Coach card */}
          <div className="c-box flex items-center gap-3 rounded-2xl p-5">
            <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

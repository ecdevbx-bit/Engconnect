import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Loading placeholders shaped like the real content so nothing jumps when data
// lands. Pure markup (no hooks) — the page can use them as a Suspense fallback.

export function ChatListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading conversations" className="space-y-5 p-2">
      {[0, 1].map((g) => (
        <div key={g} className="space-y-1">
          <Skeleton className="mx-3 mb-2 h-3 w-20" />
          {Array.from({ length: g === 0 ? Math.min(3, rows) : Math.max(0, rows - 3) }, (_, i) => (
            <div key={i} className="flex min-h-[60px] items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className={cn("h-4", i % 2 ? "w-2/3" : "w-4/5")} />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading conversations…</span>
    </div>
  );
}

export function ChatDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading conversation" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-11 w-56 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-16 w-3/4 rounded-[18px]" />
        <Skeleton className="ml-auto h-12 w-2/3 rounded-[18px]" />
        <Skeleton className="h-20 w-4/5 rounded-[18px]" />
      </div>
      <span className="sr-only">Loading conversation…</span>
    </div>
  );
}

export function MemorySkeleton() {
  return (
    <div role="status" aria-label="Loading memory" className="c-box space-y-4 rounded-2xl p-5 md:p-7">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
      <div className="space-y-2.5 pt-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-5 w-1/4" />
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <span className="sr-only">Loading what K.AI remembers…</span>
    </div>
  );
}

/** Whole-screen fallback while the client screen hydrates (Suspense). */
export function HistoryScreenSkeleton() {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex h-11 items-center gap-3">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-12 w-full rounded-full md:w-80" />
      </div>
      <div className="md:grid md:h-[calc(100dvh-14rem)] md:min-h-[440px] md:grid-cols-[320px_minmax(0,1fr)] md:gap-4">
        <div className="c-box rounded-2xl">
          <ChatListSkeleton />
        </div>
        <div className="c-box hidden rounded-2xl p-6 md:block">
          <ChatDetailSkeleton />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholder for a phrase fetch. Mirrors the ListenStep layout —
// header lines, the round icon, the sentence, and the two action buttons —
// so the content area holds its shape while the next sentence loads.
export function PhraseSkeleton() {
  return (
    <div className="flex flex-col items-center text-center">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />

      <Skeleton className="mt-6 h-16 w-16 rounded-full" />

      <div className="mt-6 flex flex-col items-center gap-2">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-7 w-56 max-w-full" />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Skeleton className="h-11 w-28 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
    </div>
  );
}

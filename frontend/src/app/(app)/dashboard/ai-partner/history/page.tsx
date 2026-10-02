import { Suspense } from "react";
import type { Metadata } from "next";

import HistoryScreen from "@/components/aiPartnerHistory/HistoryScreen";
import { HistoryScreenSkeleton } from "@/components/aiPartnerHistory/Skeletons";

export const metadata: Metadata = {
  title: "K.AI history",
};

// K.AI chat history + memory (D-047). Sign-in is enforced by the dashboard
// layout. The screen is a client component: it reads `?tab` / `?c` with
// useSearchParams and updates them with history.pushState / replaceState, so
// switching conversations never round-trips to the server — hence the
// Suspense boundary the hook needs.
export default function AIPartnerHistoryPage() {
  return (
    <Suspense fallback={<HistoryScreenSkeleton />}>
      <HistoryScreen />
    </Suspense>
  );
}

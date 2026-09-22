import { Suspense } from "react";
import MainLayout from "@/components/jumbleWordsComponent/MainLayout";

// MainLayout renders its own compact in-game header, so the standard page
// header is intentionally omitted here to keep the play screen uncluttered.
// Suspense wraps MainLayout because it calls useSearchParams() to detect the
// ?tour=1 auto-launch flag from the "How to play" CTA.
export default function JumbleWordsPage() {
  return (
    <Suspense fallback={null}>
      <MainLayout />
    </Suspense>
  );
}

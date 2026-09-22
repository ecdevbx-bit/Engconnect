"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { cn } from "@/lib/utils";
import ActivityHeatmap from "@/components/v3/ActivityHeatmap";
import WeeklyActivityChart from "@/components/v3/WeeklyActivityChart";
import { Skeleton } from "@/components/ui/skeleton";
import type { V3Activity, V3UserAttributes } from "@/lib/v3Game";

// Mobile-only "Your Activities" carousel: two equal-height stat cards —
// Monthly (the 3-month activity heatmap) and Weekly (this week's XP chart) —
// in an infinite, auto-advancing carousel. Autoplay is 6s, double the
// Trainings carousel's 3s. A Monthly/Weekly segmented toggle sits inline with
// the section heading and stays in sync with the active slide (and drives it).

// Both slides share this fixed height so the two cards are exactly the same
// height — matches the standalone mobile weekly chart (h-56). The heatmap
// card fills it via its existing h-full; the weekly chart is naturally h-56.
const SLIDE_H = "h-56";

const TABS = ["Monthly", "Weekly"] as const;

interface Props {
  rows: V3Activity[];
  attributes: V3UserAttributes | null;
  loading: boolean;
  isPro?: boolean;
}

export function ActivityStatsCarousel({ rows, attributes, loading, isPro = false }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 6000, stopOnInteraction: false })],
  );
  // Selected slide drives the toggle's active state; the toggle drives the
  // carousel via scrollTo. Autoplay/swipe both fire "select" to keep them
  // in sync.
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div>
      {/* Heading + Monthly/Weekly toggle, inline (same row) */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-heading">Your Activities</h2>
        <div className="inline-flex rounded-full border border-white/[0.08] bg-surface-2/60 p-0.5 text-xs font-semibold">
          {TABS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-pressed={selected === i}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                selected === i ? "bg-primary text-[#0b0e14]" : "text-body hover:text-heading",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className={cn("w-full rounded-2xl", SLIDE_H)} />
      ) : (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {/* Monthly — 3-month activity heatmap (fills the slide via h-full) */}
            <div className={cn("min-w-0 flex-[0_0_100%] [&>*]:h-full", SLIDE_H)}>
              <ActivityHeatmap rows={rows} />
            </div>
            {/* Weekly — this week's XP chart (naturally h-56) */}
            <div className={cn("min-w-0 flex-[0_0_100%] [&>*]:h-full", SLIDE_H)}>
              <WeeklyActivityChart rows={rows} attributes={attributes} isPro={isPro} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CardComponentProps } from "nextstepjs";
import { cn } from "@/lib/utils";
import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";

// useLayoutEffect on the client, useEffect on the server (avoids the SSR warning).
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Custom NextStep card matching the app's glass / dark theme. Replaces the
// shipped DefaultCard used by `<NextStep />`.
//
// Mobile positioning: nextstepjs anchors the card to the target and centres it
// horizontally on the element — which pushes it off-screen for edge targets, and
// the card lives inside a transform:translate() wrapper so CSS position:fixed
// can't reach the viewport. So on phones we place the card ourselves: pinned to
// the viewport width (12px margins) and docked just BELOW the highlighted element
// (or above it when there's no room), clamped on-screen. We re-measure on a short
// rAF loop so it tracks the element even while nextstepjs scrolls it into view.
// We also show shorter `mobileContent` and a smaller mascot to keep it compact.
export default function JumbleTourCard({
    step,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    arrow,
}: CardComponentProps) {
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;
    const progressPct = ((currentStep + 1) / totalSteps) * 100;
    const rootRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
    );
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const onChange = () => setIsMobile(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    // Position the nextstep-card wrapper ourselves (all sizes): fixed, next to the
    // highlighted element, clamped fully on-screen, keeping the card's natural
    // width. nextstepjs's own anchoring centres on the element — which overlaps it
    // and runs off-screen for edge targets. A continuous rAF re-applies the
    // position so it survives framer-motion / nextstepjs re-renders and tracks the
    // element while it scrolls into view. The wrapper transform is neutralised in
    // globals.css so position:fixed resolves against the viewport.
    useIsoLayoutEffect(() => {
        const inner = rootRef.current;
        const card = inner?.closest('[data-name="nextstep-card"]') as HTMLElement | null;
        if (!card) return;

        let raf = 0;
        const place = () => {
            const m = 12;
            const gap = 12;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            card.style.position = "fixed";
            card.style.margin = "0";
            card.style.transform = "none";
            card.style.right = "auto";
            card.style.bottom = "auto";
            card.style.setProperty("max-height", `${vh - 2 * m}px`);
            card.style.setProperty("overflow-y", "auto");

            const cardW = card.offsetWidth || 320;
            const cardH = card.offsetHeight || 200;
            const sel = (step as { selector?: string }).selector;
            const el = sel ? document.querySelector(sel) : null;
            let top: number;
            let left: number;
            if (el) {
                let r = el.getBoundingClientRect();
                // Bring a genuinely off-screen target into view INSTANTLY (no
                // smooth slide) — nextstepjs's own scroll is disabled. In-view
                // targets (e.g. the header on step 1) never trigger this.
                if (r.bottom < 48 || r.top > vh - 48) {
                    el.scrollIntoView({ block: "center", behavior: "auto" });
                    r = el.getBoundingClientRect();
                }
                const spaceBelow = vh - r.bottom - gap - m;
                const spaceAbove = r.top - gap - m;
                top =
                    spaceBelow >= cardH || spaceBelow >= spaceAbove
                        ? r.bottom + gap // below the element
                        : r.top - gap - cardH; // otherwise above it
                left = r.left + r.width / 2 - cardW / 2; // centred on the element…
            } else {
                top = (vh - cardH) / 2;
                left = (vw - cardW) / 2;
            }
            card.style.top = `${Math.max(m, Math.min(top, vh - cardH - m))}px`;
            card.style.left = `${Math.max(m, Math.min(left, vw - cardW - m))}px`; // …clamped on-screen

            raf = requestAnimationFrame(place);
        };
        place();
        return () => cancelAnimationFrame(raf);
    }, [currentStep]);

    const emotion: MascotEmotion =
        (step as { emotion?: MascotEmotion }).emotion ?? "conversing";
    const body =
        (isMobile && (step as { mobileContent?: ReactNode }).mobileContent) || step.content;

    return (
        <div
            ref={rootRef}
            className={cn(
                "relative w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl",
                "border border-white/[0.08] bg-surface-1/95 text-heading backdrop-blur-xl",
                "shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65),0_0_0_1px_rgba(171,142,255,0.10)]",
            )}
        >
            {/* Soft brand glow at the top edge */}
            <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-64 -translate-x-1/2 bg-gradient-to-b from-[#ab8eff]/30 via-[#00e3fd]/10 to-transparent blur-3xl" />

            <div className="relative p-4 sm:p-5">
                {/* Header: expressive mascot + title + close */}
                <div className="mb-3 flex items-start gap-3">
                    <span
                        className={cn(
                            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2/60 ring-1 ring-primary/20",
                            isMobile ? "h-11 w-11" : "h-16 w-16",
                        )}
                    >
                        <PixelMascot emotion={emotion} size={isMobile ? 40 : 60} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Step {currentStep + 1} of {totalSteps}
                        </div>
                        <h3 className="mt-0.5 text-base font-semibold leading-tight text-heading">
                            {step.title}
                        </h3>
                    </div>
                    {skipTour && (
                        <button
                            onClick={skipTour}
                            aria-label="Close tour"
                            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-heading"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="text-sm leading-relaxed text-body">
                    {body}
                </div>

                {/* Progress bar */}
                <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2976c7] to-[#005da7] transition-[width] duration-300 dark:from-[#f59e0b] dark:to-[#f97316]"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                {/* Controls */}
                <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                        onClick={prevStep}
                        disabled={isFirst}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                            isFirst
                                ? "cursor-not-allowed border-white/[0.04] text-muted-foreground/50"
                                : "cursor-pointer border-white/[0.08] bg-surface-2 text-heading hover:border-primary/40",
                        )}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                    </button>

                    {skipTour && !isLast && (
                        <button
                            onClick={skipTour}
                            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-heading"
                        >
                            Skip tour
                        </button>
                    )}

                    <button
                        onClick={nextStep}
                        className={cn(
                            "flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-[0.97]",
                            "bg-gradient-to-br from-[#2976c7] to-[#005da7] text-white dark:from-[#f59e0b] dark:to-[#f97316] dark:text-[#0b0e14]",
                            "shadow-[0_0_18px_rgba(41,118,199,0.35)] hover:opacity-90 dark:shadow-[0_0_18px_rgba(171,142,255,0.35)]",
                        )}
                    >
                        {isLast ? "Finish" : "Next"}
                        {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            {arrow}
        </div>
    );
}

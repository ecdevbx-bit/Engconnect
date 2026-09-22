"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { OnboardingNativeLang } from "@/lib/v3Onboarding";

interface LangOption {
  id: OnboardingNativeLang;
  label: string;
  script: string;
  gradient: string;
}

const LANGUAGES: LangOption[] = [
  { id: "English",  label: "English",  script: "E",  gradient: "from-rose-400 to-red-500" },
  { id: "Hindi",    label: "Hindi",    script: "अ", gradient: "from-orange-400 to-amber-500" },
  { id: "Marathi",  label: "Marathi",  script: "म", gradient: "from-amber-300 to-yellow-500" },
  { id: "Bengali",  label: "Bengali",  script: "অ", gradient: "from-emerald-300 to-teal-400" },
  { id: "Telugu",   label: "Telugu",   script: "అ", gradient: "from-cyan-400 to-blue-500" },
  { id: "Tamil",    label: "Tamil",    script: "அ", gradient: "from-indigo-400 to-violet-500" },
  { id: "Gujarati", label: "Gujarati", script: "અ", gradient: "from-fuchsia-400 to-pink-500" },
];

export interface LanguageCarouselProps {
  value: OnboardingNativeLang | "";
  onChange: (lang: OnboardingNativeLang) => void;
}

export default function LanguageCarousel({ value, onChange }: LanguageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!value) return 0;
    const idx = LANGUAGES.findIndex((l) => l.id === value);
    return idx >= 0 ? idx : 0;
  });
  const [shaking, setShaking] = useState<number | null>(null);

  const activeRef = useRef(activeIndex);
  useEffect(() => { activeRef.current = activeIndex; }, [activeIndex]);

  const wheelLock = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const select = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(LANGUAGES.length - 1, index));
      setActiveIndex(clamped);
      activeRef.current = clamped;
      setShaking(clamped);
      onChange(LANGUAGES[clamped].id);
    },
    [onChange],
  );

  useEffect(() => {
    if (shaking === null) return;
    const t = setTimeout(() => setShaking(null), 500);
    return () => clearTimeout(t);
  }, [shaking]);

  const move = useCallback(
    (delta: number) => select(activeRef.current + delta),
    [select],
  );

  // Wheel handling lives on a *non-passive* native listener so preventDefault
  // actually works — it moves the selection AND stops the wheel from scrolling
  // the parent / page while the cursor is over the picker.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (wheelLock.current) return;
      if (e.deltaY > 15) move(1);
      else if (e.deltaY < -15) move(-1);
      wheelLock.current = setTimeout(() => { wheelLock.current = null; }, 250);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [move]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    // NB: no setPointerCapture here — capturing the pointer on the container
    // swallows the per-pill `click`, so tapping a language wouldn't select it.
    // The drag still works: pointer-up bubbles up to this container.
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const delta = dragStartY.current - e.clientY;
      if (delta > 40) move(1);
      else if (delta < -40) move(-1);
    },
    [move],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
    },
    [move],
  );

  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  // ── Draggable scrollbar ──────────────────────────────────────────────────
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  const scrubTo = useCallback(
    (clientY: number) => {
      const el = scrollbarRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const frac = (clientY - rect.top) / rect.height;
      select(Math.round(Math.max(0, Math.min(1, frac)) * (LANGUAGES.length - 1)));
    },
    [select],
  );

  const handleScrollDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      scrubbing.current = true;
      scrollbarRef.current?.setPointerCapture(e.pointerId);
      scrubTo(e.clientY);
    },
    [scrubTo],
  );
  const handleScrollMove = useCallback(
    (e: React.PointerEvent) => {
      if (!scrubbing.current) return;
      e.stopPropagation();
      scrubTo(e.clientY);
    },
    [scrubTo],
  );
  const handleScrollUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    scrubbing.current = false;
    scrollbarRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  const getPillStyle = (index: number): React.CSSProperties => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);
    const yShift = offset * 64;
    const xShift = -Math.pow(absOffset, 1.4) * 20;
    const rotateZ = offset * 10;
    const scale = 1 - absOffset * 0.08;
    const opacity = 1 - absOffset * 0.25;
    return {
      top: "50%",
      left: "10%",
      transform: `translateY(calc(-50% + ${yShift}px)) translateX(${xShift}px) rotate(${rotateZ}deg) scale(${scale})`,
      opacity: Math.max(0, opacity),
      zIndex: 100 - absOffset,
      transition: "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
    };
  };

  return (
    <div
      ref={containerRef}
      id="lang-carousel-listbox"
      tabIndex={0}
      className="isolate relative flex h-[320px] w-full cursor-grab items-center justify-center overflow-hidden outline-none active:cursor-grabbing sm:h-[360px]"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Select your native language"
    >
      <div className="relative h-full w-full">
        {LANGUAGES.map((lang, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={lang.id}
              role="option"
              aria-selected={isActive}
              onClick={() => select(index)}
              className="absolute h-[62px] w-[80%] cursor-pointer"
              style={getPillStyle(index)}
            >
              <div
                className={cn(
                  "flex h-full w-full items-center justify-between rounded-[2rem] bg-gradient-to-r px-2.5 shadow-xl transition-shadow",
                  lang.gradient,
                  isActive && "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent",
                  index === shaking && "anim-mascot-shake",
                )}
              >
                <span className="pl-5 text-xl font-bold tracking-wide text-neutral-900">
                  {lang.label}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 shadow-inner backdrop-blur-md">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                    <span className="pt-0.5 text-base font-bold leading-none text-neutral-900">
                      {lang.script}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={scrollbarRef}
        className="absolute right-1 top-1/2 z-20 flex -translate-y-1/2 cursor-pointer touch-none flex-col items-end gap-1.5 py-2 pl-6 pr-2"
        onPointerDown={handleScrollDown}
        onPointerMove={handleScrollMove}
        onPointerUp={handleScrollUp}
        role="scrollbar"
        aria-controls="lang-carousel-listbox"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={LANGUAGES.length - 1}
        aria-valuenow={activeIndex}
        aria-label="Scroll languages"
      >
        <ScrollIndicator activeIndex={activeIndex} total={LANGUAGES.length} />
      </div>

    </div>
  );
}

function ScrollIndicator({ activeIndex, total }: { activeIndex: number; total: number }) {
  const ticks = 30;
  const pos = (activeIndex / (total - 1)) * (ticks - 1);
  return (
    <>
      {Array.from({ length: ticks }, (_, i) => {
        const dist = Math.abs(i - pos);
        let width = 6;
        let cls = "bg-neutral-600";
        let opacity = 0.5;
        if (dist < 1.5) {
          width = 16;
          cls = "bg-primary";
          opacity = 1;
        } else if (dist < 4) {
          width = 10;
          cls = "bg-neutral-400";
          opacity = 0.8;
        }
        return (
          <div
            key={i}
            className={`h-[2px] rounded-full transition-all duration-300 ${cls}`}
            style={{ width: `${width}px`, opacity }}
          />
        );
      })}
    </>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// LazyMount — renders `placeholder` until the box gets near the viewport, then
// its children. With `unmountOnExit`, children are swapped back out once the
// box is far off-screen again, which stops the demos' timers / canvas loops
// while nobody is looking. The wrapper keeps its own size (give it a fixed
// height when unmounting), so swapping never shifts the page.
export function LazyMount({
  children,
  placeholder = null,
  className,
  rootMargin = "320px 0px",
  unmountOnExit = false,
}: {
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
  rootMargin?: string;
  unmountOnExit?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Very old browsers: just show it (in a callback, not the effect body).
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (!unmountOnExit) io.disconnect();
        } else if (unmountOnExit) {
          setShown(false);
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, unmountOnExit]);

  return (
    <div ref={ref} className={className}>
      {shown ? children : placeholder}
    </div>
  );
}

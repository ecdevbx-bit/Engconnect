'use client';

import { RefObject, useEffect, useState } from 'react';

export function useInViewOnce<T extends HTMLElement>(ref: RefObject<T | null>, threshold = 0.08) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, ref, threshold]);

  return inView;
}

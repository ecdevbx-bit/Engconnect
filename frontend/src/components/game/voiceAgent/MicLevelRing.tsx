"use client";

import { useEffect, useRef } from "react";
import { readLevel } from "./agentConfig";

/**
 * MicLevelRing — a ring around the push-to-talk button that swells and glows
 * with the user's voice, so it's obvious the mic is actually hearing you.
 */
export default function MicLevelRing({
  active,
  getAnalyser,
}: {
  active: boolean;
  getAnalyser: () => AnalyserNode | null;
}) {
  const ringRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const buf = new Uint8Array(new ArrayBuffer(1024));
    let raf = 0;
    const loop = () => {
      const ring = ringRef.current;
      if (ring) {
        if (activeRef.current) {
          const level = readLevel(getAnalyser(), buf);
          ring.style.transform = `scale(${1 + level * 0.9})`;
          ring.style.opacity = `${0.3 + level * 0.7}`;
        } else {
          ring.style.opacity = "0";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getAnalyser]);

  return (
    <span
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full opacity-0"
      style={{ boxShadow: "0 0 0 3px #00e3fd, 0 0 22px 2px rgba(0,227,253,0.55)" }}
    />
  );
}

"use client";

import Reveal from "@/components/client/Reveal";
import { SliderImg1 } from "./SliderImg1";
import { SliderImg2 } from "./SliderImg2";
import { SliderImg3 } from "./SliderImg3";

/**
 * HomeShowcase — the landing page's product showcase.
 *
 * Replaces the former full-viewport auto-advancing carousel. The three product
 * pillars are now stacked vertical sections the visitor scrolls through at
 * their own pace; each fades gently into view once (and not at all under
 * `prefers-reduced-motion`). Nothing moves on its own.
 */
export default function HomeShowcase() {
  return (
    <div className="flex flex-col">
      <Reveal as="section" className="py-12 lg:py-20">
        <SliderImg1 />
      </Reveal>
      <Reveal as="section" className="py-12 lg:py-20">
        <SliderImg2 />
      </Reveal>
      <Reveal as="section" className="py-12 lg:py-20">
        <SliderImg3 />
      </Reveal>
    </div>
  );
}

"use client";

// KaiFigure — the K.AI mascot (compressed kai_welcome.webp) over a single
// concentrated smoky-orange glow. The glow is a circular radial gradient that
// fades to 0 in every direction; the container is NOT clipped (no overflow
// -hidden), so the boundary stays soft/blurry with no hard rectangular edges.
export function KaiFigure() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Concentrated smoky-orange glow — circular, equal in all directions,
          fading smoothly to transparent (no clipping → no hard edges). */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[65px]"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle, rgba(251,146,60,0.55) 0%, rgba(249,115,22,0.3) 34%, rgba(234,88,12,0.1) 58%, transparent 76%)",
        }}
      />
      {/* Mascot — nudged up a touch; its bottom fades out (mask) so it melts
          into the glow rather than ending on a hard edge. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kai_welcome.webp"
        alt="K.AI — your AI English coach"
        className="relative w-[106%] -translate-y-[5%]"
        style={{
          maskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.45) 28%, #000 52%)",
          WebkitMaskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.45) 28%, #000 52%)",
        }}
      />
    </div>
  );
}

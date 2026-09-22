import Image from "next/image";

// KaiFigure — the K.AI mascot (kai_welcome.webp) over one soft, circular glow.
// The glow is a plain radial gradient that fades to 0 in every direction (no
// `filter: blur`, which is costly to paint at this size); the container is not
// clipped, so the edge stays soft with no hard rectangle. The glow colours come
// from the landing's theme tokens (warm orange on dark, marigold/blue on light)
// with the original orange as the fallback for any other page.
//
// The image is the hero's LCP candidate on desktop: next/image serves a
// right-sized AVIF/WebP instead of the 2048px original, loaded eagerly with high
// fetch priority.
export function KaiFigure() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle closest-side, var(--lp-glow-1, rgba(251,146,60,0.5)) 0%, var(--lp-glow-2, rgba(249,115,22,0.24)) 45%, var(--lp-glow-3, rgba(234,88,12,0.08)) 72%, transparent 100%)",
        }}
      />
      {/* Nudged up a touch; the bottom fades out (mask) so it melts into the
          glow rather than ending on a hard edge. */}
      <Image
        src="/kai_welcome.webp"
        alt="K.AI, your AI English coach, welcoming you with open arms"
        width={2048}
        height={2048}
        sizes="(min-width: 1024px) 480px, (min-width: 640px) 440px, 92vw"
        loading="eager"
        fetchPriority="high"
        className="relative h-auto w-[106%] max-w-none -translate-y-[5%]"
        style={{
          maskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.45) 28%, #000 52%)",
          WebkitMaskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.45) 28%, #000 52%)",
        }}
      />
    </div>
  );
}

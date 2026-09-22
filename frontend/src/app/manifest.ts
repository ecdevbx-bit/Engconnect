import type { MetadataRoute } from "next";

// Web App Manifest — makes the site installable as a standalone (desktop) PWA.
// Next.js serves this at /manifest.webmanifest and auto-injects the
// <link rel="manifest"> into every page, so no manual <head> wiring is needed.
//
// Icons reuse the existing brand SVG (public/logo.svg). A single SVG declared
// with sizes:"any" satisfies Chromium's desktop install criteria; drop 192/512
// PNGs in public/ later for the crispest installed-app icon across all browsers.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Connection — Speak English Fearlessly",
    short_name: "English Connection",
    description:
      "Build confidence and fluency in spoken English through guided practice, structured feedback, and immersive learning experiences.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#18181c",
    theme_color: "#18181c",
    categories: ["education"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

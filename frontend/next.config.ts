import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No turbopack.root pin: the repo root has no package.json, and on Vercel the
  // pin conflicted with outputFileTracingRoot (repo root) — see DECISIONS D-022.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        // PWA service worker: serve as JS, never cache (so updates ship), and
        // allow it to control the whole origin.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ['e945-2401-4900-1ca8-30d7-12a4-4234-bb8a-761c.ngrok-free.app'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/9.x/**',
      },
    ],
  },
};

export default nextConfig;
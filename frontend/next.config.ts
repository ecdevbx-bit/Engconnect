import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Which deployment this build is for ("production" / "preview" on Vercel,
  // "local" otherwise) — the browser Sentry client only reports off-local.
  env: { NEXT_PUBLIC_APP_ENV: process.env.VERCEL_ENV ?? "local" },
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

// Sentry (D-044): error monitoring + source-map upload at build time. The
// upload only runs when SENTRY_AUTH_TOKEN is set (Vercel); local builds skip it.
// "/monitoring" tunnels browser events through our own domain so ad blockers
// don't drop them — it is excluded from the proxy matcher in src/proxy.ts.
export default withSentryConfig(nextConfig, {
  org: "englishconnection",
  project: "engconnect",
  sentryUrl: "https://de.sentry.io/",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  webpack: { treeshake: { removeDebugLogging: true } },
});
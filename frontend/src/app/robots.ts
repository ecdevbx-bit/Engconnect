import type { MetadataRoute } from "next";

const SITE = "https://englishconnection.in";

// Served at /robots.txt. Lets search engines crawl the public marketing pages
// while keeping the signed-in app, auth screens, and internal design previews
// out of the index (they're either gated, thin, or duplicate content).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard", // signed-in app — not useful in the index
          "/showcase", // design previews / duplicate landing content
          "/login",
          "/signup",
          "/verify-email",
          "/forgot-password",
          "/not-signed-in",
          "/badge-inspector",
          "/badge-forge",
          "/badge-medals",
          "/deck-preview",
          "/streak-badges",
          "/squarical-forge",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

import "server-only";

import type { Metadata } from "next";
import { cache } from "react";

import { learnAccess } from "@/server/viewer";

// One access check per request: the layout, the page and generateMetadata all
// ask, and React's cache() makes that a single auth + flag lookup.
export const getLearnAccess = cache(learnAccess);

export const SITE_URL = "https://englishconnection.in";

const OG_IMAGE = { url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "English Connection" };

/**
 * Metadata for a Learn page. While the library is admin-only (switch OFF) every
 * page is noindex, so previews never leak into search results.
 */
export function learnMetadata(opts: { title: string; description: string; path: string; isPublic: boolean }): Metadata {
  const title = `${opts.title} | English Connection`;
  return {
    title: { absolute: title },
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "article",
      siteName: "English Connection",
      locale: "en_IN",
      url: opts.path,
      title,
      description: opts.description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary", title, description: opts.description, images: [OG_IMAGE.url] },
    ...(opts.isPublic ? {} : { robots: { index: false, follow: false } }),
  };
}

/** For pages that 404 (switch off, unknown slug). */
export const HIDDEN_METADATA: Metadata = { robots: { index: false, follow: false } };

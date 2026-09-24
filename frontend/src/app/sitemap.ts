import type { MetadataRoute } from "next";

import { learnPaths } from "@/content/learn";
import { FLAG_LEARN, flagEnabled } from "@/server/viewer";

const SITE = "https://englishconnection.in";

// Re-read hourly: the Learn library joins the sitemap once the admin switch
// shows it to everyone (D-042).
export const revalidate = 3600;

// Served at /sitemap.xml and referenced from robots.txt. Lists the public,
// indexable marketing pages so Google can discover them. Add new public routes
// here as they ship.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/updates", priority: 0.6, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  ];
  if (await flagEnabled(FLAG_LEARN, false)) {
    // Index, tracks and every lesson — Pro ones too: their title, summary and
    // first section are public.
    for (const l of learnPaths()) pages.push({ path: l.path, priority: l.pro ? 0.5 : 0.7, changeFrequency: "monthly" });
  }
  return pages.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}

import type { Metadata } from "next";
import { InfoPageShell, Bullets } from "@/components/legal/InfoPageShell";

export const metadata: Metadata = {
  title: "Updates",
  description: "What's new in English Connection — product updates and improvements.",
  alternates: { canonical: "/updates" },
};

type Release = { date: string; tag: string; title: string; items: string[] };

const RELEASES: Release[] = [
  {
    date: "June 2026",
    tag: "New",
    title: "Pronunciation Agent gets clearer feedback",
    items: [
      "Tap any missed word to hear its correct pronunciation, now in an Indian-English voice.",
      "Cleaner word breakdown with per-word accuracy.",
    ],
  },
  {
    date: "May 2026",
    tag: "New",
    title: "Leaderboards, streaks & badges",
    items: [
      "Weekly and all-time leaderboards with a crowned podium.",
      "Daily streaks and an activity heatmap to keep your momentum.",
      "Collect badges for XP, levels, streaks, and combos.",
    ],
  },
  {
    date: "April 2026",
    tag: "Improved",
    title: "Smarter AI Partner",
    items: [
      "More natural conversations that adapt to your level.",
      "Faster, more specific feedback after every reply.",
    ],
  },
  {
    date: "March 2026",
    tag: "New",
    title: "Jumble Words launch",
    items: [
      "Rebuild real sentences to master grammar and word order.",
      "Smart, progressive hints when you get stuck.",
    ],
  },
];

const TAG_STYLE: Record<string, string> = {
  New: "border-primary/30 bg-primary/10 text-primary",
  Improved: "border-cyan/30 bg-cyan/10 text-cyan",
};

export default function UpdatesPage() {
  return (
    <InfoPageShell
      title="Product updates"
      intro="A running log of what's new in English Connection. We ship improvements constantly — here are the highlights."
    >
      {RELEASES.map((r) => (
        <section key={r.title} className="border-l-2 border-white/10 pl-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${TAG_STYLE[r.tag] ?? "border-white/15 text-muted-foreground"}`}>
              {r.tag}
            </span>
            <span className="text-sm text-muted-foreground">{r.date}</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-heading">{r.title}</h2>
          <Bullets items={r.items} />
        </section>
      ))}
    </InfoPageShell>
  );
}

// TEMPORARY preview for the badge deck. Delete after verifying.
import { BadgeDeck } from "@/components/v3/BadgeDeck";

// Mock earned badge IDs in the deterministic scheme — rendered via the registry.
const MOCK: string[] = [
  "xp:100",
  "xp:500",
  "streak:7",
  "lvl:3",
  "streak:14",
  "combo:jumble:50",
  "onboarding:1",
  "xp:5000",
  "progset:1",
];

export default function DeckPreview() {
  return (
    <div className="min-h-screen bg-[#18181c] p-10">
      <div className="c-box mx-auto max-w-4xl rounded-2xl p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-heading">Best achievements</h2>
        <BadgeDeck badges={MOCK} />
      </div>
    </div>
  );
}

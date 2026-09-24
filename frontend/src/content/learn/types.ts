// Learn library — content model. Lessons are plain data (no JSX) so they can be
// validated, listed in the sitemap and rendered by one set of components.
// Visual-first: every section should lean on a `visual` and short examples;
// `text` is at most two short sentences.

export type TrackId = "beginner" | "intermediate" | "advanced" | "career";

export type Track = {
  id: TrackId;
  title: string;
  /** CEFR range, e.g. "A1–A2". */
  level: string;
  /** Plain-words level name used in chips and JSON-LD ("Beginner"). */
  levelName: string;
  /** ≤ 8 words. */
  blurb: string;
  /** Mid-tone hex used only as a tint/border/shape colour (never as text). */
  accent: string;
};

/** Grammatical role of a chip in `blocks` / `formula` visuals. */
export type Role =
  | "subject"
  | "verb"
  | "helper"
  | "object"
  | "time"
  | "place"
  | "complement"
  | "question"
  | "negative"
  | "link"
  | "other";

/** `label` overrides the role name shown under the chip (e.g. "how often"). */
export type Chip = { text: string; role: Role; label?: string };

/** Colour tones for timeline marks and scale bars (theme-aware in the UI). */
export type Tone = "primary" | "green" | "blue" | "violet" | "pink" | "muted";

export type TimelineMark =
  /** A single moment ("yesterday at 5"). */
  | { kind: "point"; at: number; label: string; tone?: Tone; side?: "top" | "bottom" }
  /** A stretch of time ("from 2019 until now"). `arrow` = continues on. */
  | { kind: "span"; from: number; to: number; label: string; tone?: Tone; side?: "top" | "bottom"; arrow?: boolean }
  /** Repeated moments — habits and routines. */
  | { kind: "repeat"; from: number; to: number; count?: number; label: string; tone?: Tone; side?: "top" | "bottom" };

export type TimelineVisual = {
  type: "timeline";
  /** Where "now" sits on the axis, 0–100 (default 55). */
  now?: number;
  marks: TimelineMark[];
  caption?: string;
};

export type BlocksVisual = {
  type: "blocks";
  rows: { chips: Chip[]; note?: string }[];
  caption?: string;
};

export type TableVisual = {
  type: "table";
  head: string[];
  /** Cells may use inline markdown (**bold**, *italic*). */
  rows: string[][];
  /** Columns are equals (a vs an): no row-header column. */
  peer?: boolean;
  caption?: string;
};

export type FormulaVisual = {
  type: "formula";
  rows: { label?: string; parts: Chip[]; example?: string }[];
  /** Symbol between chips (default "+"). */
  join?: string;
  caption?: string;
};

export type TransformVisual = {
  type: "transform";
  from: string;
  to: string;
  pairs: { from: string; to: string; note?: string }[];
  caption?: string;
};

/** A strength meter — certainty, formality, frequency… `value` is 0–100. */
export type ScaleVisual = {
  type: "scale";
  low: string;
  high: string;
  items: { text: string; value: number; note?: string; tone?: Tone }[];
  caption?: string;
};

export type Visual = TimelineVisual | BlocksVisual | TableVisual | FormulaVisual | TransformVisual | ScaleVisual;

export type Example = { right: string; wrong?: string; note?: string };

export type Section = {
  heading: string;
  /** Markdown, ≤ 2 short sentences. */
  text?: string;
  visual?: Visual;
  examples?: Example[];
  /** "Indian learner tip" — one line. */
  tip?: string;
};

export type Question = { q: string; options: string[]; answer: number; why: string };

export type Lesson = {
  track: TrackId;
  slug: string;
  title: string;
  /** ≤ 15 words. */
  summary: string;
  pro: boolean;
  minutes: number;
  /** Optional page-title override (default "<title>: rules and examples"). */
  seoTitle?: string;
  /** Where "Drill it" points (default Jumble Words). */
  drill?: "jumble" | "pronunciation";
  sections: Section[];
  quiz: Question[];
};

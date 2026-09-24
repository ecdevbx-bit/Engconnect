import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import { env } from "../env";
import { db } from "../supabase";
import { NATIVE_SCRIPTS, parseModelJson, TEXT_CALL_TIMEOUT_MS, withTextModel } from "./textModel";

// Jumble Words "structure" hint (D-043): before any word is revealed, the
// learner gets the sentence's shape — what kind of sentence it is, the tense,
// its building blocks in order ("Who → Did what → What → When") and a one-line
// grammar clue — plus what it means in their own language. Generated once per
// sentence × language by the text model and cached in problem_hints; if the
// model is unavailable a basic clue is built from the punctuation (not cached).

export type JumbleClue = {
  kind: "statement" | "question" | "negative" | "command" | "exclamation";
  tense: string;
  pattern: string[];
  clue: string;
  meaning: string;
  meaningLang: string;
  source: "ai" | "basic";
};

const KINDS: JumbleClue["kind"][] = ["statement", "question", "negative", "command", "exclamation"];

const INSTRUCTION = `You write hints for a word-order puzzle for Indian learners of English.
The learner sees the words of an English sentence shuffled and must put them back in order.
Help them see the sentence's STRUCTURE without giving away the full order.

Return JSON:
- kind: statement | question | negative | command | exclamation.
- tense: the tense or form in plain words, e.g. "Present continuous", "Past simple", "Modal (can)". Empty if none.
- pattern: the sentence's building blocks in order as short role labels (1-3 words each), one label per phrase, not per word, 3-7 labels.
  Use labels like "Question word", "Helper verb", "Who", "Action", "What", "Whom", "Where", "When", "How", "Why",
  "Describing word", "Linking word", "Not". NEVER put the sentence's own words in a label.
- clue: at most 18 words — a grammar tip that helps order the words (e.g. "Past questions start with 'Did'; the
  action word goes back to its base form."). You may quote at most ONE word from the sentence. Never give the full order.
- meaning: the whole sentence translated naturally into the requested language and script, or "" if none requested.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    kind: { type: Type.STRING, enum: KINDS },
    tense: { type: Type.STRING },
    pattern: { type: Type.ARRAY, items: { type: Type.STRING } },
    clue: { type: Type.STRING },
    meaning: { type: Type.STRING },
  },
  required: ["kind", "tense", "pattern", "clue", "meaning"],
};

function clip(s: unknown, max: number): string {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

// No model: sentence type from punctuation + a generic shape. Honest but plain.
export function basicClue(sentence: string): JumbleClue {
  const s = sentence.trim();
  const lower = ` ${s.toLowerCase()} `;
  const kind: JumbleClue["kind"] = s.endsWith("?")
    ? "question"
    : s.endsWith("!")
      ? "exclamation"
      : / not |n't /.test(lower)
        ? "negative"
        : "statement";
  const pattern =
    kind === "question"
      ? ["Question word / Helper", "Who", "Action", "The rest"]
      : kind === "negative"
        ? ["Who", "Helper + not", "Action", "The rest"]
        : ["Who / What", "Action", "The rest"];
  return {
    kind,
    tense: "",
    pattern,
    clue:
      kind === "question"
        ? "Questions usually start with a question word or a helper verb (is, do, can…)."
        : "Start with who or what the sentence is about, then the action.",
    meaning: "",
    meaningLang: "",
    source: "basic",
  };
}

export async function getJumbleClue(args: {
  userId: string;
  problemId: number;
  sentence: string;
  nativeLang: string;
}): Promise<JumbleClue> {
  const script = NATIVE_SCRIPTS[args.nativeLang.trim()] ?? "";
  const lang = script ? args.nativeLang.trim() : "English";

  const { data: cached } = await db()
    .from("problem_hints")
    .select("data")
    .eq("problem_id", args.problemId)
    .eq("lang", lang)
    .maybeSingle();
  if (cached?.data) return cached.data as JumbleClue;

  try {
    const { result, model } = await withTextModel(args.userId, env.geminiTextModel(), async (apiKey, pick) => {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: TEXT_CALL_TIMEOUT_MS } });
      const res = await ai.models.generateContent({
        model: pick,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Sentence: "${args.sentence}"\n${
                  script ? `Translate "meaning" into ${script}.` : `No translation requested — leave "meaning" empty.`
                }`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      });
      return parseModelJson<Partial<Record<keyof JumbleClue, unknown>>>(res);
    });

    const pattern = (Array.isArray(result.pattern) ? result.pattern : [])
      .map((p) => clip(p, 28))
      .filter(Boolean)
      .slice(0, 8);
    const clue: JumbleClue = {
      kind: KINDS.includes(result.kind as JumbleClue["kind"]) ? (result.kind as JumbleClue["kind"]) : basicClue(args.sentence).kind,
      tense: clip(result.tense, 40),
      pattern: pattern.length >= 2 ? pattern : basicClue(args.sentence).pattern,
      clue: clip(result.clue, 160) || basicClue(args.sentence).clue,
      meaning: script ? clip(result.meaning, 300) : "",
      meaningLang: script ? lang : "",
      source: "ai",
    };
    // A clue must never hand over the answer: if the model pasted the
    // sentence itself into the clue, use the plain clue instead.
    const answer = args.sentence.toLowerCase().replace(/[^a-z' ]/g, "").trim();
    if (answer.split(" ").length > 2 && clue.clue.toLowerCase().includes(answer)) clue.clue = basicClue(args.sentence).clue;

    await db()
      .from("problem_hints")
      .upsert({ problem_id: args.problemId, lang, data: clue, model }, { onConflict: "problem_id,lang", ignoreDuplicates: true });
    return clue;
  } catch (err) {
    // Busy/at capacity/any model failure: the learner still gets a hint.
    console.warn("[jumble] clue generation failed, using the basic clue:", (err as Error)?.message?.slice(0, 160));
    return basicClue(args.sentence);
  }
}

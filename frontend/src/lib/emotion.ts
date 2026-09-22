// Shared mascot emotion vocabulary + a cheap, dependency-free emotion
// detector. Used by the PixelMascot across Jumble, Pronunciation, and the AI
// Partner chat. Detection is pure keyword/regex scanning — no model call — so
// it's effectively free to run on every streamed reply.

export type MascotEmotion =
  | "idle"
  | "happy"
  | "sad"
  | "angry"
  | "thinking"
  | "surprised"
  | "love"
  | "scared"
  | "confused"
  | "idea"
  | "tips"
  | "greeting"
  | "asking"
  | "conversing";

// Ordered rules — first match wins, so stronger / more specific cues sit
// above broader ones (e.g. "love" before generic "happy").
const RULES: Array<{ emotion: MascotEmotion; test: RegExp }> = [
  { emotion: "love", test: /\b(i love|love it|adore|so proud of you|you're amazing|you are amazing|wonderful job|absolutely brilliant)\b|❤|🥰|😍/i },
  { emotion: "greeting", test: /\b(hello|hi there|hey there|welcome|nice to meet|good morning|good afternoon|good evening)\b|👋/i },
  { emotion: "happy", test: /\b(great|well done|excellent|awesome|fantastic|perfect|brilliant|good job|nicely done|congrats|congratulations|that's right|correct)\b|🎉|😊|😄|😁/i },
  { emotion: "idea", test: /\b(here's an idea|i have an idea|let's try|how about we|you could try|why don't you|one approach)\b|💡/i },
  { emotion: "tips", test: /\b(tip|hint|pro tip|remember to|make sure to|a good way|i'd recommend|i recommend|try to)\b/i },
  { emotion: "surprised", test: /\b(wow|whoa|oh wow|no way|incredible|that's surprising|unbelievable)\b|‼|!{2,}|😮|😲/i },
  { emotion: "sad", test: /\b(sorry|i'm sorry|unfortunately|that's a shame|oh no|too bad|not quite|that's incorrect|don't worry|it's okay|keep trying)\b|😢|😞|😔/i },
  { emotion: "confused", test: /\b(hmm|i'm not sure|not sure i|confused|that's unclear|i don't understand|come again|what do you mean)\b|🤔/i },
  { emotion: "asking", test: /\?\s*$/ },
];

// detectEmotion scans `text` for emotional cues and returns the first match,
// or `fallback` (default "conversing") when nothing strong is found.
export function detectEmotion(text: string, fallback: MascotEmotion = "conversing"): MascotEmotion {
  const t = (text ?? "").trim();
  if (!t) return fallback;
  for (const rule of RULES) {
    if (rule.test.test(t)) return rule.emotion;
  }
  return fallback;
}

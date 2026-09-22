// Shared browser Text-to-Speech helpers (Web Speech API). Used wherever the app
// reads a sentence/word aloud — Jumble Words and the Pronunciation Coach.
//
// Accent: we prefer an Indian-English ("en-IN") voice so prompts sound local
// (e.g. macOS "Veena", Windows "Heera"/"Ravi", Chrome's Google en-IN). If the
// user's device has no en-IN voice installed we fall back to any English voice,
// then the platform default — the API only exposes voices installed on the OS,
// it can't download one. Note hi-IN is skipped on purpose: a Hindi voice
// reading English text mispronounces it; en-IN is the accent we want.

// Some Indian female voice names don't contain the word "female", so match a few
// known ones too. Female is only a soft tiebreak — accent (en-IN) wins first.
const FEMALE_RE = /female|woman|veena|heera|aditi|raveena|kalpana|priya|neerja/i;

function lang(v: SpeechSynthesisVoice): string {
  return v.lang.toLowerCase().replace("_", "-");
}

// Pick the best voice: en-IN (female first) → any English (female first) → first.
export function pickSpeechVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const isIndian = (v: SpeechSynthesisVoice) => lang(v) === "en-in";
  const isEnglish = (v: SpeechSynthesisVoice) => lang(v).startsWith("en");
  const isFemale = (v: SpeechSynthesisVoice) => FEMALE_RE.test(v.name);
  return (
    voices.find((v) => isIndian(v) && isFemale(v)) ??
    voices.find(isIndian) ??
    voices.find((v) => isEnglish(v) && isFemale(v)) ??
    voices.find(isEnglish) ??
    voices[0]
  );
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
}

// Speak `text` with the preferred Indian-English voice. Cancels anything in
// flight first. Handles browsers (notably Chrome) that load voices
// asynchronously: if the voice list is empty we wait once for `voiceschanged`,
// then speak.
export function speak(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.95;
  u.pitch = opts.pitch ?? 1;
  if (opts.onstart) u.onstart = opts.onstart;
  if (opts.onend) u.onend = opts.onend;
  if (opts.onerror) u.onerror = opts.onerror;

  const assignAndSpeak = () => {
    const voice = pickSpeechVoice(synth.getVoices());
    if (voice) u.voice = voice;
    // Keep lang aligned with the chosen voice; hint en-IN when none was found.
    u.lang = voice ? voice.lang : "en-IN";
    synth.speak(u);
  };

  if (synth.getVoices().length) {
    assignAndSpeak();
  } else {
    synth.onvoiceschanged = () => {
      synth.onvoiceschanged = null;
      assignAndSpeak();
    };
  }
}

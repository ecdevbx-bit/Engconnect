// Live preview of the learner's words while they are still speaking (D-054).
//
// Gemini Live only sends the learner's transcript once their turn is over
// (~1–1.5 s after they stop), all at once — so the caption couldn't follow
// them as they spoke. On desktop browsers that have the Web Speech API we run
// it alongside, ONLY to draw interim captions; Gemini's transcript replaces
// the preview as soon as it arrives and is the one that is saved.
//
// Not used on phones/tablets: there the recogniser competes with our own mic
// capture and can switch the device's audio mode (the very route change mute
// used to cause), so phones show Gemini's transcript when the turn ends.

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechPreviewSupported(): boolean {
  if (!recognitionCtor()) return false;
  const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return !touch && !mobileUa;
}

export class SpeechPreview {
  private rec: Recognition | null = null;
  private running = false;
  private failures = 0;

  constructor(private readonly onText: (text: string) => void) {}

  start(lang = "en-IN"): void {
    const Ctor = recognitionCtor();
    if (!Ctor || this.running) return;
    this.running = true;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      // Only the utterance in progress: final results are Gemini's job.
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0]?.transcript ?? "";
      this.failures = 0;
      this.onText(text.trim());
    };
    rec.onerror = (e) => {
      // Our own reset() and plain silence are normal, not failures.
      if (e.error === "aborted" || e.error === "no-speech") return;
      // Mic denied / service unavailable → stop trying; the preview is optional.
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") this.failures = 99;
      else this.failures++;
    };
    // Chrome ends a "continuous" session after a minute or on silence: restart.
    rec.onend = () => {
      if (!this.running || this.failures > 5) {
        this.running = false;
        return;
      }
      try {
        rec.start();
      } catch {
        this.running = false;
      }
    };
    this.rec = rec;
    try {
      rec.start();
    } catch {
      this.running = false;
    }
  }

  /** Forget the utterance in progress (its turn is over) and listen afresh. */
  reset(): void {
    if (!this.running) return;
    try {
      this.rec?.abort(); // onend restarts it
    } catch {
      /* not started */
    }
  }

  stop(): void {
    this.running = false;
    try {
      this.rec?.abort();
    } catch {
      /* not started */
    }
    this.rec = null;
  }
}

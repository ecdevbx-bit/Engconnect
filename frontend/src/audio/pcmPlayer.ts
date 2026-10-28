// Streaming PCM player for Gemini Live audio chunks.
//
// Each ai_audio_chunk frame carries base64-encoded signed-16-bit little-endian
// PCM (mono). We decode → convert to Float32 → schedule on the AudioContext
// timeline using a running `nextTime` cursor so consecutive chunks play
// seamlessly without restarting for every frame.
//
// Crackle fixes (D-053):
//   * the AudioContext runs at the stream's own rate (24 kHz) when the browser
//     allows it, so the output is resampled once as a stream instead of chunk
//     by chunk (per-chunk resampling clicks at every chunk boundary);
//   * a small jitter buffer: after a gap, playback starts LEAD_S ahead, so a
//     chunk that arrives a little late doesn't cut the audio (each cut is a
//     click). Every underrun grows the lead, up to MAX_LEAD_S;
//   * a chunk that starts after a gap fades in over a few ms.
//
// Captions (D-054): Gemini sends K.AI's words seconds before they are heard,
// so callers stamp each caption piece with `lastChunkStart()` and reveal it
// once `clock()` gets there — the text then appears as K.AI says it.

const DEFAULT_SAMPLE_RATE = 24000; // Gemini Live default for output audio
const LOG = "[pcm]";
const LEAD_S = 0.12;
const LEAD_STEP_S = 0.04;
const MAX_LEAD_S = 0.3;
const FADE_S = 0.004;

export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextTime = 0;
  private chunkCount = 0;
  // Live/scheduled chunk sources, tracked so flush() (barge-in) can stop them.
  private sources: AudioBufferSourceNode[] = [];
  private lead = LEAD_S;
  private lastStart = 0;

  constructor(private readonly sampleRate: number = DEFAULT_SAMPLE_RATE) {
    console.log(`${LOG} ctor sampleRate=${sampleRate}`);
  }

  /** Live analyser tapping K.AI's voice — read by the agent visualizers. */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /** Audio clock (seconds); 0 before the first chunk. */
  clock(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** When the most recently queued chunk starts playing, on `clock()`'s timeline (0 = nothing queued). */
  lastChunkStart(): number {
    return this.sources.length ? this.lastStart : 0;
  }

  /** True while any scheduled chunk is still playing (K.AI audibly speaking). */
  isPlaying(): boolean {
    return this.sources.length > 0;
  }

  /**
   * Eagerly create + resume the AudioContext. Call from a synchronous click /
   * tap handler so the browser's user-activation check passes; otherwise the
   * context lands in `suspended` and the first chunks pile up silently.
   */
  prime(): void {
    console.log(`${LOG} prime() — gesture-bound init`);
    this.ensureCtx();
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AC: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      try {
        this.ctx = new AC({ sampleRate: this.sampleRate });
      } catch {
        this.ctx = new AC();
      }
      this.nextTime = 0;
      this.analyser = null;
      console.log(
        `${LOG} created AudioContext: state=${this.ctx.state} deviceRate=${this.ctx.sampleRate} target=${this.sampleRate}`,
      );
    }

    const ctx = this.ctx;

    // The analyser sits between every chunk source and the speakers, so it
    // always carries whatever K.AI is currently saying.
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.connect(ctx.destination);
    }

    if (ctx.state === "suspended") {
      void ctx.resume().then(() =>
        console.log(`${LOG} resume() resolved, state=${ctx.state}`),
      );
    }

    return ctx;
  }

  enqueueBase64Pcm(b64: string): void {
    if (!b64) return;
    try {
      const ctx = this.ensureCtx();

      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      if (bytes.byteLength < 2) return;

      const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

      // Behind the clock = the queue ran dry. If it ran dry under a second ago
      // that was an underrun mid-reply, so keep a bigger cushion from now on.
      const gap = this.nextTime < ctx.currentTime + 0.005;
      if (gap && this.nextTime > 0 && ctx.currentTime - this.nextTime < 1) {
        this.lead = Math.min(MAX_LEAD_S, this.lead + LEAD_STEP_S);
      }
      if (gap) {
        const fade = Math.min(float32.length, Math.round(FADE_S * this.sampleRate));
        for (let i = 0; i < fade; i++) float32[i] *= i / fade;
      }

      const buffer = ctx.createBuffer(1, float32.length, this.sampleRate);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser ?? ctx.destination);

      const startAt = gap ? ctx.currentTime + this.lead : this.nextTime;
      source.start(startAt);
      this.lastStart = startAt;
      this.sources.push(source);
      source.onended = () => {
        this.sources = this.sources.filter((s) => s !== source);
      };
      this.nextTime = startAt + buffer.duration;
      this.chunkCount++;
      if (this.chunkCount === 1 || this.chunkCount % 25 === 0) {
        console.log(
          `${LOG} chunk #${this.chunkCount}: samples=${float32.length} dur=${buffer.duration.toFixed(3)}s startAt=${startAt.toFixed(3)} ctxNow=${ctx.currentTime.toFixed(3)} ctxState=${ctx.state}`,
        );
      }
    } catch (err) {
      console.warn(`${LOG} enqueue failed`, err);
    }
  }

  /**
   * Barge-in: immediately stop everything currently playing or scheduled WITHOUT
   * tearing down the AudioContext, so the very next chunk (the user's next turn)
   * plays right away. Used when the learner taps the mic to talk over K.AI.
   */
  flush(): void {
    for (const s of this.sources) {
      try {
        s.onended = null;
        s.stop();
        s.disconnect();
      } catch {
        // already ended/stopped — fine
      }
    }
    this.sources = [];
    // 0 = "idle", so the next reply isn't mistaken for an underrun.
    this.nextTime = 0;
  }

  stop(): void {
    console.log(`${LOG} stop() — ${this.chunkCount} chunks enqueued total`);
    if (this.ctx && this.ctx.state !== "closed") {
      void this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.analyser = null;
    this.nextTime = 0;
    this.chunkCount = 0;
    this.sources = [];
  }
}

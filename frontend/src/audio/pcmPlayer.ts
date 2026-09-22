// Streaming PCM player for Gemini Live audio chunks.
//
// Each ai_audio_chunk frame carries base64-encoded signed-16-bit little-endian
// PCM (mono). We decode → convert to Float32 → schedule on the AudioContext
// timeline using a running `nextTime` cursor so consecutive chunks play
// seamlessly without restarting for every frame.

const DEFAULT_SAMPLE_RATE = 24000; // Gemini Live default for output audio
const LOG = "[pcm]";

export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextTime = 0;
  private chunkCount = 0;
  // Live/scheduled chunk sources, tracked so flush() (barge-in) can stop them.
  private sources: AudioBufferSourceNode[] = [];

  constructor(private readonly sampleRate: number = DEFAULT_SAMPLE_RATE) {
    console.log(`${LOG} ctor sampleRate=${sampleRate}`);
  }

  /** Live analyser tapping K.AI's voice — read by the agent visualizers. */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
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
      this.ctx = new AC();
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

      const buffer = ctx.createBuffer(1, float32.length, this.sampleRate);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser ?? ctx.destination);

      const startAt = Math.max(this.nextTime, ctx.currentTime);
      source.start(startAt);
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
    this.nextTime = this.ctx ? this.ctx.currentTime : 0;
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

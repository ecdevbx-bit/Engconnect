// Microphone → 16-bit PCM (mono) chunks, base64-encoded for Gemini Live's
// realtimeInput.audio. Adapted from the Deepgram capture hook's audio graph:
//   * asks for a 16 kHz AudioContext (Gemini's native input rate) but works at
//     whatever rate the browser grants — the rate travels in the MIME type;
//   * AudioWorklet on the audio thread, ScriptProcessor fallback;
//   * batches the worklet's 128-sample frames into ~100 ms chunks so we send
//     ~10 messages/s instead of ~125;
//   * exposes an analyser (MicLevelRing) and the time of the last voiced frame;
//   * optional `gate`: frames it rejects are sent as silence (zeros) instead —
//     the hands-free AI Partner uses it so K.AI's own voice leaking from the
//     speaker can't count as the learner talking (the stream never pauses, so
//     Gemini's voice detection keeps seeing a continuous signal);
//   * background-voice gate (D-052, on by default): only a voice close to the
//     mic gets through — a TV or people talking across the room are quieter
//     than the learner, so frames well below the learner's own level (or just
//     above the room's noise) are sent as silence too. Audio is held back
//     LOOKAHEAD_MS so the gate can open before a word's first sound.
//   * D-054: the browser's automatic gain control is OFF — it turned the room
//     up whenever the learner paused, so a TV across the room reached almost
//     the learner's own level and slipped past the gate. Instead, frames that
//     pass are amplified by a gain keyed to the learner's voice level only
//     (never to the room), so quiet mics still reach Gemini at a usable level.
//   * `paused` (mute) stops sending without releasing the mic: releasing it
//     switched phones out of call audio, so K.AI's volume/speaker changed.

const WORKLET_SOURCE = `
class PCMRecorder extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    const out = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let s = ch[i];
      if (s > 1) s = 1; else if (s < -1) s = -1;
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.port.postMessage(out.buffer, [out.buffer]);
    return true;
  }
}
registerProcessor('pcm-recorder', PCMRecorder);
`;

const CHUNK_MS = 100;
// RMS (0–1) above which a frame counts as the learner speaking.
const VOICE_RMS = 0.02;

// Background-voice gate. Threshold = the largest of BG_MIN_RMS, the room's
// noise × BG_NOISE_RATIO and the learner's voice level × BG_VOICE_SHARE, but
// never more than BG_MAX_RMS so a soft-spoken learner in a loud room still
// gets through.
const BG_MIN_RMS = 0.012;
const BG_MAX_RMS = 0.05;
const BG_NOISE_RATIO = 3; // ≈ 10 dB over the noise between words
const BG_VOICE_SHARE = 0.25; // ≈ 12 dB under the learner's own voice
const BG_OPEN_MS = 24; // a click or tap shorter than this doesn't open it
const BG_HOLD_MS = 450; // stays open through the gaps between words
const LOOKAHEAD_MS = 120;
// Voice-keyed gain: bring the learner's voice to about TARGET_RMS, ×1…MAX_GAIN.
const TARGET_RMS = 0.1;
const MAX_GAIN = 6;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

export class MicPcmStream {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: AudioNode | null = null;
  private analyser: AnalyserNode | null = null;
  private workletURL: string | null = null;
  private pending: Int16Array[] = [];
  private pendingSamples = 0;
  private onChunk: ((b64: string) => void) | null = null;
  lastVoiceAt = 0;
  // Per-frame veto (echo gate). Frames it rejects are sent as silence.
  gate: ((rms: number, frameMs: number) => boolean) | null = null;
  // Muted: frames are dropped (nothing is sent), the mic stays open.
  paused = false;
  // Set false before start() to send every frame (no background-voice gate).
  rejectBackground = true;
  sampleRate = 16000;
  // Background-gate state, timed in samples (worklet messages can arrive in bursts).
  private clockMs = 0;
  private noiseRms = 0.006;
  private voiceRms = 0.06;
  private aboveMs = 0;
  private openUntilMs = -1;
  private delayed: { frame: Int16Array; open: boolean; pass: boolean }[] = [];
  private delayedSamples = 0;
  private passing = true;

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /** The learner's learned speaking level (RMS 0–1). */
  get voiceLevel(): number {
    return this.voiceRms;
  }

  get mimeType(): string {
    return `audio/pcm;rate=${Math.round(this.sampleRate)}`;
  }

  async start(onChunk: (b64: string) => void): Promise<void> {
    this.onChunk = onChunk;
    // Echo cancellation matters: K.AI speaks through the same device. Gain
    // control is ours (see the header); voice isolation where the browser has it.
    const supported = navigator.mediaDevices.getSupportedConstraints() as Record<string, boolean>;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        ...(supported.voiceIsolation ? { voiceIsolation: true } : {}),
      } as MediaTrackConstraints,
    });
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    try {
      this.ctx = new AC({ sampleRate: 16_000 });
    } catch {
      this.ctx = new AC();
    }
    const ctx = this.ctx;
    if (ctx.state === "suspended") await ctx.resume();
    this.sampleRate = ctx.sampleRate;

    const source = ctx.createMediaStreamSource(this.stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    const chunkSamples = Math.round((this.sampleRate * CHUNK_MS) / 1000);
    const lookaheadSamples = this.rejectBackground ? Math.round((this.sampleRate * LOOKAHEAD_MS) / 1000) : 0;
    const push = (raw: Int16Array) => {
      let sum = 0;
      for (let i = 0; i < raw.length; i++) sum += (raw[i] / 32768) ** 2;
      const rms = Math.sqrt(sum / Math.max(1, raw.length));
      if (this.paused) {
        // Drop what was held back too, so unmuting never sends stale audio.
        this.delayed = [];
        this.delayedSamples = 0;
        this.pending = [];
        this.pendingSamples = 0;
        return;
      }
      const frameMs = (raw.length * 1000) / this.sampleRate;
      const pass = !this.gate || this.gate(rms, frameMs);
      const open = this.rejectBackground ? this.nearVoice(rms, frameMs, pass) : true;
      if (open && pass && rms > VOICE_RMS) this.lastVoiceAt = performance.now();
      // Opening also lets through the held-back audio just before it (the onset);
      // so does the echo gate letting a barge-in through.
      if (open) for (const d of this.delayed) d.open = true;
      if (pass && !this.passing) for (const d of this.delayed) d.pass = true;
      this.passing = pass;
      this.delayed.push({ frame: raw, open, pass });
      this.delayedSamples += raw.length;
      while (this.delayed.length && this.delayedSamples - this.delayed[0].frame.length >= lookaheadSamples) {
        this.emit(this.delayed.shift()!, chunkSamples);
      }
    };

    if (ctx.audioWorklet) {
      this.workletURL = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
      await ctx.audioWorklet.addModule(this.workletURL);
      const worklet = new AudioWorkletNode(ctx, "pcm-recorder");
      worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => push(new Int16Array(e.data));
      this.node = worklet;
    } else {
      const proc = ctx.createScriptProcessor(2048, 1, 1);
      proc.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const out = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        push(out);
      };
      // ScriptProcessor only runs while connected; zero gain avoids self-echo.
      const mute = ctx.createGain();
      mute.gain.value = 0;
      proc.connect(mute);
      mute.connect(ctx.destination);
      this.node = proc;
    }
    source.connect(this.node);
    this.lastVoiceAt = performance.now();
  }

  // Is this frame (part of) the learner's voice rather than the room?
  // `learn` is false while `gate` is muting the frame (K.AI's own voice from
  // the speaker), so that echo doesn't skew the learned levels.
  private nearVoice(rms: number, frameMs: number, learn: boolean): boolean {
    this.clockMs += frameMs;
    const threshold = Math.min(
      BG_MAX_RMS,
      Math.max(BG_MIN_RMS, this.noiseRms * BG_NOISE_RATIO, this.voiceRms * BG_VOICE_SHARE),
    );
    if (rms > threshold) {
      this.aboveMs += frameMs;
      if (this.aboveMs >= BG_OPEN_MS) this.openUntilMs = this.clockMs + BG_HOLD_MS;
    } else {
      this.aboveMs = 0;
    }
    const open = this.clockMs <= this.openUntilMs;
    if (!learn) return open;
    if (open && rms > threshold) {
      // Learn the learner's level: rise quickly, follow a softer voice over ~4 s.
      const rate = rms > this.voiceRms ? 0.02 : frameMs / 4_000;
      this.voiceRms += (rms - this.voiceRms) * rate;
    } else if (!open) {
      // Room noise: fall fast, rise over ~5 s.
      const rate = rms < this.noiseRms ? 0.2 : frameMs / 5_000;
      this.noiseRms = Math.max(0.002, this.noiseRms + (rms - this.noiseRms) * rate);
    }
    return open;
  }

  private emit(d: { frame: Int16Array; open: boolean; pass: boolean }, chunkSamples: number): void {
    this.delayedSamples -= d.frame.length;
    const frame = d.open && d.pass ? this.amplify(d.frame) : new Int16Array(d.frame.length);
    this.pending.push(frame);
    this.pendingSamples += frame.length;
    if (this.pendingSamples >= chunkSamples) this.flush();
  }

  private amplify(frame: Int16Array): Int16Array {
    const gain = this.rejectBackground ? Math.min(MAX_GAIN, Math.max(1, TARGET_RMS / Math.max(1e-4, this.voiceRms))) : 1;
    if (gain <= 1.01) return frame;
    const out = new Int16Array(frame.length);
    for (let i = 0; i < frame.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(frame[i] * gain)));
    return out;
  }

  private flush(): void {
    if (!this.pendingSamples || !this.onChunk) return;
    const merged = new Int16Array(this.pendingSamples);
    let o = 0;
    for (const f of this.pending) {
      merged.set(f, o);
      o += f.length;
    }
    this.pending = [];
    this.pendingSamples = 0;
    this.onChunk(toBase64(new Uint8Array(merged.buffer)));
  }

  // Release the mic (end of the conversation).
  stop(): void {
    for (const d of this.delayed) this.emit(d, Infinity);
    this.delayed = [];
    this.delayedSamples = 0;
    this.flush();
    this.onChunk = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    try {
      this.node?.disconnect();
    } catch {
      /* already disconnected */
    }
    this.node = null;
    if (this.ctx && this.ctx.state !== "closed") void this.ctx.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
    if (this.workletURL) URL.revokeObjectURL(this.workletURL);
    this.workletURL = null;
  }
}

// Microphone → 16-bit PCM (mono) chunks, base64-encoded for Gemini Live's
// realtimeInput.audio. Adapted from the Deepgram capture hook's audio graph:
//   * asks for a 16 kHz AudioContext (Gemini's native input rate) but works at
//     whatever rate the browser grants — the rate travels in the MIME type;
//   * AudioWorklet on the audio thread, ScriptProcessor fallback;
//   * batches the worklet's 128-sample frames into ~100 ms chunks so we send
//     ~10 messages/s instead of ~125;
//   * exposes an analyser (MicLevelRing) and the time of the last voiced frame
//     (silence auto-stop in tap-to-talk).

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
  sampleRate = 16000;

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  get mimeType(): string {
    return `audio/pcm;rate=${Math.round(this.sampleRate)}`;
  }

  async start(onChunk: (b64: string) => void): Promise<void> {
    this.onChunk = onChunk;
    // Echo cancellation matters: K.AI speaks through the same device.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
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
    const push = (frame: Int16Array) => {
      let sum = 0;
      for (let i = 0; i < frame.length; i++) sum += (frame[i] / 32768) ** 2;
      if (Math.sqrt(sum / Math.max(1, frame.length)) > VOICE_RMS) this.lastVoiceAt = performance.now();
      this.pending.push(frame);
      this.pendingSamples += frame.length;
      if (this.pendingSamples >= chunkSamples) this.flush();
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

  // Release the mic straight away (a held mic keeps Bluetooth headsets in
  // their muffled "call" profile, which would make K.AI's reply sound bad).
  stop(): void {
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

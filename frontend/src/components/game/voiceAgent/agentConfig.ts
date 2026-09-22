// Shared config + audio helpers for the voice-agent visualizers.

// The orb style was removed — only the pixel mascot remains.
export type AgentStyle = "pixel";

/** What K.AI is doing right now — drives every visualization. */
export type AgentState = "idle" | "listening" | "speaking";

export const AGENT_STYLES: { id: AgentStyle; label: string; emoji: string }[] = [
  { id: "pixel", label: "Pixel", emoji: "👾" },
];

export const DEFAULT_AGENT_STYLE: AgentStyle = "pixel";

/** Per-state accent colour shared across the visualizers. */
export function stateColor(state: AgentState): string {
  if (state === "listening") return "#00e3fd"; // cyan — the user
  if (state === "speaking") return "#b79fff"; // purple — K.AI
  return "#8c7bd0"; // muted — idle
}

/**
 * RMS amplitude (0..~1) from an analyser's time-domain data. Returns 0 when the
 * analyser is null (not yet connected) so callers can fall back to an idle
 * animation. The result is scaled up a little for visual punch.
 */
export function readLevel(
  analyser: AnalyserNode | null,
  buf: Uint8Array<ArrayBuffer>,
): number {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 2.6);
}

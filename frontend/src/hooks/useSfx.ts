"use client";

import { useCallback, useRef } from "react";

/**
 * useSfx — tiny synthesized sound effects via the Web Audio API.
 *
 * No audio assets: each cue is a short oscillator envelope, so it adds zero
 * network weight. Returns a `play(cue)` function; pass `enabled=false` to mute.
 */
export type SfxCue =
  | "place"
  | "correct"
  | "wrong"
  | "streak"
  // Jumble round finished.
  | "complete"
  // Railway / train world (Jumble): the buffer signal turns green, the train
  // departs, and a fresh train rolls in on the next question.
  | "signal"
  | "depart"
  | "arrive"
  // App-wide celebrations.
  | "levelup"
  | "badge"
  // AI-partner mascot moods — three buckets the detected emotion maps onto.
  | "cheer"
  | "aww"
  | "blip";

export function useSfx(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (cue: SfxCue) => {
      if (!enabled || typeof window === "undefined") return;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = (ctxRef.current ??= new Ctx());
        if (ctx.state === "suspended") void ctx.resume();

        const note = (
          freq: number,
          start: number,
          dur: number,
          type: OscillatorType = "sine",
          gain = 0.14
        ) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          const t0 = ctx.currentTime + start;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + dur + 0.02);
        };

        switch (cue) {
          case "place":
            note(420, 0, 0.09, "triangle", 0.1);
            break;
          case "correct":
            note(523.25, 0, 0.12, "sine"); // C5
            note(659.25, 0.1, 0.14, "sine"); // E5
            note(783.99, 0.2, 0.22, "sine"); // G5
            break;
          case "wrong":
            note(180, 0, 0.22, "sawtooth", 0.09);
            break;
          case "streak":
            note(659.25, 0, 0.1, "triangle");
            note(987.77, 0.09, 0.2, "triangle");
            break;
          case "complete":
            // Bright ascending "ta-daa" for finishing a round.
            note(659.25, 0, 0.12, "triangle"); // E5
            note(880.0, 0.12, 0.12, "triangle"); // A5
            note(1046.5, 0.24, 0.3, "triangle", 0.15); // C6
            break;

          // ── Railway / train world ────────────────────────────────────────
          case "signal":
            // Two-tone "go" bell — the buffer signal flips to green.
            note(587.33, 0, 0.13, "sine", 0.12); // D5
            note(880.0, 0.13, 0.2, "sine", 0.12); // A5
            break;
          case "depart": {
            // Steam whistle (two detuned reeds) over a couple of low chuffs.
            note(440, 0, 0.42, "sawtooth", 0.06);
            note(556, 0, 0.42, "sawtooth", 0.05);
            note(130.81, 0.04, 0.12, "square", 0.06); // chuff
            note(130.81, 0.26, 0.12, "square", 0.06); // chuff
            break;
          }
          case "arrive":
            // Softer, shorter whistle as the next train rolls in.
            note(523.25, 0, 0.18, "sine", 0.08); // C5
            note(659.25, 0.12, 0.22, "sine", 0.07); // E5
            break;

          // ── App-wide celebrations ────────────────────────────────────────
          case "levelup":
            // Grand four-note arpeggio with a high sparkle resolve.
            note(523.25, 0, 0.12, "triangle"); // C5
            note(659.25, 0.1, 0.12, "triangle"); // E5
            note(783.99, 0.2, 0.12, "triangle"); // G5
            note(1046.5, 0.32, 0.34, "triangle", 0.16); // C6
            note(1567.98, 0.42, 0.26, "sine", 0.08); // sparkle G6
            break;
          case "badge":
            // Shiny reward ding + sparkle for earning a badge.
            note(880.0, 0, 0.1, "triangle"); // A5
            note(1318.51, 0.08, 0.2, "triangle", 0.13); // E6
            note(1760.0, 0.18, 0.22, "sine", 0.08); // sparkle A6
            break;

          // ── AI-partner mascot moods ──────────────────────────────────────
          case "cheer":
            // Light, upbeat lift for happy / proud / excited replies.
            note(659.25, 0, 0.1, "triangle", 0.1); // E5
            note(880.0, 0.08, 0.16, "triangle", 0.1); // A5
            break;
          case "aww":
            // Gentle falling pair for sad / unsure / nervous replies.
            note(440.0, 0, 0.16, "sine", 0.08); // A4
            note(349.23, 0.12, 0.24, "sine", 0.08); // F4
            break;
          case "blip":
            // Subtle single tick for neutral / conversational replies.
            note(520, 0, 0.07, "sine", 0.06);
            break;
        }
      } catch {
        /* audio not available — silently ignore */
      }
    },
    [enabled]
  );

  return play;
}

"use client";

import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";

/**
 * VoiceAgent — the expressive PixelMascot, driven by the conversation's detected
 * emotion + thinking state. (The audio-reactive "orb" style was removed.)
 */
export default function VoiceAgent({
  emotion,
  isThinking,
  size = 150,
}: {
  emotion?: MascotEmotion;
  isThinking?: boolean;
  size?: number;
}) {
  return <PixelMascot emotion={emotion ?? "conversing"} isThinking={isThinking} size={size} />;
}

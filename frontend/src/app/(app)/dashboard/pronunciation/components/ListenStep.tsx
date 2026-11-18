"use client";

import { useCallback, useEffect, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";
import { StepDots } from "./StepDots";

// Browser-native TTS via window.speechSynthesis (shared helper in lib/tts).
// No backend cost, no extra audio asset — and it prefers an Indian-English
// (en-IN) voice when one is installed, otherwise the platform default.

export function ListenStep({
  sentence,
  onReady,
}: {
  sentence: string;
  onReady: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // Cancel any in-flight utterance on unmount or sentence change.
  useEffect(() => {
    return stop;
  }, [stop, sentence]);

  const play = useCallback(() => {
    speak(sentence, {
      rate: 0.95,
      onstart: () => setSpeaking(true),
      onend: () => setSpeaking(false),
      onerror: () => setSpeaking(false),
    });
  }, [sentence]);

  return (
    <div className="flex flex-col items-center text-center">
      <StepDots current="listen" />

      <h3 className="mt-4 max-w-2xl font-display text-[26px] font-bold leading-snug text-heading text-balance md:text-[34px]">
        {sentence}
      </h3>

      <button
        type="button"
        onClick={speaking ? stop : play}
        aria-label={speaking ? "Stop the sentence" : "Hear the sentence"}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-speak-soft px-5 font-display text-[16px] font-extrabold text-speak transition-colors hover:brightness-95 active:scale-[0.98]"
      >
        {speaking ? <Square className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        {speaking ? "Stop" : "Hear it"}
      </button>

      <Button onClick={onReady} size="lg" className="mt-8 w-full max-w-sm">
        <Mic className="!size-5" />
        I&apos;m ready
      </Button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Headphones, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

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
      <p className="text-sm font-medium text-primary">Listen Carefully</p>
      <p className="mt-1 hidden text-sm text-muted-foreground md:block">Hear the sentence before speaking.</p>

      <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Headphones className="h-6 w-6" />
      </div>

      <h3 className="mt-6 max-w-2xl font-display text-2xl font-semibold leading-snug text-heading md:text-3xl">
        {sentence}
        <button
          type="button"
          onClick={speaking ? stop : play}
          aria-label={speaking ? "Stop" : "Play"}
          className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 align-middle text-primary transition-colors hover:bg-primary/25"
        >
          {speaking ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </h3>

      <Button onClick={onReady} size="lg" className="mt-8">
        I&apos;m ready →
      </Button>
    </div>
  );
}

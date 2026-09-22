"use client";

import { Lightbulb } from "lucide-react";

import { Card } from "@/components/ui/card";

import type { CoachStep } from "./StepperSidebar";

const TIPS: Record<CoachStep, string> = {
  listen: "Listen carefully before speaking. Focus on rhythm and stress.",
  speak: "Take a breath, then read the sentence at a natural pace.",
  feedback: "Tap a word chip to hear it again and compare with your attempt.",
  improve: "Try one tip at a time. Small adjustments compound fast.",
};

export function TipBar({ step }: { step: CoachStep }) {
  return (
    <Card className="flex flex-row items-center gap-3 px-5 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Lightbulb className="h-4 w-4" />
      </span>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-heading">Tip:</span> {TIPS[step]}
      </p>
    </Card>
  );
}

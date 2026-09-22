"use client";

import { cn } from "@/lib/utils";
import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";

type Feedback = "correct" | "wrong" | null;

interface Props {
    feedback: Feedback;
    size?: number;
    className?: string;
}

// The Jumble AI coach now uses the shared expressive PixelMascot:
//   calm (idle)  -> question loaded / retry
//   happy        -> correct answer
//   sad          -> wrong answer
export default function AiCoachMascot({ feedback, size = 56, className }: Props) {
    const emotion: MascotEmotion =
        feedback === "correct" ? "happy" : feedback === "wrong" ? "sad" : "idle";

    return (
        <PixelMascot
            emotion={emotion}
            size={size}
            className={cn(
                "shrink-0",
                feedback === "correct" && "anim-mascot-pop",
                feedback === "wrong" && "anim-mascot-shake",
                className,
            )}
        />
    );
}

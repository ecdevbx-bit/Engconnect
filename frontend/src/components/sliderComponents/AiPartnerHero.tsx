"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Speaker = "kai" | "user";

interface Bubble {
    speaker: Speaker;
    name: string;
    avatar: string;
    text: string;
}

const SCRIPT: Bubble[] = [
    {
        speaker: "kai",
        name: "K.AI",
        avatar: "/avatars/k-ai.svg",
        text: "Hi Abhimanyu, ready to improve your English today?",
    },
    {
        speaker: "user",
        name: "Abhimanyu",
        avatar: "/avatars/abhimanyu.svg",
        text: "Yes, I would love to do it.",
    },
    {
        speaker: "kai",
        name: "K.AI",
        avatar: "/avatars/k-ai.svg",
        text: "Cool! Let's get started.",
    },
];

const STEP_MS = 1400;       // gap between bubbles popping in
const LOOP_PAUSE_MS = 3200; // pause before the script restarts

export default function AiPartnerHero() {
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const timers: ReturnType<typeof setTimeout>[] = [];

        const run = () => {
            setVisibleCount(0);
            SCRIPT.forEach((_, i) => {
                timers.push(
                    setTimeout(() => {
                        if (!cancelled) setVisibleCount(i + 1);
                    }, STEP_MS * (i + 1)),
                );
            });
            timers.push(
                setTimeout(
                    () => {
                        if (!cancelled) run();
                    },
                    STEP_MS * (SCRIPT.length + 1) + LOOP_PAUSE_MS,
                ),
            );
        };

        run();
        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="relative flex w-full max-w-[720px] flex-row-reverse items-center justify-center gap-5 px-4 lg:gap-7">
            {/* AI Partner mascot */}
            <div className="relative shrink-0">
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-radial from-[#ab8eff]/30 via-[#00e3fd]/15 to-transparent blur-3xl" />
                <Image
                    src="/aiPartner.svg"
                    alt="K.AI partner"
                    width={520}
                    height={520}
                    priority
                    className="h-auto w-[180px] md:w-[220px] lg:w-[280px] anim-partner-float"
                />
            </div>

            {/* Chat bubbles column (sits to the left of the mascot) */}
            <div className="flex min-h-[320px] flex-1 flex-col gap-6 self-center lg:min-h-[400px] lg:gap-7">
                {SCRIPT.map((b, i) => {
                    const visible = i < visibleCount;
                    const isUser = b.speaker === "user";
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex items-end gap-3 transition-opacity md:gap-4",
                                isUser ? "flex-row-reverse" : "flex-row",
                                visible ? "anim-bubble-pop opacity-100" : "pointer-events-none opacity-0",
                            )}
                            aria-hidden={!visible}
                        >
                            <Image
                                src={b.avatar}
                                alt={b.name}
                                width={56}
                                height={56}
                                className="h-12 w-12 shrink-0 rounded-full ring-1 ring-white/10 md:h-14 md:w-14"
                            />
                            <div
                                className={cn(
                                    "relative w-full max-w-[340px] rounded-lg px-5 py-3.5 text-base leading-relaxed shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] md:max-w-[420px] md:text-lg",
                                    isUser
                                        ? "rounded-br-sm bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14]"
                                        : "rounded-bl-sm border border-white/10 bg-surface-2/80 text-heading backdrop-blur",
                                )}
                            >
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70 md:text-[13px]">
                                    {b.name}
                                </div>
                                {b.text}
                            </div>
                        </div>
                    );
                })}

                {/* Typing dots while waiting for the next bubble */}
                {visibleCount < SCRIPT.length && (
                    <div
                        className={cn(
                            "flex items-end gap-3 md:gap-4",
                            SCRIPT[visibleCount].speaker === "user" ? "flex-row-reverse" : "flex-row",
                        )}
                    >
                        <Image
                            src={SCRIPT[visibleCount].avatar}
                            alt=""
                            width={56}
                            height={56}
                            className="h-12 w-12 shrink-0 rounded-full opacity-50 ring-1 ring-white/10 md:h-14 md:w-14"
                        />
                        <div className="rounded-lg border border-white/10 bg-surface-2/60 px-4 py-3 backdrop-blur">
                            <span className="flex gap-1.5">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

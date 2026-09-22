import type { ReactNode } from "react";
import type { Step, Tour } from "nextstepjs";

// `mobileContent` is a shorter body shown on phones (full `content` on desktop).
type AipStep = Step & { mobileContent?: ReactNode };

// Tour name used by useNextStep().startNextStep('ai-partner').
export const AI_PARTNER_TOUR_NAME = "ai-partner";

// localStorage key — set after the first walkthrough so the tour only
// auto-launches once per browser.
export const AI_PARTNER_TOUR_SEEN_KEY = "ai-partner:tour:seen:v1";

// Query param the page honours to request an auto-launch when the user
// arrives from a "How to play" CTA.
export const AI_PARTNER_TOUR_QUERY = "tour";

// The tour highlights elements that only exist once a session is running
// (the agent header, chat, and mic), so it is launched from the active
// session view — not the pre-session "Meet K.AI" screen.
const STEPS: AipStep[] = [
    {
        icon: "🤖",
        title: "Meet K.AI",
        content: (
            <p>
                Have a real, judgement-free conversation in spoken English.
                K.AI listens, replies, and helps you improve as you talk.
            </p>
        ),
        mobileContent: <p>Have a real spoken-English chat. K.AI listens and replies.</p>,
        selector: "#aip-tour-title",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 12,
    },
    {
        icon: "⏱️",
        title: "Your session",
        content: (
            <p>
                Watch K.AI&apos;s state and your remaining time here. You can
                also switch the agent&apos;s personality mid-session.
            </p>
        ),
        mobileContent: <p>K.AI&apos;s state and your time left — switch personality too.</p>,
        selector: "#aip-tour-agent",
        side: "bottom",
        pointerPadding: 6,
        pointerRadius: 16,
    },
    {
        icon: "💬",
        title: "The conversation",
        content: (
            <p>
                Everything you and K.AI say appears here. Don&apos;t worry
                about mistakes — just keep the conversation flowing.
            </p>
        ),
        mobileContent: <p>Your conversation appears here. Don&apos;t fear mistakes.</p>,
        selector: "#aip-tour-messages",
        side: "right",
        pointerPadding: 6,
        pointerRadius: 16,
    },
    {
        icon: "🎤",
        title: "Tap to talk",
        content: (
            <p>
                Tap the mic — or press <strong className="text-heading">Space</strong> —
                to speak. We auto-stop after a few seconds and send it to K.AI.
            </p>
        ),
        mobileContent: (
            <p>
                Tap the mic (or press <strong className="text-heading">Space</strong>) to talk; we auto-stop and send.
            </p>
        ),
        selector: "#aip-tour-mic",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 20,
    },
    {
        icon: "📊",
        title: "Your progress",
        content: (
            <p>
                XP is earned for time on the mic. Track your stats and
                speaking milestones here as the session goes on.
            </p>
        ),
        mobileContent: <p>Earn XP for time on the mic; track stats here.</p>,
        selector: "#aip-tour-stats",
        side: "left",
        pointerPadding: 6,
        pointerRadius: 16,
    },
    {
        icon: "❓",
        title: "Need a refresher?",
        content: (
            <p>
                Tap this button any time to replay this walkthrough.
                Now go have a chat!
            </p>
        ),
        mobileContent: <p>Tap here anytime to replay this tour. Now go have a chat!</p>,
        selector: "#aip-tour-help-btn",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 999,
    },
];

export const AI_PARTNER_TOUR: Tour[] = [
    {
        tour: AI_PARTNER_TOUR_NAME,
        steps: STEPS.map((s) => ({
            showControls: true,
            showSkip: true,
            ...s,
        })),
    },
];

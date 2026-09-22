import type { ReactNode } from "react";
import type { Step, Tour } from "nextstepjs";
import type { MascotEmotion } from "@/lib/emotion";

// A tour step that also carries a mascot emotion — JumbleTourCard renders the
// expressive PixelMascot for it in every card. `mobileContent` is a shorter
// body shown on phones (the full `content` stays on desktop).
type EmotiveStep = Step & { emotion?: MascotEmotion; mobileContent?: ReactNode };

// Tour name used by useNextStep().startNextStep('jumble').
export const JUMBLE_TOUR_NAME = "jumble";

// localStorage key — set after the first successful walkthrough so the tour
// only auto-launches once per browser.
export const JUMBLE_TOUR_SEEN_KEY = "jumble:tour:seen:v1";

// Query param the landing page uses to request an auto-launch when the
// player arrives from the "How to play" CTA.
export const JUMBLE_TOUR_QUERY = "tour";

// Per-step content. `showControls` / `showSkip` are applied to every step
// below — keeps Next / Back / Skip available throughout the walkthrough.
const STEPS: EmotiveStep[] = [
    {
        icon: null,
        emotion: "greeting",
        title: "Hi, I'm K.AI! 👋",
        content: (
            <p>
                Welcome to Jumble Words! Rearrange the shuffled words into a
                correct English sentence to earn XP and build streaks. Let me
                show you around — it&apos;ll take 30 seconds.
            </p>
        ),
        mobileContent: <p>Rearrange the words into a correct sentence to earn XP. Quick tour!</p>,
        selector: "#tour-title",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 12,
    },
    {
        icon: null,
        emotion: "idea",
        title: "Your journey",
        content: (
            <p>
                Track how many sentences you&apos;ve completed in this round,
                plus the difficulty of the current question and a speed timer.
            </p>
        ),
        mobileContent: <p>Your progress this round, the difficulty, and a speed timer.</p>,
        selector: "#tour-controlbar",
        side: "bottom",
        pointerPadding: 6,
        pointerRadius: 14,
    },
    {
        icon: null,
        emotion: "asking",
        title: "Your turn — grab a word!",
        content: (
            <p>
                These are your shuffled words. Go ahead and{" "}
                <strong className="text-heading">drag the first word</strong>{" "}
                (or just tap it) down into the build box. 
            </p>
        ),
        mobileContent: (
            <p>
                Drag (or tap) a word down into the build box. Try it now!
            </p>
        ),
        selector: "#tour-pool",
        side: "bottom",
        pointerPadding: 6,
        pointerRadius: 14,
    },
    {
        icon: null,
        emotion: "idea",
        title: "Build the sentence",
        content: (
            <p>
                Keep dropping words in order until the box reads like a proper
                sentence. The moment every word is placed, I check your answer
                automatically — no button needed. Give the rest a go!
            </p>
        ),
        mobileContent: <p>Fill the box in order — I check automatically when it&apos;s full.</p>,
        selector: "#tour-sentence",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 14,
    },
    {
        icon: null,
        emotion: "tips",
        title: "Re-jumble anytime",
        content: (
            <p>
                Stuck? Tap <strong className="text-heading">Re-Jumble</strong> to
                send every word back to the yard and start the sentence over.
            </p>
        ),
        mobileContent: (
            <p>
                Tap <strong className="text-heading">Re-Jumble</strong> to reset and start over.
            </p>
        ),
        selector: "#tour-jumble-btn",
        side: "top",
        pointerPadding: 8,
        pointerRadius: 999,
    },
    {
        icon: null,
        emotion: "happy",
        title: "Score & streak",
        content: (
            <p>
                Watch your XP climb and chain correct answers to grow your
                streak. Answer fast to earn a speed bonus!
            </p>
        ),
        mobileContent: <p>Chain correct answers for streaks. Answer fast for bonus XP!</p>,
        selector: "#tour-progress",
        side: "left",
        pointerPadding: 6,
        pointerRadius: 16,
    },
    {
        icon: null,
        emotion: "love",
        title: "That's me — your AI Coach",
        content: (
            <p>
                I cheer you on, hint when you stumble, and celebrate your
                streaks. I turn happy when you nail it and a little sad when you
                slip — but I&apos;m always rooting for you. 💚
            </p>
        ),
        mobileContent: <p>I&apos;m your AI coach — hints, cheers, and feedback. 💚</p>,
        selector: "#tour-coach",
        side: "left",
        pointerPadding: 6,
        pointerRadius: 16,
    },
    {
        icon: null,
        emotion: "conversing",
        title: "Need a refresher?",
        content: (
            <p>
                Tap this button any time to replay this walkthrough. That&apos;s
                it — go score some XP!
            </p>
        ),
        mobileContent: <p>Tap here anytime to replay this tour. Go score some XP!</p>,
        selector: "#tour-help-btn",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 999,
    },
];

export const JUMBLE_TOUR: Tour[] = [
    {
        tour: JUMBLE_TOUR_NAME,
        steps: STEPS.map((s) => ({
            showControls: true,
            showSkip: true,
            ...s,
        })),
    },
];

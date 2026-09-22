import type { ReactNode } from "react";
import type { Step, Tour } from "nextstepjs";
import type { MascotEmotion } from "@/lib/emotion";
import type { CoachStep } from "./components/StepperSidebar";

// A tour step that also carries a mascot emotion — the shared tour card renders
// the expressive PixelMascot for it. `mobileContent` is a shorter body shown on
// phones (the full `content` stays on desktop). `demoStep`, when set, puts the
// Coach into a no-send DEMO of that practice step while the tour explains it —
// the real Listen/Speak/Feedback/Improve UI runs with dummy data (see
// PronunciationCoach), so the four steps are walked through interactively.
type EmotiveStep = Step & {
    emotion?: MascotEmotion;
    mobileContent?: ReactNode;
    demoStep?: CoachStep;
};

// Tour name used by useNextStep().startNextStep('pronunciation').
export const PRONUNCIATION_TOUR_NAME = "pronunciation";

// localStorage key — set after the first walkthrough so the tour only
// auto-launches once per browser.
export const PRONUNCIATION_TOUR_SEEN_KEY = "pronunciation:tour:seen:v1";

// Query param the page honours to request an auto-launch when the user
// arrives from a "How to play" CTA.
export const PRONUNCIATION_TOUR_QUERY = "tour";

const STEPS: EmotiveStep[] = [
    {
        icon: null,
        emotion: "greeting",
        title: "Hi, I'm K.AI! 🎙️",
        content: (
            <p>
                Welcome to Pronunciation! Listen, speak, and I&apos;ll give you
                instant feedback on how you sound — earning XP as your speech
                sharpens. Let me give you a quick tour.
            </p>
        ),
        mobileContent: <p>Listen, speak, and get instant feedback on how you sound. Quick tour!</p>,
        selector: "#pron-tour-title",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 12,
    },
    {
        icon: null,
        emotion: "idea",
        title: "Pick your difficulty",
        content: (
            <p>
                Switch between Easy, Medium, and Hard. Your choice is remembered
                for next time — start where you&apos;re comfortable.
            </p>
        ),
        mobileContent: <p>Switch Easy / Medium / Hard — your pick is remembered.</p>,
        selector: "#pron-tour-difficulty",
        side: "bottom",
        pointerPadding: 6,
        pointerRadius: 999,
    },
    {
        icon: null,
        emotion: "idea",
        title: "Let's walk through it",
        content: (
            <p>
                This is your practice area. Every sentence runs through four
                steps — let me walk you through all of them right here. This is
                just a preview: nothing is recorded or sent.
            </p>
        ),
        mobileContent: <p>Your practice area — I&apos;ll preview all 4 steps. Nothing is recorded or sent.</p>,
        selector: "#pron-tour-stage",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 16,
    },
    {
        icon: null,
        emotion: "asking",
        title: "Step 1 · Listen",
        content: (
            <p>
                First, <strong className="text-heading">Listen</strong>. Tap play
                to hear the sentence read aloud — as many times as you like before
                you try it yourself.
            </p>
        ),
        mobileContent: <p><strong className="text-heading">Listen</strong> — tap play to hear the sentence.</p>,
        selector: "#pron-tour-stage",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 16,
        demoStep: "listen",
    },
    {
        icon: null,
        emotion: "tips",
        title: "Step 2 · Speak",
        content: (
            <p>
                Then <strong className="text-heading">Speak</strong>. After a short
                countdown, recording starts and you read the sentence aloud — we
                auto-stop when the time&apos;s up. (Just a demo — this isn&apos;t
                being recorded.)
            </p>
        ),
        mobileContent: <p><strong className="text-heading">Speak</strong> — read it aloud; recording auto-stops. (Demo only.)</p>,
        selector: "#pron-tour-stage",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 16,
        demoStep: "speak",
    },
    {
        icon: null,
        emotion: "happy",
        title: "Step 3 · Feedback",
        content: (
            <p>
                Next, <strong className="text-heading">Feedback</strong>. I score
                every word, highlight exactly which ones to polish, and show your
                accuracy and the XP you earned.
            </p>
        ),
        mobileContent: <p><strong className="text-heading">Feedback</strong> — per-word scores, accuracy, and XP.</p>,
        selector: "#pron-tour-stage",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 16,
        demoStep: "feedback",
    },
    {
        icon: null,
        emotion: "love",
        title: "Step 4 · Improve",
        content: (
            <p>
                Finally, <strong className="text-heading">Improve</strong>. Tap any
                tricky word to hear it slowly and follow the tips — then move on to
                your next sentence. That&apos;s the whole loop!
            </p>
        ),
        mobileContent: <p><strong className="text-heading">Improve</strong> — tap tricky words to hear them; follow the tips.</p>,
        selector: "#pron-tour-stage",
        side: "top",
        pointerPadding: 6,
        pointerRadius: 16,
        demoStep: "improve",
    },
    {
        icon: null,
        emotion: "happy",
        title: "Your stats",
        content: (
            <p>
                Track your XP, level, combo, and streak as you practise. Keep a
                streak alive by coming back each day!
            </p>
        ),
        mobileContent: <p>Your XP, level, combo, and streak.</p>,
        selector: "#pron-tour-stats",
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
                Tap this button any time to replay this walkthrough. Now go nail
                those sounds!
            </p>
        ),
        mobileContent: <p>Tap here anytime to replay this tour. Go nail those sounds!</p>,
        selector: "#pron-tour-help-btn",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 999,
    },
];

export const PRONUNCIATION_TOUR: Tour[] = [
    {
        tour: PRONUNCIATION_TOUR_NAME,
        steps: STEPS.map((s) => ({
            showControls: true,
            showSkip: true,
            ...s,
        })),
    },
];

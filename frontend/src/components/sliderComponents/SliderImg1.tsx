"use client"
import Image from "next/image"
import { FaMicrophone, FaArrowRight } from "react-icons/fa"
import { FiPlayCircle } from "react-icons/fi"
import { GoGraph } from "react-icons/go"
import SliderSection from "./SliderSection"
import AiPartnerHero from "./AiPartnerHero"
import EngAILogo from "./EngAILogo"
import ReviewCard1 from "./ReviewCard1"
import { useRouter } from 'next/navigation'
import { FcSpeaker } from "react-icons/fc";
import { useSession } from "@/lib/session"
import { emitToast } from "@/lib/toast"
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate"

const CODE_TO_LANGUAGE: Record<string, string> = {
    en: "English", hi: "Hindi", bn: "Bengali",
    gu: "Gujarati", mr: "Marathi", ta: "Tamil", te: "Telugu",
};

type FeatureItem = {
    icon: React.ReactNode
    title: string
    description: string
}

type ButtonConfig = {
    label: React.ReactNode
    onClick: () => void
    variant: "primary" | "outline"
}

export function SliderImg1() {
    const router = useRouter();
    const { data: session, status } = useSession();
    // AI Partner is flag-gated while it's being rebuilt. Checked before the
    // auth branch so a signed-out visitor is told about the upgrade rather than
    // being sent to log in for something they can't open yet.
    const { guard: aiPartnerGuard } = useAIPartnerGate();
    const getUserState = () => {
        if (aiPartnerGuard()) return;
        if (status !== "authenticated" || !session?.user) {
            emitToast({ type: "error", title: "Login needed", body: "Please Login to use this AI partner" });
        } else {
            const langCode = session.user.nativeLang ?? "hi";
            const langName = CODE_TO_LANGUAGE[langCode] ?? CODE_TO_LANGUAGE[langCode.toLowerCase()] ?? "Hindi";
            router.push(`/dashboard/ai-partner?lang=${encodeURIComponent(langName)}`);
        }
    }
    const features: FeatureItem[] = [
        {
            icon: <FaMicrophone size={24} />,
            title: "Speaking Practice",
            description: "Real-time AI conversations",
        },
        {
            icon: <Image src="/books.svg" alt="Grammar Icon" width={40} height={40} />,
            title: "Grammar Connection",
            description: "Instant feedback & tips.",
        },
        {
            icon: <FcSpeaker size={24} />,
            title: "Pronunciation Trainer",
            description: "Speak clearly & confidently",
        },
        {
            icon: <GoGraph size={24} />,
            title: "Progress Tracking",
            description: "Track your improvement",
        },
    ]

    const buttons: ButtonConfig[] = [
        {
            label: <><FaMicrophone /> Start Speaking Now <FaArrowRight /></>,
            onClick: getUserState,
            variant: "primary",
        },
        {
            label: <>Watch Demo <FiPlayCircle /></>,
            onClick: () => console.log("Watch Demo clicked"),
            variant: "outline",
        },
    ]

    return (
        <SliderSection
            logoSlot={<EngAILogo />}
            heading="Practice Real Conversation With K.AI Improve Your Grammar, Vocabulary, & Pronunciation As You Speak Naturally"
            buttons={buttons}
            heroSlot={<AiPartnerHero />}
            reviewsImg={<ReviewCard1 />}
            features={features}
            featuresLayout="spread"
        />
    )
}
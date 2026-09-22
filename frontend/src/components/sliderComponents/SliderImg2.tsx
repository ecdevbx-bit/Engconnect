"use client"
import Image from "next/image"
import { FaArrowRight } from "react-icons/fa"
import { FiPlayCircle } from "react-icons/fi"
import { LiaPuzzlePieceSolid } from "react-icons/lia";
import { TbTargetArrow } from "react-icons/tb";
import SliderSection from "./SliderSection";
import JumbleWordLogo from "./JumbleWordLogo";
import { useRouter } from "next/navigation";

type FeatureItem = {
    icon: React.ReactNode
    title: string
    description: string
}

type ButtonConfig = {
    label: React.ReactNode      // can be text or JSX (e.g. with icons)
    onClick: () => void
    variant: "primary" | "outline"
}

export function SliderImg2() {
    const router = useRouter()
    const features: FeatureItem[] = [
        {
            icon: (
                <LiaPuzzlePieceSolid
                    fill="#ab8eff"
                    color="#ab8eff"
                    className="rotate-225 fill-current text-primary"
                    size={24}
                />
            ),
            title: "Fun Challenges",
            description: "Exciting Word Puzzles every day",
        },
        {
            icon: <Image src="/learn&Improve.svg" alt="Learn & Improve" width={36} height={36} />,
            title: "Learn & Improve",
            description: "Build vocabulary while you play",
        },
        {
            icon: <TbTargetArrow color="#ab8eff" size={24} />,
            title: "Track Progress",
            description: "See your Improvement step by step",
        },
    ]

    const buttons: ButtonConfig[] = [
        {
            label: <>Play Jumble Word <FaArrowRight /></>,
            onClick: () => {
                router.push("/dashboard/jumble")
            },
            variant: "primary",
        },
        {
            label: <><FiPlayCircle /> How to play</>,
            onClick: () => router.push("/dashboard/jumble?tour=1"),
            variant: "outline",
        },
    ]

    return (
        <SliderSection
            logoSlot={<JumbleWordLogo />}
            heading="Unjumble the words, expand your vocabulary, and become an English word master!"
            buttons={buttons}
            heroImageSrc="/JumbleRobotImg.svg"
            heroImageAlt="JumbleRobotImg"
            heroImageClassName="h-160 w-auto"
            features={features}
            featuresLayout="grouped"
        />
    )
}
"use client"
import Image from "next/image"
import { FaMicrophone, FaArrowRight } from "react-icons/fa"
import { FiPlayCircle } from "react-icons/fi"
import { HiLightBulb } from "react-icons/hi"
import PronunciationLogo from "./PronunciationLogo"
import ReviewCard3 from "./ReviewCard3";

export function SliderImg3() {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute -top-10 -right-10 w-125 h-125 bg-radial from-[#ab8eff]/20 via-[#00e3fd]/10 to-transparent rounded-full blur-[60px] -z-10" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-125 h-125 bg-radial from-[#ab8eff]/20 via-[#00e3fd]/10 to-transparent rounded-full blur-[60px] -z-10" />
            <div className="flex justify-around gap-4 mt-8 px-10">
                <div className="mt-16 relative flex flex-col items-center">
                    {/* Image */}
                    <Image
                        src="robot.svg"
                        alt="robot ui"
                        width={360}
                        height={360}
                    />
                    {/* Tip card */}
                    <div className="absolute bottom-1 left-40 w-full flex justify-center px-4">
                        <div className="c-box flex items-center gap-4 rounded-xl px-6 py-5 max-w-xl opacity-90">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-surface-2 text-primary">
                                <HiLightBulb className="text-4xl text-primary" />
                            </div>
                            <div>
                                <div className="font-semibold text-heading">
                                    Tip from K.AI
                                </div>
                                <div className="text-sm text-body">
                                    Focus on the &ldquo;t&rdquo; sound and keep your tongue light and relaxed.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-y-6">
                    <div className="flex justify-center">
                        <PronunciationLogo />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="text-xl lg:max-w-160 font-semibold mt-4 text-heading">Improve your pronunciation with real-time AL feedback. Speak clearly, naturally, and confidently</div>
                    </div>
                    <div className="flex items-center justify-center gap-4 py-4">
                        <button
                            onClick={() => console.log("Start Pronunciation Practice clicked")}
                            className="flex cursor-pointer items-center gap-2 bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14] font-semibold px-5 py-2.5 rounded-full hover:opacity-90 shadow-[0_0_20px_rgba(171,142,255,0.35)] transition"
                        >
                            <><FaMicrophone /> Start Pronunciation Practice <FaArrowRight /></>
                        </button>
                        <button
                            onClick={() => console.log("How it works clicked")}
                            className="flex cursor-pointer items-center gap-2 glass text-heading border border-white/[0.06] px-5 py-2.5 rounded-full hover:border-white/[0.12] transition"
                        >
                            <><FiPlayCircle /> How it works</>
                        </button>
                    </div>
                    <div className="flex items-center justify-center">
                        <ReviewCard3 />
                    </div>
                </div>
                <div>
                    <Image src={"pagesUI.svg"} alt="pagesUI" width={500} height={500} />
                </div>
            </div>
        </div>
    )
}
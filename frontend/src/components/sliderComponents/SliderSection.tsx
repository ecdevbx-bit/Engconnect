"use client"
import Image from "next/image"

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

type SliderSectionProps = {
    logoSrc?: string
    logoAlt?: string
    heading: string
    buttons: ButtonConfig[]
    heroImageSrc?: string
    heroImageAlt?: string
    heroImageClassName?: string
    /** When provided, replaces the default <Image/> hero with custom content. */
    heroSlot?: React.ReactNode
    /** When provided, replaces the default <Image/> logo with custom content. */
    logoSlot?: React.ReactNode
    /** Optional extra content below buttons (e.g. reviews image) */
    reviewsImg?: React.ReactNode
    features?: FeatureItem[]
    /** Controls how feature cards are arranged — "spread" = justify-between, "grouped" = gap-only */
    featuresLayout?: "spread" | "grouped"
}

// ─── Reusable Component ───────────────────────────────────────────────────────

export default function SliderSection({
    logoSrc,
    logoAlt,
    heading,
    buttons,
    heroImageSrc,
    heroImageAlt,
    heroImageClassName = "h-110 w-auto",
    heroSlot,
    logoSlot,
    reviewsImg,
    features,
}: SliderSectionProps) {
    return (
        <div className="relative">

            <div className="pointer-events-none absolute right-[5%] top-[15%] w-275 h-275 bg-radial from-[#ab8eff]/20 via-[#00e3fd]/10 to-transparent rounded-full blur-[120px] -z-10" />

            <div className="relative flex justify-center">
                <div className="flex flex-col lg:block max-w-7xl w-full lg:relative">

                    <div className="w-full lg:w-1/2 flex flex-col justify-center gap-y-8 z-10 items-center lg:items-start text-center lg:text-left px-6 lg:px-0 pt-10 lg:pt-0">
                        {logoSlot ? logoSlot : logoSrc && <Image src={logoSrc} alt={logoAlt ?? ""} loading="eager" width={300} height={300} className="w-85 h-auto" />}

                        <div className="text-2xl lg:max-w-100 font-semibold mt-4 text-heading">
                            {heading}
                        </div>
                        <div className="pointer-events-none absolute right-[5%] top-[15%] w-275 h-275 bg-radial from-[#ab8eff]/20 via-[#00e3fd]/10 to-transparent rounded-full blur-[120px] -z-10" />

                        <div className="flex gap-8 justify-center lg:justify-start">
                            {buttons.map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={btn.onClick}
                                    className={
                                        btn.variant === "primary"
                                            ? "flex cursor-pointer items-center gap-2 bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14] font-semibold px-5 py-2.5 rounded-full hover:opacity-90 shadow-[0_0_20px_rgba(249,115,22,0.35)] transition"
                                            : "flex cursor-pointer items-center gap-2 glass text-heading border border-white/[0.06] px-5 py-2.5 rounded-full hover:border-white/[0.12] transition"
                                    }
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {reviewsImg}
                    </div>
                    <div className="flex justify-center py-8 lg:py-0 lg:absolute lg:right-[5%] lg:top-1/2 lg:-translate-y-1/2 z-10">
                        {heroSlot ? (
                            heroSlot
                        ) : (
                            heroImageSrc && (
                                <Image
                                    src={heroImageSrc}
                                    alt={heroImageAlt ?? ""}
                                    width={800}
                                    height={800}
                                    priority
                                    className={`w-auto max-h-100 md:max-h-120 lg:max-h-none ${heroImageClassName}`}
                                />
                            )
                        )}
                    </div>

                </div>
            </div>
            {features && features.length > 0 && (
                <div className="relative w-full px-6 py-8">
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto"
                    >
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="c-box flex items-center gap-4 rounded-xl px-6 py-5">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-2 text-primary shrink-0">
                                    {feature.icon}
                                </div>

                                <div>
                                    <div className="font-semibold text-heading">
                                        {feature.title}
                                    </div>
                                    <div className="text-sm text-body">
                                        {feature.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}
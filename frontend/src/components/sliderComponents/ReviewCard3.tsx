"use client"
import Image from "next/image"

export default function ReviewCard3() {
  return (
    <div className="flex items-center gap-4 w-full">
      {/* Avatar frame */}
      <Image src="/reviewFrame.svg" alt="learners" width={170} height={50} className="h-auto shrink-0" />

      {/* Right content */}
      <div className="flex flex-col gap-1">
        {/* Stats */}
        <span className="font-semibold text-heading text-lg">1 Lakh+</span>

        {/* Testimonial text */}
        <div className="text-sm sm:text-base text-body">
          Learners are improving their pronunciation with <span className="font-semibold text-heading">K.AI</span>
        </div>
      </div>
    </div>
  )
}

"use client"
import Image from "next/image"

export default function ReviewCard1() {
  return (
    <div className="flex items-center gap-4 w-full">
      {/* Avatar frame */}
      <Image src="/reviewFrame.svg" alt="learners" width={170} height={50} className="h-auto shrink-0" />

      {/* Right content */}
      <div className="flex flex-col gap-2">
        {/* Rating and stars */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">4.9/5</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-lg">⭐</span>
            ))}
          </div>
        </div>

        {/* Testimonial text */}
        <div className="text-sm text-body">
          Loved by <span className="font-semibold text-heading">1.3 million learners</span>
        </div>
      </div>
    </div>
  )
}

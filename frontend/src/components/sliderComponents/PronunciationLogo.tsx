"use client"

export default function PronunciationLogo() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/[0.05] backdrop-blur-md">
        <span className="text-lg">🎤</span>
        <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#f59e0b] to-[#f97316] bg-clip-text text-transparent">
          Pronunciation Trainer
        </span>
      </div>

      {/* Main heading */}
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Pronounce Perfect
        </h1>
        <div className="relative">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#5B5FDE] to-[#7C3AED] bg-clip-text text-transparent leading-tight">
              Be Confident
            </h1>
            {/* Decorative lines */}
            <div className="flex flex-col gap-2">
              <div className="w-8 h-1.5 bg-gradient-to-r from-[#a78bfa] to-[#8b7fd9] rounded-full rotate-12" />
              <div className="w-6 h-1 bg-gradient-to-r from-[#a78bfa] to-[#8b7fd9] rounded-full -rotate-12" />
            </div>
          </div>
          {/* Underline */}
          <div className="absolute -bottom-4 left-0 h-1.5 w-full max-w-xs bg-gradient-to-r from-[#5B5FDE] to-[#7C3AED] rounded-full blur-sm opacity-60" />
        </div>
      </div>
    </div>
  )
}

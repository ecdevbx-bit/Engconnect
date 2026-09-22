"use client"

export default function EngAILogo() {
  return (
    <div className="flex flex-col items-center lg:items-start gap-4">
      {/* Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/[0.05] backdrop-blur-md">
        <span className="text-lg">✨</span>
        <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#f59e0b] to-[#f97316] bg-clip-text text-transparent">
          K.AI Powered English Connection
        </span>
      </div>

      {/* Main heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Your AI English
        </h1>
        <div className="relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#f59e0b] to-[#f97316] bg-clip-text text-transparent leading-tight">
            Partner
          </h1>
          {/* Decorative line */}
          <div className="absolute -bottom-4 left-0 h-1.5 w-40 bg-gradient-to-r from-[#f59e0b] to-[#f97316] rounded-full blur-sm opacity-60" />
        </div>
      </div>
    </div>
  )
}

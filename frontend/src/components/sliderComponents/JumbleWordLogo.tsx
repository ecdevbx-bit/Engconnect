"use client"

export default function JumbleWordLogo() {
  return (
    <div className="flex flex-col items-center lg:items-start gap-4">
      {/* Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/[0.05] backdrop-blur-md">
        {/* Colorful icon */}
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-sm bg-red-400" />
          <div className="w-2 h-2 rounded-sm bg-blue-400" />
          <div className="w-2 h-2 rounded-sm bg-yellow-400" />
          <div className="w-2 h-2 rounded-sm bg-green-400" />
        </div>
        <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#f59e0b] to-[#f97316] bg-clip-text text-transparent">
          Fun Word Challenge
        </span>
      </div>

      {/* Main heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Unjumble
        </h1>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Learn
        </h1>
        <div className="relative flex items-center gap-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#5B5FDE] to-[#7C3AED] bg-clip-text text-transparent leading-tight">
            Grow
          </h1>
          {/* Decorative lines */}
          <div className="flex flex-col gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-[#a78bfa] to-[#8b7fd9] rounded-full rotate-12" />
            <div className="w-6 h-1 bg-gradient-to-r from-[#a78bfa] to-[#8b7fd9] rounded-full -rotate-12" />
          </div>
          {/* Underline */}
          <div className="absolute -bottom-4 left-0 h-1.5 w-56 bg-gradient-to-r from-[#5B5FDE] to-[#7C3AED] rounded-full blur-sm opacity-60" />
        </div>
      </div>
    </div>
  )
}

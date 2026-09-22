"use client";

// BadgeBrandMark — a small English Connection logo stamp dropped into a corner
// of every badge so each one is unmistakably ours. The LevelCard carries its
// own bespoke logo strip; this is the shared mark for the rest (streak / combo
// / xp / progset / onboarding). Just the logo (no backing chip); a drop-shadow
// keeps it legible on any coloured gradient. Parent must be `relative`.
export function BadgeBrandMark({
  size = "sm",
  position = "top-right",
}: {
  size?: "xs" | "sm" | "md";
  position?: "top-right" | "bottom-left";
}) {
  const dim = size === "md" ? "h-4 w-4" : size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  const pos = position === "bottom-left" ? "bottom-2 left-2" : "right-2 top-2";
  return (
    <div className={`pointer-events-none absolute z-30 ${pos}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="English Connection"
        className={`${dim} opacity-95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]`}
      />
    </div>
  );
}

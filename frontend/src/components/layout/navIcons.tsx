import type { SVGProps } from "react";

// Custom nav icons drawn on lucide's grid (24×24, 2px round strokes) so they
// sit next to lucide icons without looking out of place.

/** K.AI / AI Partner — a speech bubble with a voice waveform: "talk to K.AI". */
export function KaiIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M7 3.5h10a3.5 3.5 0 0 1 3.5 3.5v5.5a3.5 3.5 0 0 1-3.5 3.5h-4.5L8 19.5V16H7a3.5 3.5 0 0 1-3.5-3.5V7A3.5 3.5 0 0 1 7 3.5z" />
      <path d="M8.5 9v1.5M11 7.5v4.5M13.5 8.5v2.5M16 9.25v1" />
    </svg>
  );
}

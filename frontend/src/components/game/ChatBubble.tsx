"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { detectEmotion } from "@/lib/emotion";
import { PixelMascot } from "@/components/v3/PixelMascot";
import type { V3ChatMessage } from "@/hooks/useV3ChatSession";

// Render a SMALL subset of inline markdown the model emits for emphasis —
// **bold** / __bold__, *italic* / _italic_, `code` — into React nodes. Inline
// only (no blocks), so the result is valid inside the bubble's <p>; the AI is
// prompted to speak naturally (no lists/headers). Unbalanced or still-streaming
// markers (e.g. "**hel" before the closing "**") are left as literal text.
// Content must be non-space-adjacent so lone "*" (e.g. "2 * 3") isn't matched.
// No lookbehind — keeps it safe on older Safari.
const INLINE_MD_RE =
  /(\*\*|__)(\S(?:[\s\S]*?\S)?)\1|(\*|_)(\S(?:[\s\S]*?\S)?)\3|`([^`]+)`/g;

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE_MD_RE.lastIndex = 0;
  while ((m = INLINE_MD_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(<em key={key++}>{m[4]}</em>);
    } else {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {m[5]}
        </code>,
      );
    }
    last = INLINE_MD_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// One chat row — the AI-partner message bubble. Extracted from V3AIPartner so
// it can be reused by the landing showcase (auto-typing demo) without pulling
// in the WebSocket chat client.
export function ChatBubble({
  message,
  userAvatar,
  userInitial,
  isStreaming = false,
}: {
  message: V3ChatMessage;
  userAvatar?: string | null;
  userInitial: string;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${
          isUser
            ? "border-white/[0.06] bg-surface-2"
            : "border-white/[0.06] bg-surface-2"
        }`}
      >
        {isUser ? (
          userAvatar ? (
            // DiceBear serves SVG; next/image refuses to optimize SVG unless
            // dangerouslyAllowSVG is on, so plain <img> is the project-wide
            // convention for avatars (see Profile.tsx, Leaderboard.tsx).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userInitial}
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[13px] font-bold text-primary">{userInitial}</span>
          )
        ) : (
          // K.AI's avatar mirrors the mood of this message — the shared
          // PixelMascot reads the text and reacts (greeting, happy, asking…).
          <PixelMascot emotion={detectEmotion(message.body)} size={48} />
        )}
      </div>

      <div
        className={[
          "max-w-[520px] rounded-[18px] px-5 py-4",
          isUser
            ? "bg-surface-2 border border-white/[0.08] md:mr-4"
            : "c-box",
        ].join(" ")}
      >
        <p
          className={cn(
            "whitespace-pre-line text-[14px] leading-7 text-[#101317] dark:text-heading",
            isStreaming && "karaoke-shimmer"
          )}
        >
          {renderInlineMarkdown(message.body)}
        </p>
        <p className={`mt-3 text-[12px] text-muted-foreground ${isUser ? "text-right" : ""}`}>
          {message.time}
        </p>
      </div>
    </div>
  );
}

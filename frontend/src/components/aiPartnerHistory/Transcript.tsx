import type { ReactNode } from "react";
import { FaRobot } from "react-icons/fa6";

import type { ChatTranscriptLine } from "@/lib/v3ChatHistory";
import { cn } from "@/lib/utils";

import { formatClock } from "./format";

// A saved conversation as chat bubbles — learner on the right, K.AI on the
// left — in the live screen's visual language (rounded 18px bubbles, 14px
// text, time underneath). The live ChatBubble isn't reused: it mounts an
// animated canvas mascot per message, too heavy for a long static transcript.

// Same inline subset the live bubble renders (**bold**, *italic*, `code`);
// unbalanced markers stay literal text.
const INLINE_MD_RE = /(\*\*|__)(\S(?:[\s\S]*?\S)?)\1|(\*|_)(\S(?:[\s\S]*?\S)?)\3|`([^`]+)`/g;

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE_MD_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[2] !== undefined) out.push(<strong key={key++} className="font-semibold">{m[2]}</strong>);
    else if (m[4] !== undefined) out.push(<em key={key++}>{m[4]}</em>);
    else
      out.push(
        <code key={key++} className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[0.9em]">
          {m[5]}
        </code>,
      );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Transcript({ messages }: { messages: ChatTranscriptLine[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No transcript was saved for this conversation.</p>;
  }

  return (
    <ol className="space-y-4">
      {messages.map((m, i) => {
        const isUser = m.role === "user";
        const time = formatClock(m.at);
        return (
          <li key={`${m.at}-${i}`} className={cn("flex items-end gap-2.5", isUser && "justify-end")}>
            {!isUser && (
              <span
                aria-hidden
                className="mb-5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-primary"
              >
                <FaRobot className="h-3.5 w-3.5" />
              </span>
            )}
            <div className={cn("flex min-w-0 max-w-[85%] flex-col md:max-w-[75%]", isUser && "items-end")}>
              <div
                className={cn(
                  "rounded-[18px] px-4 py-3",
                  isUser
                    ? "rounded-br-md border border-primary/25 bg-primary/10"
                    : "rounded-bl-md border border-border bg-surface-2",
                )}
              >
                <p className="whitespace-pre-line break-words text-[14px] leading-6 text-heading">
                  <span className="sr-only">{isUser ? "You: " : "K.AI: "}</span>
                  {renderInline(m.text)}
                </p>
              </div>
              {time && (
                <time dateTime={m.at} className="mt-1 px-1 text-[11px] text-muted-foreground">
                  {time}
                </time>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

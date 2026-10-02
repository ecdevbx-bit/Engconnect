import { useId } from "react";
import Link from "next/link";
import { Brain, Lock, MessagesSquare, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { plural } from "./format";
import { primaryButton } from "./styles";

// Shown to learners without Pro: on the Chats tab in place of the list, and on
// the memory tab above the basic memory every learner has.

const PERKS = [
  { icon: MessagesSquare, text: "Every past chat, with its summary and full transcript" },
  { icon: Sparkles, text: "Your corrections and new words from each conversation" },
  { icon: Brain, text: "K.AI remembers you — and picks up where you left off" },
];

export default function ProLockCard({
  total,
  className,
}: {
  /** Saved conversations (from the list call); omitted when unknown. */
  total?: number | null;
  className?: string;
}) {
  // Both tabs can show this card at once (one hidden), so ids must be unique.
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn("glass mx-auto w-full max-w-xl rounded-2xl px-5 py-8 text-center md:px-8", className)}
    >
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/25">
        <Lock className="h-6 w-6" aria-hidden />
      </span>
      <h2 id={titleId} className="text-xl font-bold leading-snug text-heading md:text-2xl">
        Chat history and K.AI&apos;s memory are part of Pro
      </h2>
      {typeof total === "number" && total > 0 && (
        <p className="mt-2 text-sm text-body">
          You have <span className="font-bold text-heading">{plural(total, "saved conversation")}</span>
        </p>
      )}
      <ul className="mx-auto mt-5 max-w-sm space-y-2.5 text-left">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm leading-6 text-body">
            <Icon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      <Link href="/v3/premium" className={cn(primaryButton, "mt-6 w-full sm:w-auto sm:px-8")}>
        Unlock with Pro
      </Link>
    </section>
  );
}

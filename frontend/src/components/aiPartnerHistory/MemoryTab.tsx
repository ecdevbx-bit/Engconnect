import { useEffect, useRef, useState } from "react";
import { Brain, Eraser } from "lucide-react";
import { toast } from "sonner";

import { v3ClearKaiMemory, v3FetchKaiMemory, type KaiMemory } from "@/lib/v3ChatHistory";
import { cn } from "@/lib/utils";

import ConfirmDialog from "./ConfirmDialog";
import { errorMessage, formatRelative, isProRequired, plural } from "./format";
import { CorrectionList, VocabChips } from "./LearningBits";
import MemoryMarkdown from "./MemoryMarkdown";
import ProLockCard from "./ProLockCard";
import { MemorySkeleton } from "./Skeletons";
import { ErrorState, KaiLink } from "./states";
import { dangerButton, primaryButton } from "./styles";

// "What K.AI remembers". Pro: the compacted memory file K.AI reads at the start
// of every conversation. Everyone else: the short mistakes / words lists every
// learner has, plus the Pro card. Clearing is allowed for everyone — it's the
// learner's own data.

type MemoryState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; memory: KaiMemory; now: number };

const EMPTY_BASIC: KaiMemory = {
  pro: false,
  memoryMd: "",
  updatedAt: null,
  sessions: 0,
  mistakes: [],
  vocabulary: [],
};

export default function MemoryTab({
  token,
  ready,
  savedTotal,
}: {
  token: string;
  ready: boolean;
  /** Saved conversations, if the Chats tab has loaded them (for the Pro card). */
  savedTotal: number | null;
}) {
  const [state, setState] = useState<MemoryState>({ status: "loading" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** Set when a clear succeeds — the Clear button is gone, so focus the panel. */
  const justCleared = useRef(false);

  useEffect(() => {
    if (!ready || state.status !== "loading") return;
    let cancelled = false;
    v3FetchKaiMemory(token)
      .then((memory) => {
        if (!cancelled) setState({ status: "ready", memory, now: Date.now() });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState(
          isProRequired(error)
            ? { status: "ready", memory: EMPTY_BASIC, now: Date.now() }
            : { status: "error", error },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [ready, token, state.status]);

  if (state.status === "loading") return <MemorySkeleton />;

  if (state.status === "error") {
    return (
      <div className="c-box mx-auto max-w-3xl rounded-2xl">
        <ErrorState
          title="Couldn't load what K.AI remembers"
          message={errorMessage(state.error)}
          onRetry={() => setState({ status: "loading" })}
        />
      </div>
    );
  }

  const { memory, now } = state;
  const hasAnything =
    Boolean(memory.memoryMd.trim()) || memory.mistakes.length > 0 || memory.vocabulary.length > 0;

  const clear = async () => {
    await v3ClearKaiMemory(token);
    justCleared.current = true;
    setState((s) =>
      s.status === "ready"
        ? {
            ...s,
            memory: { ...s.memory, memoryMd: "", updatedAt: null, sessions: 0, mistakes: [], vocabulary: [] },
          }
        : s,
    );
    toast.success("K.AI's memory is cleared");
  };

  const clearButton = hasAnything && (
    <button type="button" onClick={() => setConfirmOpen(true)} className={dangerButton}>
      <Eraser className="h-4 w-4" aria-hidden />
      Clear memory
    </button>
  );

  const dialog = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Clear K.AI's memory?"
      description="K.AI will forget everything it has learned about you. Your chat history stays."
      confirmLabel="Clear memory"
      busyLabel="Clearing…"
      onConfirm={clear}
      // The Clear button disappears with the memory — land on the panel instead.
      onCloseAutoFocus={(e) => {
        if (!justCleared.current) return;
        justCleared.current = false;
        e.preventDefault();
        document.getElementById("kai-memory-title")?.focus();
      }}
    />
  );

  if (memory.pro) {
    const meta = [
      memory.updatedAt ? `Updated ${formatRelative(memory.updatedAt, now)}` : "",
      memory.sessions > 0 ? `from ${plural(memory.sessions, "conversation")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <section aria-labelledby="kai-memory-title" className="c-box mx-auto max-w-3xl rounded-2xl p-5 md:p-7">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h2 id="kai-memory-title" tabIndex={-1} className="text-xl font-bold text-heading outline-none">
              What K.AI remembers
            </h2>
            {memory.memoryMd.trim() && meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
          </div>
          {clearButton}
        </header>
        {memory.memoryMd.trim() ? (
          <>
            <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs leading-5 text-muted-foreground">
              K.AI reads this at the start of every conversation, so it can pick up where you left off.
            </p>
            <div className="mt-4">
              <MemoryMarkdown markdown={memory.memoryMd} />
            </div>
          </>
        ) : (
          <EmptyMemory />
        )}
        {dialog}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section aria-labelledby="kai-memory-title" className="c-box rounded-2xl p-5 md:p-7">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h2 id="kai-memory-title" tabIndex={-1} className="text-xl font-bold text-heading outline-none">
              What K.AI has noted so far
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The mistakes and words K.AI keeps an eye on in your conversations.
            </p>
          </div>
          {clearButton}
        </header>

        {memory.mistakes.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-base font-bold text-heading">Mistakes K.AI is helping you fix</h3>
            <CorrectionList items={memory.mistakes} />
          </div>
        )}
        {memory.vocabulary.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-base font-bold text-heading">Words you&apos;ve practised</h3>
            <VocabChips items={memory.vocabulary} />
          </div>
        )}
        {!hasAnything && (
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Nothing saved yet. Have a conversation with K.AI and the mistakes and new words it notices will show up
            here.
          </p>
        )}
        {dialog}
      </section>

      <ProLockCard total={savedTotal} />
    </div>
  );
}

function EmptyMemory() {
  return (
    <div className="flex flex-col items-center px-2 py-10 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Brain className="h-7 w-7" aria-hidden />
      </span>
      <p className="text-base font-bold text-heading">Nothing remembered yet</p>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
        K.AI writes its memory after your first conversation — your goals, what you like to talk about, the mistakes
        you&apos;re working on and new words — so every chat picks up where the last one ended.
      </p>
      <KaiLink className={cn(primaryButton, "mt-6")}>Start a conversation</KaiLink>
    </div>
  );
}

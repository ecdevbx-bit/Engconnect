import { useState } from "react";
import { ArrowLeft, Clock, Gauge, Languages, Lightbulb, MessageSquareText, Play, RotateCcw, Trash2 } from "lucide-react";

import { continueChatHref, type ChatHistoryDetail } from "@/lib/v3ChatHistory";
import { cn } from "@/lib/utils";

import ConfirmDialog from "./ConfirmDialog";
import { chatTitle, errorMessage, formatDateTime, formatMinutes, isProRequired, plural } from "./format";
import { CorrectionList, VocabChips } from "./LearningBits";
import ProLockCard from "./ProLockCard";
import { ChatDetailSkeleton } from "./Skeletons";
import { ErrorState, KaiLink, LiveBadge } from "./states";
import { chip, dangerButton, eyebrow, primaryButton, quietButton, secondaryButton, tile } from "./styles";
import Transcript from "./Transcript";

// Right pane (desktop) / full screen (mobile) for one conversation: header with
// actions, the digest (summary, topics, corrections, new words, next-time tip)
// and the transcript.

export type DetailEntry = { status: "ready"; data: ChatHistoryDetail } | { status: "error"; error: unknown };

export default function ChatDetail({
  entry,
  onBack,
  onRetry,
  onRefresh,
  onDelete,
}: {
  /** undefined while loading. */
  entry: DetailEntry | undefined;
  /** Mobile "All chats" button. */
  onBack: () => void;
  onRetry: () => void;
  /** Re-fetch a conversation whose summary isn't ready yet. */
  onRefresh: () => void;
  /** Deletes on the server and removes it from the list; throws on failure. */
  onDelete: () => Promise<void>;
}) {
  return (
    <div>
      <button type="button" onClick={onBack} className={cn(quietButton, "-ml-3 mb-2 md:hidden")}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All chats
      </button>
      {!entry ? (
        <ChatDetailSkeleton />
      ) : entry.status === "error" ? (
        isProRequired(entry.error) ? (
          <ProLockCard className="my-4" />
        ) : (
          <ErrorState
            title="Couldn't open this conversation"
            message={errorMessage(entry.error)}
            onRetry={onRetry}
          >
            <button type="button" onClick={onBack} className={cn(secondaryButton, "md:hidden")}>
              Back to all chats
            </button>
          </ErrorState>
        )
      ) : (
        <ConversationView detail={entry.data} onRefresh={onRefresh} onDelete={onDelete} />
      )}
    </div>
  );
}

function ConversationView({
  detail,
  onRefresh,
  onDelete,
}: {
  detail: ChatHistoryDetail;
  onRefresh: () => void;
  onDelete: () => Promise<void>;
}) {
  const { session, digest, messages } = detail;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const live = session.status === "active";
  const titleId = `kai-chat-title-${session.id}`;
  const facts = [session.mode, session.language, session.level];

  return (
    <article aria-labelledby={titleId} className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 id={titleId} className="min-w-0 break-words text-xl font-bold leading-snug text-heading md:text-2xl">
            {chatTitle(session)}
          </h2>
          {live && <LiveBadge />}
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <time dateTime={session.startedAt}>{formatDateTime(session.startedAt)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatMinutes(session.minutes)}
          </span>
        </p>
        {facts.some(Boolean) && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Conversation settings">
            {session.mode && (
              <li className={chip}>
                <MessageSquareText className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="sr-only">Mode: </span>
                {session.mode}
              </li>
            )}
            {session.language && (
              <li className={chip}>
                <Languages className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="sr-only">Language: </span>
                {session.language}
              </li>
            )}
            {session.level && (
              <li className={chip}>
                <Gauge className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="sr-only">Level: </span>
                {session.level}
              </li>
            )}
          </ul>
        )}
        {/* Stacked full-width on phones; side by side from sm up. */}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          {!live && (
            <KaiLink href={continueChatHref(session.id)} className={primaryButton}>
              <Play className="h-4 w-4" aria-hidden />
              Continue this conversation
            </KaiLink>
          )}
          <button type="button" onClick={() => setConfirmOpen(true)} className={dangerButton}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        </div>
      </header>

      {digest ? (
        <>
          <section aria-labelledby={`${titleId}-summary`} className={tile}>
            <h3 id={`${titleId}-summary`} className={eyebrow}>
              Summary
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-heading">{digest.summary || session.summary}</p>
            {digest.topics.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
                {digest.topics.map((t, i) => (
                  <li key={`${t}-${i}`} className={cn(chip, "bg-surface-1")}>
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {digest.facts.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">You shared</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-body marker:text-muted-foreground">
                  {digest.facts.map((f, i) => (
                    <li key={`${f}-${i}`}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {digest.mistakes.length > 0 && (
            <section aria-labelledby={`${titleId}-fixes`}>
              <h3 id={`${titleId}-fixes`} className="mb-3 flex items-baseline gap-2 text-base font-bold text-heading">
                Corrections
                <span className="text-xs font-semibold text-muted-foreground">{digest.mistakes.length}</span>
              </h3>
              <CorrectionList items={digest.mistakes} />
            </section>
          )}

          {digest.vocabulary.length > 0 && (
            <section aria-labelledby={`${titleId}-words`}>
              <h3 id={`${titleId}-words`} className="mb-3 flex items-baseline gap-2 text-base font-bold text-heading">
                New words
                <span className="text-xs font-semibold text-muted-foreground">{digest.vocabulary.length}</span>
              </h3>
              <VocabChips items={digest.vocabulary} />
            </section>
          )}

          {digest.nextTime && (
            <section
              aria-labelledby={`${titleId}-next`}
              className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4"
            >
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 id={`${titleId}-next`} className="text-sm font-bold text-heading">
                  Next time
                </h3>
                <p className="mt-1 text-sm leading-6 text-body">{digest.nextTime}</p>
              </div>
            </section>
          )}
        </>
      ) : (
        <SummaryNote live={live} skipped={session.digest === "skipped"} onRefresh={onRefresh} />
      )}

      <section aria-labelledby={`${titleId}-transcript`}>
        <h3 id={`${titleId}-transcript`} className="mb-4 flex items-baseline gap-2 text-base font-bold text-heading">
          Transcript
          {messages.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground">{plural(messages.length, "line")}</span>
          )}
        </h3>
        <Transcript messages={messages} />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this conversation?"
        description="The transcript and summary will be removed from your history. Deleting a chat doesn't erase what K.AI already remembers about you — you can clear that on the “What K.AI remembers” tab."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        onConfirm={onDelete}
      />
    </article>
  );
}

function SummaryNote({ live, skipped, onRefresh }: { live: boolean; skipped: boolean; onRefresh: () => void }) {
  const text = live
    ? "This conversation is still going — K.AI will summarise it when it ends."
    : skipped
      ? "There's no summary for this conversation (it was probably too short), but the full transcript is below."
      : "Summary is on its way — check back in a minute.";

  return (
    <div role="status" className={cn(tile, "flex flex-wrap items-center gap-3")}>
      <p className="min-w-0 flex-1 text-sm leading-6 text-body">{text}</p>
      {!skipped && (
        <button type="button" onClick={onRefresh} className={cn(secondaryButton, "px-4")}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Check again
        </button>
      )}
    </div>
  );
}

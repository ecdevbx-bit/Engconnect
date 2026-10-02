import type { MouseEvent } from "react";
import { LoaderCircle } from "lucide-react";

import type { ChatHistoryItem } from "@/lib/v3ChatHistory";
import { cn } from "@/lib/utils";

import { chatTitle, formatMinutes, formatRowStamp, type ChatGroup, type ChatGroupKey } from "./format";
import { LiveBadge, Summarising } from "./states";
import { eyebrow, focusable, secondaryButton } from "./styles";

// The conversation list, grouped ChatGPT-style (Today / Yesterday / …). Rows
// are real links to `?c=<id>` so open-in-new-tab works; a plain click is
// intercepted and handled in place (history.pushState, no server round trip).

export const rowDomId = (id: string) => `kai-chat-row-${id}`;

export default function ChatList({
  groups,
  now,
  openId,
  hrefFor,
  onOpen,
  hasMore,
  loadingMore,
  moreError,
  onLoadMore,
}: {
  groups: ChatGroup[];
  now: number;
  openId: string | null;
  hrefFor: (id: string) => string;
  onOpen: (id: string, e: MouseEvent<HTMLAnchorElement>) => void;
  hasMore: boolean;
  loadingMore: boolean;
  moreError: string | null;
  onLoadMore: () => void;
}) {
  return (
    <div className="space-y-4 p-2">
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`kai-group-${g.key}`}>
          <h2 id={`kai-group-${g.key}`} className={cn(eyebrow, "px-3 pb-1.5 pt-2")}>
            {g.label}
          </h2>
          <ul className="space-y-0.5">
            {g.items.map((item) => (
              <li key={item.id}>
                <ChatRow
                  item={item}
                  group={g.key}
                  now={now}
                  selected={item.id === openId}
                  href={hrefFor(item.id)}
                  onOpen={onOpen}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {(hasMore || moreError) && (
        <div className="px-1 pb-1 pt-1">
          {moreError && (
            <p role="alert" className="mb-2 px-2 text-center text-xs leading-5 text-destructive">
              {moreError}
            </p>
          )}
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
            className={cn(secondaryButton, "w-full")}
          >
            {loadingMore && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
            {loadingMore ? "Loading…" : moreError ? "Try again" : "Load older"}
          </button>
        </div>
      )}
    </div>
  );
}

function ChatRow({
  item,
  group,
  now,
  selected,
  href,
  onOpen,
}: {
  item: ChatHistoryItem;
  group: ChatGroupKey;
  now: number;
  selected: boolean;
  href: string;
  onOpen: (id: string, e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const live = item.status === "active";
  const summarising = !live && item.digest === "pending" && !item.title.trim();
  const meta = [item.mode, formatMinutes(item.minutes)].filter(Boolean).join(" · ");
  const stamp = formatRowStamp(item.startedAt, group, now);

  return (
    <a
      id={rowDomId(item.id)}
      href={href}
      aria-current={selected ? "page" : undefined}
      onClick={(e) => onOpen(item.id, e)}
      className={cn(
        "flex min-h-[60px] items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        focusable,
        selected
          ? "border-primary/30 bg-primary/12"
          : "border-transparent hover:bg-surface-2 active:bg-surface-3",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-heading">
          {summarising ? <Summarising /> : chatTitle(item)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {stamp && (
          <time dateTime={item.startedAt} className="text-[11px] tabular-nums text-muted-foreground">
            {stamp}
          </time>
        )}
        {live && <LiveBadge />}
      </span>
    </a>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";

import {
  v3DeleteChat,
  v3FetchChatHistory,
  v3FetchChatHistoryDetail,
  type ChatHistoryItem,
} from "@/lib/v3ChatHistory";
import { cn } from "@/lib/utils";

import ChatDetail, { type DetailEntry } from "./ChatDetail";
import ChatList, { rowDomId } from "./ChatList";
import { errorMessage, groupChats, isProRequired, plural } from "./format";
import ProLockCard from "./ProLockCard";
import { ChatListSkeleton } from "./Skeletons";
import { EmptyChats, ErrorState } from "./states";

// Chats tab. Desktop (md+): a fixed-height two-pane layout — list on the left
// (320px, scrolls on its own), detail on the right (scrolls on its own), so
// switching conversations never moves the page. Mobile: the same two panes,
// but only one is shown — the list, or the open conversation with an
// "All chats" button. The open conversation lives in the URL (`?c=<id>`), set
// with history.pushState so the browser's back/forward step through it.

const PAGE_SIZE = 30;

type ListState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | {
      status: "ready";
      locked: boolean;
      total: number;
      items: ChatHistoryItem[];
      nextBefore: string | null;
      /** When this data arrived — the reference point for Today / Yesterday. */
      now: number;
    };

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

function without<T>(map: Record<string, T>, key: string): Record<string, T> {
  const next = { ...map };
  delete next[key];
  return next;
}

export default function ChatsTab({
  token,
  ready,
  onTotal,
}: {
  token: string;
  ready: boolean;
  /** Reports how many conversations are saved (the memory tab's Pro card uses it). */
  onTotal: (total: number) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const openId = searchParams.get("c") || null;

  const [list, setList] = useState<ListState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, DetailEntry>>({});

  const inflight = useRef(new Set<string>());
  /** Id opened by tapping a row here — "All chats" can then simply go back. */
  const openedHere = useRef<string | null>(null);
  /** Mobile: list scroll position to restore when coming back from a chat. */
  const listScrollY = useRef(0);
  const focusListNext = useRef(false);
  const prevOpenId = useRef<string | null>(openId);
  const listPaneRef = useRef<HTMLElement>(null);
  const detailPaneRef = useRef<HTMLElement>(null);

  const locked = list.status === "ready" && list.locked;

  // ── Data ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready || list.status !== "loading") return;
    let cancelled = false;
    v3FetchChatHistory(token, { limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setList({
          status: "ready",
          locked: page.locked,
          total: page.total,
          items: page.locked ? [] : page.sessions,
          nextBefore: page.locked ? null : page.nextBefore,
          now: Date.now(),
        });
        onTotal(page.total);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setList(
          isProRequired(error)
            ? { status: "ready", locked: true, total: 0, items: [], nextBefore: null, now: Date.now() }
            : { status: "error", error },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [ready, token, list.status, onTotal]);

  const hasEntry = openId ? Boolean(details[openId]) : false;

  // Details are cached per id for the life of the page; results are stored by
  // the id they were requested for, so quick switching never mixes them up.
  useEffect(() => {
    if (!ready || !openId || hasEntry || locked || inflight.current.has(openId)) return;
    const id = openId;
    inflight.current.add(id);
    v3FetchChatHistoryDetail(token, id)
      .then((data) => {
        setDetails((d) => ({ ...d, [id]: { status: "ready", data } }));
        // The list row may be stale (e.g. still "Summarising…") — refresh it.
        setList((l) =>
          l.status === "ready"
            ? { ...l, items: l.items.map((it) => (it.id === id ? { ...it, ...data.session } : it)) }
            : l,
        );
      })
      .catch((error: unknown) => setDetails((d) => ({ ...d, [id]: { status: "error", error } })))
      .finally(() => inflight.current.delete(id));
  }, [ready, token, openId, hasEntry, locked]);

  const groups = useMemo(
    () => (list.status === "ready" ? groupChats(list.items, list.now) : []),
    [list],
  );

  // ── URL ─────────────────────────────────────────────────────────────────

  const hrefFor = useCallback(
    (id: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (id) sp.set("c", id);
      else sp.delete("c");
      const q = sp.toString();
      return q ? `${pathname}?${q}` : pathname;
    },
    [searchParams, pathname],
  );

  const openChat = (id: string, e: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab / new-window clicks.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (id === openId) return;
    if (!isDesktop()) listScrollY.current = window.scrollY;
    openedHere.current = id;
    window.history.pushState(null, "", hrefFor(id));
  };

  const closeChat = useCallback(() => {
    if (openId && openedHere.current === openId) {
      openedHere.current = null;
      window.history.back();
    } else {
      window.history.replaceState(null, "", hrefFor(null));
    }
  }, [openId, hrefFor]);

  // Keep scroll and focus sensible when the open conversation changes.
  useEffect(() => {
    const prev = prevOpenId.current;
    prevOpenId.current = openId;
    if (prev === openId) return;
    const focusList = focusListNext.current;
    focusListNext.current = false;

    if (isDesktop()) {
      detailPaneRef.current?.scrollTo({ top: 0 });
      if (focusList) listPaneRef.current?.focus({ preventScroll: true });
      return;
    }
    if (openId) {
      // The list (and the row that had focus) is now hidden — move to the chat.
      window.scrollTo({ top: 0 });
      detailPaneRef.current?.focus({ preventScroll: true });
    } else if (prev) {
      const y = listScrollY.current;
      requestAnimationFrame(() => {
        window.scrollTo({ top: y });
        const row = document.getElementById(rowDomId(prev));
        (row ?? listPaneRef.current)?.focus({ preventScroll: true });
      });
    }
  }, [openId]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const retryList = () => {
    setMoreError(null);
    setList({ status: "loading" });
  };

  const loadMore = async () => {
    if (list.status !== "ready" || !list.nextBefore || loadingMore) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await v3FetchChatHistory(token, { limit: PAGE_SIZE, before: list.nextBefore });
      setList((l) => {
        if (l.status !== "ready") return l;
        const seen = new Set(l.items.map((i) => i.id));
        return {
          ...l,
          items: [...l.items, ...page.sessions.filter((s) => !seen.has(s.id))],
          nextBefore: page.nextBefore,
          total: page.total,
          now: Date.now(),
        };
      });
    } catch (err) {
      setMoreError(errorMessage(err, "Couldn't load older conversations."));
    } finally {
      setLoadingMore(false);
    }
  };

  const refetchDetail = (id: string) => setDetails((d) => without(d, id));

  const deleteChat = async (id: string) => {
    await v3DeleteChat(token, id);
    setList((l) =>
      l.status === "ready"
        ? { ...l, items: l.items.filter((i) => i.id !== id), total: Math.max(0, l.total - 1) }
        : l,
    );
    // Keep an entry for the id (rather than dropping it) so the detail effect
    // doesn't re-fetch it before the URL moves on, and so Forward to it later
    // says what happened instead of showing stale content.
    setDetails((d) => ({ ...d, [id]: { status: "error", error: new Error("This conversation was deleted.") } }));
    toast.success("Conversation deleted");
    focusListNext.current = true;
    if (openId !== id) return;
    // Desktop: just clear the selection — going "back" could reopen the chat
    // viewed before this one. Mobile: same as "All chats" (back to the list).
    if (isDesktop()) window.history.replaceState(null, "", hrefFor(null));
    else closeChat();
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (locked) return <ProLockCard total={list.total} className="mt-2" />;

  if (list.status === "ready" && list.items.length === 0 && !openId) return <EmptyChats />;

  const entry = openId ? details[openId] : undefined;

  return (
    <div className="md:grid md:h-[calc(100dvh-14rem)] md:min-h-[440px] md:grid-cols-[320px_minmax(0,1fr)] md:gap-4">
      <nav
        ref={listPaneRef}
        tabIndex={-1}
        aria-label="Conversations"
        aria-busy={list.status === "loading"}
        className={cn(
          "c-box rounded-2xl outline-none [scrollbar-gutter:stable] md:min-h-0 md:overflow-y-auto md:overscroll-contain",
          openId && "hidden md:block",
        )}
      >
        {list.status === "loading" && <ChatListSkeleton />}
        {list.status === "error" && (
          <ErrorState
            title="Couldn't load your conversations"
            message={errorMessage(list.error)}
            onRetry={retryList}
          />
        )}
        {list.status === "ready" && (
          <>
            <p className="px-5 pt-4 text-xs text-muted-foreground">
              {list.items.length === 0 ? "No conversations yet" : plural(list.total, "conversation")}
            </p>
            <ChatList
              groups={groups}
              now={list.now}
              openId={openId}
              hrefFor={hrefFor}
              onOpen={openChat}
              hasMore={Boolean(list.nextBefore)}
              loadingMore={loadingMore}
              moreError={moreError}
              onLoadMore={loadMore}
            />
          </>
        )}
      </nav>

      <section
        ref={detailPaneRef}
        tabIndex={-1}
        aria-label="Conversation"
        className={cn(
          "c-box rounded-2xl p-4 outline-none [scrollbar-gutter:stable] md:min-h-0 md:overflow-y-auto md:overscroll-contain md:p-6",
          !openId && "hidden md:block",
        )}
      >
        {openId ? (
          <ChatDetail
            key={openId}
            entry={entry}
            onBack={closeChat}
            onRetry={() => refetchDetail(openId)}
            onRefresh={() => refetchDetail(openId)}
            onDelete={() => deleteChat(openId)}
          />
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center text-center">
            <div className="max-w-xs">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MessagesSquare className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-base font-bold text-heading">Pick a conversation</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Its summary, corrections, new words and the full transcript will show up here.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

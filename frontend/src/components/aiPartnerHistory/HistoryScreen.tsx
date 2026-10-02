"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Brain, MessagesSquare } from "lucide-react";

import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

import ChatsTab from "./ChatsTab";
import { KaiGateContext } from "./kaiGate";
import MemoryTab from "./MemoryTab";
import { ErrorState } from "./states";
import { focusable, quietButton, secondaryButton } from "./styles";

// /dashboard/ai-partner/history — K.AI's past conversations (ChatGPT-style)
// and what K.AI remembers about the learner. The tab lives in the URL
// (`?tab=memory`) so it can be linked; switching tabs replaces the entry
// rather than adding one, so Back leaves the screen as expected. Each tab
// mounts on first visit and then stays mounted (hidden), keeping its data and
// scroll position when you switch back.

type Tab = "chats" | "memory";

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "chats", label: "Chats", icon: MessagesSquare },
  { id: "memory", label: "What K.AI remembers", icon: Brain },
];

export default function HistoryScreen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tab: Tab = searchParams.get("tab") === "memory" ? "memory" : "chats";

  const session = useSession();
  const token = session.data?.user?.accessToken ?? "";
  const ready = session.status === "authenticated" && Boolean(token);
  const { guard } = useAIPartnerGate();

  // Tabs mount on first visit and stay mounted afterwards.
  const [visited, setVisited] = useState<Record<Tab, boolean>>({ chats: tab === "chats", memory: tab === "memory" });
  if (!visited[tab]) setVisited((v) => ({ ...v, [tab]: true }));

  const [savedTotal, setSavedTotal] = useState<number | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ chats: null, memory: null });

  const selectTab = (next: Tab, focus = false) => {
    if (focus) tabRefs.current[next]?.focus();
    if (next === tab) return;
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "memory") sp.set("tab", "memory");
    else sp.delete("tab");
    const q = sp.toString();
    window.history.replaceState(null, "", q ? `${pathname}?${q}` : pathname);
  };

  // WAI-ARIA tabs: arrow keys / Home / End move between tabs (and select them).
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    selectTab(TABS[next].id, true);
  };

  return (
    <KaiGateContext value={guard}>
      <header className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href="/dashboard/ai-partner"
            onClick={(e) => guard(e)}
            className={cn(quietButton, "-ml-2 shrink-0")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            K.AI
          </Link>
          <span aria-hidden className="text-muted-foreground/60">
            /
          </span>
          <h1 className="ml-2 truncate text-2xl font-bold text-heading">History</h1>
        </div>

        <div
          role="tablist"
          aria-label="History"
          className="grid w-full grid-cols-2 gap-1 rounded-full border border-border bg-surface-1 p-1 md:inline-grid md:w-auto"
        >
          {TABS.map((t) => {
            const selected = t.id === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`kai-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`kai-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(t.id)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  "inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-[13px] font-semibold leading-tight transition-colors sm:px-4 sm:text-sm",
                  focusable,
                  selected
                    ? "bg-gradient-to-br from-primary-1 to-primary-2 text-primary-foreground"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-heading",
                )}
              >
                <Icon className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {session.status === "unauthenticated" ? (
        <div className="c-box rounded-2xl">
          <ErrorState title="You're signed out" message="Sign in again to see your conversations with K.AI.">
            <Link href="/login" className={secondaryButton}>
              Sign in
            </Link>
          </ErrorState>
        </div>
      ) : (
        <>
          <div
            role="tabpanel"
            id="kai-panel-chats"
            aria-labelledby="kai-tab-chats"
            hidden={tab !== "chats"}
          >
            {visited.chats && <ChatsTab token={token} ready={ready} onTotal={setSavedTotal} />}
          </div>
          <div
            role="tabpanel"
            id="kai-panel-memory"
            aria-labelledby="kai-tab-memory"
            hidden={tab !== "memory"}
          >
            {visited.memory && <MemoryTab token={token} ready={ready} savedTotal={savedTotal} />}
          </div>
        </>
      )}
    </KaiGateContext>
  );
}

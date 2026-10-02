// Pure helpers for the K.AI history screen: date buckets, labels, error text.
// No React here — everything takes `now` as an argument so render stays pure
// (the caller stamps `now` when its data arrives).

import { ApiError } from "@/lib/apiClient";
import { PRO_REQUIRED_CODE, type ChatHistoryItem } from "@/lib/v3ChatHistory";

export type ChatGroupKey = "today" | "yesterday" | "week" | "month" | "older";

export const CHAT_GROUP_LABELS: Record<ChatGroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Previous 7 days",
  month: "Previous 30 days",
  older: "Older",
};

export type ChatGroup = { key: ChatGroupKey; label: string; items: ChatHistoryItem[] };

function startOfLocalDay(ms: number, daysBack = 0): number {
  // setDate (not "minus 24h") so DST changes never shift a bucket boundary.
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  if (daysBack) d.setDate(d.getDate() - daysBack);
  return d.getTime();
}

function timeOf(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function groupKeyFor(iso: string, now: number): ChatGroupKey {
  const t = timeOf(iso);
  if (t >= startOfLocalDay(now)) return "today";
  if (t >= startOfLocalDay(now, 1)) return "yesterday";
  if (t >= startOfLocalDay(now, 7)) return "week";
  if (t >= startOfLocalDay(now, 30)) return "month";
  return "older";
}

/** ChatGPT-style buckets by `startedAt` in local time, newest first; empty buckets dropped. */
export function groupChats(items: ChatHistoryItem[], now: number): ChatGroup[] {
  const sorted = [...items].sort((a, b) => timeOf(b.startedAt) - timeOf(a.startedAt));
  const groups: ChatGroup[] = [];
  for (const item of sorted) {
    const key = groupKeyFor(item.startedAt, now);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: CHAT_GROUP_LABELS[key], items: [item] });
  }
  return groups;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Right-hand stamp on a list row: a clock time for recent chats, a date otherwise. */
export function formatRowStamp(iso: string, group: ChatGroupKey, now: number): string {
  if (group === "today" || group === "yesterday") return formatClock(iso);
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "Tue, 30 Sep 2026 · 7:42 pm" for the detail header. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${date} · ${formatClock(iso)}`;
}

/** Billed minutes arrive with one decimal: "<1 min", "6.5 min", "12 min". */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 min";
  if (minutes < 1) return "<1 min";
  if (minutes < 10) return `${Math.round(minutes * 10) / 10} min`;
  return `${Math.round(minutes)} min`;
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/** "just now", "3 hours ago", "yesterday", "2 weeks ago". */
export function formatRelative(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  let value = (t - now) / 1000;
  if (Math.abs(value) < 45) return "just now";
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return "";
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

export function isProRequired(err: unknown): boolean {
  return err instanceof ApiError && err.code === PRO_REQUIRED_CODE;
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

/** Title shown for a conversation everywhere: the digest's title, else a plain fallback. */
export function chatTitle(item: Pick<ChatHistoryItem, "title">): string {
  return item.title.trim() || "Conversation";
}

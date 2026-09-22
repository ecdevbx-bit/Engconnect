// Global "AI Partner is being rebuilt" trigger. While the
// englishconnection-ai-partner flag is off, every surface that would normally
// navigate to /dashboard/ai-partner swallows the click and calls
// triggerAIPartnerNotice() instead; the app-wide <AIPartnerGateRoot> registers
// the listener and opens the modal. Module-level (not context) so non-React
// callers can fire it too — same shape as quotaPrompt.ts.

type Listener = () => void;

let listener: Listener | null = null;

export function registerAIPartnerNoticeListener(fn: Listener | null): void {
  listener = fn;
}

export function triggerAIPartnerNotice(): void {
  if (typeof window === "undefined") return;
  listener?.();
}

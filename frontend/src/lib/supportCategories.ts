// "Something wrong?" issue types — shared by the support panel (dropdown) and
// the API (validation + email subject).
export const SUPPORT_CATEGORIES = [
  { id: "bug", label: "Something isn't working" },
  { id: "ai-partner", label: "AI Partner (K.AI) problem" },
  { id: "microphone", label: "Microphone / audio problem" },
  { id: "pronunciation", label: "Pronunciation Coach" },
  { id: "jumble", label: "Jumble Words" },
  { id: "account", label: "Account & sign-in" },
  { id: "pro", label: "Pro plan & payments" },
  { id: "suggestion", label: "Suggestion / feedback" },
  { id: "other", label: "Something else" },
] as const;

export type SupportCategoryId = (typeof SUPPORT_CATEGORIES)[number]["id"];

export function supportCategoryLabel(id: string): string {
  return SUPPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

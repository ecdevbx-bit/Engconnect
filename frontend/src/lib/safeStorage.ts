// localStorage can be missing or throw (private mode, some in-app WebViews,
// blocked site data). Reads here never throw.

export function storageGet(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// "Has the learner already seen this?" — when storage is unavailable we say
// yes, so a one-time tour doesn't replay on every visit.
export function storageSeen(key: string): boolean {
  try {
    return typeof window === "undefined" || window.localStorage.getItem(key) === "1";
  } catch {
    return true;
  }
}

import type { AppDispatch } from "@/store";
import { enqueueBadgeCelebrations } from "@/store/slices/xpSlice";
import { emitToast } from "@/lib/toast";
import { awardMode, badgeSubtitle, badgeTitle } from "@/lib/badges";

// notifyBadgeAwards routes a batch of freshly-earned badge IDs to the right
// notification channel based on each badge's award mode. The single place all
// gameplay handlers (jumble / pronunciation / AI partner) call so the
// silent/minimal/celebration policy stays consistent.
//
// Call this only when the same event did NOT level the user up — a level-up
// shows its own card alone (the handlers gate on leveledUp first).
export function notifyBadgeAwards(dispatch: AppDispatch, ids: string[] | undefined) {
  if (!ids || ids.length === 0) return;
  const celebrate: string[] = [];
  for (const id of ids) {
    switch (awardMode(id)) {
      case "celebration":
        celebrate.push(id);
        break;
      case "minimal":
        emitToast({ type: "success", title: `Badge earned: ${badgeTitle(id)}`, body: badgeSubtitle(id) });
        break;
      case "silent":
        break; // no UI
    }
  }
  if (celebrate.length > 0) dispatch(enqueueBadgeCelebrations(celebrate));
}

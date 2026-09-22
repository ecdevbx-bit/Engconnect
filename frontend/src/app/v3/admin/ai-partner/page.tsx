import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";

import AIPartnerAdminClient from "./AIPartnerAdminClient";
import { getAIPartnerRewardsAction } from "./actions";

// Server entry point for /v3/admin/ai-partner. Hard auth gate then a
// single server-side fetch of the current rewards config + defaults so
// the form renders pre-filled on first paint.

export default async function AdminAIPartnerPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  // If the GET fails (network blip, key misconfigured) we don't want a
  // hard server-error page — render the form with bake-in defaults so
  // an admin can still write a fresh row.
  let initial;
  try {
    initial = await getAIPartnerRewardsAction();
  } catch {
    initial = {
      current: {
        thresholdSeconds: 15,
        thresholdXp: 40,
        recurringIntervalSeconds: 10,
        recurringXp: 15,
        maxRecordingSeconds: 20,
        sessionSeconds: 600,
        proDailyCapSeconds: 3600,
        freeWeeklyCapSeconds: 1200,
      },
      defaults: {
        thresholdSeconds: 15,
        thresholdXp: 40,
        recurringIntervalSeconds: 10,
        recurringXp: 15,
        maxRecordingSeconds: 20,
        sessionSeconds: 600,
        proDailyCapSeconds: 3600,
        freeWeeklyCapSeconds: 1200,
      },
    };
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">AI Partner rewards</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Tune the speech-time XP rule. Threshold + recurring interval define
        when payouts fire; XP values define how much each pays. Max recording
        controls how long the mic stays open before auto-stop. Session length
        sets the total countdown. Changes go live on the next chat turn — no
        restart required.
      </p>
      <AIPartnerAdminClient initial={initial.current} defaults={initial.defaults} />
    </div>
  );
}

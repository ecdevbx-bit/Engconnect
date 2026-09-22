import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import ProTrialsAdminClient from "./ProTrialsAdminClient";
import { getProTrialsAction, type ProTrialListResponse } from "./actions";

// Server entry for /v3/admin/pro-trials. Hard auth gate, then a server-side
// fetch of the applicants + launch settings so the panel renders pre-filled.

export default async function AdminProTrialsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  let initial: ProTrialListResponse;
  try {
    initial = await getProTrialsAction();
  } catch {
    const fallback = { endsOn: "", durationDays: 25, maxApprovals: 100 };
    initial = {
      applications: [],
      approvedCount: 0,
      settings: fallback,
      defaults: fallback,
    };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Pro trials</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        The free launch program. Approve testers (up to the cap) — every approved user&apos;s trial
        runs until the shared program end date below, no matter which day they signed up or were
        approved. Approving a user grants full, unrestricted Pro for the whole remaining window
        immediately (no daily feedback needed). Cancel to pull someone&apos;s access immediately.
      </p>
      <ProTrialsAdminClient initial={initial} />
    </div>
  );
}

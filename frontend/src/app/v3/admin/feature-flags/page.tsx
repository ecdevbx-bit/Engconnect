import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import FeatureFlagsAdminClient from "./FeatureFlagsAdminClient";
import { getFeatureFlagsAction, type FeatureFlagsResponse } from "./actions";

// Server entry for /v3/admin/feature-flags. Hard auth gate (admin email
// allow-list), then a server-side fetch of the flag registry so the panel
// renders pre-filled.

export default async function AdminFeatureFlagsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  let initial: FeatureFlagsResponse;
  try {
    initial = await getFeatureFlagsAction();
  } catch {
    initial = { flags: [] };
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Feature flags</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Toggle features on or off across the platform. A flag turned off hides its feature for
        everyone; turn it on when you&apos;re ready to launch. Changes converge across all servers
        within a couple of minutes, and apply immediately on each user&apos;s next page load.
      </p>
      <FeatureFlagsAdminClient initial={initial} />
    </div>
  );
}

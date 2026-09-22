import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";

import JumbleSettingsAdminClient from "./JumbleSettingsAdminClient";
import { getJumbleSettingsAction } from "./actions";

// Server entry point for /v3/admin/jumble. Hard auth gate then a single
// server-side fetch of the current settings + defaults so the form
// renders pre-filled on first paint.

export default async function AdminJumblePage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  // If the GET fails (network blip, key misconfigured) we don't want a
  // hard server-error page — render the form with bake-in defaults so an
  // admin can still write a fresh row. Mirrors the backend's
  // DefaultJumbleSettings.
  let initial;
  try {
    initial = await getJumbleSettingsAction();
  } catch {
    const fallback = { progressiveSetBonusXp: 10 };
    initial = { current: fallback, defaults: fallback };
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Jumble settings</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Tune the jumble game&apos;s rewards. The progressive set bonus is the
        extra XP a player earns for clearing a whole easy → medium → hard
        set. Changes go live on the next submit — no restart required.
      </p>
      <JumbleSettingsAdminClient initial={initial.current} defaults={initial.defaults} />
    </div>
  );
}

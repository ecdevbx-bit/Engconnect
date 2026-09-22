import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";

import PronunciationTimingsAdminClient from "./PronunciationTimingsAdminClient";
import { getPronunciationTimingsAction } from "./actions";

// Server entry point for /v3/admin/pronunciation. Hard auth gate then a
// single server-side fetch of the current timings + defaults so the form
// renders pre-filled on first paint.

export default async function AdminPronunciationPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  // If the GET fails (network blip, key misconfigured) we don't want a
  // hard server-error page — render the form with bake-in defaults so an
  // admin can still write a fresh row. These mirror the backend's
  // DefaultPronunciationTimings (milliseconds).
  let initial;
  try {
    initial = await getPronunciationTimingsAction();
  } catch {
    const fallback = {
      countdownMs: 5000,
      easyRecordDurationMs: 6000,
      mediumRecordDurationMs: 8000,
      hardRecordDurationMs: 12000,
    };
    initial = { current: fallback, defaults: fallback };
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Pronunciation timings</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Control how long the mic stays open per difficulty and the
        countdown wait before recording auto-starts. Values are in seconds
        and accept one decimal place (e.g. 4.5). Changes go live on the
        next sentence — no restart required.
      </p>
      <PronunciationTimingsAdminClient initial={initial.current} defaults={initial.defaults} />
    </div>
  );
}

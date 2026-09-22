import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import KeysAdminClient from "./KeysAdminClient";
import { getPoolAction } from "./actions";

// /v3/admin/keys — live view of the Gemini API key pool (DECISIONS D-006/D-011).
export const dynamic = "force-dynamic";

export default async function AdminKeysPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }
  const initial = await getPoolAction();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Gemini keys</h1>
      <p className="mb-8 max-w-3xl text-sm text-muted-foreground">
        Every API key in the pool and whether it&apos;s taking traffic right now. Free keys are always used
        first; the paid key only when no free key can. A key that hits its quota leaves rotation by
        itself — per-minute limits for a few minutes, daily limits until midnight Pacific — and comes
        back automatically. Remember: Google limits per <strong>project</strong>, so keys only add
        capacity when they come from different Google Cloud projects.
      </p>
      <KeysAdminClient initial={initial.data ?? null} initialError={initial.ok ? null : initial.message ?? "Failed to load"} />
    </div>
  );
}

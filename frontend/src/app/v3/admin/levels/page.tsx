import { redirect } from "next/navigation";
import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import { listLevelsAction, type AdminLevel } from "./actions";
import LevelsAdminClient from "./LevelsAdminClient";

export default async function AdminLevelsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  let initial: AdminLevel[] = [];
  try {
    initial = await listLevelsAction();
  } catch {
    initial = [];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Levels</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Define the level ladder. Thresholds must increase row-by-row; level 1
        always starts at 0 XP. Changes go live immediately after Save — the
        backend cache refreshes inline, no restart required.
      </p>
      <LevelsAdminClient initial={initial} />
    </div>
  );
}

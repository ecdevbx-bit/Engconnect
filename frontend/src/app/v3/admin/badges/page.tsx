import { redirect } from "next/navigation";
import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import { listBadgesAction, type Badge } from "./actions";
import BadgesAdminClient from "./BadgesAdminClient";

export default async function AdminBadgesPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  let initialByCategory: Record<string, Badge[]> = {};
  try {
    initialByCategory = await listBadgesAction();
  } catch {
    initialByCategory = {};
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Badges</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Define the badges users earn by hitting category thresholds. New
        badges are picked up by the gameplay code after the in-memory
        catalog refresh runs automatically on save.
      </p>
      <BadgesAdminClient initialByCategory={initialByCategory} />
    </div>
  );
}

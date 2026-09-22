import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import SupportAdminClient from "./SupportAdminClient";
import { listTicketsAction, type SupportInbox } from "./actions";

// /v3/admin/support — every "Something wrong?" report (each is also emailed).
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }
  let initial: SupportInbox;
  try {
    initial = await listTicketsAction();
  } catch {
    initial = { openCount: 0, tickets: [] };
  }
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Support inbox</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Reports from the in-app <strong>Help</strong> button and the /support page. Each one is also emailed to
        the support address (reply to the email to answer the learner). Mark tickets resolved when done.
      </p>
      <SupportAdminClient initial={initial} />
    </div>
  );
}

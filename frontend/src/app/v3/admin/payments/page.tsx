import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import PaymentsAdminClient from "./PaymentsAdminClient";
import { getPaymentsAction } from "./actions";

// Server entry for /v3/admin/payments (YouPI PG, D-061). Hard auth gate, then
// a server-side fetch so the panel renders pre-filled.

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminPaymentsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }
  const initial = await getPaymentsAction();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Payments</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Pro checkout through your own YouPI PG gateway. Experimental — off by default.
      </p>
      <PaymentsAdminClient initial={initial} origin={await siteOrigin()} />
    </div>
  );
}

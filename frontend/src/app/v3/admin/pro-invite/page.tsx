import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { NotAdminError, requireAdmin } from "../problems/adminAuth";
import ProInviteAdminClient from "./ProInviteAdminClient";
import { getProInviteAction, type ProInviteResponse } from "./actions";

// Server entry for /v3/admin/pro-invite. Hard auth gate, then a server-side
// fetch of the link + its redemptions so the panel renders pre-filled.

// siteOrigin rebuilds the public origin from the request. The panel shows a link
// an admin will paste into WhatsApp, so it has to be the real external host —
// behind Vercel's proxy that means the forwarded headers, not the internal one.
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminProInvitePage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof NotAdminError) redirect("/login");
    throw err;
  }

  let initial: ProInviteResponse;
  try {
    initial = await getProInviteAction();
  } catch {
    // Backend unreachable — render an empty, clearly-inactive panel rather than
    // an error screen. Saving from here still works once it recovers.
    const fallback = { active: false, endsOn: "", showEndsOn: "", durationDays: 30, maxRedemptions: 0 };
    initial = {
      settings: fallback,
      defaults: { ...fallback, active: true },
      path: "/pro",
      effectiveEndsOn: "",
      displayEndsOn: "",
      expired: false,
      redeemed: 0,
      signups: [],
    };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-extrabold text-heading">Pro link</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        One fixed link that turns anyone who <strong>signs up through it</strong> into a Pro user
        automatically — no approval step. It has its own page, separate from the normal login, and
        the URL never changes, so it is safe to print or pin. It only ever pays out on a brand-new
        account: an existing user opening it just signs in as usual, and re-sharing it can&apos;t top
        anyone up. Switch it off below to stop it; people who already joined keep their Pro.
      </p>
      <ProInviteAdminClient initial={initial} origin={await siteOrigin()} />
    </div>
  );
}

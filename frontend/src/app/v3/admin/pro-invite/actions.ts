"use server";

import { revalidatePath } from "next/cache";
import { backendFetch, internalAPIKey, requireAdmin } from "../problems/adminAuth";

// Server actions for the Pro link panel. Wrap the internal-API-key gated backend
// so the shared secret never reaches the browser.

export type ProInviteSettings = {
  active: boolean;
  // "" → inherit the Pro-trial program's end date; "none" → rolling per-user
  // window of durationDays; "YYYY-MM-DD" → the link's own shared cutoff.
  endsOn: string;
  // DISPLAY ONLY — the date the /pro page names, which changes nothing about the
  // grant. "" → name the real end date; "YYYY-MM-DD" → name this instead. It may
  // never be later than the real end (the backend refuses), so the page can quote
  // a nearer, more meaningful date while Pro itself quietly runs longer.
  showEndsOn: string;
  durationDays: number;
  // 0 = unlimited.
  maxRedemptions: number;
};

export type ProInviteSignup = {
  sub: string;
  name: string;
  email: string;
  grantedAt: string;
  premiumUntil: string;
  isPro: boolean;
};

export type ProInviteResponse = {
  settings: ProInviteSettings;
  defaults: ProInviteSettings;
  // Site-relative and fixed, always "/pro". The panel prefixes the site origin.
  path: string;
  // Inclusive IST date that a grant made right now would run through, after
  // resolving an inherited cutoff. Empty for a rolling window.
  effectiveEndsOn: string;
  // The date the /pro page actually NAMES right now, after applying showEndsOn.
  // Differs from effectiveEndsOn exactly when the page is quoting an earlier date.
  displayEndsOn: string;
  expired: boolean;
  redeemed: number;
  signups: ProInviteSignup[];
};

type Envelope<T> = { success: boolean; message: string; data?: T };

async function call<T>(
  path: string,
  method: "GET" | "PUT",
  body?: unknown,
): Promise<{ ok: boolean; message?: string; data?: T }> {
  await requireAdmin();
  const res = await backendFetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalAPIKey(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const env = (await res.json()) as Envelope<T>;
  return { ok: res.ok && !!env.success, message: env.message, data: env.data };
}

export async function getProInviteAction(): Promise<ProInviteResponse> {
  const { ok, message, data } = await call<ProInviteResponse>("/api/admin/pro-invite", "GET");
  if (!ok || !data) {
    throw new Error(message ?? "Load failed");
  }
  return data;
}

export async function saveProInviteSettingsAction(settings: ProInviteSettings) {
  const res = await call<ProInviteResponse>("/api/admin/pro-invite/settings", "PUT", settings);
  revalidatePath("/v3/admin/pro-invite");
  return res;
}

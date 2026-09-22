import "server-only";

import { getSettings, type ProInviteSettings, type ProTrialSettings } from "../settings";
import { db, must } from "../supabase";
import { extendPremium, getProfile, isProRow, istDate } from "./users";

// Pro access paths. All of them only ever push profiles.premium_until forward.
//   * Pro trial program: apply → admin approves → Pro until a shared end date
//     ("YYYY-MM-DD", IST, inclusive) or, with endsOn "none"/"", a rolling
//     durationDays window from approval.
//   * /pro invite link: signing in from the /pro page grants Pro, once per
//     account, new or existing (DECISIONS.md D-021).
//   * Razorpay subscriptions (webhook-driven), see routes/premium.ts.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Exclusive end instant of an inclusive IST date: "2026-10-31" → 2026-11-01 00:00 IST.
export function endOfIstDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1) - 5.5 * 3600_000);
}

export function trialEnd(settings: ProTrialSettings, approvedAt: Date): Date {
  if (DATE_RE.test(settings.endsOn)) return endOfIstDate(settings.endsOn);
  return new Date(approvedAt.getTime() + settings.durationDays * 86_400_000);
}

type TrialRow = {
  user_id: string;
  phone: string;
  status: "pending" | "approved" | "cancelled";
  applied_at: string;
  approved_at: string | null;
  expires_at: string | null;
  days_claimed: number;
};

export async function trialStatus(userId: string) {
  const settings = await getSettings("pro_trial");
  const profile = await getProfile(userId);
  const { data } = await db().from("pro_trial_applications").select("*").eq("user_id", userId).maybeSingle();
  const row = data as TrialRow | null;
  const { data: fb } = await db()
    .from("feedback")
    .select("id")
    .eq("user_id", userId)
    .eq("day", istDate(new Date()))
    .limit(1);

  const expires = row?.expires_at ? new Date(row.expires_at) : null;
  const approved = row?.status === "approved";
  const inWindow = approved && !!expires && expires.getTime() > Date.now();
  return {
    status: (row?.status ?? "") as "" | "pending" | "approved" | "cancelled",
    windowState: (!approved ? "none" : inWindow ? "active" : "after") as "none" | "active" | "after",
    endsOn: DATE_RE.test(settings.endsOn) ? settings.endsOn : "",
    durationDays: settings.durationDays,
    inWindow,
    submittedToday: (fb ?? []).length > 0,
    daysClaimed: row?.days_claimed ?? 0,
    approvedAt: row?.approved_at ? new Date(row.approved_at).toISOString() : "",
    expiresAt: expires ? expires.toISOString() : "",
    proUntil: profile.premium_until ? new Date(profile.premium_until).toISOString() : "",
    isPro: isProRow(profile),
    phone: row?.phone || profile.phone,
  };
}

// ── /pro invite link ────────────────────────────────────────────────

export async function proInviteState() {
  const settings = await getSettings("pro_invite");
  const trial = await getSettings("pro_trial");
  const effectiveEndsOn = inviteEffectiveEndsOn(settings, trial);
  const expired = !!effectiveEndsOn && endOfIstDate(effectiveEndsOn).getTime() <= Date.now();
  const { count } = await db().from("pro_invite_signups").select("user_id", { count: "exact", head: true });
  const redeemed = count ?? 0;
  const displayEndsOn = settings.showEndsOn && DATE_RE.test(settings.showEndsOn) ? settings.showEndsOn : effectiveEndsOn;
  const capped = settings.maxRedemptions > 0 && redeemed >= settings.maxRedemptions;
  return { settings, effectiveEndsOn, displayEndsOn, expired, redeemed, live: settings.active && !expired, capped };
}

export function inviteEffectiveEndsOn(s: ProInviteSettings, trial: ProTrialSettings): string {
  if (s.endsOn === "none") return "";
  if (DATE_RE.test(s.endsOn)) return s.endsOn;
  return DATE_RE.test(trial.endsOn) ? trial.endsOn : "";
}

// Called from /auth/callback and /auth/confirm when the sign-in started at /pro.
// New AND existing accounts qualify (the /pro page promises both — D-021), once
// per account, while the link is live and under its redemption cap.
export async function grantProInviteIfEligible(userId: string): Promise<boolean> {
  const state = await proInviteState();
  if (!state.live || state.capped) return false;
  const until = state.effectiveEndsOn
    ? endOfIstDate(state.effectiveEndsOn)
    : new Date(Date.now() + state.settings.durationDays * 86_400_000);
  const { data } = await db()
    .from("pro_invite_signups")
    .upsert({ user_id: userId, premium_until: until.toISOString() }, { onConflict: "user_id", ignoreDuplicates: true })
    .select("user_id");
  if (!data || data.length === 0) return false;
  await extendPremium(userId, until);
  return true;
}

export async function proInviteSignups() {
  const rows = must(
    await db().from("pro_invite_signups").select("user_id, granted_at, premium_until").order("granted_at", { ascending: false }).limit(500),
    "invite signups",
  ) as { user_id: string; granted_at: string; premium_until: string }[];
  if (rows.length === 0) return [];
  const { data: profiles } = await db()
    .from("profiles")
    .select("id, name, email, premium_until")
    .in("id", rows.map((r) => r.user_id));
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  return rows.map((r) => {
    const p = byId.get(r.user_id);
    return {
      sub: r.user_id,
      name: (p?.name as string) ?? "",
      email: (p?.email as string) ?? "",
      grantedAt: new Date(r.granted_at).toISOString(),
      premiumUntil: new Date(r.premium_until).toISOString(),
      isPro: !!p?.premium_until && new Date(p.premium_until as string).getTime() > Date.now(),
    };
  });
}

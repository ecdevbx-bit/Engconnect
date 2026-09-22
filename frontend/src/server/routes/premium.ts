import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { proInviteState, trialStatus } from "../domain/premium";
import { extendPremium } from "../domain/users";
import { env } from "../env";
import { requireUser } from "../guards";
import { fail, ok, readJson, str } from "../http";
import type { Router } from "../router";
import { db, must } from "../supabase";

const PHONE_RE = /^\+?[0-9 ()-]{8,20}$/;

async function razorpay<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const cfg = env.razorpay();
  if (!cfg) throw fail.unavailable("Payments aren't set up yet.", "PAYMENTS_NOT_CONFIGURED");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw fail.unavailable(json?.error?.description ?? `Razorpay error ${res.status}`, "PAYMENT_PROVIDER_ERROR");
  return json;
}

type RzpPlan = {
  id: string;
  period: string;
  interval: number;
  item: { name: string; description?: string; amount: number; currency: string; active?: boolean };
};

async function activePlans() {
  if (!env.razorpay()) return [];
  const list = await razorpay<{ items: RzpPlan[] }>("/plans?count=50");
  return (list.items ?? [])
    .filter((p) => p.item?.active !== false)
    .map((p) => ({
      id: p.id,
      name: p.item.name,
      description: p.item.description ?? "",
      amountPaise: p.item.amount,
      currency: p.item.currency,
      period: p.period,
      interval: p.interval,
    }));
}

export function registerPremiumRoutes(r: Router) {
  // ── Pro trial + feedback ──
  r.on("GET", "/trial/status", async ({ req }) => {
    const u = await requireUser(req);
    return ok(await trialStatus(u.id));
  });

  r.on("POST", "/trial/apply", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const phone = str(body.phone, "phone", { required: true, max: 20 });
    if (!PHONE_RE.test(phone)) throw fail.badRequest("Please enter a valid phone number.", { phone: "invalid" });
    const { data: existing } = await db().from("pro_trial_applications").select("status").eq("user_id", u.id).maybeSingle();
    if (!existing || existing.status === "cancelled") {
      must(
        await db()
          .from("pro_trial_applications")
          .upsert({ user_id: u.id, phone, status: "pending", applied_at: new Date().toISOString(), approved_at: null, expires_at: null })
          .select("user_id"),
        "apply trial",
      );
    }
    await db().from("profiles").update({ phone }).eq("id", u.id);
    return ok(await trialStatus(u.id), "Application received");
  });

  r.on("POST", "/feedback", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const text = str(body.text, "text", { required: true, max: 5000 });
    must(await db().from("feedback").insert({ user_id: u.id, text }).select("id"), "save feedback");
    return ok({ proGrantedToday: false, trial: await trialStatus(u.id) }, "Thanks for the feedback!");
  });

  // Public: is the /pro link live and what date does the page name?
  r.on("GET", "/pro-link", async () => {
    const s = await proInviteState();
    return ok({
      active: s.live,
      endsOn: s.displayEndsOn,
      ...(s.effectiveEndsOn ? {} : { durationDays: s.settings.durationDays }),
    });
  });

  // ── Razorpay (off until RAZORPAY_* env vars exist) ──
  r.on("GET", "/payments/plans", async ({ req }) => {
    await requireUser(req);
    return ok(await activePlans());
  });

  r.on("POST", "/payments/subscriptions", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const planId = str(body.planId, "planId", { required: true, max: 64 });
    const plans = await activePlans();
    if (!plans.some((p) => p.id === planId)) throw fail.badRequest("That plan isn't available.", { planId: "invalid" });
    const sub = await razorpay<{ id: string; short_url?: string; status: string }>("/subscriptions", {
      method: "POST",
      body: { plan_id: planId, total_count: 12, customer_notify: 1, notes: { user_id: u.id } },
    });
    must(
      await db().from("subscriptions").upsert({ id: sub.id, user_id: u.id, plan_id: planId, status: sub.status, raw: sub }).select("id"),
      "save subscription",
    );
    return ok({
      mode: "subscription",
      razorpayKeyId: env.razorpay()!.keyId,
      planId,
      subscriptionId: sub.id,
      shortUrl: sub.short_url,
    });
  });

  r.on("GET", "/payments/subscription", async ({ req }) => {
    const u = await requireUser(req);
    const { data } = await db()
      .from("subscriptions")
      .select("status, plan_id, current_end")
      .eq("user_id", u.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return ok({ active: false });
    const end = data.current_end ? new Date(data.current_end as string) : null;
    return ok({
      active: data.status === "active" && !!end && end.getTime() > Date.now(),
      status: data.status,
      planId: data.plan_id,
      ...(end ? { currentEnd: end.toISOString() } : {}),
    });
  });

  // Razorpay webhook — the ONLY path that grants paid Pro. Verified by HMAC.
  r.on("POST", "/payments/webhook", async ({ req }) => {
    const cfg = env.razorpay();
    if (!cfg?.webhookSecret) throw fail.unavailable("Webhook not configured.", "PAYMENTS_NOT_CONFIGURED");
    const raw = await req.text();
    const sig = req.headers.get("x-razorpay-signature") ?? "";
    const expected = createHmac("sha256", cfg.webhookSecret).update(raw).digest("hex");
    if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      throw fail.forbidden("Bad signature.");
    }
    const evt = JSON.parse(raw) as {
      event: string;
      payload?: { subscription?: { entity?: { id: string; status: string; plan_id: string; current_end?: number; notes?: { user_id?: string } } } };
    };
    const s = evt.payload?.subscription?.entity;
    if (s?.id) {
      const { data: row } = await db().from("subscriptions").select("user_id").eq("id", s.id).maybeSingle();
      const userId = (row?.user_id as string | undefined) ?? s.notes?.user_id;
      if (userId) {
        const end = s.current_end ? new Date(s.current_end * 1000) : null;
        await db().from("subscriptions").upsert({
          id: s.id,
          user_id: userId,
          plan_id: s.plan_id,
          status: s.status,
          current_end: end?.toISOString() ?? null,
          raw: evt,
        });
        if (end && (evt.event === "subscription.charged" || evt.event === "subscription.activated")) {
          await extendPremium(userId, end);
        }
      }
    }
    return ok({ received: true });
  });
}

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { extendPremium, getProfile, istDate } from "../domain/users";
import { env } from "../env";
import { requireInternal, requireUser } from "../guards";
import { ApiFailure, fail, ok, readJson } from "../http";
import type { Router } from "../router";
import { DEFAULTS, getSettings, putSettings, validateSettings, type PaymentsSettings } from "../settings";
import { db, must } from "../supabase";

// Pro payments through the owner's self-hosted YouPI PG gateway (D-061).
//   * Off until the admin switches it on (admin → Payments). The webhook keeps
//     working while off, so a payment already in flight still counts.
//   * The browser never sees a secret: we create the gateway session server-side
//     and send the learner to YouPI's hosted checkout page.
//   * Pro is granted ONLY from a signed webhook, and only for the amount we
//     stored for that order. By default only on RECONCILED (a bank-statement
//     line matched — YouPI's own rule); the admin can choose the riskier
//     "as soon as a bank alert matches" (OBSERVED_SUCCESS).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WEBHOOK_PATH = "/api/payments/youpi/webhook";
// YouPI retries a delivery for up to an hour with the ORIGINAL timestamp.
const MAX_DELIVERY_AGE_MS = 3 * 60 * 60 * 1000;
const MAX_CHECKOUTS_PER_HOUR = 5;

type PaymentRow = {
  id: string;
  user_id: string;
  amount_paise: number;
  base_paise: number;
  discount_percent: number;
  duration_days: number;
  status: "created" | "observed" | "paid" | "review" | "failed" | "expired" | "cancelled";
  gateway_payment_id: string | null;
  checkout_url: string | null;
  utr: string | null;
  last_event: string | null;
  granted_until: string | null;
  paid_at: string | null;
  created_at: string;
};

// What one Pro period costs right now.
export function offerFor(s: PaymentsSettings, now = new Date()) {
  const discountLive = s.discountPercent > 0 && (!s.discountEndsOn || istDate(now) <= s.discountEndsOn);
  const pct = discountLive ? s.discountPercent : 0;
  const price = Math.max(1, Math.round((s.basePriceRupees * (100 - pct)) / 100));
  return {
    basePriceRupees: s.basePriceRupees,
    priceRupees: price,
    discountPercent: pct,
    discountEndsOn: discountLive ? s.discountEndsOn : "",
    durationDays: s.durationDays,
    currency: "INR" as const,
  };
}

function ready(s: PaymentsSettings): boolean {
  return s.enabled && !!s.gatewayUrl && !!env.youpiWebhookSecret();
}

function rupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

function publicOrder(p: PaymentRow) {
  return {
    orderId: p.id,
    status: p.status,
    amountRupees: p.amount_paise / 100,
    durationDays: p.duration_days,
    grantedUntil: p.granted_until,
    createdAt: p.created_at,
  };
}

function hmac(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function sigMatches(header: string | null, expectedHex: string): boolean {
  const given = (header ?? "").replace(/^sha256=/, "");
  return given.length === expectedHex.length && timingSafeEqual(Buffer.from(given), Buffer.from(expectedHex));
}

// Marks the order paid exactly once and adds its days on top of any Pro the
// learner already has. Returns false if it was already paid.
async function grant(p: PaymentRow, utr: string, event: string): Promise<boolean> {
  const now = new Date();
  const { data: claimed } = await db()
    .from("pro_payments")
    .update({ status: "paid", paid_at: now.toISOString(), utr: utr || p.utr, last_event: event, updated_at: now.toISOString() })
    .eq("id", p.id)
    .neq("status", "paid")
    .select("id");
  if (!claimed || claimed.length === 0) return false;
  const profile = await getProfile(p.user_id);
  const current = profile.premium_until ? new Date(profile.premium_until) : null;
  const from = current && current > now ? current : now;
  const until = await extendPremium(p.user_id, new Date(from.getTime() + p.duration_days * 86_400_000));
  await db().from("pro_payments").update({ granted_until: until }).eq("id", p.id);
  return true;
}

async function loadPayment(id: string): Promise<PaymentRow | null> {
  if (!UUID_RE.test(id)) return null;
  const { data } = await db().from("pro_payments").select("*").eq("id", id).maybeSingle();
  return (data as PaymentRow | null) ?? null;
}

async function setStatus(p: PaymentRow, status: PaymentRow["status"], event: string, from: PaymentRow["status"][]) {
  await db()
    .from("pro_payments")
    .update({ status, last_event: event, updated_at: new Date().toISOString() })
    .eq("id", p.id)
    .in("status", from);
}

async function adminView() {
  const settings = await getSettings("payments");
  const { data } = await db()
    .from("pro_payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as PaymentRow[];
  const { data: profiles } = rows.length
    ? await db().from("profiles").select("id, name, email").in("id", [...new Set(rows.map((r) => r.user_id))])
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  return {
    settings,
    defaults: DEFAULTS.payments,
    offer: offerFor(settings),
    live: ready(settings),
    secretSet: !!env.youpiWebhookSecret(),
    webhookPath: WEBHOOK_PATH,
    recent: rows.map((r) => ({
      ...publicOrder(r),
      utr: r.utr ?? "",
      lastEvent: r.last_event ?? "",
      name: (byId.get(r.user_id)?.name as string) ?? "",
      email: (byId.get(r.user_id)?.email as string) ?? "",
    })),
  };
}

export function registerPaymentRoutes(r: Router) {
  // Public: is buying open, and at what price? (The Pro page reads this.)
  r.on("GET", "/payments/offer", async () => {
    const s = await getSettings("payments");
    return ok({ enabled: ready(s), ...offerFor(s) });
  });

  r.on("POST", "/payments/checkout", async ({ req }) => {
    const u = await requireUser(req);
    const s = await getSettings("payments");
    if (!ready(s)) throw fail.unavailable("Payments are switched off right now.", "PAYMENTS_OFF");

    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { data: recent } = await db()
      .from("pro_payments")
      .select("id, status, created_at")
      .eq("user_id", u.id)
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
    const rows = (recent ?? []) as Pick<PaymentRow, "id" | "status" | "created_at">[];
    if (rows.some((x) => x.status === "observed")) {
      throw fail.conflict("We've seen your last payment and are confirming it — Pro unlocks soon.", "PAYMENT_PENDING");
    }
    if (rows.filter((x) => x.created_at >= hourAgo).length >= MAX_CHECKOUTS_PER_HOUR) {
      throw new ApiFailure(429, "TOO_MANY_CHECKOUTS", "Too many payment attempts. Please try again in an hour.");
    }

    const offer = offerFor(s);
    const created = must(
      await db()
        .from("pro_payments")
        .insert({
          user_id: u.id,
          amount_paise: offer.priceRupees * 100,
          base_paise: offer.basePriceRupees * 100,
          discount_percent: offer.discountPercent,
          duration_days: offer.durationDays,
        })
        .select("*")
        .single(),
      "create payment",
    ) as PaymentRow;

    const origin = new URL(req.url).origin;
    let res: Response;
    try {
      res = await fetch(`${s.gatewayUrl}/api/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": created.id,
          // A non-default merchant must prove itself with its webhook secret
          // (YouPI answers 401 MISSING_MERCHANT_KEY otherwise). Server-to-server only.
          ...(s.merchantId ? { "X-Merchant-Id": s.merchantId, "X-Merchant-Key": env.youpiWebhookSecret() } : {}),
        },
        body: JSON.stringify({
          orderId: created.id,
          amount: rupees(created.amount_paise),
          currency: "INR",
          description: `English Connection Pro · ${created.duration_days} days`,
          returnUrl: `${origin}/v3/premium?payment=${created.id}`,
          metadata: { userId: u.id, product: "pro", days: created.duration_days },
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
    } catch {
      await setStatus(created, "failed", "GATEWAY_UNREACHABLE", ["created"]);
      throw fail.unavailable("The payment page isn't reachable right now. Please try again later.", "PAYMENT_GATEWAY_DOWN");
    }
    const body = (await res.json().catch(() => ({}))) as { paymentId?: string; checkoutUrl?: string; error?: string; message?: string };
    if (res.status === 409) {
      await setStatus(created, "cancelled", "DUPLICATE_SESSION", ["created"]);
      throw fail.conflict("You already have a payment open on another device. Finish or cancel it there first.", "PAYMENT_OPEN_ELSEWHERE");
    }
    if (!res.ok || !body.checkoutUrl || !/^https?:\/\//.test(body.checkoutUrl)) {
      await setStatus(created, "failed", `GATEWAY_${res.status}`, ["created"]);
      throw fail.unavailable(body.message || body.error || "Couldn't start the payment. Please try again.", "PAYMENT_PROVIDER_ERROR");
    }
    await db()
      .from("pro_payments")
      .update({ gateway_payment_id: body.paymentId ?? null, checkout_url: body.checkoutUrl })
      .eq("id", created.id);
    return ok({ orderId: created.id, checkoutUrl: body.checkoutUrl });
  });

  r.on("GET", "/payments/orders/:id", async ({ req, params }) => {
    const u = await requireUser(req);
    const p = await loadPayment(params.id);
    if (!p || p.user_id !== u.id) throw fail.notFound("Payment not found.");
    return ok(publicOrder(p));
  });

  // Signed server-to-server webhook from YouPI PG. The only path that grants paid Pro.
  r.on("POST", "/payments/youpi/webhook", async ({ req }) => {
    const secret = env.youpiWebhookSecret();
    if (!secret) throw fail.unavailable("Webhook not configured.", "PAYMENTS_NOT_CONFIGURED");
    const raw = await req.text();
    const ts = req.headers.get("x-gateway-timestamp");
    const v2 = req.headers.get("x-gateway-signature-v2");
    // Prefer the signature that binds the timestamp; fall back to the body-only one.
    const valid = v2 && ts ? sigMatches(v2, hmac(secret, `${ts}.${raw}`)) : sigMatches(req.headers.get("x-gateway-signature"), hmac(secret, raw));
    if (!valid) throw fail.forbidden("Bad signature.");
    if (ts && Math.abs(Date.now() - Number(ts)) > MAX_DELIVERY_AGE_MS) throw fail.forbidden("Stale delivery.");

    let evt: {
      event?: string;
      deliveryId?: string;
      orderId?: string;
      amountPaise?: number;
      currency?: string;
      method?: string;
      utr?: string;
      settlementState?: string;
    };
    try {
      evt = JSON.parse(raw);
    } catch {
      throw fail.badRequest("Body is not JSON.");
    }
    const event = String(evt.event ?? req.headers.get("x-gateway-event") ?? "");
    const deliveryId = String(req.headers.get("x-gateway-delivery-id") ?? evt.deliveryId ?? "");
    if (!deliveryId || deliveryId.length > 100) throw fail.badRequest("Missing delivery id.");

    const p = await loadPayment(String(evt.orderId ?? ""));
    // Not one of ours (or deleted with its learner) — acknowledge so YouPI stops retrying.
    if (!p) return ok({ received: true, ignored: "unknown order" });

    // Retries resend the same delivery id: handle each one once.
    const { data: fresh } = await db()
      .from("pro_payment_deliveries")
      .upsert({ delivery_id: deliveryId, payment_id: p.id, event }, { onConflict: "delivery_id", ignoreDuplicates: true })
      .select("delivery_id");
    if (!fresh || fresh.length === 0) return ok({ received: true, duplicate: true });

    try {
      if (Number(evt.amountPaise) !== p.amount_paise || (evt.currency && evt.currency !== "INR")) {
        // Wrong amount for this order: never grant; the admin looks at it.
        await setStatus(p, "review", `${event}_AMOUNT_MISMATCH`, ["created", "observed"]);
        return ok({ received: true, held: "amount mismatch" });
      }
      const utr = String(evt.utr ?? "").slice(0, 40);
      const settings = await getSettings("payments");
      switch (event) {
        case "RECONCILED":
          if (evt.settlementState && evt.settlementState !== "RECONCILED") break;
          await grant(p, utr, event);
          break;
        case "OBSERVED_SUCCESS":
          if (settings.grantOn === "observed") await grant(p, utr, event);
          else {
            await setStatus(p, "observed", event, ["created"]);
            if (utr) await db().from("pro_payments").update({ utr }).eq("id", p.id);
          }
          break;
        case "MANUAL_REVIEW":
          await setStatus(p, "review", event, ["created", "observed"]);
          break;
        case "FAILED":
        case "EXPIRED":
        case "CANCELLED":
          await setStatus(p, event.toLowerCase() as PaymentRow["status"], event, ["created"]);
          break;
        default:
          // SUCCESS = cash on delivery / counter — never offered for Pro.
          await db().from("pro_payments").update({ last_event: event }).eq("id", p.id).neq("status", "paid");
      }
    } catch (err) {
      // Let YouPI's retry run it again.
      await db().from("pro_payment_deliveries").delete().eq("delivery_id", deliveryId);
      throw err;
    }
    return ok({ received: true });
  });

  // ── Admin (admin → Payments) ──
  r.on("GET", "/admin/payments", async ({ req }) => {
    await requireInternal(req);
    return ok(await adminView());
  });

  r.on("PUT", "/admin/payments/settings", async ({ req }) => {
    const { by } = await requireInternal(req);
    const next = validateSettings("payments", (await readJson(req)) as never);
    if (next.enabled && !env.youpiWebhookSecret()) {
      throw fail.badRequest("Set YOUPI_WEBHOOK_SECRET on the server before switching payments on.");
    }
    await putSettings("payments", next, by);
    return ok(await adminView(), "Saved");
  });

  // Hand-checked payment (held for review, or matched against the bank
  // statement by hand): grant its Pro days.
  r.on("POST", "/admin/payments/:id/grant", async ({ req, params }) => {
    await requireInternal(req);
    const p = await loadPayment(params.id);
    if (!p) throw fail.notFound("Payment not found.");
    if (p.status === "paid") throw fail.conflict("Already paid and granted.");
    await grant(p, p.utr ?? "", "ADMIN_GRANT");
    return ok(await adminView(), "Pro granted");
  });
}

// End-to-end check of Pro payments through YouPI PG (D-061) — against a FAKE
// gateway on localhost, so no real money moves.
//   node scripts/payments-probe.mjs [appUrl]      (default http://localhost:3000)
// Needs YOUPI_WEBHOOK_SECRET in frontend/.env.local (the app must have the same
// value). Temporarily switches payments on with gatewayUrl = the fake gateway
// (production ignores that: it has no webhook secret, so it stays off), creates a
// throwaway learner, buys Pro, sends signed webhooks, then restores the previous
// settings and deletes the learner. Prints no secrets.
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, "frontend/.env.local"), "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const APP = process.argv[2] || "http://localhost:3000";
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const HOOK = env.YOUPI_WEBHOOK_SECRET;
if (!HOOK) throw new Error("Set YOUPI_WEBHOOK_SECRET in frontend/.env.local first.");
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };

let pass = 0, failed = 0;
const check = (name, cond, extra = "") => {
  if (cond) pass++; else failed++;
  console.log(`${cond ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
};

// ── fake YouPI payment API ──
const created = [];
const gateway = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.method === "POST" && req.url === "/api/v1/payments") {
      const b = JSON.parse(body);
      created.push({ ...b, idem: req.headers["idempotency-key"], merchant: req.headers["x-merchant-id"] });
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ paymentId: crypto.randomUUID(), orderId: b.orderId, amount: b.amount, status: "ACTIVE", checkoutUrl: `http://localhost:6199/checkout/${b.orderId}` }));
      return;
    }
    res.writeHead(404).end();
  });
});
await new Promise((r) => gateway.listen(6199, r));

const sign = (raw, ts) => ({
  "X-Gateway-Signature": `sha256=${crypto.createHmac("sha256", HOOK).update(raw).digest("hex")}`,
  "X-Gateway-Signature-V2": `sha256=${crypto.createHmac("sha256", HOOK).update(`${ts}.${raw}`).digest("hex")}`,
});
async function webhook(evt, { badSig = false, deliveryId = crypto.randomUUID() } = {}) {
  const ts = String(Date.now());
  const raw = JSON.stringify({ deliveryId, timestamp: Number(ts), currency: "INR", method: "UPI", ...evt });
  const sig = sign(raw, ts);
  if (badSig) sig["X-Gateway-Signature-V2"] = "sha256=" + "0".repeat(64);
  const res = await fetch(`${APP}/api/payments/youpi/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Gateway-Event": evt.event, "X-Gateway-Delivery-Id": deliveryId, "X-Gateway-Timestamp": ts, ...sig },
    body: raw,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const prev = await fetch(`${SB}/rest/v1/app_settings?key=eq.payments&select=value`, { headers: admin }).then((r) => r.json());
const email = `pay-${Date.now()}@example.com`, password = `Pa${Date.now()}x`;
let userId = "";
try {
  await fetch(`${SB}/rest/v1/app_settings`, {
    method: "POST",
    headers: { ...admin, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key: "payments", value: { enabled: true, gatewayUrl: "http://localhost:6199", merchantId: "probe-merchant", basePriceRupees: 499, discountPercent: 50, discountEndsOn: "", durationDays: 30, grantOn: "reconciled" }, updated_by: "payments-probe" }),
  });

  const user = await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json());
  userId = user.id;
  const s = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json());
  const auth = { Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" };
  await fetch(`${APP}/api/session/start`, { method: "POST", headers: auth });
  const api = (p, init = {}) => fetch(`${APP}/api${p}`, { ...init, headers: auth }).then((r) => r.json());
  const premiumUntil = async () =>
    (await fetch(`${SB}/rest/v1/profiles?id=eq.${userId}&select=premium_until`, { headers: admin }).then((r) => r.json()))[0]?.premium_until;

  const offer = await fetch(`${APP}/api/payments/offer`).then((r) => r.json());
  check("offer is on with 50% off", offer.data?.enabled === true && offer.data.priceRupees === 250 && offer.data.basePriceRupees === 499, JSON.stringify(offer.data));

  const co = await api("/payments/checkout", { method: "POST", body: "{}" });
  const orderId = co.data?.orderId;
  check("checkout returns the gateway's checkout URL", !!orderId && co.data.checkoutUrl.endsWith(orderId), co.message);
  const g = created.at(-1);
  check("gateway got amount 250.00, our order id, idempotency key, merchant id", g?.amount === "250.00" && g.orderId === orderId && g.idem === orderId && g.merchant === "probe-merchant");
  check("return URL comes back to /v3/premium", !!g?.returnUrl?.includes(`/v3/premium?payment=${orderId}`));

  const bad = await webhook({ event: "RECONCILED", orderId, amountPaise: 25000, settlementState: "RECONCILED" }, { badSig: true });
  check("bad signature rejected", bad.status === 403, String(bad.status));
  check("…and no Pro", !(await premiumUntil()));

  const obsId = crypto.randomUUID();
  const obs = await webhook({ event: "OBSERVED_SUCCESS", orderId, amountPaise: 25000, utr: "123456789012", settlementState: "NOT_RECONCILED" }, { deliveryId: obsId });
  let o = await api(`/payments/orders/${orderId}`);
  check("bank alert → 'observed', no Pro yet (grant on reconciled)", obs.status === 200 && o.data?.status === "observed" && !(await premiumUntil()), o.data?.status);
  const dup = await webhook({ event: "OBSERVED_SUCCESS", orderId, amountPaise: 25000 }, { deliveryId: obsId });
  check("same delivery again is a no-op", dup.body?.data?.duplicate === true);

  const again = await api("/payments/checkout", { method: "POST", body: "{}" });
  check("new checkout blocked while one is being confirmed", again.errorCode === "PAYMENT_PENDING", again.errorCode);

  const rec = await webhook({ event: "RECONCILED", orderId, amountPaise: 25000, utr: "123456789012", settlementState: "RECONCILED" });
  o = await api(`/payments/orders/${orderId}`);
  const until1 = await premiumUntil();
  const days = until1 ? (new Date(until1).getTime() - Date.now()) / 86_400_000 : 0;
  check("statement match → paid, Pro for 30 days", rec.status === 200 && o.data?.status === "paid" && days > 29.9 && days < 30.1, `${o.data?.status}, ${days.toFixed(2)} days`);
  await webhook({ event: "RECONCILED", orderId, amountPaise: 25000, settlementState: "RECONCILED" });
  check("replayed grant (new delivery id) adds nothing", (await premiumUntil()) === until1);

  // Second purchase with a wrong amount in the webhook → held, no grant.
  const co2 = await api("/payments/checkout", { method: "POST", body: "{}" });
  const order2 = co2.data?.orderId;
  await webhook({ event: "RECONCILED", orderId: order2, amountPaise: 100, settlementState: "RECONCILED" });
  o = await api(`/payments/orders/${order2}`);
  check("wrong amount → 'review', Pro unchanged", o.data?.status === "review" && (await premiumUntil()) === until1, o.data?.status);

  const other = await api(`/payments/orders/${crypto.randomUUID()}`);
  check("someone else's / unknown order → 404", other.errorCode === "NOT_FOUND", other.errorCode);
  const unknown = await webhook({ event: "RECONCILED", orderId: crypto.randomUUID(), amountPaise: 25000 });
  check("webhook for an unknown order is acknowledged (no retries)", unknown.status === 200);
} finally {
  if (prev.length) {
    await fetch(`${SB}/rest/v1/app_settings?key=eq.payments`, { method: "PATCH", headers: admin, body: JSON.stringify({ value: prev[0].value }) });
  } else {
    await fetch(`${SB}/rest/v1/app_settings?key=eq.payments`, { method: "DELETE", headers: admin });
  }
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
  gateway.close();
  console.log(`\n${pass} passed, ${failed} failed · settings restored, test learner deleted`);
  process.exitCode = failed ? 1 : 0;
}

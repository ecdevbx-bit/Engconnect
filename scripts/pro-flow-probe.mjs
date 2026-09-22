import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// Every endpoint behind the Pro screens, with a throwaway account: trial status
// + apply, payment plans, the /pro link, entitlement — and what a second login
// does to the first session (single-active-session, D-009).
//   node scripts/pro-flow-probe.mjs [appUrl]
import fs from "node:fs";
const APP = process.argv[2] || "https://engconnect-beta.vercel.app";
const env = Object.fromEntries(fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "";
async function api(p, init = {}) {
  const res = await fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, code: body.errorCode, msg: body.message, data: body.data };
}
try {
  const email = `pro-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  const show = (name, r) => console.log(`${name.padEnd(28)} ${String(r.status).padEnd(4)} ${r.code ?? ""} ${r.msg ?? ""} ${r.data ? JSON.stringify(r.data).slice(0, 120) : ""}`);
  show("POST /session/start", await api("/session/start", { method: "POST" }));
  show("GET  /trial/status", await api("/trial/status"));
  show("POST /trial/apply", await api("/trial/apply", { method: "POST", body: JSON.stringify({ phone: "+91 90000 00000" }) }));
  show("GET  /trial/status (after)", await api("/trial/status"));
  show("GET  /payments/plans", await api("/payments/plans"));
  show("POST /payments/subscriptions", await api("/payments/subscriptions", { method: "POST", body: JSON.stringify({ planId: "plan_test" }) }));
  show("GET  /pro-link", await api("/pro-link"));
  show("GET  /users/me/entitlement", await api("/users/me/entitlement"));
  // second session elsewhere (phone), then reuse the FIRST token — the single-session rule
  const second = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  const firstToken = token; token = second;
  show("POST /session/start (2nd)", await api("/session/start", { method: "POST" }));
  token = firstToken;
  show("GET  /trial/status (1st tok)", await api("/trial/status"));
  show("POST /trial/apply (1st tok)", await api("/trial/apply", { method: "POST", body: JSON.stringify({ phone: "+91 90000 00000" }) }));
} catch (e) { console.log("✗", e.message); }
finally { if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin }); }

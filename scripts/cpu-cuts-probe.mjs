import { fileURLToPath } from "node:url";
import path from "node:path";
// Checks the Vercel CPU cuts (D-068):   node scripts/cpu-cuts-probe.mjs [appUrl]
//  1. The proxy runs only with a session cookie: "/" signed out → 200 (static),
//     "/" signed in → 307 /dashboard, /dashboard signed in → 200.
//  2. A K.AI session past its allowance (or > 2 h old) is ended by its next
//     heartbeat (sessionActive:false), so a forgotten tab stops calling us.
// A throwaway learner is created and deleted; starts one real K.AI session
// (a Gemini key lease). Reads keys from local files; prints no secrets.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const env = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const ref = new URL(SB).hostname.split(".")[0];
const [APP = "http://localhost:3000"] = process.argv.slice(2);
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "", failed = 0;
const check = (ok, label) => { console.log(`${ok ? "✓" : "✗"} ${label}`); if (!ok) failed++; };
const api = (p, init = {}) =>
  fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }).then((r) => r.json());
const sql = (table, filter, patch) =>
  fetch(`${SB}/rest/v1/${table}?${filter}`, { method: "PATCH", headers: { ...admin, Prefer: "return=minimal" }, body: JSON.stringify(patch) });
const row = (table, filter, select) =>
  fetch(`${SB}/rest/v1/${table}?${filter}&select=${select}`, { headers: admin }).then((r) => r.json()).then((r) => r[0]);

try {
  const email = `cpu-cuts-${Date.now()}@example.com`, password = `Cpu-${Date.now()}x`;
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  const session = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json());
  token = session.access_token;
  await api("/session/start", { method: "POST" });
  // @supabase/ssr cookie: "base64-" + base64url(JSON), chunked at 3180 chars.
  const val = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const chunks = val.match(/.{1,3180}/g);
  const name = `sb-${ref}-auth-token`;
  const cookie = chunks.length === 1 ? `${name}=${val}` : chunks.map((c, i) => `${name}.${i}=${c}`).join("; ");

  const page = (p, headers = {}) => fetch(APP + p, { headers, redirect: "manual" });
  const out = await page("/");
  check(out.status === 200, `"/" signed out → ${out.status}`);
  const inn = await page("/", { Cookie: cookie });
  check(inn.status === 307 && (inn.headers.get("location") ?? "").endsWith("/dashboard"), `"/" signed in → ${inn.status} ${inn.headers.get("location") ?? ""}`);
  const dash = await page("/dashboard", { Cookie: cookie });
  check(dash.status === 200, `/dashboard signed in → ${dash.status}`);
  const dashOut = await page("/dashboard");
  check(dashOut.status === 307, `/dashboard signed out → ${dashOut.status} (to login)`);

  // Over the allowance: a fresh session, then its usage pushed past the cap.
  const s1 = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ level: "Beginner" }) });
  if (!s1.success) throw new Error(`start session: ${s1.message}`);
  const id1 = s1.data.sessionID;
  const live = await api(`/chat/sessions/${id1}/progress`, { method: "POST", body: JSON.stringify({ speakingSeconds: 0 }) });
  check(live.success && live.data.sessionActive === true, "a normal heartbeat keeps the session");
  const cap = s1.data.aiCapSeconds;
  await sql("chat_sessions", `id=eq.${id1}`, { started_at: new Date(Date.now() - (cap + 60) * 1000).toISOString() });
  const over = await api(`/chat/sessions/${id1}/progress`, { method: "POST", body: JSON.stringify({ speakingSeconds: 0 }) });
  check(over.success && over.data.sessionActive === false && over.data.capReached, `heartbeat past the ${cap}s allowance ends it`);
  const r1 = await row("chat_sessions", `id=eq.${id1}`, "status,end_reason");
  check(r1?.status === "ended" && r1?.end_reason === "cap", `stored as ended (${r1?.status}, ${r1?.end_reason})`);
  const again = await api(`/chat/sessions/${id1}/progress`, { method: "POST", body: JSON.stringify({ speakingSeconds: 0 }) });
  check(again.success && again.data.sessionActive === false, "later heartbeats stay read-only");
} catch (e) {
  console.log("✗", e.message);
  failed++;
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}
console.log(failed ? `\n${failed} check(s) failed` : "\nall ✓");
process.exit(failed ? 1 : 0);

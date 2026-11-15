import { fileURLToPath } from "node:url";
import path from "node:path";
// Single active login (D-009) without false "signed in elsewhere" (D-069):
//   node scripts/session-race-probe.mjs [appUrl]
// Device A signs in; device B signs in while its first requests race
// POST /session/start (as the browser does right after sign-in). Checks: B's
// requests right after the start pass (no stale cache), A is refused with
// SESSION_SUPERSEDED. Throwaway user, deleted afterwards; prints no secrets.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const env = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const [APP = "http://localhost:3000"] = process.argv.slice(2);
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", failed = 0;
const check = (ok, label) => { console.log(`${ok ? "✓" : "✗"} ${label}`); if (!ok) failed++; };
const call = (token, p, method = "GET") =>
  fetch(`${APP}/api${p}`, { method, headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());

try {
  const email = `race-${Date.now()}@example.com`, password = `Race-${Date.now()}x`;
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  const login = () =>
    fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
      .then((r) => r.json()).then((s) => s.access_token);

  const a = await login();
  await call(a, "/session/start", "POST");
  check((await call(a, "/session")).success, "device A signed in");

  for (let round = 1; round <= 5; round++) {
    const b = await login();
    // The browser's first requests fire while /session/start is in flight.
    const racing = [call(b, "/session"), call(b, "/users/me/attributes"), call(b, "/session/start", "POST"), call(b, "/users/me")];
    await Promise.all(racing);
    const after = await Promise.all([call(b, "/session"), call(b, "/users/me/attributes"), call(b, "/users/me/activity?limit=5")]);
    const bad = after.filter((r) => !r.success).map((r) => r.errorCode);
    check(bad.length === 0, `round ${round}: new login's requests after the start pass${bad.length ? ` (got ${bad.join(", ")})` : ""}`);
  }
  const old = await call(a, "/session");
  check(!old.success && old.errorCode === "SESSION_SUPERSEDED", `device A refused (${old.errorCode ?? "ok"})`);
} catch (e) {
  console.log("✗", e.message);
  failed++;
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}
console.log(failed ? `\n${failed} check(s) failed` : "\nall ✓");
process.exit(failed ? 1 : 0);

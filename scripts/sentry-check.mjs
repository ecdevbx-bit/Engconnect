import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
// Is Sentry receiving events from production? (D-044)
//  1. server: POST /api/debug/sentry (internal key) fails on purpose → an issue tagged with the
//     returned traceId must appear in Sentry;
//  2. browser path: a test event is posted through our /monitoring tunnel (what the browser SDK
//     uses) → it must appear too.
// Reads secrets from local files; prints only statuses and Sentry links.
//   node scripts/sentry-check.mjs [appUrl]
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const APP = process.argv[2] || "https://engconnect-beta.vercel.app";
const env = Object.fromEntries(fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const creds = fs.readFileSync(`${root}/credentials.txt`, "utf8");
const token = (creds.match(/sntryu_[A-Za-z0-9]+/) || [])[0];
const SENTRY = "https://de.sentry.io/api/0", ORG = "englishconnection", PROJECT = "engconnect";
const dsn = new URL(env.NEXT_PUBLIC_SENTRY_DSN);
const projectId = dsn.pathname.slice(1), orgId = dsn.hostname.split(".")[0].replace(/^o/, "");
// EU project: the browser SDK adds r=de so our tunnel forwards to o<org>.ingest.de.sentry.io.
const region = dsn.hostname.match(/\.ingest\.([a-z]{2})\.sentry\.io$/)?.[1];

let failures = 0;
const check = (ok, label, extra = "") => { console.log(`${ok ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`); if (!ok) failures++; };
const sentry = (p) => fetch(`${SENTRY}${p}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
// Poll recent events and match on a tag (tag search in the issues API lags behind).
async function waitForEvent(key, value, label) {
  for (let i = 0; i < 24; i++) {
    const events = await sentry(`/projects/${ORG}/${PROJECT}/events/?statsPeriod=1h`);
    const hit = Array.isArray(events) && events.find((e) => (e.tags || []).some((t) => t.key === key && t.value === value));
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`   (no ${label} event after 2 min)`);
  return null;
}
const link = (e) => `https://${ORG}.sentry.io/issues/${e.groupID}/`;

// 1. server-side error
const res = await fetch(`${APP}/api/debug/sentry`, { method: "POST", headers: { "x-internal-api-key": env.INTERNAL_API_KEY } });
const body = await res.json().catch(() => ({}));
check(res.status === 500 && body.traceId, "API answered the test error with a traceId", `${res.status} ${body.traceId ?? ""}`);
if (body.traceId) {
  const ev = await waitForEvent("traceId", body.traceId, "server");
  check(!!ev, "server error reached Sentry", ev ? link(ev) : "");
}

// 2. browser path through the /monitoring tunnel
const eventId = crypto.randomUUID().replace(/-/g, "");
const marker = `tunnel-check-${Date.now()}`;
const envelope = [
  JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: env.NEXT_PUBLIC_SENTRY_DSN }),
  JSON.stringify({ type: "event" }),
  JSON.stringify({ event_id: eventId, level: "info", platform: "javascript", environment: "production", message: `Sentry tunnel check ${marker}`, tags: { check: marker } }),
].join("\n");
const t = await fetch(`${APP}/monitoring?o=${orgId}&p=${projectId}${region ? `&r=${region}` : ""}`, { method: "POST", body: envelope, headers: { "Content-Type": "text/plain;charset=UTF-8" } });
check(t.status < 300, "the /monitoring tunnel accepted a browser event", String(t.status));
if (t.status < 300) {
  const ev = await waitForEvent("check", marker, "tunnel");
  check(!!ev, "tunnel event reached Sentry", ev ? link(ev) : "");
}
console.log(failures ? `\n${failures} check(s) failed` : "\nSentry is receiving events ✓");
process.exit(failures ? 1 : 0);

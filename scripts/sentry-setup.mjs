import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
// Sentry for the Next.js app (D-044). Idempotent:
//   1. makes sure the Sentry project exists (org "englishconnection", EU region),
//   2. uses an ORG auth token (sntrys_…, CI scope: releases + source maps) when
//      credentials.txt has one, so the owner's personal token needn't go to
//      Vercel. Sentry only issues org tokens in its web UI (Settings → Auth
//      Tokens; the API answers 403) — paste one into credentials.txt and re-run
//      to swap. Until then the personal token is used, stored encrypted,
//   3. sets NEXT_PUBLIC_SENTRY_DSN (public) + SENTRY_AUTH_TOKEN (encrypted) on Vercel.
// Reads secrets from credentials.txt; prints only names/statuses.
//   node scripts/sentry-setup.mjs
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const credsPath = `${root}/credentials.txt`;
let creds = fs.readFileSync(credsPath, "utf8");
const userToken = (creds.match(/sntryu_[A-Za-z0-9]+/) || [])[0];
if (!userToken) throw new Error("No Sentry user token (sntryu_…) in credentials.txt");
const vercelToken = (creds.match(/vcp_[A-Za-z0-9]+/) || [])[0];

const SENTRY = "https://de.sentry.io/api/0";
const ORG = "englishconnection", TEAM = "englishconnection", PROJECT = "engconnect";
const VERCEL_TEAM = "team_NOcBKdOGJqMLyiXrTYAovMK8", VERCEL_PROJECT = "engconnect";

async function sentry(p, init = {}, base = SENTRY) {
  const r = await fetch(base + p, { ...init, headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" } });
  const t = await r.text();
  let body; try { body = JSON.parse(t); } catch { body = { raw: t.slice(0, 200) }; }
  return { status: r.status, body };
}

// 1. project + DSN
let proj = await sentry(`/projects/${ORG}/${PROJECT}/`);
if (proj.status === 404) {
  proj = await sentry(`/teams/${ORG}/${TEAM}/projects/`, {
    method: "POST",
    body: JSON.stringify({ name: PROJECT, slug: PROJECT, platform: "javascript-nextjs", default_rules: true }),
  });
  console.log(proj.status < 300 ? "✓ project created" : `project create failed ${proj.status}`);
} else console.log(`= project exists (${proj.status})`);
const keys = await sentry(`/projects/${ORG}/${PROJECT}/keys/`);
const dsn = Array.isArray(keys.body) ? keys.body.find((k) => k.isActive)?.dsn?.public : null;
if (!dsn) throw new Error(`No DSN (${keys.status})`);
console.log("✓ DSN found");

// 2. org CI token (only once)
let ciToken = (creds.match(/sntrys_[A-Za-z0-9_=+/-]+/) || [])[0];
if (!ciToken) {
  const r = await sentry(`/organizations/${ORG}/org-auth-tokens/`, {
    method: "POST",
    body: JSON.stringify({ name: "vercel-engconnect-sourcemaps" }),
  }, "https://sentry.io/api/0"); // org tokens live on the control silo, not the EU region
  ciToken = r.body?.token;
  if (ciToken) {
    fs.appendFileSync(credsPath, `\n\nsentry org auth token (CI: source maps, used on Vercel)\n${ciToken}\n`);
    creds = fs.readFileSync(credsPath, "utf8");
    console.log("✓ org CI token created and saved to credentials.txt");
  } else {
    console.log(`org token create failed ${r.status}: ${JSON.stringify(r.body).slice(0, 200)} — falling back to the user token`);
  }
} else console.log("= org CI token already in credentials.txt");

// 3. Vercel env
if (!vercelToken) throw new Error("No Vercel token in credentials.txt");
async function vercel(p, init = {}) {
  const r = await fetch(`https://api.vercel.com${p}${p.includes("?") ? "&" : "?"}teamId=${VERCEL_TEAM}`, {
    ...init,
    headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const envs = [
  { key: "NEXT_PUBLIC_SENTRY_DSN", value: dsn, type: "plain" },
  { key: "SENTRY_AUTH_TOKEN", value: ciToken || userToken, type: "encrypted" },
].map((e) => ({ ...e, target: ["production", "preview"] }));
const r = await vercel(`/v10/projects/${VERCEL_PROJECT}/env?upsert=true`, { method: "POST", body: JSON.stringify(envs) });
console.log(r.status < 300 ? `✓ Vercel env set: ${envs.map((e) => e.key).join(", ")}` : `Vercel env error ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);

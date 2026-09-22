import { fileURLToPath } from "node:url";
import path from "node:path";
// Create the Vercel project (linked to GitHub), set env vars, trigger a prod deploy.
// Reads secrets from local files; prints only names/statuses.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const TEAM = "team_NOcBKdOGJqMLyiXrTYAovMK8";
const NAME = "engconnect";
const token = fs.readFileSync(`${root}/credentials.txt`, "utf8").match(/(vcp_[A-Za-z0-9]+)/)[1];
const envLocal = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

async function v(path, init = {}) {
  const res = await fetch(`https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${TEAM}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// 1. project
let project = (await v(`/v9/projects/${NAME}`)).body;
if (!project.id) {
  const r = await v("/v11/projects", {
    method: "POST",
    body: JSON.stringify({
      name: NAME,
      framework: "nextjs",
      rootDirectory: "frontend",
      gitRepository: { type: "github", repo: "ecdevbx-bit/Engconnect" },
    }),
  });
  if (!r.body.id) {
    console.log("project create failed:", r.status, JSON.stringify(r.body.error ?? r.body).slice(0, 400));
    process.exit(1);
  }
  project = r.body;
  console.log("✓ project created:", project.name, project.id);
} else {
  console.log("= project exists:", project.name, project.id);
}
console.log("  linked repo:", project.link ? `${project.link.org}/${project.link.repo} (${project.link.productionBranch})` : "NOT LINKED");

// 2. env vars (all environments). Public ones as plain, secrets encrypted.
const WANT = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY",
  "INTERNAL_API_KEY", "ADMIN_EMAILS", "GEMINI_API_KEYS", "GEMINI_PAID_API_KEYS",
  "GEMINI_LIVE_MODEL", "GEMINI_LIVE_API_VERSION", "GEMINI_LIVE_VOICE", "GEMINI_TEXT_MODEL",
];
const vars = WANT.filter((k) => envLocal[k]).map((k) => ({ key: k, value: envLocal[k] }));
vars.push({ key: "ENABLE_EXPERIMENTAL_COREPACK", value: "1" });
const existing = new Set(((await v(`/v10/projects/${project.id}/env`)).body.envs ?? []).map((e) => e.key));
const toCreate = vars.filter((e) => !existing.has(e.key)).map((e) => ({
  ...e,
  type: e.key.startsWith("NEXT_PUBLIC_") || e.key.startsWith("GEMINI_LIVE_") || e.key === "GEMINI_TEXT_MODEL" || e.key === "ENABLE_EXPERIMENTAL_COREPACK" ? "plain" : "encrypted",
  target: ["production", "preview", "development"],
}));
if (toCreate.length) {
  const r = await v(`/v10/projects/${project.id}/env?upsert=true`, { method: "POST", body: JSON.stringify(toCreate) });
  console.log(r.status < 300 ? `✓ env vars set: ${toCreate.map((e) => e.key).join(", ")}` : `env error ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);
} else console.log("= env vars already present");

// 3. deploy main from GitHub
const repoId = project.link?.repoId;
const d = await v("/v13/deployments", {
  method: "POST",
  body: JSON.stringify({
    name: NAME,
    project: project.id,
    target: "production",
    gitSource: repoId ? { type: "github", repoId, ref: "main" } : { type: "github", org: "ecdevbx-bit", repo: "Engconnect", ref: "main" },
  }),
});
if (d.body.id) console.log(`✓ deployment started: ${d.body.id} → https://${d.body.url}`);
else console.log("deploy failed:", d.status, JSON.stringify(d.body.error ?? d.body).slice(0, 400));

// 4. production domains
const dom = await v(`/v9/projects/${project.id}/domains`);
console.log("  domains:", (dom.body.domains ?? []).map((x) => x.name).join(", ") || "(none yet)");

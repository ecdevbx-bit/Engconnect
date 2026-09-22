import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// Wait for Vercel to finish deploying a commit (used after every push).
//   node scripts/wait-deploy.mjs <shortSha>
import fs from "node:fs";
const sha = process.argv[2];
const TEAM = "team_NOcBKdOGJqMLyiXrTYAovMK8";
const token = fs.readFileSync(`${root}/credentials.txt`, "utf8").match(/(vcp_[A-Za-z0-9]+)/)[1];
const v = (p) => fetch(`https://api.vercel.com${p}${p.includes("?") ? "&" : "?"}teamId=${TEAM}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
const t0 = Date.now();
while (Date.now() - t0 < 9 * 60_000) {
  const d = ((await v(`/v6/deployments?projectId=engconnect&limit=5`)).deployments ?? []).find((x) => x.meta?.githubCommitSha?.startsWith(sha));
  if (d) {
    process.stdout.write(`${Math.round((Date.now() - t0) / 1000)}s ${d.state} ${d.target ?? ""} ${d.url}\n`);
    if (d.state === "READY" || d.state === "ERROR" || d.state === "CANCELED") process.exit(d.state === "READY" ? 0 : 1);
  } else process.stdout.write("waiting for deployment to appear\n");
  await new Promise((r) => setTimeout(r, 20_000));
}
console.log("timeout");

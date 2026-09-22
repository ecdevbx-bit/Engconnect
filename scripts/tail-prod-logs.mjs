import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// Stream the production deployment's runtime logs for 4 minutes — how the
// Gemini 503 storm (D-040) was caught. Reproduce the problem while it runs.
//   node scripts/tail-prod-logs.mjs
import fs from "node:fs";

const TEAM = "team_NOcBKdOGJqMLyiXrTYAovMK8";
const token = fs.readFileSync(`${root}/credentials.txt`, "utf8").match(/(vcp_[A-Za-z0-9]+)/)[1];
const H = { Authorization: `Bearer ${token}` };
const q = (p) => `https://api.vercel.com${p}${p.includes("?") ? "&" : "?"}teamId=${TEAM}`;
const proj = await fetch(q("/v9/projects/engconnect"), { headers: H }).then((r) => r.json());
const dep = (await fetch(q(`/v6/deployments?projectId=${proj.id}&target=production&limit=1`), { headers: H }).then((r) => r.json())).deployments[0];
console.log(`tailing ${dep.uid} (${dep.meta?.githubCommitSha?.slice(0, 7)}) for 240s — reproduce now`);
const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 240_000);
try {
  const res = await fetch(q(`/v1/projects/${proj.id}/deployments/${dep.uid}/runtime-logs`), { headers: H, signal: ctrl.signal });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let l;
      try { l = JSON.parse(line); } catch { continue; }
      const status = l.statusCode ?? l.responseStatusCode ?? "";
      const path = l.requestPath ?? l.path ?? "";
      const msg = (l.message ?? l.text ?? "").toString().replace(/\s+/g, " ").slice(0, 300);
      if (!path && !msg) continue;
      if (String(status).startsWith("2") && !msg) continue;
      console.log(`${l.level ?? ""} ${status} ${l.requestMethod ?? ""} ${path} ${msg}`);
    }
  }
} catch (e) { if (e.name !== "AbortError") console.log("stream error:", e.message); }
console.log("done");

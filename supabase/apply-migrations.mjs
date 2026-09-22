// Apply supabase/migrations/*.sql to the hosted project through the Supabase
// Management API (no Docker / DB password needed — just a personal access token).
// Records each file in supabase_migrations.schema_migrations exactly like the
// Supabase CLI does, so `supabase db push` later sees them as applied.
//
// Usage (from repo root):
//   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=xxxx node supabase/apply-migrations.mjs
// Without env vars it reads both from ../credentials.txt (local only, git-ignored).
//   --dry-run   list what would run
//   --sql "..." run one ad-hoc statement and print the result

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function fromCredentials(re) {
  try {
    const m = fs.readFileSync(path.join(root, "credentials.txt"), "utf8").match(re);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

const token = process.env.SUPABASE_ACCESS_TOKEN || fromCredentials(/(sbp_[A-Za-z0-9]+)/);
const ref =
  process.env.SUPABASE_PROJECT_REF || fromCredentials(/https:\/\/([a-z0-9]+)\.supabase\.co/);
if (!token || !ref) {
  console.error("Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (or credentials.txt).");
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 1500)}`);
  return text ? JSON.parse(text) : null;
}

const args = process.argv.slice(2);
if (args[0] === "--sql") {
  console.log(JSON.stringify(await query(args[1]), null, 2));
  process.exit(0);
}

await query(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text
  );`);
const applied = new Set(
  (await query("select version from supabase_migrations.schema_migrations")).map((r) => r.version),
);

const dir = path.join(here, "migrations");
const files = fs.readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
for (const f of files) {
  const version = f.split("_")[0];
  const name = f.replace(/^\d+_/, "").replace(/\.sql$/, "");
  if (applied.has(version)) {
    console.log(`= ${f} (already applied)`);
    continue;
  }
  if (args.includes("--dry-run")) {
    console.log(`would apply ${f}`);
    continue;
  }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  try {
    // One transaction per file: all-or-nothing.
    await query(`begin;\n${sql}\n;\ninsert into supabase_migrations.schema_migrations (version, name, statements)
      values ('${version}', '${name.replace(/'/g, "''")}', array[]::text[]);\ncommit;`);
    console.log(`✓ ${f}`);
  } catch (err) {
    console.error(`✗ ${f}\n${err.message}`);
    try {
      await query("rollback;");
    } catch {
      /* the API runs each call in its own session; nothing to roll back */
    }
    process.exit(1);
  }
}
console.log("done");

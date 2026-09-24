import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// Jumble hint ladder (D-043) with a throwaway Hindi-speaking account:
// structure clue (type, tense, blocks, meaning in Hindi; cached on 2nd call),
// word hints, and "full sentence shown ⇒ half XP" vs a clean solve.
//   node scripts/jumble-hints-probe.mjs [appUrl]
import fs from "node:fs";
const APP = process.argv[2] || "http://localhost:3000";
const env = Object.fromEntries(fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "";
let failures = 0;
const check = (ok, label, extra = "") => { console.log(`${ok ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`); if (!ok) failures++; };
async function api(p, init = {}) {
  const t0 = Date.now();
  const res = await fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, code: body.errorCode, msg: body.message, data: body.data, ms: Date.now() - t0 };
}
try {
  const email = `hints-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  await fetch(`${SB}/rest/v1/profiles?id=eq.${userId}`, { method: "PATCH", headers: admin, body: JSON.stringify({ native_lang: "Hindi" }) });
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;

  const batch = await api("/game/jumble/batch?difficulty=easy");
  const [s1, s2] = batch.data?.sentences ?? [];
  check(batch.status === 200 && s1 && s2, "batch", `${batch.data?.sentences?.length ?? 0} sentences`);

  const clue = await api(`/game/jumble/clue?difficulty=easy&order=${s1.order}`);
  const c = clue.data ?? {};
  check(clue.status === 200 && Array.isArray(c.pattern) && c.pattern.length >= 2, "structure clue", `${clue.ms} ms, source=${c.source}`);
  console.log(`   kind=${c.kind} tense=${c.tense}\n   pattern=${JSON.stringify(c.pattern)}\n   clue=${c.clue}\n   meaning(${c.meaningLang})=${c.meaning}`);
  check(c.source !== "ai" || (c.meaning && c.meaningLang === "Hindi"), "meaning in Hindi");
  const again = await api(`/game/jumble/clue?difficulty=easy&order=${s1.order}`);
  // jsonb reorders keys, so compare field by field.
  const same = again.data && Object.keys(c).every((k) => JSON.stringify(again.data[k]) === JSON.stringify(c[k]));
  check(again.status === 200 && same, "second call returns the cached clue", `${again.ms} ms`);

  const h1 = await api(`/game/jumble/hint?difficulty=easy&order=${s1.order}&level=1`);
  const shown = (h1.data?.words ?? []).filter((w) => w.revealed).length;
  check(h1.status === 200 && shown === 2 && !h1.data.full, "level-1 hint reveals first + last only");
  const full = await api(`/game/jumble/hint?difficulty=easy&order=${s1.order}&level=3`);
  const answer = (full.data?.full ?? "").split(" ");
  check(full.status === 200 && answer.length > 1, "level-3 hint gives the full sentence");
  const sub1 = await api("/game/jumble/submit", { method: "POST", body: JSON.stringify({ difficulty: "easy", order: s1.order, userAnswer: answer }) });
  check(sub1.data?.correct && sub1.data.xpEarned === 5 && sub1.data.hintPenalty === true, "after the full hint: half XP", `xp=${sub1.data?.xpEarned}`);

  // Clean solve of the second sentence (answer fetched with the service key, not a hint).
  const row = await fetch(`${SB}/rest/v1/problems?select=final&category=eq.jumble&difficulty=eq.easy&sort_order=eq.${s2.order}`, { headers: admin }).then((r) => r.json());
  const sub2 = await api("/game/jumble/submit", { method: "POST", body: JSON.stringify({ difficulty: "easy", order: s2.order, userAnswer: row[0].final.trim().split(/\s+/) }) });
  check(sub2.data?.correct && sub2.data.xpEarned === 10 && !sub2.data.hintPenalty, "clean solve: full XP", `xp=${sub2.data?.xpEarned}`);
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);

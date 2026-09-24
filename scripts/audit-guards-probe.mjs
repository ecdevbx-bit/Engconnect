import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// The 2026-09-24 audit fixes (D-045), against the real API with a throwaway account:
//  * a browser claiming "API key not valid" can't mark a shared key invalid,
//    and /end can't either;
//  * an ended K.AI session is not billed any further;
//  * a crafted WAV header is rejected (no hang), silence isn't counted, bad ids → 404.
// Starts ONE real K.AI session (one Gemini Live token).
//   node scripts/audit-guards-probe.mjs [appUrl]
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
  const res = await fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.form ? {} : { "Content-Type": "application/json" }) }, body: init.form ?? init.body });
  const text = await res.text();
  let body = {}; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 80) }; }
  return { status: res.status, code: body.errorCode, msg: body.message, data: body.data, ms: Date.now() - t0 };
}
const rest = (p) => fetch(`${SB}/rest/v1/${p}`, { headers: admin }).then((r) => r.json());
const keyOfSession = async (id) => {
  const [s] = await rest(`chat_sessions?select=lease_id,billed_seconds,status,key_reports&id=eq.${id}`);
  const [l] = s?.lease_id ? await rest(`gemini_key_leases?select=key_id&id=eq.${s.lease_id}`) : [];
  return { session: s, keyId: l?.key_id };
};
const keyInvalid = async (keyId) => (await rest(`gemini_api_keys?select=invalid&id=eq.${keyId}`))[0]?.invalid;

function wav({ channels = 1, rate = 16000, seconds = 1, amp = 0 }) {
  const n = Math.round(rate * seconds), data = n * 2 * Math.max(channels, 1);
  const b = Buffer.alloc(44 + data);
  b.write("RIFF", 0); b.writeUInt32LE(36 + data, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(channels, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2 * Math.max(channels, 1), 28); b.writeUInt16LE(2 * Math.max(channels, 1), 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(data, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(amp * Math.sin(i / 8)), 44 + i * 2);
  return b;
}
const attempt = (buf, order) => {
  const f = new FormData();
  f.append("audio", new Blob([buf], { type: "audio/wav" }), "a.wav");
  f.append("difficulty", "easy"); f.append("order", String(order)); f.append("durationMs", "1000");
  return api("/pronunciation/attempts", { method: "POST", form: f });
};

try {
  const email = `guards-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;

  // ── K.AI: key reports + dead-session billing ──
  const created = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ level: "Beginner" }) });
  check(created.status === 200 && created.data?.sessionID, "K.AI session created", created.code ?? "");
  const id = created.data.sessionID;
  const first = await keyOfSession(id);
  const rc = await api(`/chat/sessions/${id}/reconnect`, { method: "POST", body: JSON.stringify({ keyFailed: true, detail: "API key not valid. Please pass a valid API key.", closeCode: 1008 }) });
  check(rc.status === 200 && rc.data?.live, "reconnect after a claimed key failure moves on", `${rc.status} ${rc.code ?? ""}`);
  check((await keyInvalid(first.keyId)) === false, "the claimed-invalid key is NOT marked invalid (Google still accepts it)");
  const second = await keyOfSession(id);
  check(second.session.key_reports === 1, "the report is counted on the session", `key_reports=${second.session.key_reports}`);

  const end = await api(`/chat/sessions/${id}/end`, { method: "POST", body: JSON.stringify({ outcome: "invalid", detail: "API key not valid", reason: "probe" }) });
  check(end.status === 200, "session ended");
  check((await keyInvalid(second.keyId)) === false, "/end with outcome=invalid does NOT mark the key invalid");
  const billed = (await keyOfSession(id)).session.billed_seconds;
  await new Promise((r) => setTimeout(r, 2500));
  const late = await api(`/chat/sessions/${id}/progress`, { method: "POST", body: JSON.stringify({ speakingSeconds: 999 }) });
  const after = (await keyOfSession(id)).session.billed_seconds;
  check(late.status === 200 && late.data?.sessionActive === false && after === billed, "heartbeat on an ended session bills nothing", `billed ${billed} → ${after}`);
  const bad = await api(`/chat/sessions/not-a-uuid/progress`, { method: "POST", body: "{}" });
  check(bad.status === 404, "non-uuid session id → 404", String(bad.status));
  const esc = await api(`/word-bank/%E0%A4`, { method: "DELETE" });
  // Next.js itself rejects a malformed %-escape before our route runs (HTML 500 on Vercel,
  // 400 in dev) — informational only; nothing of ours can crash on it.
  console.log(`  (info) malformed %-escape → ${esc.status} (answered by Next.js before the API code)`);

  // ── Pronunciation: crafted header, silence ──
  const phrase = await api("/pronunciation/phrases?difficulty=easy");
  const order = phrase.data?.order;
  const crafted = await attempt(wav({ channels: 0 }), order);
  check(crafted.status === 400 && crafted.ms < 5000, "WAV with 0 channels is rejected quickly", `${crafted.status} in ${crafted.ms} ms`);
  const silent = await attempt(wav({ seconds: 2 }), order);
  check(silent.status === 422 && silent.code === "NO_SPEECH", "silent WAV → NO_SPEECH", `${silent.status} ${silent.code}`);
  const [usage] = await rest(`daily_usage?select=used&user_id=eq.${userId}&bucket=eq.pronunciation:easy`);
  check(!usage || usage.used === 0, "rejected takes don't use the free quota", `used=${usage?.used ?? 0}`);
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);

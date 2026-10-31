import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
// Pronunciation retries through the real API (D-067):
//   node scripts/pronunciation-retry-probe.mjs [appUrl]
// A throwaway free learner reads one sentence badly (a word swapped), then well,
// then twice more. Checks: a better retry pays only the extra XP, retries don't
// use another free sentence, 3 tries per sentence per day, the 4th is refused.
// Deletes the user afterwards. Reads keys from local files; prints no secrets.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const env = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const { GoogleGenAI, Modality } = await import(pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const [APP = "http://localhost:3000"] = process.argv.slice(2);
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
// TTS key: from env, else a free key from the pool table (the server's own source).
const geminiKey =
  (env.GEMINI_API_KEYS ?? "").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)[0] ??
  (await fetch(`${SB}/rest/v1/gemini_api_keys?enabled=eq.true&invalid=eq.false&tier=eq.free&select=api_key&limit=1`, { headers: admin }).then((r) => r.json()))[0]?.api_key;
let userId = "", token = "", failed = 0;

const api = (p, init = {}) =>
  fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }) } }).then((r) => r.json());
const check = (ok, label) => { console.log(`${ok ? "✓" : "✗"} ${label}`); if (!ok) failed++; };

function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const ai = new GoogleGenAI({ apiKey: geminiKey });
async function say(text) {
  const r = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ role: "user", parts: [{ text: `Say clearly in an Indian English accent: ${text}` }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
  });
  return Buffer.from(r.candidates[0].content.parts.find((p) => p.inlineData).inlineData.data, "base64");
}

async function attempt(pcm, order) {
  const form = new FormData();
  form.set("audio", new Blob([wav(pcm, 24000)], { type: "audio/wav" }), "attempt.wav");
  form.set("difficulty", "easy");
  form.set("order", String(order));
  form.set("durationMs", String(Math.round((pcm.length / 48000) * 1000)));
  return api("/pronunciation/attempts", { method: "POST", body: form });
}

async function usedToday() {
  const rows = await fetch(`${SB}/rest/v1/daily_usage?user_id=eq.${userId}&bucket=eq.pronunciation:easy&select=used`, { headers: admin }).then((r) => r.json());
  return rows[0]?.used ?? 0;
}

try {
  const email = `pron-retry-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  await api("/session/start", { method: "POST" });

  const phrase = (await api("/pronunciation/phrases?difficulty=easy&sessionOffset=0")).data;
  const words = phrase.sentence.split(/\s+/);
  const li = words.reduce((b, w, i) => (w.replace(/\W/g, "").length > words[b].replace(/\W/g, "").length ? i : b), 0);
  const bad = words.map((w, i) => (i === li ? "banana" : w)).join(" ");
  console.log(`phrase: ${phrase.sentence}\nbad   : ${bad}\n`);
  const [badPcm, goodPcm] = await Promise.all([say(bad), say(phrase.sentence)]);

  const a1 = await attempt(badPcm, phrase.order);
  if (!a1.success) throw new Error(`try 1: ${a1.message}`);
  console.log(`try 1: ${a1.data.accuracyPercent}% · +${a1.data.xpEarned} XP · triesLeft ${a1.data.triesLeft}`);
  check(a1.data.triesLeft === 2, "try 1 → 2 tries left");
  check((await usedToday()) === 1, "try 1 used one free sentence");

  const a2 = await attempt(goodPcm, phrase.order);
  if (!a2.success) throw new Error(`try 2: ${a2.message}`);
  console.log(`try 2: ${a2.data.accuracyPercent}% · +${a2.data.xpEarned} XP · triesLeft ${a2.data.triesLeft}`);
  const best = Math.round(20 * a2.data.accuracy), first = Math.round(20 * a1.data.accuracy);
  check(a2.data.xpEarned === Math.max(0, best - first), `try 2 paid only the improvement (${Math.max(0, best - first)} XP)`);
  check(a2.data.triesLeft === 1, "try 2 → 1 try left");
  check((await usedToday()) === 1, "a retry doesn't use another free sentence");

  const a3 = await attempt(badPcm, phrase.order);
  if (!a3.success) throw new Error(`try 3: ${a3.message}`);
  console.log(`try 3: ${a3.data.accuracyPercent}% · +${a3.data.xpEarned} XP · triesLeft ${a3.data.triesLeft}`);
  check(a3.data.xpEarned === 0 || Math.round(20 * a3.data.accuracy) > Math.max(best, first), "a worse try pays nothing");
  check(a3.data.triesLeft === 0, "try 3 → no tries left");

  const a4 = await attempt(goodPcm, phrase.order);
  console.log(`try 4: ${a4.success ? "accepted" : `${a4.errorCode} · ${a4.message}`}`);
  check(!a4.success && a4.errorCode === "DAILY_QUOTA_REACHED", "try 4 refused");
  check((await usedToday()) === 1, "still one free sentence used");

  const next = await api("/pronunciation/phrases?difficulty=easy&sessionOffset=1");
  check(next.success && next.data.order !== phrase.order, "next sentence is a new one");
} catch (e) {
  console.log("✗", e.message);
  failed++;
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}
console.log(failed ? `\n${failed} check(s) failed` : "\nall ✓");
process.exit(failed ? 1 : 0);

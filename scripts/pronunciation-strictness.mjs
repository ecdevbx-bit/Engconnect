import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// Is the pronunciation scorer honest? Sends four clips through the real API:
// silence, faint noise, a different sentence, and one with phonetic slips.
// Expected: the first two are rejected (NO_SPEECH), the third scores 0%, the
// fourth loses marks. Catches the 2026-09-22 bug where silence scored 100%.
//   node scripts/pronunciation-strictness.mjs [appUrl]
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const APP = process.argv[2] || "http://localhost:3000";
const env = Object.fromEntries(fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const { GoogleGenAI, Modality } = await import(pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const keys = env.GEMINI_API_KEYS.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "";
const api = (p, init = {}) => fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }) } }).then((r) => r.json());
const wav = (pcm, rate) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };
async function tts(text, k) {
  const ai = new GoogleGenAI({ apiKey: keys[k % keys.length] });
  const r = await ai.models.generateContent({ model: "gemini-3.1-flash-tts-preview", contents: [{ role: "user", parts: [{ text: `Read exactly as written, do not correct the spelling: ${text}` }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } } });
  return Buffer.from(r.candidates[0].content.parts.find((p) => p.inlineData).inlineData.data, "base64");
}
try {
  const email = `strict-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  await api("/session/start", { method: "POST" });
  await api("/users/me/onboarding", { method: "POST", body: JSON.stringify({ nativeLang: "Hindi", location: "Pune", currentStatus: "working", englishReason: "career", goals: "x", hobbies: ["Music"] }) });
  await fetch(`${SB}/rest/v1/profiles?id=eq.${userId}`, { method: "PATCH", headers: { ...admin, Prefer: "return=minimal" }, body: JSON.stringify({ premium_until: "2099-01-01T00:00:00Z" }) }); // no quota
  const cases = [
    ["silence", () => Buffer.alloc(16000 * 2 * 3)],
    ["faint noise", () => { const b = Buffer.alloc(16000 * 2 * 3); for (let i = 0; i < b.length; i += 2) b.writeInt16LE(Math.round((Math.random() - 0.5) * 300), i); return b; }],
    ["different sentence", () => tts("I like to play cricket on Sundays.", 1)],
    ["mispronounced", null],
  ];
  for (const [name, make] of cases) {
    const phrase = (await api("/pronunciation/phrases?difficulty=easy&sessionOffset=0")).data;
    let pcm, rate = 16000;
    if (name === "mispronounced") {
      // Typical slips spelled out so TTS really says them: th→t/d, v→w, dropped endings.
      const said = phrase.sentence.replace(/\bth/gi, "t").replace(/v/gi, "w").replace(/(\w{4,})s\b/g, "$1").replace(/\bwh/gi, "w");
      console.log(`   (spoken as: "${said}")`);
      pcm = await tts(said, 2); rate = 24000;
    } else if (name === "different sentence") { pcm = await make(); rate = 24000; }
    else pcm = make();
    const form = new FormData();
    form.set("audio", new Blob([wav(pcm, rate)], { type: "audio/wav" }), "a.wav");
    form.set("difficulty", "easy"); form.set("order", String(phrase.order)); form.set("durationMs", "3000");
    const res = await api("/pronunciation/attempts", { method: "POST", body: form });
    if (!res.success) { console.log(`${name.padEnd(18)} → ${res.errorCode} ${res.message}`); continue; }
    console.log(`${name.padEnd(18)} expected "${phrase.sentence}" → ${res.data.accuracyPercent}% heard "${res.data.transcript}" missed=[${res.data.incorrectWords.join(", ")}]`);
  }
} catch (e) { console.log("✗", e.message); }
finally { if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin }); }

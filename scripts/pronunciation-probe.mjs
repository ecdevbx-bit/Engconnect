import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
// End-to-end pronunciation check through the real API:
//   node scripts/pronunciation-probe.mjs [appUrl] [nativeLang]
//   node scripts/pronunciation-probe.mjs http://localhost:3000 Hindi
// Creates a throwaway learner (native language set), fetches an easy phrase,
// makes a TTS clip that mispronounces/replaces one word, posts it as an attempt
// and prints each word's verdict + syllables + native-script respelling + tip.
// Deletes the user afterwards. Reads keys from local files; prints no secrets.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const env = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const { GoogleGenAI, Modality } = await import(pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const [APP = "http://localhost:3000", NATIVE = "Hindi"] = process.argv.slice(2);
const geminiKey = (env.GEMINI_API_KEYS ?? "").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)[2];
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "";

const api = (p, init = {}) =>
  fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }) } }).then((r) => r.json());

function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

try {
  const email = `pron-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json())).id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  await api("/session/start", { method: "POST" });
  await api("/users/me/onboarding", { method: "POST", body: JSON.stringify({ nativeLang: NATIVE, location: "Pune", currentStatus: "working", englishReason: "career", goals: "Speak clearly", hobbies: ["Music"] }) });

  const phrase = (await api("/pronunciation/phrases?difficulty=medium&sessionOffset=0")).data;
  const words = phrase.sentence.split(/\s+/);
  // Swap the longest word for a different one so there's a definite miss to
  // explain (TTS voices "fix" subtle slips like v→w, so those can't be simulated).
  const li = words.reduce((b, w, i) => (w.replace(/\W/g, "").length > words[b].replace(/\W/g, "").length ? i : b), 0);
  const spoken = words.map((w, i) => (i === li ? "banana" : w)).join(" ");
  console.log(`phrase : ${phrase.sentence}\nspoken : ${spoken}  (native language: ${NATIVE})`);

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const r = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ role: "user", parts: [{ text: `Say clearly in an Indian English accent: ${spoken}` }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
  });
  const pcm = Buffer.from(r.candidates[0].content.parts.find((p) => p.inlineData).inlineData.data, "base64");

  const form = new FormData();
  form.set("audio", new Blob([wav(pcm, 24000)], { type: "audio/wav" }), "attempt.wav");
  form.set("difficulty", "medium");
  form.set("order", String(phrase.order));
  form.set("durationMs", String(Math.round((pcm.length / 48000) * 1000)));
  const res = await api("/pronunciation/attempts", { method: "POST", body: form });
  if (!res.success) throw new Error(res.message);
  console.log(`accuracy ${res.data.accuracyPercent}% · heard "${res.data.transcript}"\n`);
  for (const w of res.data.words) {
    console.log(`${w.status.padEnd(9)} ${w.expected.padEnd(14)} say: ${(w.syllables ?? "—").padEnd(24)} ${NATIVE}: ${(w.native ?? "—").padEnd(20)} ${w.reason ? "· " + w.reason : ""}`);
  }
} catch (e) {
  console.log("✗", e.message);
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}

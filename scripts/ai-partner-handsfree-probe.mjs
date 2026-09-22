import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
// Hands-free K.AI (D-039) against the real API: streams a learner's voice with
// no activity markers (Gemini's own voice detection must end the turn), then
// talks over K.AI to check the interruption arrives.
//   node scripts/ai-partner-handsfree-probe.mjs [appUrl]
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const APP = process.argv[2] || "http://localhost:3000";
const env = Object.fromEntries(fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const { GoogleGenAI, Modality } = await import(pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const keys = env.GEMINI_API_KEYS.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "";
const api = (p, init = {}) => fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }).then((r) => r.json());
async function tts(text, k) {
  const r = await new GoogleGenAI({ apiKey: keys[k] }).models.generateContent({ model: "gemini-3.1-flash-tts-preview", contents: [{ role: "user", parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } } } });
  return Buffer.from(r.candidates[0].content.parts.find((p) => p.inlineData).inlineData.data, "base64"); // 24 kHz PCM
}
try {
  const said1 = await tts("Hi, my name is Ravi. I am work in a bank since two years.", 4);
  const said2 = await tts("Wait, wait, sorry, can you repeat that slowly please?", 5);
  const email = `hf-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Ravi Probe" } }) }).then((r) => r.json())).id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  await api("/session/start", { method: "POST" });
  const s = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: "English", level: "Intermediate", scenario: "General Conversation", voice: "Aoede" }) });
  if (!s.success) throw new Error(s.message);
  const live = s.data.live;
  const ws = new WebSocket(`${live.wsUrl}`);
  const t0 = Date.now(); const ts = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  let turn = 0, heard = "", said = "", audioChunks = 0, interrupted = false;
  const stream = async (pcm) => { // 100 ms chunks in real time, then 2.5 s of silence
    const chunk = 4800;
    for (let i = 0; i < pcm.length; i += chunk) { ws.send(JSON.stringify({ realtimeInput: { audio: { mimeType: "audio/pcm;rate=24000", data: pcm.subarray(i, i + chunk).toString("base64") } } })); await new Promise((r) => setTimeout(r, 100)); }
    const silence = Buffer.alloc(chunk);
    for (let i = 0; i < 25; i++) { ws.send(JSON.stringify({ realtimeInput: { audio: { mimeType: "audio/pcm;rate=24000", data: silence.toString("base64") } } })); await new Promise((r) => setTimeout(r, 100)); }
  };
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 80_000);
    ws.onopen = () => ws.send(JSON.stringify({ setup: { model: live.model, sessionResumption: {} } }));
    ws.onmessage = async (ev) => {
      const m = JSON.parse(typeof ev.data === "string" ? ev.data : await ev.data.text());
      if (m.setupComplete) ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: live.kickoff }] }], turnComplete: true } }));
      const sc = m.serverContent; if (!sc) return;
      if (sc.inputTranscription?.text) heard += sc.inputTranscription.text;
      if (sc.outputTranscription?.text) said += sc.outputTranscription.text;
      if (sc.modelTurn?.parts?.some((p) => p.inlineData)) {
        audioChunks++;
        // Barge-in test: on turn 2, talk over K.AI once it has started answering.
        if (turn === 1 && heard && audioChunks === 6 && !interrupted) { console.log(`${ts()} → learner talks over K.AI`); stream(said2); }
      }
      if (sc.interrupted) { interrupted = true; console.log(`${ts()} ✓ interrupted — K.AI stopped (had said: "${said.trim().slice(0, 60)}…")`); said = ""; }
      if (sc.turnComplete) {
        console.log(`${ts()} K.AI: "${said.trim()}"${heard ? `  [heard learner: "${heard.trim()}"]` : ""}`);
        said = ""; heard = ""; audioChunks = 0; turn++;
        if (turn === 1) { console.log(`${ts()} → learner speaks (no tap, continuous audio)`); stream(said1); }
        else if (turn === 2) { /* K.AI answering the learner — barge-in happens above */ }
        else if (turn >= 3 || (turn >= 2 && interrupted)) { clearTimeout(timer); resolve(); }
      }
    };
    ws.onclose = (ev) => { console.log(`${ts()} closed ${ev.code} ${ev.reason}`); clearTimeout(timer); resolve(); };
  });
  try { ws.close(); } catch {}
  await api(`/chat/sessions/${s.data.sessionID}/end`, { method: "POST", body: "{}" });
} catch (e) { console.log("✗", e.message); }
finally { if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin }); }

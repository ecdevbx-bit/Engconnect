import { fileURLToPath } from "node:url";
import path from "node:path";
// Talk to K.AI through the real API and print what it says — checks that the
// level + practice-mode instruction files (server/gemini/instructions/*) work.
//   node scripts/ai-partner-probe.mjs [appUrl] [level] [scenario] [language]
//   node scripts/ai-partner-probe.mjs http://localhost:3000 Beginner "IELTS Speaking" Hindi
// Creates a throwaway user, starts a session (server builds + locks the prompt
// into a Gemini token), sends the kickoff and two learner turns as text, prints
// K.AI's spoken replies (output transcription), ends the session, deletes the user.
// Reads keys from frontend/.env.local; prints no secrets.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const env = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const [APP = "http://localhost:3000", LEVEL = "Beginner", SCENARIO = "General Conversation", LANGUAGE = "English"] = process.argv.slice(2);
const LEARNER_TURNS = [
  "My name is Ravi. I am from Pune. I am work in a bank since two years.",
  "Yesterday I go to market and buyed vegetables for my mother.",
];
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
let userId = "", token = "";

async function api(p, init = {}) {
  const res = await fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  return res.json().catch(() => ({}));
}

// One Gemini Live conversation: kickoff + learner turns, collect K.AI's transcript per turn.
function converse(live) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${live.wsUrl}?access_token=${encodeURIComponent(live.token)}`);
    const replies = [];
    let current = "", turn = 0;
    const done = () => { try { ws.close(); } catch {} resolve(replies); };
    const timer = setTimeout(done, 90_000);
    const sendText = (text) => ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } }));
    ws.onopen = () => ws.send(JSON.stringify({ setup: { model: live.model.startsWith("models/") ? live.model : `models/${live.model}`, sessionResumption: {} } }));
    ws.onmessage = async (ev) => {
      const m = JSON.parse(typeof ev.data === "string" ? ev.data : await ev.data.text());
      if (m.setupComplete) sendText(live.kickoff);
      const sc = m.serverContent;
      if (sc?.outputTranscription?.text) current += sc.outputTranscription.text;
      if (sc?.turnComplete) {
        replies.push(current.trim());
        current = "";
        if (turn < LEARNER_TURNS.length) {
          console.log(`\n  learner: ${LEARNER_TURNS[turn]}`);
          sendText(LEARNER_TURNS[turn++]);
        } else { clearTimeout(timer); done(); }
      }
    };
    ws.onclose = (ev) => { if (ev.code !== 1000 && ev.code !== 1005) console.log(`  socket closed ${ev.code} ${ev.reason}`); clearTimeout(timer); resolve(replies); };
  });
}

try {
  const email = `probe-${Date.now()}@example.com`, password = "Probe1234test";
  const u = await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Ravi Probe" } }) }).then((r) => r.json());
  userId = u.id;
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  await api("/session/start", { method: "POST" });

  const s = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: LANGUAGE, level: LEVEL, scenario: SCENARIO, voice: "Sulafat" }) });
  if (!s.success) throw new Error(`session: ${s.message}`);
  console.log(`session ${s.data.sessionID} · ${s.data.language} · ${s.data.level} · ${s.data.scenario} · ${s.data.live.model}`);
  console.log(`kickoff: ${s.data.live.kickoff}`);
  const replies = await converse(s.data.live);
  replies.forEach((r, i) => console.log(`${i === 0 ? "\n  K.AI (greeting)" : "  K.AI"}: ${r} [${r.split(/\s+/).filter(Boolean).length} words]`));
  await api(`/chat/sessions/${s.data.sessionID}/end`, { method: "POST", body: "{}" });
} catch (e) {
  console.log("✗", e.message);
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}

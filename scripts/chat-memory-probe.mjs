import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
// K.AI history + memory (D-047), end to end with a throwaway PRO learner:
//  1. two finished conversations are written straight into the database (one short
//     interview chat, one long trip chat that must be split into chunks);
//  2. opening History triggers the catch-up digest → titles, summaries, corrections,
//     chunk rows, and a compacted Markdown memory file;
//  3. a REAL K.AI session is asked "what do you remember about me?" — the reply must
//     use the memory (proves the file reaches Gemini);
//  4. "Continue this conversation" links the new session to the old one;
//  5. as a free learner: history is locked, memory can still be cleared, chats deleted.
// Starts two real K.AI sessions. Reads keys from frontend/.env.local; prints no secrets.
//   node scripts/chat-memory-probe.mjs [appUrl]
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const APP = process.argv[2] || "http://localhost:3000";
const env = Object.fromEntries(fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const admin = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", Prefer: "return=representation" };
let userId = "", token = "", failures = 0;
const check = (ok, label, extra = "") => { console.log(`${ok ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`); if (!ok) failures++; };
const rest = (p, init = {}) => fetch(`${SB}/rest/v1/${p}`, { ...init, headers: admin }).then((r) => r.json());
async function api(p, init = {}) {
  const res = await fetch(`${APP}/api${p}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, code: body.errorCode, msg: body.message, data: body.data };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function seedConversation({ minutesAgo, scenario, lines }) {
  const started = new Date(Date.now() - minutesAgo * 60_000);
  const [s] = await rest("chat_sessions", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, status: "ended", started_at: started.toISOString(), ended_at: new Date(started.getTime() + 7 * 60_000).toISOString(), billed_seconds: 420, scenario, language: "English", level: "Intermediate", turns: lines.length, end_reason: "probe" }),
  });
  await rest("chat_messages", { method: "POST", body: JSON.stringify(lines.map(([role, body]) => ({ session_id: s.id, user_id: userId, role, body }))) });
  return s.id;
}

const INTERVIEW = [
  ["assistant", "Hi Priya! What would you like to practise today?"],
  ["user", "Hi K.AI. I am working in Infosys in Pune since 2019 as a support engineer."],
  ["assistant", "Nice! Small fix: say 'I have been working at Infosys since 2019.' What's coming up for you?"],
  ["user", "I have a interview at TCS next Monday for a data analyst role. I am very nervous."],
  ["assistant", "Exciting! It's 'an interview'. Let's practise. Tell me about yourself."],
  ["user", "I have went to Pune University and I did my B.Com there. Then I joined Infosys."],
  ["assistant", "Say 'I went to Pune University'. Why do you want to be a data analyst?"],
  ["user", "Because I like Excel and SQL. In my team we discuss about the reports every week."],
  ["assistant", "Good reason! 'We discuss the reports' — no 'about'. What is one strength of yours?"],
  ["user", "My strength is I am very patient with customers and I solve their problems fastly."],
  ["assistant", "Great strength. Use 'quickly', not 'fastly'. Let's do the STAR method next time."],
  ["user", "Okay, thank you so much K.AI. I will practise STAR answers before Monday."],
];

const PLACES = ["Baga beach", "Fort Aguada", "the spice farm", "Old Goa churches", "Dudhsagar falls", "Anjuna market", "a cashew factory", "Panjim's Latin quarter"];
const TRIP = [];
for (let i = 0; i < 60; i++) {
  const place = PLACES[i % PLACES.length];
  TRIP.push(["user", i % 3 === 0
    ? `We are planning to going to ${place} with my parents and my little brother Arjun on day ${1 + (i % 5)} of the trip in December.`
    : `I think ${place} will be very beautiful, my mother want to see it because she saw photos on Instagram last year.`]);
  TRIP.push(["assistant", i % 3 === 0
    ? `Lovely plan! Say 'We are planning to go to ${place}'. What will you do there with Arjun?`
    : `Nice — 'my mother wants to see it'. What else is on your list after ${place}?`]);
}

try {
  const email = `memory-${Date.now()}@example.com`, password = "Probe1234test";
  userId = (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Priya Probe" } }) }).then((r) => r.json())).id;
  await rest(`profiles?id=eq.${userId}`, { method: "PATCH", body: JSON.stringify({ name: "Priya Probe", native_lang: "Hindi", premium_until: new Date(Date.now() + 7 * 86_400_000).toISOString() }) });
  token = (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json())).access_token;
  await api("/session/start", { method: "POST" });

  // 1. two finished conversations
  const A = await seedConversation({ minutesAgo: 180, scenario: "Job Interview", lines: INTERVIEW });
  const B = await seedConversation({ minutesAgo: 60, scenario: "Travel", lines: TRIP });
  console.log(`seeded: interview chat (${INTERVIEW.length} lines), trip chat (${TRIP.length} lines, ${TRIP.map((l) => l[1]).join(" ").length} chars)`);

  // 2. History → catch-up digest
  let page = await api("/chat/history");
  check(page.status === 200 && page.data?.locked === false && page.data.sessions.length === 2, "Pro history lists both chats", `${page.data?.sessions?.map((s) => s.digest).join(", ")}`);
  const t0 = Date.now();
  while (Date.now() - t0 < 150_000) {
    await sleep(6000);
    page = await api("/chat/history");
    if (page.data?.sessions?.every((s) => s.digest === "ready")) break;
    if (Date.now() - t0 > 70_000 && page.data?.sessions?.some((s) => s.digest === "pending")) await api("/chat/history"); // nudge another catch-up
  }
  const byId = Object.fromEntries((page.data?.sessions ?? []).map((s) => [s.id, s]));
  check(byId[A]?.digest === "ready" && byId[B]?.digest === "ready", "both chats digested", `${Math.round((Date.now() - t0) / 1000)} s`);
  console.log(`   A: "${byId[A]?.title}" — ${byId[A]?.summary}\n   B: "${byId[B]?.title}" — ${byId[B]?.summary}`);

  const chunks = await rest(`chat_session_chunks?select=idx&session_id=eq.${B}`);
  check(Array.isArray(chunks) && chunks.length >= 2, "long chat was split into chunks", `${chunks.length} chunks`);

  const detail = await api(`/chat/history/${A}`);
  const corrections = detail.data?.digest?.mistakes ?? [];
  check(detail.status === 200 && detail.data.messages.length === INTERVIEW.length && corrections.length > 0, "transcript + corrections for the interview chat", `${corrections.length} corrections`);
  corrections.slice(0, 4).forEach((m) => console.log(`   ✗ ${m.wrong}  →  ✓ ${m.correct}`));

  const mem = await api("/chat/memory");
  const md = mem.data?.memoryMd ?? "";
  check(mem.data?.pro && md.includes("##") && /TCS|interview/i.test(md) && /Goa|trip/i.test(md) && mem.data.sessions === 2, "memory file covers both chats (and counts both)", `${md.length} chars, ${mem.data?.sessions} conversations`);
  console.log(md.split("\n").map((l) => `   │ ${l}`).join("\n"));

  // 3. a real K.AI session must use the memory
  const s = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: "English", level: "Intermediate", scenario: "General Conversation", voice: "Charon" }) });
  check(s.status === 200, "new K.AI session", s.code ?? "");
  if (s.status === 200) {
    const replies = await converse(s.data.live, ["Before we start — do you remember what I told you about my job and my plans?"]);
    console.log(`   K.AI greeting: ${replies[0]}\n   K.AI answer:   ${replies[1]}`);
    check(/TCS|Infosys|interview|Goa|Arjun|analyst/i.test(replies.join(" ")), "K.AI remembers (mentions the interview / job / trip)");
    await api(`/chat/sessions/${s.data.sessionID}/end`, { method: "POST", body: "{}" });
  }

  // 4. continue a past conversation
  const c = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: "English", level: "Intermediate", scenario: "Job Interview", continueFrom: A }) });
  const [row] = c.status === 200 ? await rest(`chat_sessions?select=continued_from&id=eq.${c.data.sessionID}`) : [{}];
  check(c.status === 200 && row.continued_from === A && /pick up/i.test(c.data.live.kickoff), "continue links the new session to the old chat", (c.data?.live?.kickoff ?? c.code ?? "").slice(0, 120));
  if (c.status === 200) await api(`/chat/sessions/${c.data.sessionID}/end`, { method: "POST", body: "{}" });

  // 5. as a free learner
  await rest(`profiles?id=eq.${userId}`, { method: "PATCH", body: JSON.stringify({ premium_until: null }) });
  const lockedPage = await api("/chat/history");
  check(lockedPage.data?.locked === true && lockedPage.data.total >= 2 && lockedPage.data.sessions.length === 0, "free: history locked, count shown", `total=${lockedPage.data?.total}`);
  const lockedDetail = await api(`/chat/history/${A}`);
  check(lockedDetail.status === 403 && lockedDetail.code === "PRO_REQUIRED", "free: transcript needs Pro");
  const cleared = await api("/chat/memory", { method: "DELETE" });
  const after = await api("/chat/memory");
  check(cleared.status === 200 && after.data?.memoryMd === "" && after.data?.sessions === 0, "memory can be cleared by anyone");
  const del = await api(`/chat/history/${B}`, { method: "DELETE" });
  const gone = await rest(`chat_sessions?select=id&id=eq.${B}`);
  check(del.status === 200 && gone.length === 0, "a chat can be deleted (with its transcript and chunks)");
} catch (e) {
  console.log("✗", e.message);
  failures++;
} finally {
  if (userId) await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: admin });
}
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);

// One Gemini Live conversation over the locked token: kickoff, then text turns.
function converse(live, turns) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${live.wsUrl}?access_token=${encodeURIComponent(live.token)}`);
    const replies = [];
    let current = "", turn = 0;
    const finish = () => { try { ws.close(); } catch {} resolve(replies); };
    const timer = setTimeout(finish, 90_000);
    const send = (text) => ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } }));
    ws.onopen = () => ws.send(JSON.stringify({ setup: { model: live.model.startsWith("models/") ? live.model : `models/${live.model}`, sessionResumption: {} } }));
    ws.onmessage = async (ev) => {
      const m = JSON.parse(typeof ev.data === "string" ? ev.data : await ev.data.text());
      if (m.setupComplete) send(live.kickoff);
      const sc = m.serverContent;
      if (sc?.outputTranscription?.text) current += sc.outputTranscription.text;
      if (sc?.turnComplete) {
        replies.push(current.trim());
        current = "";
        if (turn < turns.length) send(turns[turn++]);
        else { clearTimeout(timer); finish(); }
      }
    };
    ws.onclose = () => { clearTimeout(timer); resolve(replies); };
  });
}

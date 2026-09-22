import { fileURLToPath } from "node:url";
import path from "node:path";
// End-to-end smoke test (the one used before every "done").
//   node scripts/smoke-test.mjs                                  # local (http://localhost:3000)
//   node scripts/smoke-test.mjs https://engconnect-beta.vercel.app  # production
// Creates a throwaway confirmed user, signs in with a password, exercises the
// whole API (jumble, pronunciation, word bank, leaderboard, AI Partner incl.
// setup options, support ticket → Resend email), then deletes the user.
// Reads keys from frontend/.env.local. Prints statuses only — never secrets.
import fs from "node:fs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const env = Object.fromEntries(
  fs.readFileSync(`${root}/frontend/.env.local`, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL, PUB = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SECRET = env.SUPABASE_SECRET_KEY;
const APP = process.argv[2] || "http://localhost:3000";
const email = `smoke-${Date.now()}@example.com`, password = "Smoke1234test";
let userId = "", token = "";
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "✓" : "✗"} ${name}${extra ? " — " + extra : ""}`); };

async function api(path, init = {}) {
  const res = await fetch(`${APP}/api${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

try {
  // 1. create confirmed user (admin API)
  let r = await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Smoke Tester" } }) });
  const u = await r.json(); userId = u.id; check("create test user", r.ok && !!userId);

  // 2. password sign-in (same call the browser makes)
  r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const s = await r.json(); token = s.access_token; check("password sign-in", r.ok && !!token);

  let x = await api("/session/start", { method: "POST" }); check("POST /session/start", x.body.success, `name=${x.body.data?.user?.name}`);
  x = await api("/session"); check("GET /session", x.body.success && x.body.data.user.sub === userId);
  x = await api("/users/me"); check("GET /users/me (profile from trigger)", x.body.success && x.body.data.email === email);
  x = await api("/users/me/onboarding", { method: "POST", body: JSON.stringify({ nativeLang: "Hindi", location: "Pune", currentStatus: "working", englishReason: "career", goals: "Interviews", hobbies: ["Cricket", "Movies"] }) });
  check("POST /users/me/onboarding", x.body.success && x.body.data.onboardingCompleted === true);
  x = await api("/users/me/badges"); check("onboarding badge granted", x.body.success && x.body.data.includes("onboarding:1"));
  x = await api("/flags"); check("GET /flags", x.body.success && x.body.data["englishconnection-ai-partner"] === true);
  x = await api("/levels"); check("GET /levels", x.body.success && x.body.data.length === 10);

  // Jumble: batch → hint → wrong → right
  x = await api("/game/jumble/batch?difficulty=easy"); const s0 = x.body.data?.sentences?.[0];
  check("GET /game/jumble/batch", x.body.success && x.body.data.sentences.length === 6, `first tiles: ${s0?.shuffledWords?.join(" ")}`);
  x = await api(`/game/jumble/hint?order=${s0.order}&difficulty=easy&level=3`); const full = x.body.data?.full;
  check("GET /game/jumble/hint level 3", x.body.success && !!full);
  x = await api("/game/jumble/submit", { method: "POST", body: JSON.stringify({ order: s0.order, difficulty: "easy", userAnswer: [...full.split(" ")].reverse() }) });
  check("submit wrong answer", x.body.success && x.body.data.correct === false && x.body.data.combo === 0);
  x = await api("/game/jumble/submit", { method: "POST", body: JSON.stringify({ order: s0.order, difficulty: "easy", userAnswer: full.split(" ") }) });
  check("submit right answer", x.body.success && x.body.data.correct && x.body.data.xpEarned === 10, `xp=${x.body.data?.totalXp} combo=${x.body.data?.combo}`);
  x = await api("/game/jumble/submit", { method: "POST", body: JSON.stringify({ order: s0.order, difficulty: "easy", userAnswer: full.split(" ") }) });
  check("replay pays no XP (once/day)", x.body.success && x.body.data.xpEarned === 0);
  x = await api("/game/jumble/batch?difficulty=easy"); check("cursor advanced past solved", x.body.data?.sentences?.[0]?.order !== s0.order);

  // Progressive
  x = await api("/game/jumble/batch?difficulty=progressive"); const p0 = x.body.data?.sentences?.[0];
  check("progressive batch has base/level", x.body.success && p0?.progressiveBase === 1 && p0?.progressiveLevel === 1);

  // Pronunciation phrase + word bank + leaderboard + attributes
  x = await api("/pronunciation/phrases?difficulty=easy&sessionOffset=0"); check("GET /pronunciation/phrases", x.body.success && !!x.body.data.sentence, x.body.data?.sentence);
  x = await api("/word-bank/", { method: "POST", body: JSON.stringify({ word: "Vegetable!", source: "manual" }) });
  check("POST /word-bank/ normalises", x.body.success && x.body.data.word.word === "vegetable" && x.body.data.added);
  x = await api("/word-bank/", { method: "POST", body: JSON.stringify({ word: "vegetable" }) }); check("duplicate word → added:false", x.body.success && x.body.data.added === false);
  x = await api("/leaderboard?mode=xp&meRadius=2&top=5"); check("GET /leaderboard", x.body.success && x.body.data.me?.rank >= 1);
  x = await api("/users/me/attributes"); check("GET /users/me/attributes", x.body.success && x.body.data.xp === 10 && x.body.data.activityStreak === 1, `xp=${x.body.data?.xp} streak=${x.body.data?.activityStreak}`);

  // AI Partner: usage → create session (mints a real Gemini token) → progress → end
  x = await api("/chat/usage"); check("GET /chat/usage", x.body.success && x.body.data.capSeconds === 1200, `cap=${x.body.data?.capSeconds}s`);
  x = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: "Hindi" }) });
  const sess = x.body.data; check("POST /chat/sessions (Gemini token minted)", x.body.success && sess?.live?.token?.startsWith("auth_tokens/"), `model=${sess?.live?.model}`);
  if (sess) {
    x = await api(`/chat/sessions/${sess.sessionID}/progress`, { method: "POST", body: JSON.stringify({ speakingSeconds: 5, turns: [{ role: "user", text: "Hello I am from Pune" }, { role: "assistant", text: "Welcome!" }] }) });
    check("POST progress", x.body.success && x.body.data.sessionActive === true);
    x = await api(`/chat/sessions/${sess.sessionID}/end`, { method: "POST", body: JSON.stringify({ speakingSeconds: 5, turns: [] }) });
    check("POST end (releases key)", x.body.success && x.body.data.ended === true);
  }

  // AI Partner setup options (D-026): chosen options echoed; bad voice falls back
  x = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: "Tamil", level: "Advanced", scenario: "Job Interview", voice: "Sulafat" }) });
  check("session with Tamil / Job Interview / Sulafat", x.body.success && x.body.data.language === "Tamil" && x.body.data.scenario === "Job Interview" && x.body.data.voice === "Sulafat" && x.body.data.live?.token?.startsWith("auth_tokens/"), `kickoff: ${(x.body.data?.live?.kickoff||"").slice(0,60)}…`);
  if (x.body.data) await api(`/chat/sessions/${x.body.data.sessionID}/end`, { method: "POST", body: "{}" });
  x = await api("/chat/sessions", { method: "POST", body: JSON.stringify({ language: "Klingon", scenario: "Hacking", voice: "NotAVoice" }) });
  check("invalid options fall back safely", x.body.success && x.body.data.language === "English" && x.body.data.voice === "Aoede" && x.body.data.scenario === "General Conversation");
  if (x.body.data) await api(`/chat/sessions/${x.body.data.sessionID}/end`, { method: "POST", body: "{}" });

  // Support ticket (D-029) — emails the team once
  x = await api("/support", { method: "POST", body: JSON.stringify({ category: "bug", message: "smoke test — automated check of the support panel, please ignore", page: "/smoke-test" }) });
  check("POST /support (signed in)", x.body.success && x.body.data.ticketId > 0, `ticket #${x.body.data?.ticketId}`);
  global.__ticket = x.body.data?.ticketId;

  // Security: no token / bad token / admin route
  let raw = await fetch(`${APP}/api/users/me`); check("no token → 401 JSON", raw.status === 401 && (await raw.json()).errorCode === "UNAUTHORIZED");
  x = await api("/admin/levels"); check("non-admin blocked from /admin", x.status === 403);
  // Account email limits (uses a fake address; Supabase may reject sending, that's fine)
  raw = await fetch(`${APP}/api/account/reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "not-an-email" }) });
  check("reset validates email", raw.status === 400);
} catch (e) {
  console.log("✗ crashed:", e.message);
  results.push(false);
} finally {
  if (global.__ticket) {
    await new Promise((r) => setTimeout(r, 6000)); // email is sent after the response
    const t = await fetch(`${SB}/rest/v1/support_tickets?id=eq.${global.__ticket}&select=emailed,email_error`, { headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` } }).then((r) => r.json());
    check("support email sent via Resend", t[0]?.emailed === true, t[0]?.email_error || "delivered to Resend");
    await fetch(`${SB}/rest/v1/support_tickets?id=eq.${global.__ticket}`, { method: "PATCH", headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: "resolved" }) });
  }
  if (userId) {
    const d = await fetch(`${SB}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` } });
    console.log(d.ok ? "✓ test user deleted" : `✗ could not delete test user ${userId}`);
  }
  console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
}

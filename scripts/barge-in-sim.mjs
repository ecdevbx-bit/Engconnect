// Barge-in simulation (D-066): node scripts/barge-in-sim.mjs [SEED=n]. Real speech shape: loudness rises and falls with each
// syllable (~4 per second, 15–20 dB between peak and dip) and drops between words.
// Mirrors the current gate in useGeminiLiveSession.ts (D-062) and the learned
// voice level from micPcmStream.ts, then tries a candidate fix.
const FRAME = 8;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Speech envelope in RMS for a talker whose typical syllable peak is `peak`.
function speech(ms, peak) {
  const out = [];
  let t = 0;
  while (t < ms) {
    // a word: 2–3 syllables of 180–260 ms, then a 60–150 ms gap
    const syl = 2 + Math.floor(rnd() * 2);
    for (let s = 0; s < syl && t < ms; s++) {
      const len = 180 + rnd() * 80, p = peak * (0.6 + rnd() * 0.6);
      for (let x = 0; x < len && t < ms; x += FRAME, t += FRAME) {
        const shape = Math.sin(Math.PI * (x / len)) ** 2; // 0 → 1 → 0
        out.push(p * (0.12 + 0.88 * shape) * (0.85 + rnd() * 0.3));
      }
    }
    const gap = 60 + rnd() * 90;
    for (let x = 0; x < gap && t < ms; x += FRAME, t += FRAME) out.push(peak * 0.03);
  }
  return out;
}
const flat = (ms, lvl) => Array.from({ length: Math.round(ms / FRAME) }, () => lvl * (0.7 + rnd() * 0.6));
const mixRms = (a, b) => a.map((x, i) => Math.sqrt(x * x + (b[i] ?? 0) ** 2));

// micPcmStream: voice level learnt while the learner talks with K.AI silent.
function learnVoice(frames) {
  let voice = 0, noise = 0.006, above = 0, openUntil = -1, clock = 0;
  for (const rms of frames) {
    clock += FRAME;
    const thr = Math.min(0.05, Math.max(0.012, noise * 3, voice * 0.25));
    if (rms > thr) { above += FRAME; if (above >= 24) openUntil = clock + 450; } else above = 0;
    const open = clock <= openUntil;
    if (open && rms > thr) voice += (rms - voice) * (rms > voice ? 0.02 : FRAME / 4000);
    else if (!open) noise = Math.max(0.002, noise + (rms - noise) * (rms < noise ? 0.2 : FRAME / 5000));
  }
  return voice;
}

// Current gate (D-062).
function currentGate(voice) {
  let ms = 0, echo = 0.03;
  return (rms) => {
    const thr = Math.max(0.015, Math.min(echo * 2.5, voice * 0.8), voice * 0.4);
    if (rms > thr) ms += FRAME;
    else { ms = Math.max(0, ms - FRAME * 2); echo += (rms - echo) * (rms > echo ? FRAME / 1500 : 0.05); }
    if (ms >= 200) { ms = 0; return true; }
    return false;
  };
}

// Candidate: a speech-shaped detector. Counts voiced frames in a sliding 400 ms
// window (dips between syllables don't reset it); the echo estimate only rises
// slowly (5 s) and its bar is capped lower so the learner's own voice can't push
// it up past them.
function candidateGate(voice, { need = 160, win = 400, share = 0.22, cap = 0.5, ratio = 2.5, rise = 5000 } = {}) {
  let echo = 0.03;
  const hist = [];
  return (rms) => {
    const thr = Math.max(floor ?? 0.012, Math.min(echo * ratio, voice * cap), voice * share);
    const hit = rms > thr;
    hist.push(hit);
    if (hist.length > win / FRAME) hist.shift();
    if (!hit) echo += (rms - echo) * (rms > echo ? FRAME / rise : 0.05);
    const voicedMs = hist.filter(Boolean).length * FRAME;
    if (voicedMs >= need) { hist.length = 0; return true; }
    return false;
  };
}

function candidate2(voice, { need = 150, win = 400, share = 0.2, cap = 0.8, ratio = 1.6, start = 0.02, floor } = {}) {
  let echo = start;
  const hist = [];
  return (rms) => {
    const thr = Math.max(floor ?? 0.012, Math.min(echo * ratio, voice * cap), voice * share);
    const hit = rms > thr;
    hist.push(hit);
    if (hist.length > win / FRAME) hist.shift();
    // Follow the echo's peaks: up in ~160 ms, down over ~1.5 s.
    if (!hit) echo += (rms - echo) * (rms > echo ? 0.05 : FRAME / 1500);
    if (hist.filter(Boolean).length * FRAME >= need) { hist.length = 0; return true; }
    return false;
  };
}

const CANDS = JSON.parse(process.env.CANDS || '[["now",{}]]');
// Literal port of the shipped gate (useGeminiLiveSession.ts, D-066).
function shipped(voice) {
  const MIN = 0.008, RATIO = 1.6, CAP = 99, SHARE = 0.2, NEED = 180, WIN = 450, RISE = 160, FALL = 1500;
  let echo = 0.02;
  const frames = [];
  return (rms) => {
    const frameMs = FRAME;
    const over = rms > Math.max(MIN, Math.min(echo * RATIO, voice * CAP), voice * SHARE);
    if (!over) echo += (rms - echo) * Math.min(1, frameMs / (rms > echo ? RISE : FALL));
    frames.push([frameMs, over]);
    let span = 0, voiced = 0;
    for (let i = frames.length - 1; i >= 0; i--) {
      span += frames[i][0];
      if (span > WIN) { frames.splice(0, i + 1); break; }
      if (frames[i][1]) voiced += frames[i][0];
    }
    if (voiced < NEED) return false;
    frames.length = 0;
    return true;
  };
}
function either(voice) { const a = shipped(voice), b = currentGate(voice); return (rms) => { const x = a(rms), y = b(rms); return x || y; }; }
function run(label, { peak, echo, aec = 1, trace }) {
  seed = Number(process.env.SEED || 11);
  const voice = learnVoice(speech(6000, peak));
  const frames = [];
  let speechStart = null;
  for (const [kind, ms, a] of trace) {
    if (kind === "talk" && speechStart === null) speechStart = frames.length * FRAME;
    const part = kind === "talk" ? speech(ms, peak * aec) : kind === "burst" ? flat(ms, a) : flat(ms, 0);
    frames.push(...part);
  }
  const saved = seed; seed = 97;
  const echoFrames = echo > 0 ? speech(frames.length * FRAME, echo) : [];
  seed = saved;
  const withEcho = mixRms(frames, echoFrames);
  const res = [];
  for (const [name, make] of [["D-062", () => currentGate(voice)], ["D-066", () => either(voice)]]) {
    const g = make();
    let hit = null;
    withEcho.forEach((rms, i) => { if (hit === null && g(rms)) hit = i * FRAME; });
    res.push(`${name}: ${hit === null ? "BLOCKED" : speechStart !== null ? `+${hit - speechStart} ms` : `false barge-in at ${hit} ms`}`);
  }
  console.log(`${label.padEnd(58)} voice ${voice.toFixed(3)} | ${res.join(" | ")}`);
}

const talk = [["quiet", 3000], ["talk", 2000]];
console.log("— learner talks over K.AI (expected: barge-in within ~0.3 s)");
run("normal mic, good echo cancelling", { peak: 0.06, echo: 0.006, trace: talk });
run("quiet mic, good echo cancelling", { peak: 0.025, echo: 0.004, trace: talk });
run("normal mic, phone ducks the learner 6 dB while K.AI plays", { peak: 0.06, echo: 0.006, aec: 0.5, trace: talk });
run("normal mic, phone ducks the learner 10 dB", { peak: 0.06, echo: 0.006, aec: 0.32, trace: talk });
run("quiet mic, ducks 6 dB", { peak: 0.025, echo: 0.004, aec: 0.5, trace: talk });
run("speakers, weak echo cancelling (echo peaks 0.03)", { peak: 0.06, echo: 0.03, trace: talk });
run("speakers, weak echo cancelling, learner a bit softer", { peak: 0.06, echo: 0.03, aec: 0.7, trace: talk });
console.log("— no learner (expected: BLOCKED / no barge-in)");
run("echo only, weak cancelling (echo peaks 0.03), 8 s", { peak: 0.06, echo: 0.03, trace: [["quiet", 8000]] });
run("echo only, very weak cancelling (echo peaks 0.05), 8 s", { peak: 0.06, echo: 0.05, trace: [["quiet", 8000]] });
run("cough 150 ms", { peak: 0.06, echo: 0.006, trace: [["quiet", 2000], ["burst", 150, 0.12], ["quiet", 2000]] });
run('"mm" 150 ms', { peak: 0.06, echo: 0.006, trace: [["quiet", 2000], ["burst", 150, 0.04], ["quiet", 2000]] });
run("two knocks 80 ms apart", { peak: 0.06, echo: 0.006, trace: [["quiet", 2000], ["burst", 60, 0.15], ["quiet", 80], ["burst", 60, 0.15], ["quiet", 2000]] });
run("headphones (no echo)", { peak: 0.04, echo: 0, trace: talk });
run("speakers, echo peaks 0.03, learner talks normally", { peak: 0.06, echo: 0.03, trace: talk });
run("speakers, echo peaks 0.05, learner talks normally", { peak: 0.06, echo: 0.05, trace: talk });

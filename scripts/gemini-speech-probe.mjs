import { fileURLToPath } from "node:url";
import path from "node:path";
// Probe 2: (a) tap-to-talk voice turn on Gemini Live (activityStart → PCM →
// activityEnd) incl. input transcription; (b) pronunciation scoring call with
// the same JSON schema as server/gemini/scoring.ts. Uses a TTS-generated clip.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const { GoogleGenAI, Modality, Type } = await import(
  pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href
);
const keys = fs.readFileSync(`${root}/credentials.txt`, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => /^AQ\.|^AIza/.test(l));
const apiKey = keys[Number(process.argv[2] ?? 1)];
const ai = new GoogleGenAI({ apiKey });

// 1) Make a learner-like clip with a grammar mistake.
const SENT = "Yesterday I go to the market and buy vegetables.";
let pcm;
for (const ttsModel of ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]) {
  try {
    const r = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ role: "user", parts: [{ text: `Say in a calm Indian English accent: ${SENT}` }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
    });
    const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (part) { pcm = Buffer.from(part.inlineData.data, "base64"); console.log(`TTS via ${ttsModel}: ${part.inlineData.mimeType}, ${pcm.length} bytes`); break; }
  } catch (e) { console.log(`TTS ${ttsModel} failed:`, String(e.message).slice(0, 160)); }
}
if (!pcm) process.exit(1);

// Wrap 24 kHz PCM16 mono as WAV for the scoring test.
function wav(pcmBuf, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcmBuf.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcmBuf.length, 40);
  return Buffer.concat([h, pcmBuf]);
}

// 2) Pronunciation scoring (expected text differs from what was said).
const EXPECTED = "Yesterday I went to the market and bought vegetables.";
const expected = EXPECTED.split(" ");
try {
  const res = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [{ role: "user", parts: [
      { text: `Expected sentence: "${EXPECTED}"\nExpected words (${expected.length}): ${JSON.stringify(expected)}` },
      { inlineData: { mimeType: "audio/wav", data: wav(pcm, 24000).toString("base64") } },
    ] }],
    config: {
      systemInstruction: "You are a fair English pronunciation assessor. Judge each expected word CORRECT / INCORRECT / UNCLEAR. One entry per expected word in order.",
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: {
        transcript: { type: Type.STRING },
        words: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
          expected: { type: Type.STRING }, heard: { type: Type.STRING }, status: { type: Type.STRING, enum: ["CORRECT", "INCORRECT", "UNCLEAR"] },
          confidence: { type: Type.NUMBER }, reason: { type: Type.STRING } }, required: ["expected", "heard", "status", "confidence", "reason"] } },
        message: { type: Type.STRING } }, required: ["transcript", "words", "message"] },
      temperature: 0.1,
    },
  });
  const j = JSON.parse(res.text);
  console.log("SCORING ✓ transcript:", JSON.stringify(j.transcript));
  console.log("  words:", j.words.map((w) => `${w.expected}=${w.status}${w.heard && w.heard !== w.expected ? `(heard "${w.heard}")` : ""}`).join(" "));
  console.log("  message:", j.message);
} catch (e) { console.log("SCORING FAILED:", e.status ?? "", String(e.message).slice(0, 300)); }

// 3) Live tap-to-talk turn with that clip.
const live = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
const model = "gemini-3.1-flash-live-preview";
const token = await live.authTokens.create({ config: { uses: 1, expireTime: new Date(Date.now() + 600_000).toISOString(),
  newSessionExpireTime: new Date(Date.now() + 120_000).toISOString(),
  liveConnectConstraints: { model, config: { responseModalities: [Modality.AUDIO],
    systemInstruction: "You are K.AI, an English tutor. If the learner makes a grammar mistake, correct it in one short sentence.",
    inputAudioTranscription: {}, outputAudioTranscription: {},
    realtimeInputConfig: { automaticActivityDetection: { disabled: true } } } }, lockAdditionalFields: [] } });
const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.name)}`);
let heard = "", said = "", audio = 0;
const finish = (why) => { console.log(`LIVE ${why} | learner transcript: "${heard.trim()}" | K.AI: "${said.trim()}" | audio chunks: ${audio}`); process.exit(0); };
const t = setTimeout(() => finish("TIMEOUT"), 40_000);
ws.onopen = () => ws.send(JSON.stringify({ setup: { model: `models/${model}` } }));
ws.onmessage = async (ev) => {
  const m = JSON.parse(typeof ev.data === "string" ? ev.data : await ev.data.text());
  if (m.setupComplete) {
    ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
    const chunk = 4800; // 100 ms at 24 kHz
    for (let i = 0; i < pcm.length; i += chunk) {
      ws.send(JSON.stringify({ realtimeInput: { audio: { mimeType: "audio/pcm;rate=24000", data: pcm.subarray(i, i + chunk).toString("base64") } } }));
    }
    ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
  }
  const sc = m.serverContent;
  if (sc?.inputTranscription?.text) heard += sc.inputTranscription.text;
  if (sc?.outputTranscription?.text) said += sc.outputTranscription.text;
  if (sc?.modelTurn?.parts) audio += sc.modelTurn.parts.filter((p) => p.inlineData?.data).length;
  if (sc?.turnComplete) { clearTimeout(t); finish("turnComplete ✓"); }
};
ws.onclose = (ev) => { console.log("LIVE closed:", ev.code, ev.reason.slice(0, 200)); process.exit(0); };

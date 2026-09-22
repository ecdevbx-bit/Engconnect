import { fileURLToPath } from "node:url";
import path from "node:path";
// End-to-end probe: mint a constrained ephemeral token (same config as
// server/gemini/liveToken.ts) and talk to Gemini Live over a raw WebSocket
// (same protocol as hooks/useGeminiLiveSession.ts). Prints only statuses.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const { GoogleGenAI, Modality } = await import(
  pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href
);

const keyIndex = Number(process.argv[2] ?? 0);
const apiVersion = process.argv[3] ?? "v1alpha";
const lines = fs.readFileSync(`${root}/credentials.txt`, "utf8").split(/\r?\n/).map((l) => l.trim());
const keys = lines.filter((l) => /^AQ\.|^AIza/.test(l));
const apiKey = keys[keyIndex];
const model = "gemini-3.1-flash-live-preview";

const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion } });
let token;
try {
  token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(Date.now() + 10 * 60_000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 2 * 60_000).toISOString(),
      liveConnectConstraints: {
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are K.AI, a friendly English tutor. Reply in one short sentence.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: { automaticActivityDetection: { disabled: true } },
          contextWindowCompression: { slidingWindow: {} },
        },
      },
      lockAdditionalFields: [],
    },
  });
} catch (e) {
  console.log("TOKEN MINT FAILED:", e.status ?? "", String(e.message).slice(0, 300));
  process.exit(1);
}
console.log(`token minted (${apiVersion}):`, token.name ? token.name.slice(0, 14) + "…" : "NO NAME");

const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.name)}`;
const ws = new WebSocket(url);
let audioChunks = 0, audioBytes = 0, transcript = "", gotHandle = false;
const done = (why) => {
  console.log(`result: ${why} | audio chunks=${audioChunks} bytes=${audioBytes} | resumption handle=${gotHandle}`);
  console.log(`K.AI said: "${transcript.trim()}"`);
  try { ws.close(); } catch {}
  process.exit(0);
};
const timer = setTimeout(() => done("TIMEOUT"), 30_000);
ws.onopen = () => ws.send(JSON.stringify({ setup: { model: `models/${model}`, sessionResumption: {} } }));
ws.onmessage = async (ev) => {
  const text = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(text);
  if (m.setupComplete) {
    console.log("setupComplete ✓");
    ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Say hello to a new learner." }] }], turnComplete: true } }));
  }
  if (m.sessionResumptionUpdate?.newHandle) gotHandle = true;
  const sc = m.serverContent;
  if (sc?.modelTurn?.parts) for (const p of sc.modelTurn.parts) if (p.inlineData?.data) { audioChunks++; audioBytes += Math.floor(p.inlineData.data.length * 0.75); }
  if (sc?.outputTranscription?.text) transcript += sc.outputTranscription.text;
  if (sc?.turnComplete) { clearTimeout(timer); done("turnComplete ✓"); }
};
ws.onclose = (ev) => { clearTimeout(timer); console.log("closed:", ev.code, ev.reason.slice(0, 300)); process.exit(0); };
ws.onerror = () => console.log("ws error");

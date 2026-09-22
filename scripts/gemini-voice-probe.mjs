import { fileURLToPath } from "node:url";
import path from "node:path";
// Which prebuilt voices does gemini-3.1-flash-live-preview accept? For each voice:
// mint a constrained token (as the server does), connect, ask for a word, and
// report whether audio came back. Round-robins across the free keys.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."); // repo root
const { GoogleGenAI, Modality } = await import(pathToFileURL(`${root}/frontend/node_modules/@google/genai/dist/node/index.mjs`).href);
const keys = fs.readFileSync(`${root}/credentials.txt`, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => /^AQ\.|^AIza/.test(l)).slice(0, 7);
const model = "gemini-3.1-flash-live-preview";
const VOICES = process.argv.slice(2).length ? process.argv.slice(2) : [
  "Aoede", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Zephyr", "Callirrhoe", "Autonoe",
  "Despina", "Sulafat", "Achird", "Gacrux", "Umbriel", "Iapetus", "Erinome", "Laomedeia", "NotAVoice",
];

async function probe(voice, apiKey) {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
  let token;
  try {
    token = await ai.authTokens.create({ config: { uses: 1, expireTime: new Date(Date.now() + 300_000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 120_000).toISOString(),
      liveConnectConstraints: { model, config: { responseModalities: [Modality.AUDIO],
        systemInstruction: "Reply with one short word.",
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }, lockAdditionalFields: [] } });
  } catch (e) { return `mint failed: ${String(e.message).slice(0, 120)}`; }
  return await new Promise((resolve) => {
    const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.name)}`);
    const t = setTimeout(() => { try { ws.close(); } catch {} resolve("timeout"); }, 20_000);
    ws.onopen = () => ws.send(JSON.stringify({ setup: { model: `models/${model}` } }));
    ws.onmessage = async (ev) => {
      const m = JSON.parse(typeof ev.data === "string" ? ev.data : await ev.data.text());
      if (m.setupComplete) ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Say hello." }] }], turnComplete: true } }));
      if (m.serverContent?.modelTurn?.parts?.some((p) => p.inlineData?.data)) { clearTimeout(t); ws.close(); resolve("✓ audio"); }
    };
    ws.onclose = (ev) => { clearTimeout(t); resolve(`closed ${ev.code} ${ev.reason.slice(0, 120)}`); };
  });
}

for (const [i, v] of VOICES.entries()) {
  console.log(v.padEnd(12), await probe(v, keys[i % keys.length]));
}

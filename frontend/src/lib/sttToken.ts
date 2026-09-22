// Speech-to-text credentials for the browser microphone.
//
// The AI Partner streams the learner's voice straight from their device to
// Deepgram. It obviously cannot carry our Deepgram API key to do that, so the
// backend mints a short-lived token instead:
//
//   GET /api/stt/token?lang=Hindi
//     -> { provider: "deepgram", accessToken, expiresIn, url }
//     -> { provider: "browser",  reason }
//
// Backend contract: englishconnection-api/internal/apiv3/stt_token.go
//
// The endpoint NEVER errors on a Deepgram problem — it answers
// provider:"browser", which means "use the native Web Speech engine instead".
// A less accurate mic is a far better outcome than a dead one.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export type STTProvider = "deepgram" | "browser";

export type STTTokenResponse = {
  provider: STTProvider;
  accessToken?: string;
  expiresIn?: number;
  /**
   * Fully-formed wss:// URL with the model, language, and endpointing policy
   * already applied by the server. The client appends ONLY the audio
   * transport parameters it alone knows (encoding, sample_rate, channels).
   */
  url?: string;
  reason?: string;
};

/**
 * Fetch a streaming-STT credential. Resolves to a `browser` verdict rather
 * than throwing on any failure — network error, 401, malformed body — so that
 * every caller has exactly one fallback path to handle.
 */
export async function fetchSTTToken(
  accessToken: string,
  nativeLanguage?: string | null,
): Promise<STTTokenResponse> {
  const browserFallback = (reason: string): STTTokenResponse => ({
    provider: "browser",
    reason,
  });

  try {
    const qs = nativeLanguage ? `?lang=${encodeURIComponent(nativeLanguage)}` : "";
    const res = await fetch(`${API_URL}/api/stt/token${qs}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return browserFallback(`stt token http ${res.status}`);

    const body = (await res.json()) as { data?: STTTokenResponse };
    const data = body?.data;
    if (!data) return browserFallback("stt token: malformed response");
    if (data.provider !== "deepgram" || !data.accessToken || !data.url) {
      return browserFallback(data.reason ?? "stt token: provider is browser");
    }
    return data;
  } catch (err) {
    return browserFallback(`stt token fetch failed: ${String(err)}`);
  }
}

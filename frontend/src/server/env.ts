import "server-only";

// Typed access to server-side configuration. Everything here is read at call
// time (not module load) so a missing optional value only breaks the feature
// that needs it, never the whole app. See frontend/.env.example for the list.

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function requireEnv(name: string): string {
  const v = read(name);
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  supabaseUrl: () => requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: () => requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseSecretKey: () => requireEnv("SUPABASE_SECRET_KEY"),

  internalApiKey: () => read("INTERNAL_API_KEY"),
  adminEmails: () =>
    read("ADMIN_EMAILS")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),

  // Gemini. Keys can also be added from the admin Keys page; env keys are
  // upserted into the pool on first use (see server/gemini/keyPool.ts).
  geminiApiKeys: () =>
    read("GEMINI_API_KEYS")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  // Billed keys: leased only when no free key can take the request (D-011).
  geminiPaidApiKeys: () =>
    read("GEMINI_PAID_API_KEYS")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  geminiLiveModel: () => read("GEMINI_LIVE_MODEL") || "gemini-3.1-flash-live-preview",
  // Ephemeral tokens: the JS SDK only supports them on v1alpha today, while the
  // docs mention v1beta. Configurable so we can flip without a deploy of code.
  geminiLiveApiVersion: () => read("GEMINI_LIVE_API_VERSION") || "v1alpha",
  geminiLiveVoice: () => read("GEMINI_LIVE_VOICE") || "Aoede",
  geminiTextModel: () => read("GEMINI_TEXT_MODEL") || "gemini-3.1-flash-lite",

  // Cloudflare R2 (S3-compatible). Optional: without it, recordings are
  // scored but not kept.
  r2: () => {
    const accountId = read("R2_ACCOUNT_ID");
    const accessKeyId = read("R2_ACCESS_KEY_ID");
    const secretAccessKey = read("R2_SECRET_ACCESS_KEY");
    const bucket = read("R2_BUCKET");
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
    return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl: read("R2_PUBLIC_BASE_URL") };
  },

  // Resend (support notifications). SUPPORT_EMAIL_TO = where tickets go.
  resend: () => {
    const apiKey = read("RESEND_API_KEY");
    if (!apiKey) return null;
    return {
      apiKey,
      from: read("SUPPORT_EMAIL_FROM") || "English Connection <onboarding@resend.dev>",
      to: (read("SUPPORT_EMAIL_TO") || "ec.devbx@gmail.com").split(",").map((s) => s.trim()).filter(Boolean),
    };
  },

  razorpay: () => {
    const keyId = read("RAZORPAY_KEY_ID");
    const keySecret = read("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return null;
    return { keyId, keySecret, webhookSecret: read("RAZORPAY_WEBHOOK_SECRET") };
  },
};

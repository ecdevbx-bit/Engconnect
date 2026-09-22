// Configure Supabase Auth for English Connection via the Management API.
// Idempotent — safe to re-run after changing SITE_URL or templates.
//
//   node supabase/configure-auth.mjs                    # base config + email templates
//   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… node supabase/configure-auth.mjs   # + Google
//   SMTP_HOST=… SMTP_PORT=465 SMTP_USER=… SMTP_PASS=… SMTP_FROM=… node supabase/configure-auth.mjs
//
// Token/project come from SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF or ../credentials.txt.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const creds = (() => {
  try {
    return fs.readFileSync(path.join(root, "credentials.txt"), "utf8");
  } catch {
    return "";
  }
})();
const token = process.env.SUPABASE_ACCESS_TOKEN || (creds.match(/(sbp_[A-Za-z0-9]+)/) ?? [])[1];
const ref = process.env.SUPABASE_PROJECT_REF || (creds.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) ?? [])[1];
if (!token || !ref) throw new Error("Need SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF");

const SITE_URL = process.env.SITE_URL || "https://engconnect-beta.vercel.app";
const ALLOW = [
  `${SITE_URL}/**`,
  "http://localhost:3000/**",
  // Vercel preview deployments of project "engconnect" in team "engconnect"
  "https://engconnect-*-engconnect.vercel.app/**",
].join(",");

const shell = (title, body, cta, href) => `<!doctype html><html><body style="margin:0;background:#0b0e14;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#10131a;border-radius:16px;padding:32px;border:1px solid #1c2028">
<tr><td style="color:#f59e0b;font-weight:700;font-size:13px;letter-spacing:2px">ENGLISH CONNECTION</td></tr>
<tr><td style="color:#ecedf6;font-size:22px;font-weight:700;padding-top:12px">${title}</td></tr>
<tr><td style="color:#a9abb3;font-size:15px;line-height:22px;padding-top:12px">${body}</td></tr>
<tr><td style="padding-top:24px"><a href="${href}" style="display:inline-block;background:#f59e0b;color:#0b0e14;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${cta}</a></td></tr>
<tr><td style="color:#6b6e76;font-size:12px;line-height:18px;padding-top:24px">If you didn't ask for this, you can ignore this email. The link expires in 1 hour.</td></tr>
</table></td></tr></table></body></html>`;

// Email templates can only be customised once a custom SMTP provider is set
// (Supabase free-tier rule). Until then the default templates are used and
// /auth/confirm handles their #access_token links client-side.
const config = {
  site_url: SITE_URL,
  uri_allow_list: ALLOW,
  password_min_length: 8,
  mailer_autoconfirm: false,
  mailer_secure_email_change_enabled: true,
};

const templates = {
  mailer_subjects_confirmation: "Confirm your English Connection account",
  mailer_templates_confirmation_content: shell(
    "Welcome to English Connection 👋",
    "Tap the button to confirm your email and start practising with K.AI.",
    "Confirm my email",
    "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email",
  ),
  mailer_subjects_recovery: "Reset your English Connection password",
  mailer_templates_recovery_content: shell(
    "Reset your password",
    "Someone (hopefully you) asked to reset the password for {{ .Email }}. Tap the button to choose a new one.",
    "Choose a new password",
    "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery",
  ),
  mailer_subjects_email_change: "Confirm your new email address",
  mailer_templates_email_change_content: shell(
    "Confirm your new email",
    "Tap the button to use {{ .NewEmail }} for your English Connection account.",
    "Confirm new email",
    "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change",
  ),
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  Object.assign(config, {
    external_google_enabled: true,
    external_google_client_id: process.env.GOOGLE_CLIENT_ID,
    external_google_secret: process.env.GOOGLE_CLIENT_SECRET,
  });
}

if (process.env.SMTP_HOST) {
  Object.assign(config, {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT || "465",
    smtp_user: process.env.SMTP_USER,
    smtp_pass: process.env.SMTP_PASS,
    smtp_admin_email: process.env.SMTP_FROM,
    smtp_sender_name: "English Connection",
    // With our own SMTP we can raise Supabase's global cap (our API adds
    // per-email / per-IP limits on top — DECISIONS D-020).
    rate_limit_email_sent: Number(process.env.SMTP_RATE_PER_HOUR || 60),
  });
  // Custom SMTP unlocks template editing: switch to our branded token_hash links.
  Object.assign(config, templates);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(config),
});
const out = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error("✗ auth config failed:", res.status, JSON.stringify(out).slice(0, 500));
  process.exit(1);
}
console.log("✓ auth configured:", {
  site_url: out.site_url,
  uri_allow_list: out.uri_allow_list,
  password_min_length: out.password_min_length,
  google: out.external_google_enabled,
  smtp: !!out.smtp_host,
  rate_limit_email_sent: out.rate_limit_email_sent,
});

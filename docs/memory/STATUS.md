# Status — where the project stands right now

> Working-memory snapshot (Karpathy "RAM" layer). **Overwrite** this file whenever the state
> changes; history lives in `docs/wiki/log.md`, decisions in `DECISIONS.md`, and the whole thing
> as a graph in `docs/wiki/graph.json` (rebuild: `node docs/wiki/build-graph.mjs`).
> Last updated: 2026-09-22 (end of session 1).

## Live 🚀
- **https://engconnect-beta.vercel.app** — Vercel project `engconnect` (team `engconnect`, root
  `frontend`, pnpm 11 via explicit commands — D-022). Auto-deploys on push to `main`.
- GitHub `ecdevbx-bit/Engconnect` (gh logged in as `ecdevbx-bit`). Supabase `uycpxwajvhcigyhvepci`:
  12 migrations applied, RLS everywhere.
- Admin: **ec.devbx@gmail.com** → `/v3/admin` (Pro applications, Support inbox, Gemini keys, …).

## Done ✅ (session 1)
- Backend (Supabase + Next.js API re-implementing the old Go contract), progress engine, content seeds.
- Auth: Supabase only — **Google enabled** + email/password; Resend SMTP (branded emails, 30/h);
  our per-email/IP limits; single-active-session rule.
- AI Partner on Gemini Live 3.1 preview: ephemeral tokens, tap-to-talk, live captions, XP, caps,
  learner memory; **setup card: 14 languages, 3 levels, 6 practice modes, 18 voices** (all verified).
- Key pool: 7 free keys (different projects — confirmed) + 1 paid (last resort); `/v3/admin/keys`.
- Pronunciation scoring with gemini-3.1-flash-lite (verified); R2 upload code (waiting for creds).
- Support: navbar Help dropdown + /support form → `support_tickets` + Resend email to ec.devbx@gmail.com;
  admin inbox. Pro applications: Approve / Don't approve.
- Knowledge: CLAUDE.md schema, wiki (22 pages), DECISIONS D-001…D-029, graph memory.
- Verified: tsc clean; `next build` ✓; production smoke 28/28 (before this last batch).

## Next ⏭️
1. After the next deploy: re-run the production smoke test incl. a support ticket + a session with
   non-default language/mode/voice; owner to try a real voice conversation and a pronunciation take.
2. **Verify a sending domain in Resend** (e.g. englishconnection.in) → re-run
   `supabase/configure-auth.mjs` with `SMTP_FROM=noreply@<domain>` and set `SUPPORT_EMAIL_FROM`.
3. R2 credentials → recordings stored; add a 90-day lifecycle rule.
4. Consider CAPTCHA (Turnstile) on sign-up — direct `supabase.auth.signUp` bypasses our API limits.
5. Pre-existing lint debt (untouched code): LevelsAdminClient, V3AIPartner celebration effect, AuthLayout.
6. Later: `gemini-3.8-live` (stable) is a config switch (`GEMINI_LIVE_MODEL`).

## Blocked on the owner 🙋
- Resend: a domain they own, verified with DNS records (until then emails reach only the Resend
  account owner). Cloudflare R2 keys. Optional Razorpay, custom domain.
- Security hygiene: tokens were pasted in chat (Vercel, Supabase access, Resend) — rotate when convenient
  and update `credentials.txt` + Vercel env.

## Gotchas
- pnpm: `npx -y pnpm@11.0.8 …`. No Doppler. `credentials.txt` = real secrets, never print them.
- Next 16: `src/proxy.ts` (not middleware); route `params` are Promises; `.next` types can go stale
  after deleting a route → `rm -rf frontend/.next` before `tsc`.
- A leftover `next start` can keep port 3000 busy on Windows — find it with Get-CimInstance.
- Supabase free tier: email templates editable only with custom SMTP (now configured).

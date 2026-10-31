# Status — where the project stands right now

> Working-memory snapshot (Karpathy "RAM" layer). **Overwrite** this file whenever the state
> changes; history lives in `docs/wiki/log.md`, decisions in `DECISIONS.md`, and the whole thing
> as a graph in `docs/wiki/graph.json` (rebuild: `node docs/wiki/build-graph.mjs`).
> Last updated: 2026-10-31 (session 6). Repo now lives at `/Users/ace/Desktop/ENGAI` (macOS).

## Live 🚀
- **https://engconnect-beta.vercel.app** — Vercel project `engconnect` (team `engconnect`, root
  `frontend`, pnpm 11 via explicit commands — D-022). Auto-deploys on push to `main`.
  Session 4: `16a981e` (memory + voices) + `ff1268a` (merge retry) READY — production smoke **32/32**,
  `chat-memory-probe` all ✓ on prod (K.AI recalled job, TCS interview and Goa trip).
  Session 3: `0856583` (features + fixes) and `1513925` (raw-path API dispatch) READY; production smoke
  **32/32**, `jumble-hints-probe` all ✓, `audit-guards-probe` all ✓, `sentry-check` ✓ (server error +
  browser tunnel event both arrived; source maps uploaded for the release).
- GitHub `ecdevbx-bit/Engconnect` (gh logged in as `ecdevbx-bit`). Supabase `uycpxwajvhcigyhvepci`:
  18 migrations applied (…1002000100 chat memory, …1002000200 turns/continue, …1002000300 memory merged), RLS everywhere.
- Admin: **ec.devbx@gmail.com** → `/v3/admin` (Learn switch on top, Pro applications, Support inbox,
  Wiki & memory, Gemini keys, content, settings).
- **Sentry**: org `englishconnection` (EU), project `engconnect` — errors from Vercel deployments only
  (wiki: operations/monitoring, D-044). **Verified working in production 2026-09-24** (`scripts/sentry-check.mjs`).

## Session 6 (2026-10-29) 🔧 — deployed `960bad9` READY, production smoke **32/32**
- **K.AI picks the language itself** (D-059): no language picker; sessions are `Auto`; K.AI opens in English
  and follows the learner (probe: Hinglish learner → Hinglish with English practice lines; English learner →
  English only). Memory notes the language they're comfortable in.
- **Phone-first UI pass** (D-060): onboarding = full-screen sheet, pinned Next, 4 steps, only 3 required
  (was stuck below the screen on phones); red ✕ End call beside the mic (verified: session `ended`); K.AI start
  card fits one phone screen with Start pinned; tours only on request (auto tour rendered see-through on
  phones); dashboard decluttered; Profile/Leaderboard/dashboard no longer scroll sideways at 375 px.
- **Pro payments via YouPI PG** (D-061): admin → Payments (on/off — **off**, price ₹499, discount % + end
  date, days, unlock on statement match or bank alert), `/v3/premium` price + "Pay ₹X with UPI", signed
  webhook → Pro days. Migration `20261029000100_pro_payments` **applied**. `scripts/payments-probe.mjs`
  14/14 against a fake gateway locally. Terms §4 + Privacy updated.
- Checks: `tsc` ✓, eslint on changed files ✓ (only old errors left), production build ✓, local smoke
  31/32 (the Resend check needs the key, prod-only). Not checked: admin → Payments page visually (needs an
  admin sign-in), a real YouPI gateway / real UPI payment, real-phone feel.
- Production: `/api/payments/offer` answers `enabled:false` (no `YOUPI_WEBHOOK_SECRET` on Vercel yet) — payments stay off.
- **Deployed `4ee4142` READY, production smoke 32/32 (2026-10-31):** K.AI can be interrupted again — barge-in bar now relative to
  the device's echo and the learner's voice (D-062; the fixed 0.05 blocked quiet mics; simulated only);
  language follows what K.AI heard in earlier calls (`comfort_language`, migration …1029000200 **applied**) and
  answers Marathi in Marathi when the profile/notes say so (D-063; the live model still sometimes reads
  Devanagari Marathi as Hindi); checkout sends `X-Merchant-Key` for a non-default merchant (payments probe 14/14);
  YouPI cloud-server guide in the wiki (`operations/youpi-gateway`). tsc ✓, eslint ✓.
- **Deployed `292fe02` READY, production smoke 32/32 (2026-10-31): accent rule** (D-064) — K.AI speaks English with an Indian
  English accent and Hindi/Marathi/other languages like a native speaker; Beginner no longer says "Roman letters";
  a line in the learner's language before they speak uses the profile/notes language, not Hindi. Probes (text):
  Marathi learner → Marathi greeting + replies, English learner → English only. The accent itself can only be
  judged by ear — owner to listen on a call. tsc ✓, eslint ✓.
- Mute does NOT pause — the call and the clock keep running, no audio is sent (a real pause with auto-end was
  offered, not built).
- Owner asked where YouPI can run: needs an always-on Node 24 host with a disk (small Linux VPS in Mumbai, or an
  always-on home PC + Cloudflare Tunnel) plus an Android phone with the bank SIM for the SMS observer. Not Vercel.

## Session 5 (2026-10-28) 🔧
- Found email sign-ups and password resets failing for real learners (Resend 550 → Supabase rolled back the
  sign-up). **Email confirmation switched OFF** in Supabase; `LoginForm` signs in right after sign-up (D-050).
  Verified: live API sign-up → password login → session ✓; local UI sign-up → dashboard ✓.
  Deployed `df4ed96` READY; production smoke **32/32**.
- **Google sign-in needed two tries** (35/51 in 24 h started on englishconnection.in/www, not allow-listed).
  Site URL → englishconnection.in, both hosts allow-listed (D-051); verified via `auth.flow_state.referrer`.
- Supabase health: all services ACTIVE_HEALTHY, 17 MB, 18/60 connections, no Postgres errors. PostgREST
  "Thread killed by timeout manager" (~1k/day) is benign idle-connection noise.
- Advisors: 4 WARN security (handle_new_user executable, 4 functions w/o search_path, leaked-password check),
  12 WARN `auth_rls_initplan` performance — not fixed yet.
- Gemini text lane: every free key ~20 requests/day with 504 DEADLINE_EXCEEDED errors; paid key never used —
  not investigated yet.
- **K.AI ignores background voices** (near-voice gate in `micPcmStream.ts` + prompt rule) and says its full
  form is **Kanchan AI** (D-052). Simulated only — owner to test in a noisy room on phone + laptop.
  Deployed `f39ecb1` READY; production smoke **32/32**.
- "Chats run out at 10 min": no fixed cut found (sessions up to 30 min, Gemini's ~10-min resets resume on the
  same lease); chats end at the allowance (free 20 min/week, Pro 30 min/day — admin → AI Partner).
- **K.AI talks less** (shorter caps, "let them talk" rules; probe replies ~15–35 words, were 34–46) and the
  voice player got crackle fixes (24 kHz context, jitter buffer, fade-in) (D-053). Deployed `6f047ef` READY;
  production smoke **32/32**. Owner to listen on a phone + laptop.
- Plain-English notes of everything fixed this session: `docs/notes/2026-10-28-problems-solved.md`.
- **Sign-out instant + landing static (D-055)**: cookies cleared at once, session revoked in the background
  (verified: refresh token rejected after), "/" pre-rendered (proxy redirects signed-in visitors). "Logged out
  after closing the browser" is not the app (400-day cookies, refresh verified on prod) — likely a different
  address (apex / www / Vercel URL each have their own cookies) or a browser that clears cookies on exit.
- **Functions moved to Mumbai `bom1` (D-056)**: they ran in Washington DC while Supabase is in Mumbai —
  K.AI start took ~7.5 s to the first word (server 4.7–5.9 s). Session start also parallelised.
- **Pronunciation faster (D-057)**: short answers (detail only for missed words), scorer
  `gemini-3-flash-preview` (thinking LOW), hedged across models, friendly "busy" when all fail, parallel DB
  work. Locally 5.2–6.6 s per attempt while Google's lite models were 503'ing (was 15–25 s).
  Deployed `a444c80` READY (functions confirmed in `bom1`); production smoke **32/32**. Production timings:
  K.AI start 0.73 s server (was 4.7–5.9 s), first word 2.8–3.3 s (was ~7.5 s), `/chat/usage` 0.15 s (was
  1.4–1.8 s); pronunciation 5.4–19 s while Google's models were slow (single calls 10–15 s, several 504) —
  the hedge helps but Google's capacity is the limit. Sometimes the scorer leaves out the native-script
  respelling for a missed word (field is optional now) — watch.
- **Sign-out feedback (D-058)**: a "Signing out…" cover is painted before the page changes (owner: "still slow,
  it does not show"). Verified locally on a phone-size screen. Deployed `4dcc761` READY; production smoke **32/32**.
- **K.AI call rebuilt (D-054)**: ~10 % of K.AI replies were being cut off (one loud mic frame = barge-in) →
  sustained barge-in (220 ms, relative to the learner's level); +200 ms turn-end pauses; browser auto-gain OFF
  + our voice-keyed gain (background TV was boosted); mic held open through mute/reconnects + iOS
  audioSession (mute used to change K.AI's volume/route); captions revealed on the audio clock; desktop
  live preview of the learner's words (Web Speech, display only); UI decluttered. Typecheck ✓, local check:
  greeting revealed word by word in sync. Deployed `4a1e99b` READY; production smoke **32/32**. Real-mic
  behaviour still needs the owner's phone + laptop test.
- Supabase usage is far under free limits (17 MB DB, ~53 MAU, 0 storage, ~5k REST requests/day) — no Pro needed yet.
- `DNS-RECORDS-englishconnection.in.txt` (repo root, untracked) = handout with the 4 Resend records + steps.

## Done ✅
- Sessions 1–2: backend, auth, K.AI on Gemini Live (hands-free), key pool, pronunciation scoring (strict,
  native-script respelling), levels/modes instruction files, Pro 20 min/day, support via Resend, admin
  wiki + knowledge graph, landing redesign (D-001…D-041).
- Session 3 (2026-09-24):
  - **Learn library** `/learn`: 39 visual lessons, 4 tracks (13 Pro), server-side Pro gate (non-Pro get the
    first section only), SEO + JSON-LD + sitemap. **Admin switch "show to everyone" — currently OFF**
    (admins only) (D-042). Verified: quiz works, locked sections/quiz absent from guest HTML, 404 when OFF.
  - **Jumble hint ladder**: sentence shape (type, tense, blocks, meaning in the learner's script) → words →
    full sentence at **half XP**; 💡 Hint button (D-043). `scripts/jumble-hints-probe.mjs` all ✓ locally.
  - **Sentry** wired, privacy-first, `/monitoring` tunnel, traceId tag on API errors (D-044).
  - **Code audit**: 17 findings, 15 fixed (D-045) — the critical ones: a browser could disable shared Gemini
    keys; dead K.AI sessions billed minutes; the full-answer hint paid full XP. `scripts/audit-guards-probe.mjs`
    all ✓ locally.
  - **Landing explained with figures** (~1,000 → ~470 words), scroll-swipe kept, Learn link when public (D-046).
  - Login honours a safe `?next=` path (Learn "Sign in" returns to the lesson).

- Session 4 (2026-10-02):
  - **K.AI memory for Pro** (D-047): chunk → digest → compacted Markdown memory file, fed to Gemini in the
    locked prompt; ChatGPT-style **History** (`/dashboard/ai-partner/history`: list by date → transcript,
    corrections, words, continue, delete) + **What K.AI remembers** (view / clear). Postgres only, no Redis.
    `scripts/chat-memory-probe.mjs` all ✓ locally (a real K.AI session recalled the seeded chats).
    Privacy page mentions K.AI transcripts + memory. Production build ✓.
  - **K.AI voices cut to two** (D-048): Aoede (female, default) + Charon (male); old choices fall back to Aoede.
  - Memory merge tracked separately and retried (D-049) after the first prod run dropped one chat.

## Next ⏭️
0. Owner: try History & memory as a Pro account on a phone and desktop (I can't sign in through the browser
   myself — Supabase sign-in is an outside identity provider).
1. **Owner: read the Learn lessons** (admin → open /learn), then flip the switch ON. Simplifications to
   eyeball: "feel badly" / "Who did call you?" marked ✗; may 50 % vs might 35 % on the certainty scale;
   British schwa examples; "the Ganga"; "click a photo" labelled Indian English; IELTS timings.
2. Owner testing on a real phone: K.AI on speakers AND headphones (tune `BARGE_IN_RMS` /
   level `pauseMs`), pronunciation on an **iPhone** (Safari AudioContext fix), the Jumble 💡 hint card.
3. Verify a sending domain in Resend → `supabase/configure-auth.mjs` with `SMTP_FROM`, set `SUPPORT_EMAIL_FROM`.
4. Not fixed from the audit (low): leaderboard RPC capped at 1,000 rows by PostgREST (rank missing past
   1,000 learners); streak board ranks stored streaks that never reset by themselves. A malformed
   %-escape in an /api URL gets an HTML 500 from Next.js itself on Vercel (before our code) — harmless.
5. Not built yet: post-session review card (talk ratio, IELTS band — the digest now has the mistakes),
   "Practise this lesson with K.AI" deep link (K.AI grammar focus from a Learn lesson),
   admin switch for single-active-session (D-009 confuses testers), CAPTCHA on sign-up (needs keys).
6. Lint debt: 49 React-compiler errors in old files (mostly `/showcase/*` previews, some game components)
   — build doesn't depend on them.
7. SEO: canonical/sitemap/JSON-LD use `englishconnection.in`, which currently serves a different (old)
   site — fine once the domain moves to this app; until then the Vercel URL pages canonicalise away.

## Blocked on the owner 🙋
- **Payments (D-061)**: host YouPI PG yourself (VPS/home server + its Android observer or Gmail), create a
  merchant, paste our webhook URL (shown on admin → Payments) into it, put its webhook secret in Vercel as
  `YOUPI_WEBHOOK_SECRET`, then fill in admin → Payments and switch it on. Have Terms §4 / refunds reviewed.
- **Email sending** (D-050): add the 4 Resend DNS records for `englishconnection.in` at GoDaddy, or a Gmail app
  password for ec.devbx@gmail.com → then turn email confirmation back on.
- Resend: a verified domain. Optional: Razorpay, custom domain move, R2 (only if keeping recordings).
- Security hygiene: tokens pasted in chat (Vercel, Supabase access, Resend, **Sentry**) — rotate and update
  `credentials.txt` + Vercel env. Swap Vercel's `SENTRY_AUTH_TOKEN` for a Sentry **org** token (the API
  can't mint one; Sentry → Settings → Auth Tokens), then re-run `scripts/sentry-setup.mjs`.
- Landing claims "4.9 rating" and "1,00,000+ learners" are the owner's own pre-existing copy; reviews
  are shortened verbatim quotes of the existing testimonials.

## Gotchas
- pnpm: `npx -y pnpm@11.0.8 …`. No Doppler. `credentials.txt` = real secrets, never print them — and when
  "redacting" it, redact EVERY line (values sit on their own lines under labels; a `key: value` regex
  missed them on 2026-09-24).
- Next 16: `src/proxy.ts` (not middleware; excludes `/monitoring`, the Sentry tunnel); route `params` are
  Promises; `.next` types can go stale after deleting a route → `rm -rf frontend/.next` before `tsc`.
- **Never filter `tsc` output to hide a file you're ignoring.** Build the COMMIT in a worktree before
  pushing (reuse `$TEMP/eb1340`: `git checkout --force --detach <sha>`, install, build). Delete worktrees
  with `cmd /c rd /s /q "\\?\<path>"`.
- After editing the wiki or memory run `node docs/wiki/build-graph.mjs` — it refreshes the admin wiki
  snapshot `frontend/src/generated/wiki-bundle.json`, which must be committed.
- Python edits on Windows: `newline=""`; some landing files are CRLF. Bash heredocs with quotes/backslashes
  break — write a .py/.mjs file with the Write tool instead.
- Sentry v11: `sendDefaultPii` is gone → `dataCollection` (see `lib/sentryScrub.ts`); `withSentryConfig`
  comes from `@sentry/nextjs/config`.
- Gemini free tier: `gemini-omni-*` has no quota; 3.8/3.5-flash often 503 and slow; `gemini-3.1-flash-lite`
  is the fast scorer. Text calls: 15 s timeout, 30 s deadline, model fallback (`gemini/textModel.ts`).
- Test data: probes create throwaway users via the admin API and delete them; the audit probe starts one
  real K.AI session.
- A leftover `next start` can keep port 3000 busy on Windows — find it with Get-CimInstance.
- After moving the repo, pnpm refuses to reuse node_modules without a TTY → `CI=true npx -y pnpm@11.0.8 install`.
- The Claude desktop preview for this session reads `C:\Users\abhic\Desktop\ENGAI\.claude\launch.json`
  (session started there): use its `eng-dev` entry, which runs this repo's frontend by absolute path.

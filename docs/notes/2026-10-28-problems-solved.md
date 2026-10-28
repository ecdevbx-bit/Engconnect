# Problems solved — 28 Oct 2026

Plain-English notes on what was broken, why, what we changed, and what is still left.
Technical details: `docs/memory/DECISIONS.md` (D-050 … D-053) and `docs/wiki/log.md`.

---

## 1. Email sign-up didn't work ("Invalid login credentials")
- **What learners saw:** they signed up with email, then couldn't log in. Forgot-password emails never arrived.
- **Why:** sign-up emails go out through Resend, and Resend only sends from its test address
  (`onboarding@resend.dev`) to the account owner. Every other email bounced (error 550), and Supabase
  then cancelled the sign-up. 13 sign-ups failed this way on 27–28 Oct.
- **Fix:** email confirmation is switched **off** for now, and the app logs the learner in straight
  after sign-up. Tested live: sign-up → logged in → dashboard ✓. (D-050)
- **Trade-off:** email addresses aren't verified, and forgot-password still can't send.
- **Still to do (owner):** add the 4 DNS records at GoDaddy (`DNS-RECORDS-englishconnection.in.txt`).
  Then we verify the domain in Resend, send from `noreply@englishconnection.in`, and turn
  confirmation back on.

## 2. Google sign-in needed two tries
- **What learners saw:** the first "Continue with Google" landed them on the home page, still logged out.
  The second try worked.
- **Why:** the site is now also served on `englishconnection.in` and `www.englishconnection.in`, but
  Supabase only trusted the Vercel address. 35 of 51 Google sign-ins in one day started on those
  addresses and were bounced to the wrong host.
- **Fix:** `englishconnection.in` is now the main site URL, and every address the app runs on is
  trusted. Checked for each host. (D-051)
- **Optional:** redirect `www` → `englishconnection.in` in Vercel so there's only one address.

## 3. K.AI answered background voices (TV, other people)
- **Fix:** a background-voice filter on the mic. It learns how loud the learner is and how loud
  the room is, and only lets through sound that is close and clear. K.AI was also told to ignore TV,
  music and other people. (D-052)
- **Tested in simulation:** a quiet TV is fully cut; a TV at about a quarter of the learner's volume
  is mostly cut; the learner keeps at least 93 % of their speech.
- **Limit:** a TV as loud as the learner can still get through (volume alone can't separate them).
- **Still to do (owner):** try it in a real room on a phone and a laptop.

## 4. K.AI's full form
- When asked what K.AI stands for, it now says **"Kanchan AI — Kanchan Artificial Intelligence"**.

## 5. "Long chats run out at 10 minutes" — not a bug
- Checked 30 days of chats: there is no 10-minute cut. Chats ran up to 30 minutes. Google resets
  the voice connection about every 10 minutes, and the app reconnects without a break.
- Chats end when the learner's **allowance** runs out: free = 20 min per week, Pro = 30 min per day.
  To give more time: Admin → AI Partner.

## 6. "Is Supabase running out? Should I get Pro?" — not needed yet
- Database 17 MB (free limit 500 MB), no file storage used, 74 users (about 53 active a month),
  about 5,000 requests a day. All far under the free limits.
- Upgrade later if you need daily backups, more than ~50,000 monthly users, or the database grows
  past ~400 MB.

## 7. K.AI talked too much
- **Fix:** shorter replies — Beginner under 20 words, Intermediate under 25, Expert under 30 — and
  one question or task per reply. New "let them talk" rules: open questions, ask for more instead of
  filling gaps, no lectures, one correct version (no "or you could say…"). (D-053)
- **Result:** replies went from 34–46 words to about 15–35. Less K.AI speech = fewer audio tokens
  = lower Gemini cost, and the learner gets more speaking time.
- **Watch for:** in 1 of 5 test runs K.AI gave a wrong correction ("since two years"). Reruns were
  right — normal model variation, but worth listening for.

## 8. Crackling / noise when K.AI speaks
- **Why (two causes found):**
  1. K.AI's voice arrives in small pieces. Each piece was converted to the speaker's sample rate on
     its own, which clicks where pieces join.
  2. When a piece arrived late over the network, playback stopped and restarted — another click.
- **Fix:** the player now runs at K.AI's own rate (24 kHz, no conversion), keeps about 0.12 s of
  audio in reserve (more if the network is shaky), and fades in softly after a gap. Cost: K.AI's
  first word starts about 0.1 s later. (D-053)
- **Not fixable in code:** Bluetooth earphones switch to low-quality "call mode" while the mic is on.
  If the noise only happens on Bluetooth, that's the cause.
- **Still to do (owner):** listen on a phone and a laptop.

---

## Health checks done
- Supabase: all services healthy, 18 of 60 connections used, no database errors.
- Production smoke test after each deploy: 32/32 ✓.

## Found but not fixed yet
- Supabase security advisor: 4 warnings (function permissions, missing `search_path` on 4 functions,
  leaked-password check off) and 12 performance warnings (RLS policies re-evaluating auth per row).
- Gemini text lane (scoring, hints, memory): free keys are hitting slow-response timeouts (504) and the
  paid key is never used. Not investigated.

## Owner checklist
1. Add the 4 DNS records at GoDaddy (file: `DNS-RECORDS-englishconnection.in.txt`).
2. Try Google login on `englishconnection.in` and `www.englishconnection.in`.
3. Test K.AI on a phone and a laptop: background TV, crackle, shorter replies.
4. Decide whether learners need more K.AI minutes (Admin → AI Partner).
5. Rotate the tokens that were pasted in chat (Vercel, Supabase, Resend, Sentry).

---
title: Product overview
type: overview
tags: [product]
links: [features/jumble-words, features/pronunciation, features/ai-partner, features/word-bank, features/progress-and-rewards, features/premium, features/admin, features/support, features/learn, architecture/auth, architecture/system, operations/monitoring]
updated: 2026-09-24
---

# English Connection — product overview

**English Connection** is a web app (installable as a PWA) that teaches **spoken and written
English to Indian learners**, many of whom think in Hindi, Bengali, Gujarati, Marathi, Tamil or
Telugu. Content is rooted in everyday Indian life: trains, cricket, festivals, office, family.
The friendly tutor persona is **K.AI** (said "kaa-ee").

## The four trainers
| Trainer | Skill | How it works |
|---|---|---|
| [[features/jumble-words]] | Sentence structure, word order | Drag scrambled words into the right order; hints when stuck; progressive sets grow a sentence easy → hard |
| [[features/pronunciation]] | Clear speech | Listen, record yourself reading a sentence, get per-word feedback |
| [[features/ai-partner]] | Fluency, confidence | Real voice conversation with K.AI, who corrects mistakes gently and remembers you |
| Leaderboard | Motivation | XP, weekly and streak boards — see [[features/progress-and-rewards]] |

Plus [[features/word-bank]] (save and practise words, behind a feature flag) and a **Help** button
on every screen for reporting problems ([[features/support]]).

## Learner journey
1. Sign in with Google or email + password ([[architecture/auth]]).
2. Short onboarding: native language, city, status (student/working/…), why English, goals,
   hobbies. K.AI uses this to personalise conversations.
3. Practise any trainer; every correct answer or minute of speaking earns **XP** → levels,
   streaks, combos and badges ([[features/progress-and-rewards]]).
4. Free learners have daily limits; **Pro** removes them ([[features/premium]]).

## The landing page
`frontend/src/components/ShowcaseV4.tsx` (rendered by `src/app/page.tsx` for logged-out visitors;
signed-in users are redirected to the dashboard). **Explained with figures, not text** (D-046, ~470
words): animated live-call hero, a 3-step "How it works" flow diagram, the scroll-driven **swipe**
(`components/landing/ScrollSwipe.tsx`) carrying a K.AI call timeline, jumble chips and a pronunciation
figure, setup tiles (levels, 14 languages, 6 modes, 18 voices), progress widgets, one-line reviews, and
Free vs Pro drawn on the same scale. Figures live in `components/landing/figures/` (HTML/SVG + CSS,
`role="img"` + `aria-label`), animated by `landing/FigurePlayer.tsx` only while on screen. Glass style and
lightness from D-041. A "Learn" link appears when the Learn library is public ([[features/learn]]).

## Learn library
Free grammar & speaking lessons at `/learn` (39 lessons, 4 tracks, 13 Pro), visual-first, behind an
admin "show to everyone" switch — [[features/learn]].

## Monitoring
Errors are reported to Sentry (privacy-first, errors only) — [[operations/monitoring]].

## Business model
Free tier with daily limits → Pro (trial program, invite link, later Razorpay subscriptions).

## Tech in one paragraph
Next.js 16 app on Vercel serves both the UI and the API (`/api/*`). Data and auth are in
**Supabase** (Postgres + Auth). The AI Partner talks **directly** from the browser to **Google
Gemini Live** using short-lived tokens our server mints from a pool of API keys. Pronunciation
scoring also uses Gemini. Recordings go to **Cloudflare R2**. Details: [[architecture/system]].

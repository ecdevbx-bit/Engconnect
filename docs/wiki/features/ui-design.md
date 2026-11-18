---
title: UI design system (Calm Saffron)
type: feature
tags: [ui, design, accessibility, phone]
links: [features/ai-partner, features/pronunciation, features/jumble-words, features/progress-and-rewards, features/premium, features/learn]
updated: 2026-11-18
---

# UI design system — "Calm Saffron"

The learner app's look, decided in the UI overhaul (D-071, branch `claude/ui-overhaul-b33f7f`, not on
`main` until the owner approves). Owner's brief: "more user friendly, simple, good for all age groups,
looking like a premium app", then "too much text — like Duolingo, 12 min with a circle".

## Rules
1. **One brand colour** — saffron in light and dark (the old light theme was blue). `--primary`
   (#c9480c light, #ff7a1a dark), soft fill `--brand-soft`.
2. **Pictures and numbers, not sentences** — amounts are rings (`components/ui/stat-ring.tsx`:
   "12 min" in a circle, "2/3" today), stats are icon + number, practices are icon tiles with a
   one-word name. Helper lines removed; screen-reader text keeps the full meaning.
3. **Readable type** — Tailwind's `text-xs/sm/base` are 13/15/17 px (`globals.css` `@theme`),
   nothing below 13 px, body 17 px. Headings Plus Jakarta Sans, text Manrope (the landing uses the
   same heading font now; Space Grotesk dropped).
4. **Big targets** — 48 px minimum, main buttons 56 px (`components/ui/button.tsx` sizes), inputs 48 px,
   K.AI Mute / End 64 px with labels.
5. **Solid surfaces** — no glass blur and no colour blobs behind pages (they cost frames on cheap
   phones). `.c-box/.glass/.ec-card` = surface + hairline border + soft shadow (light only).
6. **Motion** — 150–250 ms, press = scale 0.97 (`.ec-press`), looping only while K.AI speaks or the
   mic records; off with reduced motion.

## Tokens (`frontend/src/app/globals.css`)
Token names are unchanged (`--bg`, `--surface-1..3`, `--primary-1/2`, `--heading`, `--body`…) so
older components re-skin automatically. New: feature colours `--kai` (teal, K.AI), `--speak`
(violet, Pronunciation), `--words` (amber, Jumble), `--learn` (blue), each with a `-soft` fill, and
states `--good/--warn/--bad` (+ `-soft`), exposed as Tailwind colours (`bg-kai-soft text-kai`…).
`--tint-*` stay strong gradients because white text sits on them (Pro page cards).

## Navigation
Phone tab bar (`layout/BottomNav.tsx`) and desktop tabs (`layout/NavTabs.tsx`) both read
`config/nav.ts` `primaryNav`: **Home · Words · Talk · Speak · Ranks** (Talk = raised K.AI button),
desktop adds Learn (when visible) and Pro. Labels always shown.

## Screens
- **Home** (`dashboard/page.tsx`): "Hi, name" + streak chip; Today ring (0–3 of Jumble /
  Pronunciation / K.AI done today, from `/users/me/activity`) with one button to the next practice;
  progress card (level, XP, streak, level bar, this week's days); tiles Talk (with K.AI minutes ring
  from `/chat/usage`), Speak, Words, Learn, Ranks (phone); Pro card. Heatmap/weekly chart moved off
  Home (still on `/dashboard/activity`).
- **K.AI** (`game/V3AIPartner.tsx`): start card = title, History, setup chips, minutes ring + Start;
  call = status pill (Listening / K.AI speaking / Thinking / Muted), +XP chip, minutes ring, chat,
  caption, Mute + End call. See [[features/ai-partner]].
- **Pronunciation**: "N of 12" bar, Listen → Speak → Result as three icons (`StepDots.tsx`), big
  mic, coloured word chips (wrong words also underlined). See [[features/pronunciation]].
- **Jumble Words**: 48 px tiles at 17 px, Hint button, "Start over". See [[features/jumble-words]].
- **Ranks**: board first, badges below, larger rows. **Login**: form first on phones.
- **Landing**: same tokens, no orbs, solid cards, hero = headline + one line + "Start free" + three
  stat chips (4.9 ★, 1 lakh+ learners, 20 min ring). Mascot section and store badges removed.
  `revalidate = 86400` + flag-save refresh kept (D-070).

- **Onboarding** (sheet): big emoji tiles (2 px border, saffron when picked), 56 px Next/Start.
- **Help panel**: "Need help?", 48 px fields, one line after sending. **K.AI History**: shared button
  styles 48 px, saffron primary. **Profile**: larger labels/values.

## Still to look at
Learn lessons only picked up tokens (behind the admin switch). No signed-in screen has been checked in a
browser yet — owner to check on the Vercel preview.

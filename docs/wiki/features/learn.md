---
title: Learn library
type: feature
tags: [learn, content, seo, pro]
links: [features/premium, features/admin, features/jumble-words, features/pronunciation, features/ai-partner, overview]
updated: 2026-09-24
---

# Learn library (`/learn`) — D-042

A free English grammar & speaking library "like W3Schools", visual-first (the owner wants pictures
over text): every rule is a diagram + ✓/✗ examples + an "Indian learner tip", then a 3-question
**Quick check** and buttons to practise it with K.AI ([[features/ai-partner]]) or drill it in
[[features/jumble-words]] / [[features/pronunciation]].

## Visibility — the admin switch
Feature flag **`englishconnection-learn`**, toggled on the admin home card or `/v3/admin/feature-flags`
([[features/admin]]). It **starts OFF**:
| Switch | Visitors / learners | Admins | Menus, landing link, sitemap | Search engines |
|---|---|---|---|---|
| OFF | `/learn` = 404 | can open everything (preview) | hidden | `noindex` |
| ON | free lessons open; Pro lessons show a preview | everything | shown | indexed |
Server check: `learnAccess()` in `frontend/src/server/viewer.ts` (cached per request in `app/learn/access.ts`);
client links: `hooks/useLearnVisible.ts` (NavTabs, account menu, dashboard card) and the landing
(`app/page.tsx` → `ShowcaseV4 showLearn`).

## Content — 39 lessons, 4 tracks (13 Pro)
| Track | Level | Lessons |
|---|---|---|
| Beginner | A1–A2, all free | sentence order, nouns & plurals, a/an/the, pronouns, am/is/are, simple present, present continuous, simple past, will vs going to, questions, negatives, in/on/at, adjectives vs adverbs, much/many/some/any, common Indian-English mistakes |
| Intermediate | B1–B2 | present perfect vs past, present perfect continuous, past continuous & past perfect, modals, conditionals 0/1/2, passive, reported speech, gerund vs infinitive, relative clauses, comparatives — **Pro:** phrasal verbs, linking words |
| Advanced | C1, all **Pro** | third & mixed conditionals, future continuous/perfect, inversion & emphasis, collocations, idioms at work, hedging & softening |
| Speaking & Career | first free, rest **Pro** | small talk (free), job interviews (STAR), professional emails, meetings & presentations, IELTS Speaking, pronunciation for Indian speakers |

Lessons are typed data in `frontend/src/content/learn/*.ts` (`server-only`, so a client component can't
pull locked lessons into the browser). Sections use visuals from `components/learn/visuals/`: **timeline**
(tenses on a past–now–future axis), **blocks** (sentence as coloured role chips), **table**, **formula**
(chips joined by + / →), **transform** (active → passive, direct → reported…), **scale** (certainty,
formality). All HTML/CSS/SVG, readable at 375 px, dark + light.

## Pro gating (security)
Done in **server components**: for a Pro lesson and a non-Pro viewer the page renders the title, summary
and the **first section only**, then a lock card ("Unlock with Pro" → `/pro`; "Already Pro? Sign in" →
`/login?next=<lesson>`). Later sections and the quiz are never in the HTML (checked 2026-09-24).
Admins count as Pro. See [[features/premium]].

## SEO
Per-page `generateMetadata` (title "…: rules and examples | English Connection", canonical, OG), JSON-LD
`LearningResource` (`isAccessibleForFree` = !pro), sitemap entries (hourly revalidate) only while ON.
Pro lessons are indexable through their public preview.

## Open points
- The owner should read the lessons before switching ON (AI-written; a few simplifications are listed in
  STATUS). IELTS timings follow the current test format as known on 2026-09-24.

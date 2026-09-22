---
title: Word Bank
type: feature
tags: [word-bank, feature-flag]
links: [features/pronunciation, features/admin]
updated: 2026-09-22
---

# Word Bank

A personal list of English words to practise. **Hidden by default** — feature flag
`englishconnection-word-bank` (turn on at `/v3/admin/feature-flags`).

- Add words by typing, or drag them from a Pronunciation result into the wallet
  ([[features/pronunciation]]).
- Each word: **Listen** (device voice) and **Practice** (record yourself 3 times and play back —
  local only, no scoring, no upload).
- Rules: single lowercase word `^[a-z][a-z'-]*$` (the server normalises and trims punctuation);
  unique per learner — adding a duplicate returns `added:false`; newest first.
- API: `GET /api/word-bank/` · `POST /api/word-bank/` `{word, source}` · `DELETE /api/word-bank/{word}`.

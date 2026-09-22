---
title: Object storage (Cloudflare R2)
type: architecture
tags: [storage, r2]
links: [features/pronunciation, operations/credentials]
updated: 2026-09-22
---

# Object storage — Cloudflare R2

S3-compatible, no egress fees. Accessed from the server with SigV4 (`aws4fetch`) —
`frontend/src/server/r2.ts`. **Buckets stay private**; reads use presigned URLs (10 min).

| What | Key pattern | Written by |
|---|---|---|
| Pronunciation recordings (16 kHz WAV) | `pronunciation/<userId>/<attemptId>.wav` | `POST /api/pronunciation/attempts` (after the response) |

**Not required** (D-036): pronunciation scoring sends the audio from our server straight to Gemini
inside the API request, so nothing has to be stored first. R2 would only *keep* recordings (for a
"listen to your past attempts" feature, reviewing disputes, or building a dataset). If
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` aren't set (current state),
recordings are simply not kept. Add the keys later if one of those features is wanted, with a
lifecycle rule deleting recordings after 90 days ([[operations/credentials]]).
AI Partner audio is **not** stored (privacy + cost); only its text transcript is.

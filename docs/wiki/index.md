---
title: Wiki index
type: index
updated: 2026-09-22
---

# English Connection — Wiki index

The compiled knowledge base for the product (Karpathy "LLM Wiki" pattern, see
[[meta/how-this-wiki-works]]). Every page has frontmatter (`type`, `tags`, `links`) and uses
`[[wikilinks]]`, so the whole wiki is a graph. **Start here, then follow links.**

## Product
| Page | What it covers |
|---|---|
| [[overview]] | What English Connection is, who it's for, the four trainers, tech at a glance |
| [[features/jumble-words]] | Sentence unscrambling game: rounds, hints, progressive sets, XP rules |
| [[features/pronunciation]] | Read-aloud coach: record → Gemini scores each word → feedback |
| [[features/ai-partner]] | K.AI voice tutor on Gemini Live: language/level/mode/voice setup, hands-free talk + interruptions, captions, memory, caps |
| [[features/k-ai-instructions]] | K.AI's instruction files: Beginner/Intermediate/Expert behaviour, practice modes, IELTS & interview material |
| [[features/word-bank]] | Saved words + 3-take practice (feature-flagged) |
| [[features/progress-and-rewards]] | XP, levels, streaks, combos, badges, leaderboard |
| [[features/premium]] | Pro: trial program, /pro invite link, quotas, Razorpay |
| [[features/support]] | "Something wrong?" Help dropdown → ticket + email to the team (Resend) |
| [[features/admin]] | Admin panel: Pro applications, support inbox, wiki & memory, Gemini keys, content, settings |

## Architecture
| Page | What it covers |
|---|---|
| [[architecture/system]] | Big picture: Next.js app + API + Supabase + Gemini + R2 + Vercel |
| [[architecture/api]] | Every `/api/*` endpoint, auth, envelope, error codes |
| [[architecture/database]] | Tables, Postgres functions, RLS model, migrations |
| [[architecture/auth]] | Supabase Auth (Google + email/password), sessions, single-session rule |
| [[architecture/gemini-key-pool]] | 7 free + 1 paid keys: lanes, tiers, leases, cooldowns, fail-over |
| [[architecture/gemini-live]] | Ephemeral tokens, WebSocket protocol, hands-free voice detection, resumption |
| [[architecture/storage-r2]] | Cloudflare R2 object storage: what's stored, keys, presigning |

## Operations
| Page | What it covers |
|---|---|
| [[operations/runbook]] | Run locally, apply migrations, add Gemini keys, common fixes |
| [[operations/deployment]] | Vercel project, env vars, GitHub flow |
| [[operations/credentials]] | Every secret/config value: where it lives, who provides it, status |

## Memory (outside the wiki)
- `docs/memory/DECISIONS.md` — append-only decision log (why things are the way they are)
- `docs/memory/STATUS.md` — current state / in progress / blocked (working memory)
- [[log]] — chronological log of wiki + project changes
- [[meta/graph]] — the knowledge graph (generated from this wiki + DECISIONS; also `graph.json`)

# English Connection

An English-learning platform for Indian learners — **Jumble Words** (sentence building),
**Pronunciation Coach** (per-word feedback), **AI Partner** (voice conversations with the tutor
K.AI on Google Gemini Live), XP/levels/badges/leaderboard, and Pro access.

| | |
|---|---|
| App + API | Next.js 16 (`frontend/`), deployed on Vercel |
| Data + Auth | Supabase — Postgres (`supabase/migrations/`) + Auth (Google, email/password) |
| AI | Gemini Live `gemini-3.1-flash-live-preview` (voice), `gemini-3.1-flash-lite` (scoring) via a key pool |
| Storage | Cloudflare R2 (recordings) |

## Start here
- **Product & architecture wiki:** [`docs/wiki/index.md`](docs/wiki/index.md)
- **Why things are the way they are:** [`docs/memory/DECISIONS.md`](docs/memory/DECISIONS.md)
- **Current status / what's next:** [`docs/memory/STATUS.md`](docs/memory/STATUS.md)
- **Run it locally / migrations / keys:** [`docs/wiki/operations/runbook.md`](docs/wiki/operations/runbook.md)

```bash
cd frontend
cp .env.example .env.local          # fill in values
npx -y pnpm@11.0.8 install
npx -y pnpm@11.0.8 dev              # http://localhost:3000
```

Secrets never go in git: `credentials.txt` and every `.env*` (except `.env.example`) are ignored.

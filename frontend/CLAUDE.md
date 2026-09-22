@AGENTS.md

# frontend/ — code conventions

Project memory, decisions and the product wiki live at the repo root: read `../CLAUDE.md`
(it loads `docs/memory/STATUS.md` + `DECISIONS.md`) and `../docs/wiki/index.md` first.

## Where things are
| Path | What |
|---|---|
| `src/app/**` | Pages (App Router). `(app)/dashboard/*` = learner app, `v3/admin/*` = admin |
| `src/app/api/[...path]/route.ts` | The whole backend API entry → `src/server/routes/index.ts` |
| `src/server/` | Server-only code (`import "server-only"`): router, guards, settings, domain, gemini, r2 |
| `src/lib/` | Browser API clients (`v3Fetch`, `v3Game`, `v3Pronunciation`, `v3Chat`…) — contract with the API |
| `src/hooks/useGeminiLiveSession.ts` | AI Partner ↔ Gemini Live client |
| `src/audio/` | Mic PCM streamer, PCM player, WAV converter |
| `src/components/` | UI (shadcn/ui + Tailwind 4; design in `Design.md`, layouts in `Layout.md`) |

## Conventions
- API responses: `ok(data)` / throw `fail.*()` from `src/server/http.ts` → envelope
  `{success, message, data}` / `{success:false, message, errorCode}`. Never return non-JSON.
- Every handler starts with `requireUser(req)` or `requireInternal(req)` (`src/server/guards.ts`).
- DB access: `db()` (service role) from `src/server/supabase.ts`; wrap results with `must()`.
- XP changes only through `awardProgress()` (→ Postgres `award_progress`).
- Gemini calls only through `src/server/gemini/keyPool.ts` (`withTextKey`, `leaseKey`) — never
  read a key from env directly.
- Settings the admin can change go in `src/server/settings.ts` (defaults + validation).
- Match surrounding style: comments explain *why*; TypeScript strict; no new deps without need.

## Commands (pnpm is pinned to 11.0.8 — local pnpm is 10.x)
```bash
npx -y pnpm@11.0.8 dev        # http://localhost:3000 (env: .env.local)
npx tsc --noEmit              # typecheck
npx -y pnpm@11.0.8 lint
npx -y pnpm@11.0.8 build
```

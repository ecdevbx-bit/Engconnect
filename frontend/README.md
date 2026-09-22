# frontend — English Connection web app + API

Next.js 16 (App Router) app that serves both the learner/admin UI **and** the backend API
(`src/app/api/[...path]/route.ts` → `src/server/**`). Data and auth: Supabase. AI: Gemini.

```bash
cp .env.example .env.local        # fill in values (see ../docs/wiki/operations/credentials.md)
npx -y pnpm@11.0.8 install        # pnpm is pinned to 11.0.8
npx -y pnpm@11.0.8 dev            # http://localhost:3000
npx tsc --noEmit                  # typecheck
npx -y pnpm@11.0.8 build          # production build (what Vercel runs)
```

- Code conventions and layout: [`CLAUDE.md`](CLAUDE.md)
- Product + architecture wiki: [`../docs/wiki/index.md`](../docs/wiki/index.md)
- Design system: [`Design.md`](Design.md) · page layouts: [`Layout.md`](Layout.md)
- Admin panel: `/v3/admin` (email must be in `ADMIN_EMAILS`)

---
title: How this wiki works
type: meta
tags: [wiki, memory, karpathy]
links: [index, log]
updated: 2026-09-22
---

# How this wiki works

We use Andrej Karpathy's **LLM Wiki** pattern: instead of re-reading raw sources every session,
the AI agent *compiles* what it learns into a persistent, interlinked markdown wiki and keeps it
current. Knowledge compounds instead of being rediscovered.

## Three layers
1. **Raw sources** (read-only truth): the code in `frontend/` and `supabase/`, `credentials.txt`
   (secrets — never copy into the wiki), the old `ENGAI/` prototype, owner instructions.
2. **The wiki** (`docs/wiki/`): agent-maintained pages — features, architecture, operations.
   Plain markdown; readable by humans in GitHub or Obsidian.
3. **The schema** (root `CLAUDE.md`): tells every agent session how to read and maintain all this.

Plus the memory files in `docs/memory/`: `DECISIONS.md` (append-only "why") and `STATUS.md`
(overwritten "where are we now").

## Operations
- **Ingest** — after learning something (reading code, a doc, a user instruction): update every
  affected page, add cross-links, append a line to [[log]].
- **Query** — answer questions from the wiki first; if the answer is worth keeping, file it back
  as a page or section.
- **Lint** — periodically check for: contradictions with the code, stale claims, orphan pages
  (not linked from [[index]]), missing pages for concepts that are mentioned a lot.

## Conventions (graph-ready)
- Frontmatter on every page: `title`, `type` (overview|feature|architecture|operations|meta|index|log),
  `tags`, `links` (outgoing edges), `updated`.
- Links are `[[folder/page-name]]` without `.md`. The `links:` list mirrors the body links, so
  a graph (nodes = pages, edges = links) can be built by parsing frontmatter alone.
- Secrets never appear in the wiki. Refer to them by env-var name.
- Code references: repo-relative paths, e.g. `frontend/src/server/routes/chat.ts`.

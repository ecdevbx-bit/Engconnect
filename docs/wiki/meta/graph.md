---
title: Knowledge graph
type: meta
tags: [graph, memory]
links: [index, meta/how-this-wiki-works]
updated: 2026-09-22
---

# Knowledge graph (generated — do not edit by hand)

Regenerate with `node docs/wiki/build-graph.mjs`. Machine-readable version: `docs/wiki/graph.json`
(54 nodes · 172 edges). See [[index]] and [[meta/how-this-wiki-works]].

## Map of pages
```mermaid
flowchart LR
  subgraph architecture
    architecture_api["API reference"]
    architecture_auth["Authentication"]
    architecture_database["Database (Supabase Postgres)"]
    architecture_gemini_key_pool["Gemini key pool"]
    architecture_gemini_live["Gemini Live integration"]
    architecture_storage_r2["Object storage (Cloudflare R2)"]
    architecture_system["System architecture"]
  end
  subgraph feature
    features_admin["Admin panel"]
    features_ai_partner["AI Partner (K.AI)"]
    features_jumble_words["Jumble Words"]
    features_premium["Premium (Pro)"]
    features_progress_and_rewards["Progress & rewards"]
    features_pronunciation["Pronunciation Coach"]
    features_support["Customer support ('Something wrong?')"]
    features_word_bank["Word Bank"]
  end
  subgraph index
    index["Wiki index"]
  end
  subgraph log
    log["Log"]
  end
  subgraph meta
    meta_how_this_wiki_works["How this wiki works"]
    meta_graph["Knowledge graph"]
  end
  subgraph operations
    operations_credentials["Credentials & config"]
    operations_deployment["Deployment"]
    operations_runbook["Runbook"]
  end
  subgraph overview
    overview["Product overview"]
  end
  architecture_api --> features_jumble_words
  architecture_api --> features_pronunciation
  architecture_api --> features_word_bank
  architecture_api --> features_ai_partner
  architecture_api --> architecture_gemini_live
  architecture_api --> features_premium
  architecture_api --> features_admin
  architecture_api --> architecture_auth
  architecture_api --> features_support
  architecture_api --> architecture_system
  architecture_auth --> architecture_api
  architecture_auth --> operations_credentials
  architecture_auth --> features_premium
  architecture_auth --> features_support
  architecture_database --> operations_runbook
  architecture_database --> architecture_gemini_key_pool
  architecture_database --> architecture_system
  architecture_database --> features_progress_and_rewards
  architecture_gemini_key_pool --> architecture_gemini_live
  architecture_gemini_key_pool --> features_pronunciation
  architecture_gemini_key_pool --> features_ai_partner
  architecture_gemini_key_pool --> features_admin
  architecture_gemini_key_pool --> architecture_database
  architecture_gemini_live --> features_ai_partner
  architecture_gemini_live --> architecture_gemini_key_pool
  architecture_gemini_live --> architecture_api
  architecture_storage_r2 --> operations_credentials
  architecture_storage_r2 --> features_pronunciation
  architecture_system --> architecture_database
  architecture_system --> architecture_gemini_live
  architecture_system --> architecture_gemini_key_pool
  architecture_system --> operations_deployment
  architecture_system --> architecture_auth
  architecture_system --> architecture_storage_r2
  architecture_system --> architecture_api
  features_admin --> features_premium
  features_admin --> features_support
  features_admin --> architecture_gemini_key_pool
  features_admin --> features_progress_and_rewards
  features_admin --> features_jumble_words
  features_admin --> features_pronunciation
  features_ai_partner --> architecture_gemini_live
  features_ai_partner --> architecture_gemini_key_pool
  features_ai_partner --> features_premium
  features_ai_partner --> features_progress_and_rewards
  features_ai_partner --> architecture_api
  features_jumble_words --> features_progress_and_rewards
  features_jumble_words --> features_premium
  features_jumble_words --> features_admin
  features_jumble_words --> architecture_database
  features_jumble_words --> architecture_api
  features_premium --> features_admin
  features_premium --> features_jumble_words
  features_premium --> features_pronunciation
  features_premium --> features_ai_partner
  features_progress_and_rewards --> architecture_database
  features_progress_and_rewards --> features_jumble_words
  features_progress_and_rewards --> features_pronunciation
  features_progress_and_rewards --> features_ai_partner
  features_progress_and_rewards --> features_admin
  features_pronunciation --> features_word_bank
  features_pronunciation --> architecture_gemini_key_pool
  features_pronunciation --> architecture_storage_r2
  features_pronunciation --> architecture_api
  features_pronunciation --> features_progress_and_rewards
  features_pronunciation --> features_premium
  features_support --> operations_credentials
  features_support --> features_admin
  features_support --> architecture_auth
  features_support --> architecture_api
  features_word_bank --> features_pronunciation
  features_word_bank --> features_admin
  meta_how_this_wiki_works --> log
  meta_how_this_wiki_works --> index
  meta_how_this_wiki_works --> meta_graph
  operations_credentials --> operations_deployment
  operations_credentials --> architecture_auth
  operations_credentials --> architecture_storage_r2
  operations_credentials --> architecture_gemini_key_pool
  operations_deployment --> operations_runbook
  operations_deployment --> operations_credentials
  operations_deployment --> architecture_system
  operations_runbook --> architecture_gemini_key_pool
  operations_runbook --> operations_credentials
  operations_runbook --> operations_deployment
  operations_runbook --> architecture_database
  overview --> features_jumble_words
  overview --> features_pronunciation
  overview --> features_ai_partner
  overview --> features_progress_and_rewards
  overview --> features_word_bank
  overview --> features_support
  overview --> architecture_auth
  overview --> features_premium
  overview --> architecture_system
  overview --> features_admin
  meta_graph --> index
  meta_graph --> meta_how_this_wiki_works
```

## Which pages cite which decisions
| Page | Decisions |
|---|---|
| [[architecture/auth]] | D-008, D-024, D-025, D-020, D-009, D-023 |
| [[architecture/database]] | D-013 |
| [[architecture/gemini-key-pool]] | D-027, D-011 |
| [[architecture/gemini-live]] | D-026 |
| [[architecture/system]] | D-002 |
| [[features/admin]] | D-023, D-018 |
| [[features/ai-partner]] | D-026 |
| [[features/premium]] | D-010 |
| [[features/support]] | D-029 |
| [[log]] | D-008, D-011, D-009, D-019, D-021, D-022, D-026, D-024, D-025, D-023, D-029, D-027, D-028, D-030 |
| [[meta/how-this-wiki-works]] | D-028 |
| [[operations/credentials]] | D-027, D-024, D-025, D-023 |
| [[operations/deployment]] | D-022 |

## Decisions (from docs/memory/DECISIONS.md)
| Id | Decision | Status | Cited by |
|---|---|---|---|
| D-001 | Repo layout: one git repo at `ENG/` | active | [[memory/status]] |
| D-002 | Backend = Supabase (Postgres + Auth) + Next.js route handlers | active | [[architecture/system]] |
| D-003 | Auth: keep NextAuth Google sign-in, swap the token exchange to Supabase | superseded → D-008 | — |
| D-004 | AI Partner = Gemini Live, browser ↔ Google directly via ephemeral tokens | active | — |
| D-005 | Gemini quotas are per **Google Cloud project**, not per key | active | — |
| D-006 | Key pool design (rotation, cooldown, admin page) | active | — |
| D-007 | AI Partner keeps its UI; only the plumbing under it changes | active | — |
| D-008 | Auth = Supabase Auth ONLY (Google + email/password); NextAuth removed | active | [[architecture/auth]] [[log]] |
| D-009 | Single active session uses the Supabase JWT `session_id` claim | active | [[architecture/auth]] [[log]] |
| D-010 | /pro invite link grants Pro only to NEWLY created accounts | superseded → D-021 | [[features/premium]] |
| D-011 | Gemini key tiers: free first, paid only as last resort | active | [[architecture/gemini-key-pool]] [[log]] |
| D-012 | Gemini Live wire details (verified by live probes, 2026-09-22) | active | — |
| D-013 | Never name columns after PostgREST reserved words | active | [[architecture/database]] |
| D-014 | Pronunciation scoring | active | — |
| D-015 | Default game economics & free-tier limits (admin-editable) | active | — |
| D-016 | Tooling: no Doppler; env via .env.local / Vercel; pnpm 11 via npx | active | — |
| D-017 | Migrations are applied with `supabase/apply-migrations.mjs` | active | — |
| D-018 | No self-HTTP on the server; API base is same-origin | active | [[features/admin]] |
| D-019 | Project knowledge = Karpathy "LLM Wiki" pattern | active | [[log]] |
| D-020 | Our own email-send limits on top of Supabase's | active | [[architecture/auth]] |
| D-021 | /pro link grants Pro to new AND existing accounts (once each) | active | [[log]] |
| D-022 | Vercel builds with explicit pnpm 11 commands; email links handled client-side | active | [[log]] [[operations/deployment]] [[memory/status]] |
| D-023 | Admin is ec.devbx@gmail.com | active | [[architecture/auth]] [[features/admin]] [[log]] [[operations/credentials]] |
| D-024 | Google sign-in enabled in Supabase | active | [[architecture/auth]] [[log]] [[operations/credentials]] |
| D-025 | Auth email via Resend SMTP (no verified domain yet) | active | [[architecture/auth]] [[log]] [[operations/credentials]] |
| D-026 | AI Partner session setup: language × level × mode × voice (ENGAI-style) | active | [[architecture/gemini-live]] [[features/ai-partner]] [[log]] |
| D-027 | The 7 free Gemini keys are from different Google Cloud projects | active | [[architecture/gemini-key-pool]] [[log]] [[operations/credentials]] |
| D-028 | Graph memory = generated from the wiki (`docs/wiki/graph.json`) | active | [[log]] [[meta/how-this-wiki-works]] |
| D-029 | Customer support panel: navbar "Help" dropdown → ticket + Resend email | active | [[features/support]] [[log]] |
| D-030 | Verification scripts live in `scripts/`; the workflow is written in CLAUDE.md | active | [[log]] [[memory/status]] |

## Lint
- ✅ no broken links, mismatches or orphans

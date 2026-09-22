---
title: Database (Supabase Postgres)
type: architecture
tags: [database, supabase, postgres, rls]
links: [architecture/system, features/progress-and-rewards, architecture/gemini-key-pool, operations/runbook]
updated: 2026-09-22
---

# Database — Supabase Postgres 17

Project ref `uycpxwajvhcigyhvepci`. Schema source of truth: `supabase/migrations/*.sql`, applied
with `node supabase/apply-migrations.mjs` ([[operations/runbook]]).

## Access model
- The Next.js server uses the **secret (service-role) key** and enforces all rules.
- **RLS is on for every table.** Learner-owned tables have *read-own-rows* policies only; no table
  accepts writes from the browser keys. Secret tables (Gemini keys, settings, leases) have no
  policies at all and privileges revoked from `anon`/`authenticated`. Verified 2026-09-22.
- Business functions are `security definer` and `execute` is revoked from public roles.

## Tables
| Group | Tables |
|---|---|
| Identity & progress | `profiles` (1:1 auth.users; created by trigger `on_auth_user_created`), `user_attributes` (xp, level, streak, combos, cursors, progressive_sets), `user_badges`, `activity`, `daily_usage` |
| Catalogs | `levels`, `badges`, `feature_flags`, `app_settings` (JSON docs: jumble, pronunciation_timings, ai_partner_rewards, quotas, pro_trial, pro_invite) |
| Content | `problems` (category jumble/pronunciation; difficulty; `sort_order`; progressive `base`/`variant`; `initial`/`final`), `problem_rewards` (XP once per problem per IST day) |
| Practice | `pronunciation_attempts` (words JSON, audio_key in R2), `word_bank` |
| AI Partner | `chat_sessions` (billing, talk-time, XP, lease), `chat_messages`, `learner_memory` |
| Premium | `pro_trial_applications`, `feedback`, `pro_invite_signups`, `subscriptions` |
| Gemini pool | `gemini_api_keys`, `gemini_key_lanes`, `gemini_key_leases`, `gemini_key_events`, view `gemini_key_overview` |

## Functions
| Function | Purpose |
|---|---|
| `award_progress(user, game, xp, combo, …)` | The ONLY writer of XP/level/streak/combo/badges; returns totals + new badges |
| `level_for_xp`, `recompute_levels` | Level math; re-derive after admin edits |
| `grant_badge` | One-off badges (onboarding) |
| `leaderboard_rows(metric)` | Ranked rows for xp / streak / weekly |
| `bump_daily_usage` | Free-tier counters (IST day) |
| `gemini_lease_key`, `gemini_heartbeat_lease`, `gemini_release_lease`, `gemini_refresh_key_states`, `next_pacific_midnight` | Key pool ([[architecture/gemini-key-pool]]) |
| `ist_today`, `set_updated_at`, `handle_new_user` | Helpers / triggers |

## Rules
- Never name a column after a PostgREST keyword (`order`, `count`, `select`, `limit`…) — D-013.
- Times: learner days are **IST**; Gemini quota days are **Pacific**.

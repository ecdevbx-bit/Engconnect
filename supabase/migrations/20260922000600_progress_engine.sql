-- ════════════════════════════════════════════════════════════════════
-- Progress engine: the ONE place XP, streaks, combos, levels and badges
-- change. Every game calls award_progress() inside a single transaction,
-- so two quick submits can never double-count or lose XP.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.level_for_xp(p_xp int)
returns int
language sql
stable
as $$
  select coalesce((select max(level) from public.levels where threshold <= p_xp), 1);
$$;

-- award_progress
--   p_game       : 'jumble' | 'pronunciation' | 'ai-partner'
--   p_xp         : XP to add (0 is fine — e.g. a wrong answer)
--   p_combo      : 'inc' (correct), 'reset' (wrong), 'keep'
--   p_log        : write an activity row (only when XP > 0)
--   p_progset    : this solve completed a progressive set
-- Returns: { totalXp, currentLevel, leveledUp, combo, streak,
--            newlyEarnedBadges (never includes lvl:*), progressiveSets }
create or replace function public.award_progress(
  p_user          uuid,
  p_game          text,
  p_xp            int,
  p_combo         text default 'keep',
  p_difficulty    text default '',
  p_problem_order int default 0,
  p_log           boolean default true,
  p_progset       boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a            user_attributes%rowtype;
  today        date := ist_today();
  new_xp       int;
  new_level    int;
  new_streak   int;
  combo_val    int;
  new_badges   text[];
begin
  insert into user_attributes (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into a from user_attributes where user_id = p_user for update;

  new_xp := a.xp + greatest(coalesce(p_xp, 0), 0);

  -- Daily streak: any XP-earning action on a new IST day extends it.
  new_streak := a.activity_streak;
  if p_xp > 0 then
    if a.last_active_day = today then
      new_streak := greatest(a.activity_streak, 1);
    elsif a.last_active_day = today - 1 then
      new_streak := a.activity_streak + 1;
    else
      new_streak := 1;
    end if;
  end if;

  combo_val := coalesce((a.combos ->> p_game)::int, 0);
  if p_combo = 'inc' then
    combo_val := combo_val + 1;
  elsif p_combo = 'reset' then
    combo_val := 0;
  end if;

  new_level := level_for_xp(new_xp);

  update user_attributes
     set xp = new_xp,
         current_level = new_level,
         activity_streak = new_streak,
         best_streak = greatest(best_streak, new_streak),
         last_active_day = case when p_xp > 0 then today else last_active_day end,
         combos = jsonb_set(combos, array[p_game], to_jsonb(combo_val), true),
         progressive_sets = progressive_sets + case when p_progset then 1 else 0 end
   where user_id = p_user
  returning * into a;

  if p_log and p_xp > 0 then
    insert into activity (user_id, category, difficulty, problem_order, xp_earned)
    values (p_user, p_game, coalesce(p_difficulty, ''), coalesce(p_problem_order, 0), p_xp);
  end if;

  -- Badges: everything the learner now qualifies for and doesn't own yet.
  with candidates as (
    select b.id
      from badges b
     where b.active
       and (
            (b.category = 'xp' and b.threshold <= a.xp)
         or (b.category = 'streak' and b.threshold <= a.activity_streak)
         or (b.category = 'combo' and b.game = p_game and b.threshold <= combo_val)
         or (b.category = 'progset' and b.threshold <= a.progressive_sets)
       )
    union
    -- a level card for every level reached (driven by leveledUp on the client)
    select 'lvl:' || l.level from levels l where l.level <= a.current_level
  ),
  inserted as (
    insert into user_badges (user_id, badge_id)
    select p_user, c.id from candidates c
    on conflict do nothing
    returning badge_id
  )
  select coalesce(array_agg(badge_id order by badge_id), '{}')
    into new_badges
    from inserted
   where badge_id not like 'lvl:%';

  return jsonb_build_object(
    'totalXp', a.xp,
    'currentLevel', a.current_level,
    'leveledUp', a.current_level > level_for_xp(new_xp - greatest(coalesce(p_xp, 0), 0)),
    'combo', combo_val,
    'streak', a.activity_streak,
    'progressiveSets', a.progressive_sets,
    'newlyEarnedBadges', to_jsonb(new_badges)
  );
end;
$$;

-- After an admin edits the level ladder, re-derive everyone's level.
-- (No level-up celebrations or lvl:* badges are issued retroactively.)
create or replace function public.recompute_levels()
returns void
language sql
security definer
set search_path = public
as $$
  update user_attributes set current_level = level_for_xp(xp)
   where current_level is distinct from level_for_xp(xp);
$$;

-- Grant a one-off badge (e.g. onboarding:1). Returns true when newly earned.
create or replace function public.grant_badge(p_user uuid, p_badge text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_badges (user_id, badge_id) values (p_user, p_badge)
  on conflict do nothing;
  return found;
end;
$$;

-- ── leaderboard ─────────────────────────────────────────────────────
-- Returns every ranked learner for a metric, best first. Fine up to tens of
-- thousands of learners; switch to a materialized view beyond that.
--   xp     : lifetime XP
--   streak : current daily streak
--   weekly : XP earned since Monday 00:00 IST
create or replace function public.leaderboard_rows(p_metric text)
returns table (rank bigint, user_id uuid, name text, avatar text, value bigint)
language sql
stable
security definer
set search_path = public
as $$
  with week_start as (
    select ((date_trunc('week', now() at time zone 'Asia/Kolkata'))
            at time zone 'Asia/Kolkata') as ts
  ),
  scored as (
    select ua.user_id,
           case p_metric
             when 'streak' then ua.activity_streak::bigint
             when 'weekly' then coalesce((
               select sum(x.xp_earned) from activity x, week_start w
                where x.user_id = ua.user_id and x.created_at >= w.ts), 0)::bigint
             else ua.xp::bigint
           end as value,
           ua.updated_at
      from user_attributes ua
  )
  select row_number() over (order by s.value desc, s.updated_at asc) as rank,
         s.user_id,
         coalesce(nullif(p.name, ''), 'Learner') as name,
         p.avatar,
         s.value
    from scored s
    join profiles p on p.id = s.user_id
   where s.value > 0;
$$;

revoke execute on function public.award_progress(uuid, text, int, text, text, int, boolean, boolean),
                           public.recompute_levels(),
                           public.grant_badge(uuid, text),
                           public.leaderboard_rows(text)
  from public, anon, authenticated;

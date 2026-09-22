-- ════════════════════════════════════════════════════════════════════
-- Default catalogs. All admin-editable afterwards (/v3/admin/*); these
-- inserts never overwrite an existing row.
-- ════════════════════════════════════════════════════════════════════

-- Levels — mirrors DEFAULT_LEVEL_DEFINITIONS in frontend/src/lib/levels.ts.
insert into public.levels (level, threshold, title, icon) values
  (1,     0, 'Hello World',       'Sparkles'),
  (2,   100, 'Word Collector',    'BookOpen'),
  (3,   250, 'Sentence Builder',  'Puzzle'),
  (4,   500, 'Conversationalist', 'MessageCircle'),
  (5,   850, 'Storyteller',       'BookText'),
  (6,  1300, 'Linguist',          'Languages'),
  (7,  1900, 'Orator',            'Mic'),
  (8,  2700, 'Wordsmith',         'Feather'),
  (9,  3700, 'Polyglot',          'Globe2'),
  (10, 5000, 'Eloquent',          'Crown')
on conflict (level) do nothing;

-- Badges. id = category[:game]:threshold (see frontend/src/lib/badges.ts).
insert into public.badges (id, category, game, threshold) values
  ('onboarding:1', 'onboarding', null, 1),
  ('xp:100',   'xp', null, 100),
  ('xp:500',   'xp', null, 500),
  ('xp:1000',  'xp', null, 1000),
  ('xp:2500',  'xp', null, 2500),
  ('xp:5000',  'xp', null, 5000),
  ('xp:10000', 'xp', null, 10000),
  ('streak:3',   'streak', null, 3),
  ('streak:7',   'streak', null, 7),
  ('streak:14',  'streak', null, 14),
  ('streak:30',  'streak', null, 30),
  ('streak:60',  'streak', null, 60),
  ('streak:100', 'streak', null, 100),
  ('combo:jumble:5',   'combo', 'jumble', 5),
  ('combo:jumble:10',  'combo', 'jumble', 10),
  ('combo:jumble:25',  'combo', 'jumble', 25),
  ('combo:jumble:50',  'combo', 'jumble', 50),
  ('combo:pronunciation:3',  'combo', 'pronunciation', 3),
  ('combo:pronunciation:5',  'combo', 'pronunciation', 5),
  ('combo:pronunciation:10', 'combo', 'pronunciation', 10),
  ('combo:pronunciation:25', 'combo', 'pronunciation', 25),
  ('combo:ai-partner:3',  'combo', 'ai-partner', 3),
  ('combo:ai-partner:5',  'combo', 'ai-partner', 5),
  ('combo:ai-partner:10', 'combo', 'ai-partner', 10),
  ('progset:1',  'progset', null, 1),
  ('progset:2',  'progset', null, 2),
  ('progset:3',  'progset', null, 3),
  ('progset:5',  'progset', null, 5),
  ('progset:7',  'progset', null, 7),
  ('progset:9',  'progset', null, 9),
  ('progset:10', 'progset', null, 10)
on conflict (id) do nothing;

-- Feature flags. AI Partner starts ON here because the Gemini Live rebuild
-- is the point of this backend; flip it off in /v3/admin/feature-flags to
-- show the "upgrading" modal again.
insert into public.feature_flags (key, enabled, description) values
  ('englishconnection-pronunciation', true,  'Pronunciation Coach tab'),
  ('englishconnection-lang-carousel', true,  'Language carousel on the landing page'),
  ('englishconnection-word-bank',     false, 'Word Bank page + save-words wallet in Pronunciation'),
  ('englishconnection-ai-partner',    true,  'AI Partner (K.AI on Gemini Live). Off ⇒ "upgrading" modal')
on conflict (key) do nothing;

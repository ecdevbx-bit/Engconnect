-- The language a learner was most comfortable speaking with K.AI, noted after
-- every conversation (free and Pro), so the next call starts in it (D-059).
alter table public.learner_memory add column if not exists comfort_language text;

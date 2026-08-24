-- ZYVA v17 — English / Greek event descriptions
-- Run once in the Supabase SQL Editor before deploying v17.
-- Safe to run more than once.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS description_el TEXT;

COMMENT ON COLUMN public.events.description_el IS
  'Optional Greek event description; manually supplied or generated once during admin approval.';

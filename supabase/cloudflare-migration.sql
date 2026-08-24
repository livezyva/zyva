-- ZYVA — Cloudflare migration helper
-- Run once in Supabase SQL Editor after the Cloudflare deployment is ready.
-- Moves the nightly cleanup schedule from Netlify to Supabase Cron.
-- Safe to re-run: an existing ZYVA cleanup job is removed first.

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid
    INTO existing_job_id
    FROM cron.job
   WHERE jobname = 'zyva-cleanup-events'
   LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END
$$;

SELECT cron.schedule(
  'zyva-cleanup-events',
  '0 2 * * *',
  $$DELETE FROM events WHERE end_datetime < NOW() - INTERVAL '7 days'$$
);

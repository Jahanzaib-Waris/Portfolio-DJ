-- ==============================================================================
-- radar_cron.sql — runs the radar-ingest Edge Function every day.
-- Run once in the Supabase SQL Editor AFTER radar.sql and after deploying the
-- function (see docs/DEPLOYMENT.md §8).
--
-- Needs two Vault secrets (the first is shared with quote_notify.sql):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as RADAR_CRON_SECRET>', 'radar_cron_secret');
--
-- pg_cron schedules are in UTC. 03:00 UTC = 08:00 in Pakistan; change as needed.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove a previous schedule so this file can be re-run.
DO $$
BEGIN
    PERFORM cron.unschedule('radar-ingest-daily');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
    'radar-ingest-daily',
    '0 3 * * *',
    $job$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1)
               || '/functions/v1/radar-ingest',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'radar_cron_secret' LIMIT 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
    );
    $job$
);

-- ==============================================================================
-- quote_notify.sql — calls the `quote-notify` Edge Function whenever a quote
-- request is submitted. Run once in the Supabase SQL Editor AFTER deploying the
-- function and setting its secrets (see docs/DEPLOYMENT.md §7).
--
-- Not part of schema.sql because it depends on two Vault secrets you create:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as QUOTE_WEBHOOK_SECRET>', 'quote_webhook_secret');
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_quote_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
    v_url TEXT;
    v_secret TEXT;
BEGIN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'quote_webhook_secret' LIMIT 1;

    IF v_url IS NOT NULL AND v_secret IS NOT NULL THEN
        PERFORM net.http_post(
            url := v_url || '/functions/v1/quote-notify',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', v_secret
            ),
            body := jsonb_build_object('record', to_jsonb(NEW))
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- A notification problem must never block a visitor's quote submission.
    RAISE WARNING 'notify_quote_insert failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_quote_insert() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_quote_insert ON public.quote_requests;
CREATE TRIGGER trg_notify_quote_insert
    AFTER INSERT ON public.quote_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_quote_insert();

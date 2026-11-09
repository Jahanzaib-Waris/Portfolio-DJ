-- ==============================================================================
-- visitors.sql — link website visitors to leads (consented, same-browser only).
-- Run once in the Supabase SQL Editor (or `supabase db query --linked -f`). Idempotent.
--
--   quote_requests.visitor_id   the visitor's random browser ID, sent with the quote form
--   crm_leads.track_token       random token used in tracked links inside your pitches
--   visitor_links               which browser IDs belong to which lead (admin-only)
--   link_visitor(token, id)     called from the public site when a tracked link is opened
--   cleanup_old_page_views()    anonymous views deleted after N days; views of linked
--                               visitors are kept for 365 days (scheduled weekly below)
--
-- No fingerprinting, no IP lookups: a link exists only because the person submitted the
-- quote form or opened a link you sent them, and tracking can be switched off per
-- browser (see /privacy).
-- ==============================================================================

-- 1. Quote form carries the visitor's browser ID
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS visitor_id TEXT DEFAULT '';

-- 2. Each lead gets a random, unguessable token for tracked links
ALTER TABLE public.crm_leads
    ADD COLUMN IF NOT EXISTS track_token TEXT DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
UPDATE public.crm_leads
    SET track_token = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
    WHERE track_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_track_token ON public.crm_leads (track_token);

-- 3. Visitor <-> lead links
CREATE TABLE IF NOT EXISTS public.visitor_links (
    visitor_id TEXT NOT NULL,
    lead_id BIGINT NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'link',        -- 'quote' | 'link'
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (visitor_id, lead_id)
);
CREATE INDEX IF NOT EXISTS idx_visitor_links_lead ON public.visitor_links (lead_id);

ALTER TABLE public.visitor_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin visitor_links all" ON public.visitor_links;
CREATE POLICY "Admin visitor_links all" ON public.visitor_links
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Public entry point used when a visitor opens a tracked link (?ref=<token>).
--    It never reveals whether a token exists and ignores malformed input.
CREATE OR REPLACE FUNCTION public.link_visitor(p_token TEXT, p_visitor TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead BIGINT;
BEGIN
    IF p_token IS NULL OR p_visitor IS NULL
       OR p_token !~ '^[a-f0-9]{16}$'
       OR p_visitor !~ '^s_[a-z0-9]{6,32}$' THEN
        RETURN;
    END IF;

    SELECT id INTO v_lead FROM public.crm_leads WHERE track_token = p_token;
    IF v_lead IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public.visitor_links (visitor_id, lead_id, source)
    VALUES (p_visitor, v_lead, 'link')
    ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.link_visitor(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_visitor(TEXT, TEXT) TO anon, authenticated;

-- 5. Retention: anonymous page views expire after `retention_days` (default 90);
--    views from visitors linked to a lead are kept for 365 days.
--    Callable by admins, the service role, and scheduled jobs (not by anonymous visitors).
CREATE OR REPLACE FUNCTION public.cleanup_old_page_views(retention_days INT DEFAULT 90)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted BIGINT;
    v_cutoff TIMESTAMPTZ;
    v_linked_cutoff TIMESTAMPTZ;
BEGIN
    IF auth.role() = 'anon' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    retention_days := GREATEST(7, LEAST(retention_days, 365));
    v_cutoff := TIMEZONE('utc', NOW()) - (retention_days || ' days')::INTERVAL;
    v_linked_cutoff := TIMEZONE('utc', NOW()) - INTERVAL '365 days';

    DELETE FROM public.page_views
    WHERE created_at < v_cutoff
      AND (
          session_key NOT IN (SELECT visitor_id FROM public.visitor_links)
          OR created_at < v_linked_cutoff
      );

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_page_views(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_page_views(INT) TO authenticated, service_role;

-- 6. Run the cleanup every Sunday at 03:30 UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
    PERFORM cron.unschedule('page-views-retention-weekly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
SELECT cron.schedule('page-views-retention-weekly', '30 3 * * 0', $job$ SELECT public.cleanup_old_page_views(90); $job$);

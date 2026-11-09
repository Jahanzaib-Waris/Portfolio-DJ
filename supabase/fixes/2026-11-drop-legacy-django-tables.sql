-- ==============================================================================
-- One-time cleanup (2026-11-09): remove the tables left behind by the retired Django
-- backend (backend/). The app only uses the Supabase tables from schema.sql.
--
-- Before running: all 267 rows were exported to a local JSON backup. Legacy page views
-- (84 rows, Sept 2026) were NOT copied into page_views; they exist only in that backup.
--
-- Two old storage policies referenced public.auth_user (Django staff check). They were
-- redundant with "Admin delete storage media" and "Public read storage media", and
-- must go first. No CASCADE is used: any unexpected dependency makes this fail and roll back.
-- ==============================================================================
BEGIN;

DROP POLICY IF EXISTS "Admin media read (relaxed)"   ON storage.objects;
DROP POLICY IF EXISTS "Admin media delete (relaxed)" ON storage.objects;

DROP TABLE
  public.token_blacklist_blacklistedtoken,
  public.token_blacklist_outstandingtoken,
  public.auth_user_user_permissions,
  public.auth_user_groups,
  public.auth_group_permissions,
  public.auth_group,
  public.auth_permission,
  public.django_admin_log,
  public.django_content_type,
  public.django_session,
  public.django_cache,
  public.django_migrations,
  public.auth_user,
  public.analytics_pageview,
  public.blog_blogpost,
  public.profiles_profile,
  public.profiles_skill,
  public.projects_project,
  public.quotes_quoterequest,
  public.sitesettings_sitebranding,
  public.sitesettings_sitetheme;

COMMIT;

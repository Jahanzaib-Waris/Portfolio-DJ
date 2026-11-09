# Deployment Guide

Stack: **Firebase Hosting** (React SPA) + **Supabase** (Postgres, Auth, Storage, Edge Functions).

There is no application server. The browser talks to Supabase directly with the public anon key, and Row Level Security decides what each caller may do. The legacy Django app in `backend/` is not part of deployment (see `docs/ARCHITECTURE.md` §1).

> **Never paste real credentials into this file or any tracked file.** The Supabase **anon** key is designed to be public, but the **service-role** key, database password, and any third-party API keys must never be committed or placed in `frontend/.env`.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) and note the **Project URL** and **anon key** (Project Settings → API).
2. **Schema:** SQL Editor → paste and run `supabase/schema.sql`. It is idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ON CONFLICT DO NOTHING`), so re-running after edits is safe. It creates the tables, RLS policies, the public-read `media` storage bucket and its write policies, the analytics RPCs, the CRM tables, and seed rows (branding, theme, starter posts).
3. **Optional content:** run `supabase/seed_scheduled_blogs.sql` for the dated editorial-calendar posts.
4. **Admin user:** Authentication → Users → Add user (email + password). This is the account you sign into `/admin` with.
5. **Disable public sign-ups:** Authentication → Sign In / Providers → turn off "Allow new users to sign up". RLS treats *any* authenticated user as admin, so open sign-ups would make everyone an admin.

## 2. Deploy the Edge Functions

Two Deno functions, both with `verify_jwt = true` (see `supabase/config.toml`): `ai-proxy` and `apollo-proxy`.

```bash
supabase login
supabase functions deploy ai-proxy     --project-ref <project-ref>
supabase functions deploy apollo-proxy --project-ref <project-ref>
```

The current project ref is `fbeegpzrbocqgyxeqqtc`. The functions need no secrets of their own: they use the auto-provided `SUPABASE_URL` / `SUPABASE_ANON_KEY` to verify the caller, and third-party keys arrive per-request from the admin's browser.

## 3. Configure and build the frontend

```bash
cd frontend
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

```bash
npm install
npm run lint
npm run build          # outputs frontend/dist
```

Vite inlines `VITE_*` values at build time, so rebuild after changing them.

## 4. Deploy to Firebase Hosting

`firebase.json` serves `frontend/dist`, rewrites every path to `/index.html` (SPA routing), and sets long-lived immutable caching on js/css/font files. The Firebase project is `jerry-dev-studio` (`.firebaserc`).

```bash
firebase login
firebase deploy --only hosting
# or: npx -y firebase-tools deploy --only hosting
```

Live at https://jerry-dev-studio.web.app/.

## 5. Populate content

Sign in at `/admin/login` with the admin user from step 1.4, then fill in Profile, Skills, Projects, Blog posts, Branding and Theme. Uploads go to the `media` bucket.

Open `/admin/settings/integrations` to enter AI provider and Apollo keys. They are stored in that browser's `localStorage` only, so repeat this on each device you use.

## 6. Verify end to end

Run `docs/QUICK-TEST.md` against the live site. Key signals:

- Home loads real profile/projects (confirms anon reads + RLS read policies).
- The quote form submits and the row appears in `/admin/quotes` (confirms the anon INSERT policy).
- A future-dated post is **not** visible on `/blogs` while signed out (confirms the scheduling RLS).
- Image upload in the admin works (confirms the storage policies).
- Pitch generation / Apollo enrichment return results rather than 401 (confirms the Edge Functions and JWT).

## 7. Quote alerts and auto-reply (optional)

The `quote-notify` Edge Function emails you (and/or posts to a chat webhook) when someone submits the quote form, creates the CRM lead automatically, and can send the submitter a short acknowledgement. It is called by a database trigger, not by browsers.

1. Choose an email provider. The function uses [Resend](https://resend.com) (HTTP API); verify a sending domain there so `FROM_EMAIL` can be on your own domain. Skip this step if you only want a chat webhook.
2. Set the function's secrets:
   ```bash
   supabase secrets set --project-ref <project-ref> \
     QUOTE_WEBHOOK_SECRET=<long random string> \
     RESEND_API_KEY=<key> NOTIFY_EMAIL=<where alerts go> \
     FROM_EMAIL="Jerry Dev Studio <hello@yourdomain.com>" \
     AUTO_REPLY=true            # omit to disable the submitter acknowledgement
   # optional: NOTIFY_WEBHOOK_URL=<Slack/Discord incoming webhook>
   ```
3. Deploy it: `supabase functions deploy quote-notify --project-ref <project-ref>` (`verify_jwt = false` is set in `config.toml`; the function authenticates the trigger with the `x-webhook-secret` header instead).
4. In the SQL Editor create the two Vault secrets named in `supabase/quote_notify.sql` (`project_url` and `quote_webhook_secret`, the latter equal to `QUOTE_WEBHOOK_SECRET`), then run that file to create the trigger.
5. Submit a test quote and check the function logs (Dashboard → Edge Functions → quote-notify → Logs). A failed notification never blocks the submission.

Abuse note: the quote form is public, so the auto-reply is limited to one per email address per 24 hours and 20 per hour overall, and never repeats what the submitter typed. If you see misuse, set `AUTO_REPLY` off.

## 8. Server-side Client Radar (optional, recommended)

By default Client Radar fetches posts live in your browser. This step makes the server fetch them daily, store them (with history and a dismissed/imported status shared across devices), and email you a digest of new contract-fit posts.

1. **Create the tables.** Run `supabase/radar.sql` in the SQL Editor. It adds the `radar_items` table and a `source_url` column on `crm_leads`. Idempotent.
2. **Set secrets** for the function (the email ones are only needed for the digest, and are the same as in §7):
   ```bash
   supabase secrets set --project-ref <project-ref> \
     RADAR_CRON_SECRET=<long random string> \
     RESEND_API_KEY=<key> NOTIFY_EMAIL=<where the digest goes> \
     FROM_EMAIL="Jerry Dev Studio <hello@yourdomain.com>"
   # optional: NOTIFY_WEBHOOK_URL=<Slack/Discord webhook>  DIGEST_MIN_SCORE=65
   ```
3. **Deploy:** `supabase functions deploy radar-ingest --project-ref <project-ref>`. The function imports shared code from `supabase/functions/_shared/radar/`, which the CLI bundles automatically.
4. **Run it once** from Client Radar → "Refresh Feeds" (signed in as admin). The page header changes from "Live results fetched in your browser" to "Stored results, last fetched …". Check the function logs if it doesn't.
5. **Schedule it.** Create the Vault secrets named in `supabase/radar_cron.sql` (`project_url`, and `radar_cron_secret` equal to `RADAR_CRON_SECRET`), then run that file. It schedules a daily run at 03:00 UTC (08:00 in Pakistan); edit the cron expression to change it. List jobs with `select * from cron.job;` and their results with `select * from cron.job_run_details order by start_time desc limit 5;`.

Until step 1 is done, Client Radar keeps working in live mode, so the order above is safe. The digest includes only posts that are new, not full-time-only, and scoring at least `DIGEST_MIN_SCORE`, and each post is emailed once. Posts you never act on are deleted after 45 days without being seen again; dismissed and imported posts are kept.

## Notes

- **Schema changes** are applied by running SQL in the Supabase SQL Editor; update `supabase/schema.sql` in the same commit so it stays the source of truth. `schema.sql` is for fresh setups: `INSERT ... ON CONFLICT DO NOTHING` seed rows never overwrite an existing row, so changed defaults (e.g. the theme fonts) do not alter a live database — change those through the admin UI.
- **Free-tier pausing.** Supabase pauses idle free projects after about a week. A paused project can stop resolving in DNS, which looks like the project was deleted (`ENOTFOUND`). Check the dashboard for "Paused" and restore it before debugging anything else.
- **Analytics retention.** `cleanup_old_page_views(retention_days)` trims old `page_views` rows, but it rejects anything that is not an authenticated JWT, so it cannot be run from the SQL Editor and no admin UI calls it yet. Invoke it with `supabase.rpc('cleanup_old_page_views', { retention_days: 90 })` from a signed-in session (e.g. the browser console on `/admin`), or schedule it with `pg_cron` after relaxing that check.
- **Static SEO files.** `frontend/public/sitemap.xml` and `feed.xml` are hand-maintained; update them when publishing new posts.
- **Custom domain.** Add it under Firebase Hosting → Add custom domain, then update the canonical URL base in `useDocumentMeta.js`, `index.html`, `sitemap.xml`, `feed.xml`, and `robots.txt`.
- **Rollback.** Firebase Hosting keeps release history; roll back from the Hosting console.

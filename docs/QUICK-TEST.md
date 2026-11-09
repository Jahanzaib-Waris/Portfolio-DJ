# Quick test pass

A fast, surface-level walkthrough to confirm the live site works end to end — about 15 minutes,
no technical depth required. For a thorough checklist, see `TESTING.md` instead.

Site: `https://jerry-dev-studio.web.app` · Admin: `https://jerry-dev-studio.web.app/admin`

## 1. Public site (5 min)

- [ ] Homepage loads — hero, tech stack, featured work, footer all show up
- [ ] Nav links work: Home, Solutions, Blogs, Projects
- [ ] Open a blog post from the list — content renders correctly (headings, links, code blocks,
      sticky table of contents, reading-progress bar)
- [ ] Open a project card — the case-study modal shows thumbnail, tags, repo/live links
- [ ] Click "Request Quote" (or the hero button) → fill the form → submit → see a success message
- [ ] Visit a made-up URL (e.g. add `/does-not-exist`) → a proper "Page not found" page, not a
      blank screen
- [ ] Resize the browser to ~320px wide — no horizontal scrollbar on any public page

## 2. Admin panel (8 min)

- [ ] Log in at `/admin/login` with the Supabase admin email + password
- [ ] Dashboard shows KPI cards, pipeline value, and action-required feeds
- [ ] Blog → open an existing post or create one → save → check it shows/updates on `/blogs`
- [ ] Blog → set a **future** publish date on a test post → it appears in the admin list but
      **not** on the public `/blogs` page (check in a private window)
- [ ] Projects → toggle "Featured" on one → confirm it appears in Home's "Featured Work"
- [ ] Quotes → the request you submitted in step 1 shows up here → "Convert to Deal" creates a
      lead in CRM → Pipeline
- [ ] Settings → Theme → change a color → Save → confirm the public site's accent changed
      (reload may be needed)
- [ ] Settings → Branding → change the site name → confirm it updates the browser tab title
- [ ] Settings → Integrations → "Test connection" for the configured AI provider succeeds (this
      exercises the Edge Function and JWT)
- [ ] Log out → confirm you land back on the login screen, and Back doesn't reveal the panel

## 3. Quick security/SEO spot-check (2 min)

- [ ] In a private window, open `/admin` → redirected to `/admin/login`
- [ ] Visit `/robots.txt`, `/sitemap.xml` and `/feed.xml` → plain text/XML, not the app shell
- [ ] Open Home, Blogs, and a blog post → the browser tab title is different on each
- [ ] In a private window, call a private table directly and expect an empty result or an error,
      never data (replace the placeholders with your project values):
      `curl "https://<project-ref>.supabase.co/rest/v1/quote_requests?select=*" -H "apikey: <anon key>"`

## If something fails

Note which checklist item broke and what you saw (screenshot helps) — that's enough to hand
back for a fix. No need to dig into *why* it broke yourself.

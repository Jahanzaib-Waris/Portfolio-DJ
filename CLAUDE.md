# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal developer portfolio + blog: Django REST Framework API (`backend/`) + React/Vite SPA
(`frontend/`), deployed as two separate Vercel projects backed by Supabase (Postgres + S3-style
Storage). The frontend has a public marketing site and a custom admin panel (JWT-authenticated,
staff-only) that replaces the Django admin for day-to-day content editing — including a
runtime-editable site theme (colors/fonts/borders/button style, applied via CSS custom
properties with no rebuild) and self-built traffic analytics.

**Read `docs/ARCHITECTURE.md` before making non-trivial changes.** It's the maintained system
reference — full data model, every API endpoint and its permissions, how JWT auth and
throttling actually work, all env vars, frontend routing/conventions, and a list of what's
deliberately not built. This file only covers commands and the architectural patterns that span
multiple files; ARCHITECTURE.md has the detail.

## Commands

### Backend (`cd backend`)

```bash
.venv/bin/python manage.py runserver              # dev server, http://127.0.0.1:8000/
.venv/bin/python manage.py test                   # full suite
.venv/bin/python manage.py test blog              # one app
.venv/bin/python manage.py test blog.tests.BlogPostReadTests.test_anonymous_list_excludes_drafts  # one test
.venv/bin/python manage.py makemigrations <app>   # after any models.py change
.venv/bin/python manage.py migrate                # local SQLite by default (zero setup, no .env needed)
.venv/bin/python manage.py check --deploy         # production security checklist
```

No `.venv`? `python -m venv .venv && .venv/bin/pip install -r requirements.txt`.

### Frontend (`cd frontend`)

```bash
npm run dev      # dev server, http://localhost:5173/ — proxies /api and /media to Django
npm run build    # production build (also the fastest way to typecheck-by-proxy — this is JS, not TS)
npm run lint     # oxlint
```

No dedicated frontend test runner exists — verification is manual (see `docs/TESTING.md`) or,
for visual/behavioral changes, driving a headless browser against the dev server.

### Production deploys need a manual migration step

Vercel functions have no persistent shell, so `migrate` / `createcachetable` are **never** run
at build time. After any migration-producing change, before it'll work live:

```bash
cd backend
vercel env pull .env.local --environment=production   # sensitive vars come back as literal "[SENSITIVE]" — paste real values by hand into .env
cp .env.local .env
python manage.py migrate
rm .env   # or local dev silently runs against production
```

Then `vercel deploy --prod` from the repo root (the linked project's root directory is
`backend`, so running from inside `backend/` double-resolves the path — always deploy from the
repo root).

**Gotcha already hit once:** Supabase's free tier auto-pauses a project after ~1 week idle, and
a paused project briefly stops resolving in DNS — this looks identical to the project being
deleted in Vercel's runtime logs (`ENOTFOUND`). Check the Supabase dashboard for "Paused" before
assuming data loss.

## Architecture patterns that span multiple files

**Singleton models** (`Profile`, `SiteBranding`, `SiteTheme`) all follow the same shape: a
`clean()` override raises if a second row would be created, and Django admin's
`has_add_permission` mirrors that. But the DRF views differ in one important way —
`ProfileView.get_object()` 404s until a row exists (POST creates it, 409 if one already exists),
while `BrandingView`/`ThemeView` use `get_or_create(pk=1)` so they never 404 — the public site
needs branding/theme on every page load and there's no meaningful "not configured" state for
those two. Follow whichever precedent matches a new singleton's actual usage pattern.

**Public-read/staff-write is the default permission shape**
(`config/permissions.py::IsAdminUserOrReadOnly`), applied to Profile, Skill, BlogPost, Project,
SiteBranding, SiteTheme. Quotes inverts it (`quotes/views.py::CreatePublicReadStaff`) — the
*write* is the public part (the contact form), reads are staff-only. When adding a new
content type, decide which shape it needs rather than assuming the default.

**Three independent throttle scopes** (`quotes`, `analytics`, `login`), all wired the same way:
a rate in `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES` (env-overridable), `ScopedRateThrottle` on the
view, and `throttle_scope` set to the scope name. For a ViewSet where only one action should be
throttled (quotes' `create`), override `get_throttles()` rather than setting `throttle_classes`
viewset-wide. Throttle counters live in the cache (`DatabaseCache` in production, since each
Vercel invocation is a fresh process — `LocMemCache` would reset them constantly), so tests that
touch a throttled endpoint must `cache.clear()` in `setUp` or an earlier test's counter bleeds
through.

**The theme system is CSS-custom-property-driven, not a build-time theme.** `index.css`'s
`@theme` block and component classes read values like `var(--theme-radius, 0.5rem)` with
fallbacks matching the shipped look. `frontend/src/utils/applyTheme.js` resolves the
`SiteTheme` API response into concrete values for those same custom properties and calls
`document.documentElement.style.setProperty(...)` once at `App.jsx` boot — this is what makes a
saved theme change apply site-wide immediately with no rebuild. Any new themeable visual
property needs to go through this same var-with-fallback pattern, not a hardcoded value, or the
editor can't actually control it.

**File-upload fields use a JSON-vs-multipart split**, implemented once in
`frontend/src/utils/buildPayload.js` and reused by every editor with an image field (Profile,
Project, Branding). Sending an *existing* file back as its URL string makes DRF try to parse the
URL as an upload and reject it — so the payload is plain JSON (omitting file fields, which
leaves them untouched) unless a *new* file was actually chosen, in which case it switches to
`FormData`. New editors with file fields should reuse this helper rather than reimplementing it.

**Access tokens live in memory only** (`frontend/src/auth/tokenStore.js`); refresh tokens are in
`localStorage`. Refresh is single-flight (`api/client.js`) because the server rotates refresh
tokens on every use — two concurrent 401s triggering two refreshes would have the second present
an already-blacklisted token and fail. Both requests must await one shared promise instead.

**Analytics tracking excludes the admin panel by construction, not by a route check** — the
`trackPageView` beacon fires from `PublicLayout`'s route-change effect, and admin routes render
under a completely separate layout (`AdminLayout`) that never mounts `PublicLayout`. If you ever
need admin routes to share chrome with the public layout, revisit whether that beacon should
fire there too.

# Portfolio-DJ — Project Reference

A personal developer portfolio and blog with a clean, GitHub-dark visual system. Django REST
Framework API + React (Vite) single-page frontend, deployed as two separate Vercel projects
backed by Supabase. The admin panel is a custom WordPress-style control panel: grouped
sidebar, live analytics, content CRUD, site settings, and a single runtime-editable theme.

Last updated: 2026-09-12.

---

## 1. Directory layout

```
Portfolio-DJ/
├── ARCHITECTURE.md          this file
├── README.md                setup instructions
├── DEPLOYMENT.md             step-by-step Vercel + Supabase deployment
├── TESTING.md                manual test checklist for the admin panel / public site
│
├── backend/                 Django project
│   ├── .python-version      pins Python 3.13 (Django 6.0 requires >=3.12)
│   ├── requirements.txt
│   ├── vercel.json          function config (maxDuration 30)
│   ├── manage.py
│   ├── config/               settings package (not an app)
│   │   ├── settings.py      all configuration, env-driven
│   │   ├── urls.py          root URL conf
│   │   ├── permissions.py   IsAdminUserOrReadOnly, shared by every content app
│   │   ├── pagination.py    StandardPagination (page_size query param, max 100)
│   │   └── wsgi.py / asgi.py
│   ├── accounts/             JWT auth + change-password (no models)
│   ├── profiles/              Profile (singleton) + Skill
│   ├── blog/                 BlogPost
│   ├── projects/              Project (has `is_featured`)
│   ├── quotes/                QuoteRequest
│   ├── sitesettings/          SiteBranding (singleton) + SiteTheme (singleton)
│   └── analytics/             PageView — tracking beacon + aggregated summary
│
└── frontend/                 React + Vite SPA
    ├── vercel.json           SPA rewrite (all paths -> index.html)
    ├── vite.config.js        dev proxy: /api and /media -> 127.0.0.1:8000
    ├── .oxlintrc.json
    └── src/
        ├── main.jsx          entry
        ├── App.jsx           route table + applies the site theme once at boot
        ├── index.css         theme tokens (CSS custom properties) + component classes
        ├── api/client.js      axios instance, auth interceptors, every API call
        ├── auth/
        │   ├── tokenStore.js     access token (memory) + refresh token (localStorage)
        │   ├── authContext.js    context + useAuth hook
        │   └── AuthProvider.jsx  session boot, login, logout
        ├── hooks/
        │   └── usePaginatedList.js   "Load more" pagination with URL-shareable depth
        ├── utils/
        │   ├── apiErrors.js      DRF error-shape helpers for forms
        │   ├── buildPayload.js   JSON-vs-multipart payload builder for file fields
        │   └── applyTheme.js     resolves SiteTheme -> CSS custom properties, live
        ├── components/
        │   ├── PublicLayout.jsx   navbar + footer + quote modal; fetches profile/
        │   │                      branding; fires the analytics tracking beacon
        │   ├── NavBar, Footer, StatusPanel, SystemButton, Skeleton,
        │   │   RequestQuoteModal
        │   └── admin/
        │       ├── RequireAuth.jsx      route guard
        │       ├── AdminLayout.jsx      grouped, collapsible sidebar shell
        │       ├── Field.jsx, formStyles.js, ConfirmDialog.jsx, MarkdownEditor.jsx
        │       └── AnalyticsChart.jsx   single-series line+area chart, no library
        └── pages/
            ├── Home, Blogs, BlogDetail, Projects
            └── admin/
                ├── AdminLogin.jsx, Dashboard.jsx
                ├── BlogList.jsx, BlogEditor.jsx
                ├── ProjectList.jsx, ProjectEditor.jsx
                ├── SkillsManager.jsx, ProfileEditor.jsx
                ├── QuoteInbox.jsx
                ├── Analytics.jsx
                └── settings/
                    ├── AccountSettings.jsx    password change
                    ├── BrandingSettings.jsx   site name, logo, favicon
                    └── ThemeEditor.jsx        colors, fonts, radius/shadow, button/card style
```

---

## 2. Stack and packages

No new dependencies were added building the admin dashboard, analytics, or theme system —
everything above is built on what was already here (DRF views/serializers, inline SVG for the
chart, CSS custom properties for the theme).

### Backend (`backend/requirements.txt`)

| Package | Version | Why it's here |
|---|---|---|
| `Django` | 6.0.6 | Web framework. **Requires Python ≥3.12** |
| `djangorestframework` | 3.17.1 | The API layer — serializers, viewsets, pagination, throttling |
| `djangorestframework-simplejwt` | 5.5.1 | JWT auth for the admin panel |
| `django-environ` | 0.14.0 | Reads config from `.env` / environment |
| `psycopg2-binary` | 2.9.12 | PostgreSQL driver (Supabase) |
| `Pillow` | 12.3.0 | Required by Django's `ImageField` |
| `django-cors-headers` | 4.9.0 | Frontend and backend are on different domains |
| `whitenoise` | 6.11.0 | Serves static files (Django admin CSS) without a separate host |
| `django-storages` | 1.14.6 | S3-compatible storage backend |
| `boto3` | 1.40.63 | S3 client used by django-storages |
| `gunicorn` | 23.0.0 | **Currently unused.** Left from the Render setup; Vercel's native Django support doesn't need it |

### Frontend (`frontend/package.json`)

| Package | Version | Why it's here |
|---|---|---|
| `react` / `react-dom` | ^19.2.7 | UI |
| `react-router-dom` | ^7.18.1 | Client-side routing |
| `axios` | ^1.18.1 | HTTP client |
| `react-markdown` | ^10.1.0 | Renders blog post bodies |
| `remark-gfm` | ^4.0.1 | GitHub-flavoured Markdown — tables, strikethrough, task lists |
| `vite` | ^8.1.1 | Build tool and dev server |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.2 | Styling (Tailwind v4, config lives in CSS) |
| `oxlint` | ^1.71.0 | Linter (`npm run lint`) |

---

## 3. Data model

**`profiles.Profile`** — singleton, enforced two ways: `clean()` raises if a second row is
created, and the admin hides the "Add" button once one exists.
`name`, `tagline`, `bio`, `photo`, `resume`, `email`, `github_url`, `linkedin_url`, `updated_at`

**`profiles.Skill`** — the home page tech-stack cards.
`name`, `description`, `display_order`

**`blog.BlogPost`**
`title`, `slug` (unique), `excerpt`, `content` (Markdown), `cover_image`,
`published_date`, `is_published`, `created_at`, `updated_at`
Ordered by `-published_date`. **Looked up by slug, not id.**

**`projects.Project`**
`title`, `description`, `tech_stack` (comma-separated string), `thumbnail`,
`repo_url`, `live_url`, `display_order`, `is_featured`, `created_at`
Exposes a `tech_stack_list` property that splits and strips the CSV into tags. Home's
"Featured Work" shows `is_featured` projects, falling back to the first two by
`display_order` when none are marked so the section is never empty by default.

**`quotes.QuoteRequest`**
`name`, `email`, `project_details`, `submitted_at`
Read-only in Django admin (no add, no edit) — submissions are a record, not content.

**`sitesettings.SiteBranding`** — singleton, same `clean()` guard as Profile, but the API
auto-creates it on first `GET` (`get_or_create(pk=1)`) rather than 404ing — the public site
needs branding on every page load, so there's no meaningful "not configured" state.
`site_name`, `logo`, `favicon`, `updated_at`

**`sitesettings.SiteTheme`** — singleton, same auto-create pattern. One editable theme, not a
theme gallery. Every field mirrors a CSS custom property in `index.css`.
`color_void`, `color_panel`, `color_panel_edge`, `color_neon_blue`, `color_neon_indigo`,
`color_accent`, `color_status_green`, `color_status_red` (hex, validated),
`font_display`, `font_mono` (curated Google Fonts choices, not arbitrary `@font-face`),
`radius_scale` (sharp/soft/rounded), `shadow_intensity` (none/subtle/elevated),
`button_style` (solid/outline/soft), `card_style` (clean/accent), `updated_at`

**`analytics.PageView`** — one row per tracked page view.
`path`, `referrer`, `is_blog_post`, `slug`, `session_key` (a same-day hash of IP + User-Agent —
enough to dedupe repeat views into a rough "unique visitors" count with no cookies/PII),
`created_at`. Indexed on `created_at` and `path`.

---

## 4. API reference

Base path `/api/`. Pagination is `PageNumberPagination` at **10 per page**, so list responses
are `{count, next, previous, results}`.

### Auth — `accounts`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/token/` | public, **throttled 5/min/IP** | Login. Returns `access`, `refresh`, `user`. **Staff only** — a valid non-staff login returns 400 |
| POST | `/api/auth/token/refresh/` | public | Exchange refresh for a new access token |
| POST | `/api/auth/token/blacklist/` | public | Logout — invalidates the refresh token |
| GET | `/api/auth/me/` | staff | Current user; used to rehydrate the panel after a reload |
| POST | `/api/auth/change-password/` | staff | Current + new password. Self-service only — no email/forgot-password flow (single admin, no email sending configured) |

### Content

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/profile/` | public | 404 until a Profile row exists |
| POST | `/api/profile/` | staff | Creates the singleton. 409 if one already exists |
| PATCH / PUT | `/api/profile/` | staff | Update |
| GET | `/api/profile/resume/` | public | Streams the resume as a file download |
| GET | `/api/profile/skills/` | public | List |
| POST | `/api/profile/skills/` | staff | Create |
| GET/PATCH/PUT/DELETE | `/api/profile/skills/<id>/` | mixed | Read public, writes staff |
| GET | `/api/blog/posts/` | public | Published only; **staff also see drafts** |
| POST | `/api/blog/posts/` | staff | Create |
| GET/PATCH/PUT/DELETE | `/api/blog/posts/<slug>/` | mixed | Read public, writes staff. Draft slugs 404 for anonymous |
| GET | `/api/projects/` | public | List, includes `is_featured` |
| POST | `/api/projects/` | staff | Create |
| GET/PATCH/PUT/DELETE | `/api/projects/<id>/` | mixed | Read public, writes staff |
| POST | `/api/quotes/` | **public, throttled** | The contact form — see below |
| GET | `/api/quotes/` | staff | Admin inbox. Not throttled |
| GET/DELETE | `/api/quotes/<id>/` | staff | Read / delete a submission |
| GET | `/api/settings/branding/` | public | Site name, logo, favicon. Auto-creates with defaults |
| PATCH/PUT | `/api/settings/branding/` | staff | Update |
| GET | `/api/settings/theme/` | public | The one theme's current values. Auto-creates with defaults |
| PATCH/PUT | `/api/settings/theme/` | staff | Update — applies site-wide immediately, no rebuild |
| POST | `/api/analytics/track/` | **public, throttled** | Tracking beacon; fired once per route change from `PublicLayout` |
| GET | `/api/analytics/summary/?days=` | staff | Aggregated totals, daily series, top pages/posts/referrers, quotes trend |

`/admin/` — Django admin, still mounted. It is the fallback whenever the custom panel breaks.

---

## 5. How authorisation works

**`config/permissions.py` → `IsAdminUserOrReadOnly`** is applied to Profile, Skill, BlogPost,
Project, and the two `sitesettings` models: safe methods are open to everyone, everything else
requires `is_staff`. Note the bar is **staff**, not merely authenticated — an ordinary Django
user cannot edit content.

**Quotes invert this.** `CreatePublicReadStaff` in `quotes/views.py` allows anonymous `create`
but requires staff for read and delete, because the submissions are private and the *write* is
the public part.

**Tokens.** Access 15 min, refresh 7 days, with `ROTATE_REFRESH_TOKENS` and
`BLACKLIST_AFTER_ROTATION` — a refresh token is single-use, so a stolen one only works until
the real session next refreshes. Blacklisting is why `rest_framework_simplejwt.token_blacklist`
is in `INSTALLED_APPS` and why deploys need `migrate`.

**Drafts.** `blog/views.py` filters `is_published` inside `get_queryset()` based on the
requester rather than using a static queryset, so the panel edits drafts at the same URLs the
public site reads. Anonymous requests for a draft return **404, not 403** — that avoids
confirming the post exists.

**Throttling.** Three independent scopes, all via DRF's `ScopedRateThrottle` /
`DEFAULT_THROTTLE_RATES`:

- `quotes` — `POST /api/quotes/` capped at 5/hour per IP (`QUOTE_THROTTLE_RATE`).
  `get_throttles()` scopes it to the `create` action only — viewset-wide it would also have
  capped the admin inbox at five reads an hour.
- `analytics` — `POST /api/analytics/track/` capped at 120/hour per IP
  (`ANALYTICS_THROTTLE_RATE`). Generous enough for a real visitor browsing several pages,
  still a real cap against a bot hammering the beacon.
- `login` — `POST /api/auth/token/` capped at 5/minute per IP (`LOGIN_THROTTLE_RATE`). Added
  after an audit found the login endpoint had **no** throttle at all — unlimited password
  guesses were possible. Counts every attempt, successes included, so it can't be dodged by
  mixing in valid-looking requests.

Two things make throttling real in production rather than decorative:

- **Cache backend.** DRF stores throttle counters in Django's cache. Each Vercel request runs
  in a separate short-lived function, so the default per-process `LocMemCache` would reset
  them constantly. When Supabase Postgres is configured, `settings.py` switches to
  `DatabaseCache` — shared across instances, needs a one-off `createcachetable`.
- **Client IP.** Behind Vercel the real IP is in `X-Forwarded-For`, which is spoofable.
  `NUM_PROXIES=1` tells DRF how many hops to trust.

---

## 6. Configuration

Everything is env-driven with local-first fallbacks, so the project runs with **zero setup**:
no `.env` means SQLite, local-disk media, in-memory cache, `DEBUG=True`.

| Variable | Effect when set |
|---|---|
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Standard Django |
| `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` | Required in production |
| `SUPABASE_DB_*` | Switches SQLite → Postgres **and** LocMem cache → DatabaseCache |
| `SUPABASE_STORAGE_*` | Switches local media → Supabase Storage (S3) |
| `QUOTE_THROTTLE_RATE` | Defaults to `5/hour` |
| `ANALYTICS_THROTTLE_RATE` | Defaults to `120/hour` |
| `LOGIN_THROTTLE_RATE` | Defaults to `5/minute` |
| `NUM_PROXIES` | Set to `1` on Vercel |
| `SECURE_HSTS_SECONDS` | Defaults to `31536000` (1 year) when `DEBUG=False` |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | Defaults to `True` when `DEBUG=False` |
| `SECURE_HSTS_PRELOAD` | Defaults to `False` — opt-in only; submitting to the browser preload list is a separate, much harder to reverse decision than the rest of HSTS |

When `DEBUG=False`, `settings.py` additionally turns on `SECURE_PROXY_SSL_HEADER`,
`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, and the HSTS settings above.

**Supabase Storage quirk:** its S3 gateway only accepts SigV4 and requires a signed request for
*every* object, even in a "public" bucket. Hence `AWS_S3_SIGNATURE_VERSION = 's3v4'` and
`AWS_QUERYSTRING_AUTH = True`. Media URLs are therefore presigned and **expire after 1 hour**.

---

## 7. Frontend

### Routes

| Path | Page | Layout | Notes |
|---|---|---|---|
| `/` | `Home` | Public | Hero, tech stack, featured work, CTA |
| `/blogs` | `Blogs` | Public | Card grid + Load more (`?page=` tracks depth) |
| `/blogs/:slug` | `BlogDetail` | Public | Markdown-rendered post |
| `/projects` | `Projects` | Public | Card grid + Load more |
| `/admin/login` | `AdminLogin` | none | Outside the guard, or it'd be unreachable |
| `/admin` | `Dashboard` | Admin | Content counts |
| `/admin/blog`, `/admin/blog/new`, `/admin/blog/:slug/edit` | Blog CMS | Admin | List, create, edit |
| `/admin/analytics` | `Analytics` | Admin | Stat tiles, traffic chart, top pages/posts/referrers |
| `/admin/projects`, `/admin/projects/new`, `/admin/projects/:id/edit` | Projects | Admin | |
| `/admin/skills` | `SkillsManager` | Admin | |
| `/admin/profile` | `ProfileEditor` | Admin | |
| `/admin/quotes` | `QuoteInbox` | Admin | |
| `/admin/settings/account` | `AccountSettings` | Admin | Password change |
| `/admin/settings/branding` | `BrandingSettings` | Admin | Site name, logo, favicon |
| `/admin/settings/theme` | `ThemeEditor` | Admin | Live preview + save |

`App.jsx` fetches the site theme once at boot (`getTheme().then(applyTheme)`) and applies it to
`document.documentElement` before rendering routes — one shared theme for both the public site
and the admin panel, not a per-surface one.

Two separate route trees: public routes nest under `PublicLayout`, admin routes under
`RequireAuth` → `AdminLayout`. The admin panel deliberately does **not** render the marketing
navbar or footer. `AdminLayout`'s sidebar is grouped and collapsible (Blog, Portfolio, Settings
each expand to their children) rather than a flat list.

`PublicLayout` fetches the profile and branding once, drives dynamic branding (nav avatar,
name, `document.title`, favicon), and fires the analytics tracking beacon
(`trackPageView`) on mount and on every route change — admin navigation never reaches this
layout, so it's naturally excluded from traffic stats. The quote modal is global, opened from
the navbar, hero, and closing CTA.

### Admin panel authentication

The access token lives **in memory only** and dies on reload; the refresh token is in
`localStorage`. The trade-off is deliberate and documented in `auth/tokenStore.js`: the
refresh token is readable by any script on the page, which is acceptable for a single-admin
portfolio but would not be for a multi-tenant app, where an httpOnly cookie is correct.

Boot sequence on every page load: `AuthProvider` starts in a `booting` state → refreshes using
the stored token → calls `/api/auth/me/` → resolves to `authenticated` or `anonymous`.
`RequireAuth` renders nothing but a spinner until that settles, otherwise a reload would bounce
a perfectly valid session to the login screen.

Two subtleties in `api/client.js` worth not breaking:

- **Refresh is single-flight.** Several requests can 401 at once; since the server rotates
  refresh tokens, a second concurrent refresh would present an already-blacklisted token and
  fail. They all await one shared promise.
- **The rotated refresh token must be stored.** Each refresh returns a *new* refresh token and
  blacklists the old one. Dropping it breaks the *next* refresh — a bug that only surfaces
  ~15 minutes into a session.

A failed refresh clears tokens and calls a session-expired handler, which drops the panel back
to the login screen.

### Conventions

Every page uses the same `loading` / `ready` / `error` (or `empty`) state machine with skeleton
placeholders. Sections hide themselves entirely when their fetch errors, so a failed request
degrades to a shorter page rather than an error message.

`hooks/usePaginatedList.js` drives both public list pages and several admin lists: appends
pages, ignores clicks while a fetch is in flight, and on failure keeps existing items on screen
with an inline retry. It also round-trips how many pages have been loaded through a `?page=`
search param (via `replace`, not `push`, so "Load more" clicks don't spam browser history) — a
shared or reloaded link restores that depth by re-fetching pages `1..N` on mount instead of
silently resetting to the first 10 items.

`api/client.js` holds every API call. `VITE_API_BASE_URL` is unset in dev (Vite proxies `/api`
to Django) and points at the deployed API in production.

### Theming

Tailwind v4, configured in CSS via `@theme` in `index.css` — there is no `tailwind.config.js`.
The visual system is a flat, GitHub-dark palette (solid `#0d1117` canvas, `#161b22` cards,
`#58a6ff` blue accent, `#238636` green primary buttons) — no glow/blur/HUD effects.

Every themeable value is a CSS custom property with a default matching the shipped look:
`--color-void`, `--color-panel`, `--color-panel-edge`, `--color-neon-blue`,
`--color-neon-indigo`, `--color-accent`, plus status colours, `--theme-radius`,
`--theme-shadow`, `--card-border-color`, `--btn-primary-bg/fg/border`, `--font-display`,
`--font-mono-ui`. This is what makes it **runtime-editable**: `utils/applyTheme.js` resolves
the `SiteTheme` API response into these vars (plus injecting Google Fonts `<link>`s) and calls
`document.documentElement.style.setProperty(...)` — no rebuild, no redeploy, just a `PATCH` and
a page load. `pages/admin/settings/ThemeEditor.jsx` edits it with a live preview that uses the
same resolver functions, so the preview matches what saving actually produces.

Deliberately **one theme, not a multi-theme gallery** — the singleton `SiteTheme` model and the
CSS-custom-property approach both assume this; a future theme *gallery* would be a different,
larger feature.

Component classes: `.system-panel`, `.system-panel-glow`, `.system-heading`, `.eyebrow`,
`.system-button` / `.system-button-primary`, `.skeleton`, and `.markdown-body` for rendered
post content. The site is dark-only (`color-scheme: dark`) — no light mode.

---

## 8. Local development

Requires Python ≥3.12 (pinned to 3.13 via `backend/.python-version`) and Node.

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```

Frontend at `http://localhost:5173/`, API at `http://127.0.0.1:8000/`, Django admin at
`/admin/`. The Vite dev server proxies `/api` and `/media` to Django, so no CORS setup is
needed locally.

Note: throttle counters live in memory locally, so **restarting the Django server resets
them** — useful if you lock yourself out of the quote form or login while testing.

Run the backend test suite with `.venv/bin/python manage.py test` (62 tests across every app).

---

## 9. Deployment

Two separate Vercel projects from the same repo (root directories `backend` and `frontend`),
plus Supabase for Postgres and Storage. Full walkthrough in `DEPLOYMENT.md`.

Vercel has zero-config Django support — it detects `manage.py`, reads `WSGI_APPLICATION`, and
runs `collectstatic` during the build. Because functions have no persistent shell, `migrate`,
`createcachetable` and `createsuperuser` are run **locally against Supabase** rather than at
build time — any new app's migration needs the same manual step before its feature works live.

**Known gotcha (hit once already):** Supabase's free tier auto-pauses a project after about a
week of inactivity, and a paused project briefly stops resolving in DNS — this looks exactly
like the project having been deleted from Vercel's runtime logs (`ENOTFOUND`). Check Supabase's
dashboard for a "Paused" state before assuming the database is gone.

---

## 10. Not built yet / deliberately deferred

- **Email on quote submission.** Submissions land in the database silently — nothing notifies
  you. Explicitly deprioritized (not forgotten).
- **Forgot-password email flow.** `change-password` is self-service only (current + new
  password, while logged in) — no email sending is configured, and a single-admin site doesn't
  need the added infrastructure of a token-based reset-by-email flow.
- **Page builder / drag-and-drop layout editing.** The theme system (colors, typography,
  borders/shadows, button/card style) is deliberately the ceiling for now — a block/section
  editor for page *layout* is a distinct, larger feature that the theme tokens don't block but
  also don't attempt.
- **Multi-theme / theme gallery.** `SiteTheme` is a singleton by design — one fully customizable
  theme, not a selection of community themes.
- **HSTS preload.** `SECURE_HSTS_PRELOAD` defaults off — submitting to the browser preload list
  is a one-way door (see `hstspreload.org`) that the site owner should opt into deliberately,
  not something turned on automatically.

## Known quirks

- `profiles/urls.py` registers a `DefaultRouter` at `''` alongside `ProfileView` at `''`. The
  ProfileView pattern is listed first so it wins, and the router's generated API-root view is
  shadowed. Harmless, but `SimpleRouter` would be tidier.
- `.gitignore` ends with a broad `.env*`, which matches `.env.example`. The two tracked example
  files are unaffected, but a newly added one would be silently ignored.
- `gunicorn` is still in `requirements.txt` but unused, left over from a pre-Vercel Render setup.

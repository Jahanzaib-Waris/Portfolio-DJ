# Portfolio-DJ — Project Reference

A personal developer portfolio with a Solo Leveling–inspired visual theme: dark base, blue
neon accents, "system window" panels. Django REST Framework API + React (Vite) single-page
frontend, deployed as two separate Vercel projects backed by Supabase.

Last updated: 2026-08-02.

---

## 1. Directory layout

```
Portfolio-DJ/
├── ARCHITECTURE.md          this file
├── README.md                setup instructions
├── DEPLOYMENT.md            step-by-step Vercel + Supabase deployment
│
├── backend/                 Django project
│   ├── .python-version      pins Python 3.13 (Django 6.0 requires >=3.12)
│   ├── requirements.txt
│   ├── vercel.json          function config (maxDuration 30)
│   ├── manage.py
│   ├── config/              settings package (not an app)
│   │   ├── settings.py      all configuration, env-driven
│   │   ├── urls.py          root URL conf
│   │   ├── permissions.py   IsAdminUserOrReadOnly, shared by every content app
│   │   └── wsgi.py / asgi.py
│   ├── accounts/            JWT auth endpoints (no models)
│   ├── profiles/            Profile (singleton) + Skill
│   ├── blog/                BlogPost
│   ├── projects/            Project
│   └── quotes/              QuoteRequest
│
└── frontend/                React + Vite SPA
    ├── vercel.json          SPA rewrite (all paths -> index.html)
    ├── vite.config.js       dev proxy: /api and /media -> 127.0.0.1:8000
    ├── .oxlintrc.json
    └── src/
        ├── main.jsx         entry
        ├── App.jsx          route table only — public tree + admin tree
        ├── index.css        theme tokens + component classes + markdown styles
        ├── api/client.js    axios instance, auth interceptors, all API calls
        ├── auth/
        │   ├── tokenStore.js    access token (memory) + refresh token (localStorage)
        │   ├── authContext.js   context + useAuth hook
        │   └── AuthProvider.jsx session boot, login, logout
        ├── hooks/
        │   └── usePaginatedList.js
        ├── components/
        │   ├── PublicLayout.jsx  navbar + footer + quote modal, profile fetch
        │   ├── NavBar, Footer, StatusPanel, SystemButton, Skeleton,
        │   │   RequestQuoteModal
        │   └── admin/
        │       ├── RequireAuth.jsx   route guard
        │       └── AdminLayout.jsx   sidebar shell
        └── pages/
            ├── Home, Blogs, BlogDetail, Projects
            └── admin/
                ├── AdminLogin.jsx
                └── Dashboard.jsx
```

---

## 2. Stack and packages

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
`repo_url`, `live_url`, `display_order`, `created_at`
Exposes a `tech_stack_list` property that splits and strips the CSV into tags.

**`quotes.QuoteRequest`**
`name`, `email`, `project_details`, `submitted_at`
Read-only in Django admin (no add, no edit) — submissions are a record, not content.

---

## 4. API reference

Base path `/api/`. Pagination is `PageNumberPagination` at **10 per page**, so list responses
are `{count, next, previous, results}`.

### Auth — `accounts`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/token/` | public | Login. Returns `access`, `refresh`, `user`. **Staff only** — a valid non-staff login returns 400 |
| POST | `/api/auth/token/refresh/` | public | Exchange refresh for a new access token |
| POST | `/api/auth/token/blacklist/` | public | Logout — invalidates the refresh token |
| GET | `/api/auth/me/` | staff | Current user; used to rehydrate the panel after a reload |

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
| GET | `/api/projects/` | public | List |
| POST | `/api/projects/` | staff | Create |
| GET/PATCH/PUT/DELETE | `/api/projects/<id>/` | mixed | Read public, writes staff |
| POST | `/api/quotes/` | **public** | The contact form. Throttled — see below |
| GET | `/api/quotes/` | staff | Admin inbox. Not throttled |
| GET/DELETE | `/api/quotes/<id>/` | staff | Read / delete a submission |

`/admin/` — Django admin, still mounted. It is the fallback whenever the custom panel breaks.

---

## 5. How authorisation works

**`config/permissions.py` → `IsAdminUserOrReadOnly`** is applied to Profile, Skill, BlogPost
and Project: safe methods are open to everyone, everything else requires `is_staff`. Note the
bar is **staff**, not merely authenticated — an ordinary Django user cannot edit content.

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

**Throttling.** `POST /api/quotes/` is capped at 5/hour per IP (`QUOTE_THROTTLE_RATE`).
`get_throttles()` scopes it to the `create` action only — viewset-wide it would also have
capped the admin inbox at five reads an hour.

Two things make the throttle real in production rather than decorative:

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
| `NUM_PROXIES` | Set to `1` on Vercel |

When `DEBUG=False`, `settings.py` additionally turns on `SECURE_PROXY_SSL_HEADER`,
`SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE`.

**Supabase Storage quirk:** its S3 gateway only accepts SigV4 and requires a signed request for
*every* object, even in a "public" bucket. Hence `AWS_S3_SIGNATURE_VERSION = 's3v4'` and
`AWS_QUERYSTRING_AUTH = True`. Media URLs are therefore presigned and **expire after 1 hour**.

---

## 7. Frontend

### Routes

| Path | Page | Layout | Notes |
|---|---|---|---|
| `/` | `Home` | Public | Hero, tech stack, featured work, CTA |
| `/blogs` | `Blogs` | Public | Card grid + Load more |
| `/blogs/:slug` | `BlogDetail` | Public | Markdown-rendered post |
| `/projects` | `Projects` | Public | Card grid + Load more |
| `/admin/login` | `AdminLogin` | none | Outside the guard, or it'd be unreachable |
| `/admin` | `Dashboard` | Admin | Guarded by `RequireAuth` |

`App.jsx` is now just the route table. Two separate trees: public routes nest under
`PublicLayout`, admin routes under `RequireAuth` → `AdminLayout`. The admin panel deliberately
does **not** render the marketing navbar or footer.

`PublicLayout` fetches the profile once and passes it to children via `Outlet` context
(`useOutletContext()` in `Home`), and drives dynamic branding — nav avatar, name, and
`document.title`. The quote modal is global, opened from the navbar, hero, and closing CTA.

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

`hooks/usePaginatedList.js` drives both list pages: appends pages, ignores clicks while a
fetch is in flight, and on failure keeps existing items on screen with an inline retry.

`api/client.js` holds every API call. `VITE_API_BASE_URL` is unset in dev (Vite proxies `/api`
to Django) and points at the deployed API in production.

### Theming

Tailwind v4, configured in CSS via `@theme` in `index.css` — there is no `tailwind.config.js`.
Tokens: `--color-void`, `--color-abyss`, `--color-panel`, `--color-panel-edge`,
`--color-neon-blue`, `--color-neon-indigo`, `--color-accent`, plus status colours.

Component classes: `.system-panel`, `.system-panel-glow`, `.glow-text`, `.system-heading`,
`.eyebrow`, `.system-button`, `.skeleton`, and `.markdown-body` for rendered post content.
The site is dark-only (`color-scheme: dark`).

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
them** — useful if you lock yourself out of the quote form while testing.

---

## 9. Deployment

Two separate Vercel projects from the same repo (root directories `backend` and `frontend`),
plus Supabase for Postgres and Storage. Full walkthrough in `DEPLOYMENT.md`.

Vercel has zero-config Django support — it detects `manage.py`, reads `WSGI_APPLICATION`, and
runs `collectstatic` during the build. Because functions have no persistent shell, `migrate`,
`createcachetable` and `createsuperuser` are run **locally against Supabase** rather than at
build time.

---

## 10. Not built yet

- **Admin panel editing screens.** The shell is done — login, route guard, session restore,
  sidebar, dashboard with live content counts. The CRUD screens are not: blog CMS, then
  projects, skills, profile, and a quote inbox. Sidebar entries for those are shown greyed
  as `soon`. The API behind all of them already exists (§4, §5).
- **Tests.** All `tests.py` files are empty stubs. The auth boundary was verified with 11
  throwaway tests that were not kept. The admin panel has been verified only for its
  unauthenticated paths (redirect to login, bad-credential error) — the signed-in flow is
  untested, as the local database has no users.
- **Traffic and stats.** Deferred — no decision yet between self-built and Plausible/Umami.
- **Pagination beyond "Load more".** No URL state, so a paginated position isn't shareable.
- **Featured projects.** `Home.jsx` slices the first two by `display_order`; there is no
  `is_featured` flag.
- **Email on quote submission.** Submissions land in the database silently — nothing notifies
  you.
- **HSTS.** `SECURE_HSTS_SECONDS` is unset; `manage.py check --deploy` flags it.

## Known quirks

- `profiles/urls.py` registers a `DefaultRouter` at `''` alongside `ProfileView` at `''`. The
  ProfileView pattern is listed first so it wins, and the router's generated API-root view is
  shadowed. Harmless, but `SimpleRouter` would be tidier.
- `.gitignore` ends with a broad `.env*`, which matches `.env.example`. The two tracked example
  files are unaffected, but a newly added one would be silently ignored.

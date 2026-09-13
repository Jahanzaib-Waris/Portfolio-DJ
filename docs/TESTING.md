# Manual test checklist

For a fast 15-minute sanity pass instead of this full checklist, see `QUICK-TEST.md`.

Everything built but not verified by hand. Anything already proven is listed under
**Verified** at the end of each section, so you don't repeat work.

Current blockers: the local database has **no users**, so every signed-in path is untested.

---

## 0. Setup

```bash
cd backend
.venv/bin/python manage.py createsuperuser   # NOT done yet — 0 users in the local DB
.venv/bin/python manage.py runserver
```

```bash
cd frontend
npm run dev
```

Public site → http://localhost:5173/ · Panel → http://localhost:5173/admin ·
API → http://127.0.0.1:8000/ · Django admin → http://127.0.0.1:8000/admin/

---

## 1. Sign-in and session

### Login

- [ ] Correct superuser credentials → lands on the dashboard
- [ ] Backend stopped → "Cannot reach the server. Is the backend running?"
- [ ] **Non-staff account** → "This account does not have admin access." *(not* the generic
      wrong-password message). Create one to test:
      ```bash
      .venv/bin/python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_user('plainuser','p@x.com','testpass123')"
      ```

### Session handling — the fiddliest part

- [ ] **Reload while signed in** → stays signed in, briefly showing "Restoring session...".
      If this bounces you to login, the boot-time refresh is broken.
- [ ] Visit `/admin/projects` signed out → redirected to login → after signing in, land on
      `/admin/projects` rather than the dashboard
- [ ] **Log out → browser Back** → must NOT show the panel
- [ ] Log out, then reload → still logged out (refresh token was blacklisted server-side)
- [ ] **Leave the tab idle >15 min, then click around.** The access token expires at 15
      minutes; the panel should refresh silently with no visible interruption. Single most
      likely thing to be subtly wrong.
- [ ] Corrupt the stored token and reload → lands on login rather than hanging. In the console:
      `localStorage.setItem('portfolio.admin.refresh','garbage')`

### Dashboard and layout

- [ ] Cards show counts matching Django admin, plus a 7-day traffic widget below them
- [ ] A card shows a red `—` rather than blanking the page if one endpoint fails
      (stop the backend mid-load)
- [ ] Sidebar on desktop, hamburger below `lg`
- [ ] Public navbar/footer do **not** appear on admin pages

**Verified:** `/admin`, `/admin/projects`, `/admin/projects/new` all redirect to login when
signed out; bad credentials show "Incorrect username or password."

---

## 2. Projects, Skills, Profile, Quote inbox — untested

### Projects

- [ ] `/admin/projects` lists existing projects with thumbnail, `#display_order` badge and
      tech-stack tags; projects without an image show a dashed "no image" placeholder
- [ ] Typing into **Tech stack** renders live tag chips below the field as you type
- [ ] Create → redirects to the edit URL for the new project
- [ ] Changes appear on the public `/projects` page
- [ ] **Display order actually reorders** the public page (lower first)
- [ ] Thumbnail upload, replace, and Remove all behave
- [ ] **Save a project with an existing thumbnail and no new file** → the thumbnail survives
      (the JSON-vs-multipart branch again)
- [ ] An invalid Repo/Live URL shows the error *under that field*
- [ ] Delete → confirm dialog → list refreshes

### Skills

- [ ] Add a skill → appears in the list below without a manual reload
- [ ] Edit → row becomes inputs; Save persists, Cancel discards
- [ ] Delete → confirm dialog → removed
- [ ] Changes show in the home page tech-stack section
- [ ] Display order controls the order on the home page
- [ ] **Add more than 10 skills** → all still listed. (They're fetched with `page_size=100`;
      if only 10 appear, the pagination change didn't take.)

### Profile

- [ ] **With no profile yet** the page says "No profile exists yet" and the button reads
      "Create profile"
- [ ] Creating it succeeds, and the button changes to "Save changes"
- [ ] Name and photo immediately drive the navbar branding and home page hero
- [ ] Photo upload shows a round preview; Remove works
- [ ] Resume upload → "View current resume" link appears and opens the PDF
- [ ] **Save with an existing photo and resume but no new files** → both survive
- [ ] A "Saved" indicator appears after saving and clears once you edit again
- [ ] Invalid email or URL → error under that field

### Quote inbox

- [ ] Submit the public form → the request appears at `/admin/quotes`
- [ ] Newest appears first
- [ ] Clicking a row expands the full message; clicking again collapses it
- [ ] "Reply" opens your mail client addressed to the sender
- [ ] Delete → confirm dialog → removed
- [ ] **The inbox is not rate-limited** — reload it 8+ times in a row and it keeps working
      (the 5/hour cap must apply only to public submissions)

### Panel-wide

- [ ] Every sidebar item is now clickable — no greyed `soon` entries remain
- [ ] Each page sets its own browser tab title
- [ ] Unsaved-changes warning fires on the Project and Profile forms too

---

## 3. Public site

Residual checks — these were **not** covered:

- [ ] Pagination on `/projects`: 10 items → Load more → more appended, no duplicates, button
      disappears on the last page, and reloading a `?page=N` URL restores that depth
- [ ] Double-clicking Load more fast doesn't double-load
- [ ] Stop the backend, then click Load more → existing items stay and an inline
      "Couldn't load more" appears

### Quote form throttle

- [ ] 6 rapid submissions: first 5 succeed, 6th fails
- [ ] Submissions appear in Django admin → Quote requests

**Gotchas:** 5/hour per IP, so this burns your quota. Locally the counter is in-memory, so
**restarting the Django server resets it** — the escape hatch if you lock yourself out.

*Automated coverage exists:* `[201,201,201,201,201,429]` with `Retry-After: 3600`, and the
throttled request persisting no row.

---

## 4. API authorisation

*Covered by the automated test suite (`manage.py test`, 50 tests)* — anonymous reads succeed
and writes 401, staff CRUD works, non-staff can't obtain a token, the quote inbox is
unthrottled for staff. Re-check by hand only if something looks wrong.

---

## 5. Production deploy — required before the live site works

> **Blocked.** The deployed API currently 500s on every request — the Supabase project it points
> at no longer exists. Confirmed 2026-08-02 from Vercel runtime logs:
> `FATAL: (ENOTFOUND) tenant/user postgres.fbeegpzrbocqgyxeqqtc not found`, and
> `fbeegpzrbocqgyxeqqtc.supabase.co` has no DNS record. None of the steps below can run until
> there is a live database. This is unrelated to the application code — the connection fails
> before any view executes.

**First, restore the database:**

- [ ] Check Supabase — was the project deleted, or does it exist under a different reference?
- [ ] Update `SUPABASE_DB_HOST`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` in the backend
      Vercel project
- [ ] Set `SUPABASE_DB_PORT` to **5432** (session pooler), not the 6543 currently configured
- [ ] Check Project Settings → Deployment Protection isn't blocking the domain the frontend calls

**Then the deploy steps.** `abcf36f` (JWT auth) is already pushed, so the deployed backend is
running code whose tables don't exist yet.

- [ ] Set `NUM_PROXIES=1` in the backend Vercel project's env vars
- [ ] Optionally set `QUOTE_THROTTLE_RATE` (defaults to `5/hour`)
- [ ] Run migrations and the cache table against Supabase:
      ```bash
      cd backend                          # already linked to the portfolio-dj project
      vercel env pull .env.local --environment=production
      cp .env.local .env
      python manage.py migrate            # token_blacklist — LOGIN FAILS WITHOUT THIS
      python manage.py createcachetable   # throttle counters — QUOTES ERROR WITHOUT THIS
      rm .env                             # or local dev silently runs against production
      ```
      **`SUPABASE_DB_PASSWORD` is flagged sensitive in Vercel**, so `env pull` writes the literal
      string `[SENSITIVE]` rather than the value. Paste the real password into `.env` by hand
      before running migrate, or the connection fails. The same applies to `SECRET_KEY` and
      `CORS_ALLOWED_ORIGINS` — any placeholder works locally for a migration, but `[SENSITIVE]`
      itself fails the system check for CORS.
- [ ] Redeploy the backend

Then on the deployed site:

- [ ] `/admin/login` on the frontend domain signs in successfully
- [ ] Reload keeps the session. **This is the first real test of cross-domain JWT** — locally
      Vite proxies `/api` to the same origin, so localhost never exercises it
- [ ] **Cover image upload works against Supabase Storage**, not just local disk
- [ ] Quote form still throttles at 5/hour — proves `DatabaseCache` is live; if the limit never
      triggers, the cache table is missing
- [ ] Uploaded images and the resume still load
- [ ] Django admin at `/admin/` on the backend domain still works as the fallback

---

## 6. Known issues, not bugs to report

- **Media URLs expire after 1 hour.** Supabase's S3 gateway requires a signed request for every
  object. Fine live; any cached response will have dead image links.
- **Pagination has no URL state** — a scrolled position isn't shareable or restorable.
- **`SECURE_HSTS_SECONDS` is unset**, flagged by `manage.py check --deploy`.
- **`gunicorn` is unused** but still in `requirements.txt`, left from the Render setup.
- No tests are committed — every `tests.py` is still an empty stub.
- **Production is down.** The deployed API 500s on every request: its Supabase project no longer
  exists (`fbeegpzrbocqgyxeqqtc` has no DNS record). Nothing in §6 can run until that's fixed.
- `SUPABASE_DB_PORT` is set to **6543** (transaction pooler). Django needs the session pooler on
  **5432**, or `DISABLE_SERVER_SIDE_CURSORS = True`.
- The backend Vercel project has **Deployment Protection** enabled. If that covers the domain the
  frontend calls, the live site can't reach the API even once the database is restored.

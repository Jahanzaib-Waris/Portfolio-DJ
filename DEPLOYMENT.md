# Deployment Guide

Stack: **Vercel** (Django API) + **Vercel** (React frontend) + **Supabase** (Postgres + Storage).

The backend is production-ready (whitenoise for static files, Supabase Storage for media,
CSRF/proxy settings) — see `backend/vercel.json` and `backend/.env.example`. The frontend reads
its API URL from `VITE_API_BASE_URL` — see `frontend/.env.example` and `frontend/vercel.json`.

Backend and frontend are two separate Vercel projects (same repo, different root directory), so
each gets its own `*.vercel.app` domain. That means there's a bit of a chicken-and-egg order
below: deploy the backend first, then the frontend, then circle back and update two env vars on
the backend with the frontend's real URL.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (pick a strong database
   password — you'll need it below).
2. **Database credentials**: Project Settings → Database → Connection pooling. Note the host,
   port, database name, user, and the password you set.
3. **Storage bucket**: Storage → create a new bucket, e.g. `media`. Make it **public** (so
   uploaded photos/resumes/covers are viewable without extra auth).
4. **Storage S3 credentials**: Project Settings → Storage → S3 Connection. Note the endpoint URL,
   region, access key ID, and secret access key.

> **Never paste real credentials into this file.** It's tracked in git and pushed to GitHub —
> secrets belong in `backend/.env` (gitignored, for local testing) or directly in the Vercel
> dashboard env var fields, never in a committed doc.

## 2. Deploy the backend to Vercel

Vercel has native (zero-config) Django support: it detects `manage.py`, reads `WSGI_APPLICATION`
from settings, and runs `collectstatic` automatically during the build — no `Procfile` or
`gunicorn` needed.

1. Push this repo to GitHub if you haven't already (it already is, at
   `Jahanzaib-Waris/Portfolio-DJ`).
2. In Vercel: **New Project**, import the repo, set the **root directory** to `backend`.
3. Vercel should auto-detect the Python/Django framework. Leave build/output settings at their
   defaults.
4. Add these environment variables (Project Settings → Environment Variables):
   - `SECRET_KEY` → a long random string
   - `DEBUG` → `False`
   - `ALLOWED_HOSTS` → your Vercel domain, e.g. `portfolio-backend.vercel.app`
   - `CSRF_TRUSTED_ORIGINS` → `https://portfolio-backend.vercel.app`
   - `CORS_ALLOWED_ORIGINS` → leave a placeholder for now (e.g. `https://placeholder.vercel.app`)
     — you'll update this in step 4 once you know the real frontend URL
   - `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT` (`5432`), `SUPABASE_DB_NAME` (`postgres`),
     `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` → from step 1
   - `SUPABASE_STORAGE_BUCKET_NAME`, `SUPABASE_STORAGE_ENDPOINT_URL`,
     `SUPABASE_STORAGE_ACCESS_KEY_ID`, `SUPABASE_STORAGE_SECRET_ACCESS_KEY`,
     `SUPABASE_STORAGE_REGION` (`us-east-1`) → from step 1
5. Deploy.
6. Vercel Functions have no persistent shell, so migrations and `createsuperuser` run locally
   against the same Supabase database instead:
   ```
   cd backend
   vercel pull          # writes .env.local with the project's env vars
   python manage.py migrate
   python manage.py createsuperuser
   ```
   (Requires the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`, then `vercel link`
   once to connect this directory to the project before `vercel pull` works.)
7. Confirm the API works: visit `https://<your-backend>.vercel.app/api/profile/` (should return
   JSON, likely a 404 body until you add a Profile) and `https://<your-backend>.vercel.app/admin/`.

## 3. Deploy the frontend to Vercel

1. In Vercel: **New Project**, import the same GitHub repo again, set the **root directory** to
   `frontend`.
2. Framework preset should auto-detect Vite. Build command `npm run build`, output directory
   `dist` (Vercel defaults are fine).
3. Add an environment variable:
   - `VITE_API_BASE_URL` → `https://<your-backend>.vercel.app/api`
4. Deploy. Vercel gives you a URL like `https://portfolio-dj.vercel.app`.

## 4. Close the loop: update backend CORS/CSRF with the real frontend URL

Back in the backend Vercel project's env vars:
- `CORS_ALLOWED_ORIGINS` → `https://portfolio-dj.vercel.app` (your real frontend URL)

Save and redeploy the backend project. This is the step that actually lets the deployed frontend
talk to the deployed API (until this is set, requests will fail CORS checks in the browser).

## 5. Populate content

Log into `https://<your-backend>.vercel.app/admin/` with the superuser from step 2 and fill in:
- **Profile** (name, tagline, bio, photo, resume, social links) — uploads go to Supabase
  Storage, so they'll persist across redeploys.
- **Skill** entries (shown on the home page tech stack section)
- **Blog posts** and **Projects**

## 6. Verify end-to-end

- Home page loads your real profile, skills, and featured projects
- Blog/Projects pages list real content
- Uploaded photo/resume/cover images actually render (confirms Supabase Storage is wired up)
- Request Quote form submits successfully (check Django admin → Quote requests)
- Mobile nav menu works
- Django admin login works over HTTPS (confirms `CSRF_TRUSTED_ORIGINS` is correct)

## Notes / things to revisit later

- **Custom domain**: Vercel supports adding one per project under Project Settings → Domains; no
  code changes needed beyond adding the new domain to `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`,
  and `CORS_ALLOWED_ORIGINS`.
- **Cold starts**: Vercel Functions scale to zero between requests, so an idle backend's first
  request after a while will be slower. Fine for a portfolio.
- **Function timeout**: `backend/vercel.json` sets `maxDuration: 30` for the Django function.
  Raise it there if a request ever needs longer (Hobby plan caps apply).
- **Database migrations** run locally against Supabase (see step 2.6) rather than as part of the
  build, since Vercel Functions have no persistent shell. Remember to run `python manage.py
  migrate` locally after pulling any model changes, before/after deploying.

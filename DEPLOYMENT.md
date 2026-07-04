# Deployment Guide

Stack: **Render** (Django API) + **Vercel** (React frontend) + **Supabase** (Postgres + Storage).

The backend is now production-ready (gunicorn, whitenoise for static files, Supabase Storage for
media, CSRF/proxy settings) — see `render.yaml` at the repo root and the updated
`backend/.env.example`. The frontend now reads its API URL from `VITE_API_BASE_URL` — see
`frontend/.env.example` and `frontend/vercel.json`.

Because the backend and frontend live on different domains once deployed, there's a bit of a
chicken-and-egg order below: deploy the backend first, then the frontend, then circle back and
update two env vars on the backend with the frontend's real URL.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (pick a strong database
   password — you'll need it below).
2. **Database credentials**: Project Settings → Database → Connection pooling. Note the host,
   port, database name, user, and the password you set.
3. **Storage bucket**: Storage → create a new bucket, e.g. `media`. Make it **public** (so
   uploaded photos/resumes/covers are viewable without extra auth).
4. **Storage S3 credentials**: Project Settings → Storage → S3 Connection. Note the endpoint URL,
   region, access key ID, and secret access key.

## 2. Deploy the backend to Render

1. Push this repo to GitHub if you haven't already (it already is, at
   `Jahanzaib-Waris/Portfolio-DJ`).
2. In Render: **New → Blueprint**, connect the repo. Render will read `render.yaml` at the repo
   root and create the `portfolio-backend` web service (`rootDir: backend`, installs
   requirements, runs `collectstatic` + `migrate` on build, starts with gunicorn).
3. Fill in the env vars Render prompts for (marked `sync: false` in `render.yaml`):
   - `ALLOWED_HOSTS` → your Render domain, e.g. `portfolio-backend.onrender.com`
   - `CSRF_TRUSTED_ORIGINS` → `https://portfolio-backend.onrender.com`
   - `CORS_ALLOWED_ORIGINS` → leave a placeholder for now (e.g. `https://placeholder.vercel.app`)
     — you'll update this in step 4 once you know the real Vercel URL
   - `SUPABASE_DB_HOST`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` → from step 1
   - `SUPABASE_STORAGE_BUCKET_NAME`, `SUPABASE_STORAGE_ENDPOINT_URL`,
     `SUPABASE_STORAGE_ACCESS_KEY_ID`, `SUPABASE_STORAGE_SECRET_ACCESS_KEY` → from step 1
4. Deploy. Once live, open the Render service's **Shell** tab and run:
   ```
   python manage.py createsuperuser
   ```
5. Confirm the API works: visit `https://<your-render-domain>/api/profile/` (should return JSON,
   likely a 404 body until you add a Profile) and `https://<your-render-domain>/admin/`.

## 3. Deploy the frontend to Vercel

1. In Vercel: **New Project**, import the same GitHub repo, set the **root directory** to
   `frontend`.
2. Framework preset should auto-detect Vite. Build command `npm run build`, output directory
   `dist` (Vercel defaults are fine).
3. Add an environment variable:
   - `VITE_API_BASE_URL` → `https://<your-render-domain>/api`
4. Deploy. Vercel gives you a URL like `https://portfolio-dj.vercel.app`.

## 4. Close the loop: update backend CORS/CSRF with the real frontend URL

Back in Render, edit the `portfolio-backend` service's env vars:
- `CORS_ALLOWED_ORIGINS` → `https://portfolio-dj.vercel.app` (your real Vercel URL)

Save — Render redeploys automatically. This is the step that actually lets the deployed frontend
talk to the deployed API (until this is set, requests will fail CORS checks in the browser).

## 5. Populate content

Log into `https://<your-render-domain>/admin/` with the superuser from step 2 and fill in:
- **Profile** (name, tagline, bio, photo, resume, social links) — uploads now go to Supabase
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

- **Custom domain**: both Render and Vercel support adding one under their respective dashboards
  whenever you're ready; no code changes needed beyond adding the new domain to `ALLOWED_HOSTS`,
  `CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`.
- **Render free tier** spins down after inactivity — the first request after idle time will be
  slow (cold start). Fine for a portfolio; upgrade the plan if that's not acceptable.
- **Database migrations** currently run automatically as part of Render's build step. That's fine
  for a single-instance MVP; if this ever scales to multiple backend instances, migrations should
  move to a separate release step instead.

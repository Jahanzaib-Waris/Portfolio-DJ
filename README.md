# Developer Portfolio

A personal developer portfolio with a clean, GitHub-dark visual system. Django REST Framework
backend + React (Vite) frontend, with a custom WordPress-style admin panel (JWT auth, live
theme editor, self-built analytics) for managing content. No blog — that runs separately on
WordPress; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system reference.

## Project structure

```
backend/    Django + DRF project (config) with apps: accounts, profiles, projects, quotes,
            sitesettings, analytics
frontend/   React (Vite) + Tailwind CSS app — public site + admin panel, consumes the Django API
```

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env        # then edit values as needed

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000/`. Django admin is at `http://127.0.0.1:8000/admin/`
(kept as a fallback; day-to-day editing happens through the custom panel below).

By default the backend uses local SQLite. To use Supabase Postgres instead, set `SUPABASE_DB_HOST` (and the related `SUPABASE_DB_*` vars) in `backend/.env` — see `.env.example` for the full list.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/` and proxies `/api` and `/media` requests to the Django backend at `127.0.0.1:8000`. The admin panel is at `http://localhost:5173/admin`.

## API endpoints

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#4-api-reference) for the full endpoint reference (auth, content, settings, analytics) with permissions and throttling notes.

## Content management

Content (profile, projects, skills, quote requests, site branding, and the site theme) is managed through the custom admin panel at `/admin` on the frontend — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it's built. The Django admin at `/admin/` on the backend is kept as a fallback.

## Testing

[docs/QUICK-TEST.md](docs/QUICK-TEST.md) is a 15-minute sanity pass; [docs/TESTING.md](docs/TESTING.md) is the full manual checklist.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full step-by-step guide to deploying the backend and frontend as two separate Vercel projects, and wiring both up to Supabase (Postgres + Storage).

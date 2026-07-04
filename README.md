# Solo Leveling Developer Portfolio

A personal developer portfolio site with a Solo Leveling anime-inspired visual theme (dark base, glowing purple/blue neon accents, "system window" style panels). Django REST Framework backend + React (Vite) frontend.

See [PROGRESS.md](PROGRESS.md) for current build status and what's still outstanding.

## Project structure

```
backend/    Django + DRF project (config) with apps: profiles, blog, projects, quotes
frontend/   React (Vite) + Tailwind CSS app, consumes the Django API
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

The API runs at `http://127.0.0.1:8000/`. Django admin is at `http://127.0.0.1:8000/admin/`.

By default the backend uses local SQLite. To use Supabase Postgres instead, set `SUPABASE_DB_HOST` (and the related `SUPABASE_DB_*` vars) in `backend/.env` — see `.env.example` for the full list.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/` and proxies `/api` and `/media` requests to the Django backend at `127.0.0.1:8000`.

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/profile/` | Profile info (name, tagline, bio, photo, links) |
| `GET /api/profile/resume/` | Download resume PDF |
| `GET /api/blog/posts/` | List published blog posts |
| `GET /api/blog/posts/<slug>/` | Blog post detail |
| `GET /api/projects/` | List projects |
| `POST /api/quotes/` | Submit a quote request |

## Content management

All content (profile, blog posts, projects, quote requests) is managed through the Django admin at `/admin/`. No frontend auth or CMS UI is required for the MVP.

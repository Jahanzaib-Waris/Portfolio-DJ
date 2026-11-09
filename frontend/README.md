# Jerry Dev Studio — Frontend

React 19 + Vite SPA (Tailwind v4, Supabase). See the repository root `README.md` and `docs/ARCHITECTURE.md` for the full picture.

```bash
cp .env.example .env     # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # http://localhost:5173/
npm run build            # production build -> dist/
npm run lint             # Oxlint
```

The dev server talks directly to the Supabase project named in `.env`; there is no local backend. Only ever put the anon key in this app, never the service-role key.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and Antigravity when working with code in this repository.

## What this is

**Jerry Dev Studio** ([https://jerry-dev-studio.web.app/](https://jerry-dev-studio.web.app/)): A high-performance FlutterFlow & mobile engineering studio portfolio, client portal, and technical publication.
- **Frontend**: React 19 + Vite SPA (`frontend/`) styled with the **FlowBase** design system (`#0A0C16` canvas, violet `#6D5AF6` primary, sky `#38BDF8` accents, self-hosted Manrope & Fira Code variable fonts).
- **Backend / Database**: **Supabase** (PostgreSQL, Supabase Auth, Supabase Storage, and Row Level Security).
- **Hosting & CDN**: **Firebase Hosting** (Project ID: `jerry-dev-studio`).
- **CMS & Control Panel**: Custom route-guarded admin panel (`/admin`) featuring the **FlowBase Visual Block Builder V2**, runtime-editable theme tokens, and lead inbox.

## Commands

### Frontend (`cd frontend`)

```bash
npm run dev      # Local Vite dev server (http://localhost:5173/)
npm run build    # Production build to frontend/dist
npm run lint     # Oxlint code linter
```

### Firebase Hosting

```bash
firebase deploy --only hosting   # Deploys frontend/dist to https://jerry-dev-studio.web.app/
```

### Supabase Database & Migrations

- `supabase/schema.sql`: Full database schema, indexes, RLS policies, and analytics RPCs.
- `supabase/seed_scheduled_blogs.sql`: 6-part high-impact technical blog editorial migration with `ON CONFLICT (slug) DO UPDATE`.

## Architecture & Core Systems

### 1. Database & API Layer
- **Supabase Client (`frontend/src/api/supabase.js`)**: Initializes `@supabase/supabase-js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Also handles uploads to the `media` storage bucket.
- **API Client (`frontend/src/api/client.js`)**: Direct Supabase queries providing the exact API contract expected by all UI components and admin editors. Handles automatic pagination envelopes `{ count, next, results }` and file extraction.
- **Automated Date-Based Blog Scheduling**: Public queries in `getBlogPosts()` and `getBlogPost(slug)` strictly filter by `is_published = true AND published_date <= todayStr`. Future-dated articles automatically unlock on their scheduled calendar date without server crons. Authenticated admins bypass this check to preview and manage scheduled content.

### 2. Authentication & Admin Control Panel
- **Auth Provider (`frontend/src/auth/AuthProvider.jsx`)**: Supabase Auth session listener (`onAuthStateChange`), login, and logout.
- **Route Guard (`frontend/src/components/admin/RequireAuth.jsx`)**: Verifies active Supabase session.
- **Scheduling Status Badges (`frontend/src/pages/admin/BlogList.jsx` & `BlogEditor.jsx`)**: Visual state indicators differentiating `Live` (emerald), `Scheduled · YYYY-MM-DD` (neon blue), and `Draft` (amber).

### 3. SEO, Metadata & Syndication
- **`useDocumentMeta` (`frontend/src/hooks/useDocumentMeta.js`)**: Dynamically sets page titles, meta descriptions, canonical URLs (`https://jerry-dev-studio.web.app/...`), OpenGraph/Twitter cards, and Schema.org JSON-LD structured data (`WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`).
- **Favicons & PWA**: Multi-resolution suite (`favicon.ico`, `favicon-48x48.png`, `favicon-96x96.png`, `favicon-192x192.png`, `apple-touch-icon.png`) and Web App Manifest (`manifest.json`).
- **Sitemap & RSS**: Search engine sitemap (`public/sitemap.xml`) and RSS 2.0 feed (`public/feed.xml`) for syndication.

### 4. Interactive UI & Conversion Optimization
- **Interactive Project Case Study Modals (`frontend/src/pages/Projects.jsx`)**: Deep-dive modals presenting project overview, architecture, deliverables, and tech stack chips.
- **Real-Time Blog Search & Filters (`frontend/src/pages/Blogs.jsx`)**: Instant search query filtering and dynamic category pills.
- **1-Click Code Copy Buttons (`frontend/src/components/RichTextContent.jsx`)**: One-click snippet copying with clipboard feedback across all code blocks.
- **Related Articles & Consultation CTAs (`frontend/src/pages/BlogDetail.jsx`)**: Contextual related reads and client inquiry banners.
- **Client Testimonials & Engagement Packages**: Homepage social proof and 3 structured engagement packages on `/solutions`.


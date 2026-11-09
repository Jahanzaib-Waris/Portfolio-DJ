# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and Antigravity when working with code in this repository.

## What this is

**Jerry Dev Studio** ([https://jerry-dev-studio.web.app/](https://jerry-dev-studio.web.app/)): A high-performance FlutterFlow & mobile engineering studio portfolio, client portal, and technical publication.
- **Frontend**: React 19 + Vite SPA (`frontend/`) styled with the **FlowBase** design system (`#0A0C16` canvas, violet `#6D5AF6` primary, sky `#38BDF8` accents, self-hosted Plus Jakarta Sans, Inter, & JetBrains Mono variable fonts). Fully mobile-responsive down to 320px screen widths.
- **Backend / Database**: **Supabase** (PostgreSQL 17, Supabase Auth, Supabase Storage, Edge Functions, and Row Level Security).
- **Hosting & CDN**: **Firebase Hosting** (Project ID: `jerry-dev-studio`).
- **CMS & Control Panel**: Custom route-guarded admin panel (`/admin`) featuring the **FlowBase Visual Block Builder V2**, runtime-editable theme tokens, lead inbox, and full B2B Sales CRM.

> `backend/` is a retired Django API kept for reference only. The app talks to Supabase directly; ignore `backend/` unless asked. Docs in `docs/` describe the Supabase/Firebase architecture (see `docs/ARCHITECTURE.md`).

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
# Or via npx:
npx -y firebase-tools deploy --only hosting
```

### Supabase Database & Migrations

- `supabase/schema.sql`: Full database schema, indexes, RLS policies, and analytics RPCs.
- `supabase/functions/`: Deno Edge Functions (`ai-proxy`, `apollo-proxy`) deployed with `supabase functions deploy <name> --project-ref fbeegpzrbocqgyxeqqtc`.

## Architecture & Core Systems

### 1. Database & API Layer
- **Supabase Client (`frontend/src/api/supabase.js`)**: Initializes `@supabase/supabase-js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Also handles uploads to the `media` storage bucket.
- **API Client (`frontend/src/api/client.js`)**: Direct Supabase queries providing the exact API contract expected by all UI components and admin editors. Handles automatic pagination envelopes `{ count, next, results }` and file extraction.
- **Egress & Quota Optimizations**:
  - `getBlogPosts()` prunes large HTML bodies (`content`), transferring only metadata until viewing the single post (reduces blog list egress by ~90%).
  - Client-side TTL caching layer (`frontend/src/utils/cache.js`) with in-memory + `sessionStorage` caching and automatic invalidation on mutations.
  - Bot filtering on `trackPageView` and PostgreSQL retention cleanup RPC `public.cleanup_old_page_views(retention_days)`.
- **Client Quote Requests (`submitQuoteRequest`)**: Sanitized payload matching exact PostgreSQL `quote_requests` schema (`name`, `email`, `service`, `backend`, `budget`, `timeline`, `project_link`, `project_details`). Omits `.select()` during public submission to adhere to public RLS insert policy with `Prefer: return=minimal`.
- **Automated Date-Based Blog Scheduling & RLS**: Public queries in `getBlogPosts()` and `getBlogPost(slug)` filter by `is_published = true AND published_date <= todayStr`. Enforced at database level via PostgreSQL RLS `((is_published = true AND published_date <= CURRENT_DATE) OR (auth.role() = 'authenticated'))`.

### 2. Authentication, Admin Control Panel & B2B Sales CRM
- **Auth Provider (`frontend/src/auth/AuthProvider.jsx`)**: Supabase Auth session listener (`onAuthStateChange`), login, and logout.
- **Route Guard (`frontend/src/components/admin/RequireAuth.jsx`)**: Verifies active Supabase session.
- **Admin Shell & Navigation (`frontend/src/components/admin/AdminLayout.jsx`)**: Category SVG icons, real-time activity badges (unread quote inquiries & CRM follow-ups due), user identity dropdown, and mobile slide-over drawer (`w-[84vw] max-w-xs`).
- **Command Center Dashboard (`frontend/src/pages/admin/Dashboard.jsx`)**: Clickable KPI cards, pipeline value metrics, quick launchpad (`+ New Post`, `+ Add Project`, `+ Log Deal`), and action-required feeds.
- **Universal Toast Notifications (`frontend/src/components/admin/ToastContext.jsx` & `toastStore.js`)**: Accessible floating feedback pills (`useToast()`) replacing browser `alert()`.
- **Reusable Admin Page Header (`frontend/src/components/admin/AdminPageHeader.jsx`)**: Breadcrumb trail, unsaved dirty state badge, and sticky save/cancel controls.
- **B2B Sales CRM (`frontend/src/pages/admin/crm/`)**:
  - `CrmPipeline.jsx`: Interactive Kanban pipeline with stage transitions, deal valuation, follow-up alerts, and compact mobile list toggle.
  - `CrmProspects.jsx`: LinkedIn Sales Navigator-style directory with CSV export and outreach shortcuts.
  - `ClientRadar.jsx`: Live client discovery engine aggregating hiring posts from Hacker News (with direct founder emails), RemoteOK, Jobicy, and freelance platforms with 1-click CRM ingestion. **Features opportunity freshness decay, dynamic sorting, and a 100-point AI-powered Opportunity Score** (Tech Fit, Direct Contact, Recency, Seniority, Budget signals).
  - `LeadDetailDrawer.jsx`: Salesforce-style deal inspector with 1-click outreach, follow-up scheduler, activity timeline, and **AI Cold Pitch Engine integration**.
  - `QuoteInbox.jsx`: Inbound quote requests with 1-click **Convert to Deal** pipeline insertion.

### 3. AI Cold Pitch Engine & Apollo.io Integration
- **Apollo.io Contact Enrichment (`frontend/src/api/apolloClient.js`)**:
  - Proxied via Supabase Edge Function `apollo-proxy` (`fbeegpzrbocqgyxeqqtc`) with `verify_jwt = true`.
  - 1-click **"⚡ Find Decision-Maker & Verified Email"** in `LeadDetailDrawer.jsx` and `ClientRadar.jsx`.
- **AI Cold Pitch Engine (`frontend/src/api/aiClient.js`)**:
  - Multi-provider support configured via `/admin/settings/integrations`:
    - **Ollama Cloud**: Fast cloud inference via API key (`deepseek-v4.1-flash`, `gemma4:31b`, `mistral-large-4`, `llama3.2`).
    - **Ollama Local**: Direct daemon connectivity (`http://localhost:11434` or Cloudflare Tunnel) with zero rate limits.
    - **Groq Cloud API**: Ultra-fast free cloud inference with Llama 3.3 70B.
    - **OpenAI / Custom**: Compatible with GPT-4o / GPT-4o-mini.
    - **Built-in Algorithmic**: Zero-API dynamic templates tailored to tech stacks.
  - Generates 3 pitch angles (**Rescue & Refactor**, **Rapid MVP Delivery**, **Architecture Advisory**) across 3 tones (**Senior Engineer**, **Pragmatic Partner**, **Direct & Punchy**).

### 4. SEO, Metadata & Syndication
- **`useDocumentMeta` (`frontend/src/hooks/useDocumentMeta.js`)**: Dynamically sets page titles, meta descriptions, canonical URLs (`https://jerry-dev-studio.web.app/...`), OpenGraph/Twitter cards, and Schema.org JSON-LD structured data (`WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`).
- **Favicons & PWA**: Multi-resolution suite (`favicon.ico`, `favicon-48x48.png`, `favicon-96x96.png`, `favicon-192x192.png`, `apple-touch-icon.png`) and Web App Manifest (`manifest.json`).
- **Sitemap & RSS**: Search engine sitemap (`public/sitemap.xml`) and RSS 2.0 feed (`public/feed.xml`) for syndication.

### 5. Mobile Responsiveness Standards (320px – 430px)
- **Viewport Boundaries**: Every page and modal must render without horizontal scrollbars or squished inputs down to 320px (iPhone SE).
- **Padding Rule**: Use `px-4 sm:px-6` (or `px-3.5 sm:px-6`) instead of fixed `px-6` on outer wrappers to recover 16px of horizontal space on narrow screens.
- **Form Grids**: Forms with multiple columns must stack on mobile using `grid-cols-1 sm:grid-cols-2` or `grid-cols-1 sm:grid-cols-3`.
- **Modals & Drawers**: Modals must specify `max-h-[92vh] sm:max-h-[85vh] overflow-y-auto` and `p-2.5 sm:p-4`. Slide-over drawers must use viewport-aware widths (`w-[84vw] max-w-xs` or `w-full sm:max-w-xl`).


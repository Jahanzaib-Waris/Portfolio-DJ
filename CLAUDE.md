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

### Supabase Database, Functions & Migrations

- `supabase/schema.sql`: Full database schema, indexes, RLS policies, and analytics RPCs. Optional/extra SQL, each idempotent: `radar.sql` (stored Client Radar posts + `crm_leads.source_url`), `quote_notify.sql` (quote trigger), `radar_cron.sql` (daily schedule), `fixes/` (one-time data repairs, already applied).
- `supabase/functions/`: Deno Edge Functions: `ai-proxy`, `apollo-proxy` (JWT required), `quote-notify`, `radar-ingest` (secret-authenticated, `verify_jwt = false` in `config.toml`). Shared radar parsing/scoring/fetching lives in `supabase/functions/_shared/radar/` and is imported by both the functions and the frontend.
- The Supabase CLI is logged in on the dev machine and the folder is linked to the portfolio project (`fbeegpzrbocqgyxeqqtc`; the account also holds unrelated projects, never touch those). Useful commands:

```bash
supabase db query --linked "select ..."          # run SQL (add -f file.sql for a file)
supabase functions deploy <name> --project-ref fbeegpzrbocqgyxeqqtc --use-api
supabase secrets set KEY=value --project-ref fbeegpzrbocqgyxeqqtc   # `secrets list` shows hashes only
```

- Production changes (SQL, deploys, secrets) are made with explicit user approval; take a backup before anything destructive.

## Architecture & Core Systems

### 1. Database & API Layer
- **Supabase Client (`frontend/src/api/supabase.js`)**: Initializes `@supabase/supabase-js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Also handles uploads to the `media` storage bucket.
- **API Client (`frontend/src/api/client.js`)**: Direct Supabase queries providing the exact API contract expected by all UI components and admin editors. Handles automatic pagination envelopes `{ count, next, results }` and file extraction.
- **Egress & Quota Optimizations**:
  - `getBlogPosts()` prunes large HTML bodies (`content`), transferring only metadata until viewing the single post (reduces blog list egress by ~90%).
  - Client-side TTL caching layer (`getCached`/`setCached`/`invalidateCache` in `frontend/src/api/client.js`) with in-memory + `sessionStorage` caching and automatic invalidation on mutations.
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
  - `CrmPipeline.jsx`: Interactive Kanban pipeline with stage transitions (logged to the lead timeline), deal valuation, follow-up alerts, and compact mobile list toggle. Stage keys are `lead, contacted, proposal, negotiation, closed_won, closed_lost`.
  - `CrmProspects.jsx`: LinkedIn Sales Navigator-style directory with CSV export and outreach shortcuts.
  - `ClientRadar.jsx`: Lead discovery from Hacker News ("Who is hiring" via the `whoishiring` author), RemoteOK and Jobicy, an **App Rescue Scanner** tab (Apple's public iTunes Search API, prototype) and a **Search Links** tab (Upwork, Contra, Wellfound, Reddit, FlutterFlow forum; Reddit/forum are manual because Reddit's API needs approval). Shows stored posts from `radar_items` (filled daily by `radar-ingest`; shared dismissed/imported status) and falls back to live browser fetching if that table is missing or empty. The **rule-based 0-100 Opportunity Score** (`_shared/radar/scoring.js`, not an LLM) is freshness 30 + reachability 15 + tech match 25 + **engagement fit** 30.
  - **Engagement fit** matters because the studio is an independent contractor serving several clients: scoped contract / freelance / part-time / project / retainer work is a fit; exclusive full-time, W-2, contract-to-hire and benefits roles are `not_fit` and hidden by default. Keep this in mind when changing scoring or sources.
  - `LeadDetailDrawer.jsx`: Salesforce-style deal inspector with outreach, activity timeline, **automatic follow-up cadence** (`crmCadence.js`: +3/+7/+14 days after outreach; "Reply Received" stops the sequence), and the pitch engine.
  - `QuoteInbox.jsx`: Inbound quote requests (table with expandable rows and a row-actions menu). The `quote-notify` function creates the CRM lead automatically; **Convert to Deal** is idempotent. Budget options map to fixed deal values in `client.js`.
- **Admin UI conventions** (calm, data-first): flat panels with no hover lift (scoped under `.admin-shell` in `index.css`), no decorative emoji or `// eyebrow` labels, text no smaller than 12px (`text-xs`), `text-slate-400` (not 500) for secondary text, tables for lists (`tableWrapClass`, `thClass`, `tdClass` in `formStyles.js`) with secondary actions in `RowActionsMenu.jsx`, toasts instead of `alert()`.
- **Alerts**: `NOTIFY_WEBHOOK_URL` (a Discord webhook, set as a function secret) receives new-quote alerts and the daily radar digest. No email provider is configured (no-cost constraint), so auto-reply is off.
- **Dates**: use `localDateStr()` (`utils/dates.js`) for "today" in follow-up logic, not `toISOString()` (UTC).

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
    - **Built-in Algorithmic** (`frontend/src/utils/pitch.js`): Zero-API templates. They open with the actual source (HN post, listing, inbound quote, App Store facts), state the engagement model, and must not contain invented metrics, timelines or results.
    - Groq/OpenAI/Ollama-local calls go straight from the browser (keys in `localStorage`); only Ollama Cloud uses `ai-proxy`.
  - Generates 3 pitch angles (**Rescue & Refactor**, **Rapid MVP Delivery**, **Architecture Advisory**) across 3 tones (**Senior Engineer**, **Pragmatic Partner**, **Direct & Punchy**).

### 4. SEO, Metadata & Syndication
- **`useDocumentMeta` (`frontend/src/hooks/useDocumentMeta.js`)**: Dynamically sets page titles, meta descriptions, canonical URLs (`https://jerry-dev-studio.web.app/...`), OpenGraph/Twitter cards, and Schema.org JSON-LD structured data (`WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`).
- **Favicons & PWA**: Multi-resolution suite (`favicon.ico`, `favicon-48x48.png`, `favicon-96x96.png`, `favicon-192x192.png`, `apple-touch-icon.png`) and Web App Manifest (`manifest.json`).
- **Sitemap & RSS**: Search engine sitemap (`public/sitemap.xml`) and RSS 2.0 feed (`public/feed.xml`) for syndication. Both are static files updated by hand and currently list only the seed posts (Search Console reported "Couldn't fetch" on an early submission; the file itself is valid and serves correctly).

### 5. Mobile Responsiveness Standards (320px – 430px)
- **Viewport Boundaries**: Every page and modal must render without horizontal scrollbars or squished inputs down to 320px (iPhone SE).
- **Padding Rule**: Use `px-4 sm:px-6` (or `px-3.5 sm:px-6`) instead of fixed `px-6` on outer wrappers to recover 16px of horizontal space on narrow screens.
- **Form Grids**: Forms with multiple columns must stack on mobile using `grid-cols-1 sm:grid-cols-2` or `grid-cols-1 sm:grid-cols-3`.
- **Modals & Drawers**: Modals must specify `max-h-[92vh] sm:max-h-[85vh] overflow-y-auto` and `p-2.5 sm:p-4`. Slide-over drawers must use viewport-aware widths (`w-[84vw] max-w-xs` or `w-full sm:max-w-xl`).


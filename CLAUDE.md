# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and Antigravity when working with code in this repository.

## What this is

**Jerry Dev Studio** ([https://jerry-dev-studio.web.app/](https://jerry-dev-studio.web.app/)): A high-performance FlutterFlow & mobile engineering studio portfolio, client portal, and technical publication.
- **Frontend**: React 19 + Vite SPA (`frontend/`) styled with the **FlowBase** design system (`#0A0C16` canvas, violet `#6D5AF6` primary, sky `#38BDF8` accents, self-hosted Plus Jakarta Sans, Inter, & JetBrains Mono variable fonts).
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
- **Client Quote Requests (`submitQuoteRequest`)**: Sanitized payload matching exact PostgreSQL `quote_requests` schema (`name`, `email`, `service`, `backend`, `budget`, `timeline`, `project_link`, `project_details`). Omits `.select()` during public submission to adhere to public RLS insert policy with `Prefer: return=minimal`.
- **Automated Date-Based Blog Scheduling**: Public queries in `getBlogPosts()` and `getBlogPost(slug)` strictly filter by `is_published = true AND published_date <= todayStr`. Future-dated articles automatically unlock on their scheduled calendar date without server crons. Authenticated admins bypass this check to preview and manage scheduled content.

### 2. Authentication, Admin Control Panel & Sales CRM
- **Auth Provider (`frontend/src/auth/AuthProvider.jsx`)**: Supabase Auth session listener (`onAuthStateChange`), login, and logout.
- **Route Guard (`frontend/src/components/admin/RequireAuth.jsx`)**: Verifies active Supabase session.
- **Admin Shell & Navigation (`frontend/src/components/admin/AdminLayout.jsx`)**: Category SVG icons, real-time activity badges (unread quote inquiries & CRM follow-ups due), user identity dropdown, and mobile slide-over drawer.
- **Command Center Dashboard (`frontend/src/pages/admin/Dashboard.jsx`)**: Clickable KPI cards, pipeline value metrics, quick launchpad (`+ New Post`, `+ Add Project`, `+ Log Deal`), and action-required feeds.
- **Universal Toast Notifications (`frontend/src/components/admin/ToastContext.jsx` & `toastStore.js`)**: Accessible floating feedback pills (`useToast()`) replacing browser `alert()`.
- **Reusable Admin Page Header (`frontend/src/components/admin/AdminPageHeader.jsx`)**: Breadcrumb trail, unsaved dirty state badge, and sticky save/cancel controls.
- **WCAG 2.1 AA Compliance (`Field.jsx`, `formStyles.js`, `SearchInput.jsx`, `ConfirmDialog.jsx`)**: 6.8:1 text contrast ratios, high-visibility keyboard focus rings, accessible clear buttons, and screen-reader alerts.
- **B2B Sales CRM (`frontend/src/pages/admin/crm/`)**:
  - `CrmPipeline.jsx`: Interactive Kanban pipeline with stage transitions, deal valuation, follow-up alerts, and compact mobile list toggle.
  - `CrmProspects.jsx`: LinkedIn Sales Navigator-style directory with CSV export and outreach shortcuts.
  - `ClientRadar.jsx`: Live client discovery engine aggregating hiring posts from Hacker News (with direct founder emails), RemoteOK, Jobicy, and freelance platforms with 1-click CRM ingestion.
  - `LeadDetailDrawer.jsx`: Salesforce-style deal inspector with 1-click email pitch generator, WhatsApp ping, and activity logs.
  - `QuoteInbox.jsx`: Inbound quote requests with 1-click **Convert to Deal** pipeline insertion.

### 3. SEO, Metadata & Syndication
- **`useDocumentMeta` (`frontend/src/hooks/useDocumentMeta.js`)**: Dynamically sets page titles, meta descriptions, canonical URLs (`https://jerry-dev-studio.web.app/...`), OpenGraph/Twitter cards, and Schema.org JSON-LD structured data (`WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`).
- **Favicons & PWA**: Multi-resolution suite (`favicon.ico`, `favicon-48x48.png`, `favicon-96x96.png`, `favicon-192x192.png`, `apple-touch-icon.png`) and Web App Manifest (`manifest.json`).
- **Sitemap & RSS**: Search engine sitemap (`public/sitemap.xml`) and RSS 2.0 feed (`public/feed.xml`) for syndication.

### 4. Interactive UI & Standout Publication Experience
- **Expanded Developer Publication Layout (`frontend/src/pages/BlogDetail.jsx`)**: Wide `max-w-7xl` asymmetric canvas (8-column content stream + 4-column sticky intelligence sidebar), eliminating dead side void on modern displays.
- **Interactive Sticky Table of Contents (TOC)**: Real-time `IntersectionObserver` scroll-spy highlighting active section in neon-blue, automatic heading anchor IDs (`RichTextContent.jsx`), and smooth-scroll jumping with `scroll-margin-top: 6rem`.
- **Top Reading Progress Bar**: Real-time fixed 3px gradient line (`#38BDF8` via `#7C6CFF` to `#6D5AF6`) tracking article completion.
- **High-Contrast Reader Typography (`index.css`)**: 18px (`1.125rem`) body font, relaxed 1.85 line-height, and 15.2px (`0.95rem`) code snippets.
- **Blog Index Spotlight & 3-Column Grid (`frontend/src/pages/Blogs.jsx`)**: Full-width featured hero spotlight card for latest solution, 3-column responsive card grid (`sm:grid-cols-2 lg:grid-cols-3`), real-time search, and dynamic category pills.
- **Interactive Project Case Study Modals (`frontend/src/pages/Projects.jsx`)**: Deep-dive modals presenting project overview, architecture, deliverables, and tech stack chips.
- **1-Click Code Copy Buttons (`frontend/src/components/RichTextContent.jsx`)**: One-click snippet copying with clipboard feedback across all code blocks.
- **Client Testimonials & Engagement Packages**: Homepage social proof and 3 structured engagement packages on `/solutions`.


# Jerry Dev Studio — Production Mobile Engineering & Technical Publication

> **Live Website:** [https://jerry-dev-studio.web.app/](https://jerry-dev-studio.web.app/)  
> **Backend & Database:** Supabase (PostgreSQL 17, Storage, Auth, RLS)  
> **Hosting & CDN:** Firebase Hosting (Project ID: `jerry-dev-studio`)

A high-performance FlutterFlow & mobile engineering portfolio, client portal, and technical publication built with the custom **FlowBase** design system (`#0A0C16` canvas, violet `#6D5AF6` primary, sky `#38BDF8` accents, self-hosted Plus Jakarta Sans, Inter, and JetBrains Mono variable typography).

---

## Architecture Overview

```
frontend/     React 19 + Vite SPA (Client marketing, technical publication, FlowBase admin CMS)
supabase/     PostgreSQL schema, RLS policies, storage buckets, seeds, Edge Functions
public/       Favicon suite, Web App Manifest, RSS 2.0 feed, sitemap.xml
docs/         Architecture, SRS, deployment, testing, admin guide, prototypes guide
backend/      LEGACY Django API — retired, not used by the app or deployed (kept for reference)
```

---

## Features

- **Automated Date-Based Blog Scheduling:** Zero-cron auto-publishing. Articles unlock automatically for public readers on their publication date while authenticated admins can preview future content, enforced via database RLS.
- **Modern Developer Publication UX:** `max-w-7xl` asymmetric canvas, sticky Table of Contents with real-time `IntersectionObserver` scroll-spy, fixed reading progress bar, high-contrast readable typography (18px body, 15.2px code blocks), and community errata feedback.
- **Mobile-Responsive Architecture (320px–430px):** Full viewport optimization down to iPhone SE / small Androids across all public views, modals, and the complete admin control panel.
- **B2B Sales CRM & Pipeline:** Interactive Kanban pipeline, Sales Navigator-style prospect directory with CSV export, and Salesforce-style deal inspector drawer.
- **Client Radar:** Daily server-side lead discovery (Hacker News, Jobicy, RemoteOK) stored in Supabase with shared dismiss/import status, a Discord digest of new leads, an engagement-fit filter that hides full-time roles, a rule-based 0-100 Opportunity Score, an App Store "rescue" scanner, and one-click search links for Upwork, Contra, Wellfound, Reddit and the FlutterFlow forum.
- **Apollo.io Lead Enrichment & Pitch Engine:** Edge Function proxied contact discovery and pitch generation (Ollama Cloud/Local, Groq, OpenAI, or built-in templates that reference the actual post and make no invented claims) across 3 angles and 3 tones, with an automatic follow-up cadence (+3/+7/+14 days).
- **Supabase Quota & Performance Optimizations:** 90% egress reduction on blog queries, client-side TTL memory/sessionStorage caching layer, bot spam filters, and automated PostgreSQL retention cleanup RPC.
- **Feature Lab (`/prototypes`):** five interactive, dummy-data prototypes (swipe cards, scripted AI chat, voice chat, map with custom pins, survey-based matching) shown in switchable phone / tablet / browser frames with a pastel app style, each ending in a quote form pre-filled with the feature the visitor tried. Registry-driven, so adding one is a small change (`docs/PROTOTYPES.md`).
- **Visitor linking & privacy:** a random browser ID is tied to a contact only via the quote form or a tracked link in a pitch; visit history shows in the lead drawer and quote inbox. Opt-out and Do Not Track are honoured, and `/privacy` explains it.
- **In-app Help & Guide (`/admin/help`):** searchable topic pages that explain every admin feature.
- **Lead Generation & Client Enquiries:** Sanitized quote request pipeline with direct PostgreSQL RLS insertion, instant Discord alerts, automatic CRM lead creation, and an admin inbox with 1-click deal conversion.
- **Interactive Case Studies:** Deep-dive modal architecture presenting project challenges, architectural solutions, and tech stack chips.
- **Route-Guarded Control Panel (`/admin`):** FlowBase Visual Block Builder V2, runtime-editable theme tokens, lead inbox, API integrations manager, and password visibility toggles.
- **SEO & Syndication:** Automated Schema.org JSON-LD generation (`WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`), RSS 2.0 (`/feed.xml`), and XML sitemap (`/sitemap.xml`).

---

## Quickstart

### Frontend Development

```bash
cd frontend
npm install
npm run dev      # Local Vite dev server (http://localhost:5173/)
npm run build    # Production build to frontend/dist
npm run lint     # Oxlint code linter
```

### Environment Configuration (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://fbeegpzrbocqgyxeqqtc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Firebase Deployment

```bash
firebase deploy --only hosting
```

---

## Supabase Database Management

Database migrations, schema definitions, and blog migration scripts are maintained in `/supabase`:
- `supabase/schema.sql`: Full database schema, indexes, RLS policies, and analytics RPCs.
- `supabase/seed_scheduled_blogs.sql`: Editorial calendar and technical guide seed migration.
- `supabase/radar.sql`, `quote_notify.sql`, `radar_cron.sql`, `visitors.sql`: Client Radar storage, quote trigger, daily schedule, and visitor linking with weekly cleanup (see `docs/DEPLOYMENT.md` §7-9).
- `supabase/functions/`: Edge Functions `ai-proxy`, `apollo-proxy`, `quote-notify`, `radar-ingest`, plus shared radar code in `_shared/radar/`.
- `supabase/fixes/`: one-time data repairs that have been applied.

---

## License

Proprietary — © Jerry Dev Studio. All rights reserved.

# Portfolio-DJ — Project Reference

**Jerry Dev Studio** ([https://jerry-dev-studio.web.app/](https://jerry-dev-studio.web.app/)): a FlutterFlow & mobile engineering studio portfolio, client portal, and technical publication built with the **FlowBase** design system (deep navy canvas, violet primary, sky blue accents, self-hosted typography). A React (Vite) single-page app on **Firebase Hosting**, talking **directly to Supabase** (PostgreSQL, Supabase Auth, Storage, Row Level Security, Edge Functions). There is no application server: authorization lives in RLS policies, and the two server-side integrations run as Supabase Edge Functions.

The admin panel (`/admin`) is a route-guarded control panel: grouped sidebar, live analytics, content CRUD, the FlowBase Visual Block Builder V2, site settings, a runtime-editable theme, and a B2B sales CRM.

Last updated: 2026-11-09.

---

## 1. Directory layout

```
Portfolio-DJ/
├── CLAUDE.md                entry point for AI coding sessions — read this first
├── README.md                setup instructions
├── firebase.json            Hosting config: serves frontend/dist, SPA rewrite, immutable asset caching
├── docs/                    ARCHITECTURE (this file), SRS, DEPLOYMENT, TESTING, QUICK-TEST
│
├── supabase/
│   ├── schema.sql           tables, indexes, RLS policies, storage bucket, RPCs, seed rows (idempotent)
│   ├── seed_scheduled_blogs.sql   editorial-calendar blog seed
│   ├── quote_notify.sql     trigger that calls quote-notify (run after deploying it; needs Vault secrets)
│   ├── radar.sql            radar_items table + crm_leads.source_url (run once; app falls back to live fetching without it)
│   ├── radar_cron.sql       pg_cron schedule for radar-ingest (needs Vault secrets)
│   ├── fixes/               one-time data repair scripts
│   ├── config.toml          edge function config (verify_jwt = true for both)
│   └── functions/
│       ├── ai-proxy/        LLM calls (Ollama Cloud, Groq, OpenAI) — keeps provider CORS/keys off the browser path
│       ├── apollo-proxy/    Apollo.io contact enrichment
│       ├── quote-notify/    Quote alerts, optional auto-reply, auto-created CRM lead (called by a DB trigger)
│       ├── radar-ingest/    Daily server-side radar fetch → radar_items, plus digest email (pg_cron or admin button)
│       └── _shared/radar/   text.js, scoring.js, sources.js: parsing, scoring and fetching shared by the browser and the functions
│
├── frontend/                React 19 + Vite SPA
│   ├── public/              favicons, manifest.json, robots.txt, sitemap.xml, feed.xml,
│   │                        fonts/ (self-hosted variable woff2)
│   └── src/
│       ├── main.jsx, App.jsx    entry; route table; applies the site theme once at boot
│       ├── index.css            FlowBase tokens (CSS custom properties) + component classes
│       ├── api/
│       │   ├── supabase.js      client + uploadMedia() to the `media` bucket
│       │   ├── client.js        every data call (the contract the UI codes against) + TTL cache
│       │   ├── aiClient.js      pitch generation, multi-provider, settings in localStorage
│       │   ├── apolloClient.js  enrichment via apollo-proxy
│       │   ├── radarClient.js   Hacker News / RemoteOK / Jobicy fetchers
│       │   └── radarScoring.js  0–100 opportunity score + freshness decay
│       ├── auth/            AuthProvider (Supabase session listener), authContext
│       ├── hooks/           useDocumentMeta (SEO), usePaginatedList
│       ├── utils/           applyTheme, blogBlocks (Block Builder <-> HTML), slugify, buildPayload, apiErrors
│       ├── components/      PublicLayout, NavBar, Footer, RequestQuoteModal, RichTextContent, ...
│       │   └── admin/       AdminLayout, RequireAuth, Toast*, AdminPageHeader, BlogBlockBuilder,
│       │                    BlockPreviewRenderer, BlockPropertiesDrawer, RichTextEditor, ...
│       └── pages/
│           ├── Home, Solutions, Blogs, BlogDetail, Projects, NotFound
│           └── admin/       Dashboard, BlogList/Editor, ProjectList/Editor, SkillsManager, ProfileEditor,
│                            QuoteInbox, Analytics, crm/ (Pipeline, Prospects, ClientRadar, LeadDetailDrawer),
│                            settings/ (Account, Branding, ThemeEditor, Integrations)
│
└── backend/                 LEGACY — see below
```

### `backend/` is legacy

`backend/` is the original Django 6 + DRF + SimpleJWT API (Vercel + Supabase Postgres). The frontend no longer calls it: `frontend/src/api/client.js` queries Supabase directly and auth is Supabase Auth. It is kept in the repo for reference only; it is not deployed, not in the build, and not needed to run the site. Nothing in this document describes it except this note. (Its data model was ported to `supabase/schema.sql`; the analytics aggregation became the `get_analytics_summary` RPC.)

---

## 2. Stack and packages

### Frontend (`frontend/package.json`)

| Package | Why it's here |
|---|---|
| `react` / `react-dom` ^19 | UI |
| `react-router-dom` ^7 | Routing; admin and CRM pages are `lazy()` chunks |
| `@supabase/supabase-js` ^2 | Database, Auth, Storage, Edge Function invocation |
| `@tiptap/*` ^3 | Rich-text editing in the blog editor and block text elements |
| `dompurify` | Sanitizes post HTML before rendering |
| `vite` ^8, `@vitejs/plugin-react` | Build tool and dev server |
| `tailwindcss` + `@tailwindcss/vite` ^4 | Styling (Tailwind v4, tokens in CSS `@theme`) |
| `oxlint` | Linter (`npm run lint`) |

### Platform

- **Supabase** (PostgreSQL 17, Auth, Storage, Edge Functions on Deno).
- **Firebase Hosting** — project `jerry-dev-studio`. `firebase.json` rewrites every path to `/index.html` and marks js/css/font assets `immutable` for a year.

---

## 3. Data model (`supabase/schema.sql`)

All tables have RLS enabled. "Admin" below means any `authenticated` Supabase user — there is a single admin account, and sign-ups should stay disabled in the Supabase dashboard.

| Table | Purpose | Key columns | Public access | Admin |
|---|---|---|---|---|
| `profiles` | Singleton owner profile | `name`, `tagline`, `bio`, `photo`, `resume`, `email`, `github_url`, `linkedin_url` | read | all |
| `skills` | Home page tech-stack cards | `name`, `description`, `display_order` | read | all |
| `blog_posts` | Articles | `title`, `slug` (unique), `category`, `excerpt`, `content` (HTML), `cover_image`, `published_date`, `is_published` | read **only if** `is_published AND published_date <= CURRENT_DATE` | all (incl. drafts/future) |
| `projects` | Case studies | `title`, `description`, `tech_stack` (CSV), `thumbnail`, `repo_url`, `live_url`, `display_order`, `is_featured` | read | all |
| `quote_requests` | Inbound enquiries | `name`, `email`, `service`, `backend`, `budget`, `timeline`, `project_link`, `project_details` | **insert only** (non-empty name/email/details enforced in the policy) | read/update/delete |
| `site_branding` | Singleton (id = 1) | `site_name`, `logo`, `favicon` | read | all |
| `site_theme` | Singleton (id = 1), runtime theme | 8 colour tokens, `font_display`, `font_mono`, `radius_scale`, `shadow_intensity`, `button_style`, `card_style` | read | all |
| `page_views` | Analytics events | `path`, `referrer`, `is_blog_post`, `slug`, `session_key` | insert only | read |
| `crm_leads` | Sales pipeline | `name`, `company`, `job_title`, `email`, `linkedin_url`, `stage`, `temperature`, `source`, `deal_value`, `tech_stack[]`, `next_follow_up`, `quote_request_id` | none | all |
| `visitor_links` | Which browser IDs belong to which lead (optional; `supabase/visitors.sql`) | `visitor_id`, `lead_id`, `source` (`quote`/`link`) | none | all |
| `radar_items` | Stored Client Radar posts (optional; `supabase/radar.sql`) | `source_url` (unique), `company`, `title`, `posted_at`, `score`, `fit`, `status` (`new`/`dismissed`/`imported`), `lead_id`, `first_seen_at`, `last_seen_at`, `notified_at` | none | all |
| `crm_activities` | Per-lead timeline | `lead_id` (cascade), `type`, `content` | none | all |

Functions (RPCs):

- `get_analytics_summary(days)` — totals, daily series, top pages/posts/referrers, quote trend, in one query.
- `cleanup_old_page_views(retention_days)` — authenticated-only retention sweep (clamped to 7–365 days). Nothing in the UI calls it yet.

Storage: public-read `media` bucket; only authenticated users may upload/update/delete. `uploadMedia(file, folder)` in `api/supabase.js` returns the public URL, which is what gets stored in the `photo`, `thumbnail`, `cover_image`, `logo`, `favicon` columns.

CRM stage values: `lead`, `contacted`, `proposal`, `negotiation`, `closed_won`, `closed_lost`. Temperatures: `cold`, `warm`, `hot`.

---

## 4. How the data layer works

**`api/client.js`** is the single place that talks to Supabase. It preserves the response shapes the UI was originally written against: list calls return a `{ count, next, results }` envelope, and file fields accept `File` objects that are uploaded via `uploadMedia` before the row is written.

**Egress and quota controls**

- `getBlogPosts()` omits `content` — the list only needs metadata; the body is fetched by `getBlogPost(slug)`.
- A TTL cache (`getCached` / `setCached` / `invalidateCache`) keeps results in memory and `sessionStorage` (default 5 min). Mutations invalidate by key prefix.
- `trackPageView` skips headless/bot user agents, de-dupes the same path within 30 s, and keys visitors with a random `__pv_session` id in `localStorage` (no IP, no cookies).
- `cleanup_old_page_views` can trim the table, but must be invoked manually (see `DEPLOYMENT.md`).

**Scheduled publishing.** There is no cron. Public queries filter `is_published = true AND published_date <= today`, and the same rule is enforced in RLS, so a future-dated post is invisible to anonymous readers (the API and a direct REST call alike) until its date arrives. Admins see everything.

**Quote requests.** `submitQuoteRequest` sends exactly the `quote_requests` columns and does not chain `.select()` — anonymous users have INSERT but not SELECT, so the insert uses `return=minimal`. Spam resistance is the RLS validation plus the absence of read access; there is no server-side rate limit.

**Fallbacks.** If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, `isSupabaseConfigured` is false and `client.js` returns `null`/defaults instead of crashing; `BlogDetail` and `Solutions` additionally fall back to bundled sample posts (`src/data/fallbackBlogDetails.json`).

---

## 5. Authentication and authorization

- **Sign-in:** `supabase.auth.signInWithPassword(email, password)`. `AuthProvider` subscribes to `onAuthStateChange`; the Supabase SDK persists and silently refreshes the session (`persistSession`, `autoRefreshToken`). There is no custom token store.
- **Route guard:** `RequireAuth` blocks `/admin/*` until a session exists, preserving the originally requested URL for the post-login redirect. `/admin/login` sits outside the guard.
- **The real enforcement is RLS**, not the guard. Hiding a route is UX; the policies in §3 are what stop an anonymous caller from writing or reading private rows. Every admin-only table grants access only `TO authenticated`.
- **Single admin:** policies treat any authenticated user as admin. Keep public sign-ups disabled in Supabase Auth settings, or add a role check to the policies.
- **Login throttling** is Supabase Auth's built-in rate limiting.
- **Edge Functions** (`ai-proxy`, `apollo-proxy`) are deployed with `verify_jwt = true` *and* re-verify the caller with `supabase.auth.getUser()` before doing anything, returning 401 otherwise. They take third-party API keys in the request body, so they must never be callable anonymously.
- **Third-party keys** (Ollama, Groq, OpenAI, Apollo) are entered in `/admin/settings/integrations` and stored in the admin's **browser `localStorage`** — they never reach the database or git. The trade-off is that they are per-browser and readable by any script on the page; acceptable for a single-admin tool, not for multi-user.
- **Content safety:** post HTML is sanitized with DOMPurify before rendering (`RichTextContent`).

---

## 6. Admin panel

| Route | Page | Notes |
|---|---|---|
| `/admin` | `Dashboard` | Clickable KPI cards, pipeline value, quick launchpad, action-required feeds |
| `/admin/blog`, `/new`, `/:slug/edit` | Blog CMS | FlowBase Visual Block Builder V2 + rich text; scheduling via `published_date` |
| `/admin/analytics` | `Analytics` | Calls `get_analytics_summary` |
| `/admin/projects`, `/new`, `/:id/edit` | Projects | |
| `/admin/skills`, `/admin/profile` | Skills / Profile | |
| `/admin/quotes` | `QuoteInbox` | Read/delete; **Convert to Deal** inserts a `crm_leads` row linked by `quote_request_id` |
| `/admin/crm` | `CrmPipeline` | Kanban by stage, deal value, follow-up alerts, mobile list toggle |
| `/admin/crm/prospects` | `CrmProspects` | Directory with CSV export and outreach shortcuts |
| `/admin/crm/radar` | `ClientRadar` | Live hiring-feed aggregator with 1-click CRM ingestion |
| `/admin/settings/account` | `AccountSettings` | Password change via Supabase Auth |
| `/admin/settings/branding`, `/theme` | Branding / `ThemeEditor` | Writes `site_branding` / `site_theme` |
| `/admin/settings/integrations` | `IntegrationSettings` | AI provider + Apollo keys, connection tests |
| `/admin/help`, `/admin/help/:slug` | `HelpIndex`, `HelpTopic` | In-app Help & Guide: searchable topic list, quick answers, 8 topic pages with an "On this page" list and previous/next links. Content is data in `pages/admin/help/helpTopics.jsx` (building blocks in `HelpBlocks.jsx`) |
| `*` under `/admin` | `AdminNotFound` | |

`AdminLayout` provides the grouped sidebar, live badges (unread quotes, CRM follow-ups due), the identity dropdown, and a mobile slide-over drawer. Feedback uses the shared toast system (`useToast()`); `AdminPageHeader` supplies breadcrumbs and the sticky save/cancel bar with a dirty-state badge.

### FlowBase Visual Block Builder V2

Blog posts are composed from auto-layout containers (row/column) and atomic elements (heading, text, image, table, list, video, code card, callout, pull quote, button). Storage is **lossless dual-format** in `blog_posts.content`: clean semantic HTML (so readers, crawlers and RSS need no JS) followed by the exact block tree, URI-encoded in a trailing comment:
`<!-- FLOWBASE_BLOCKS_V2:<encoded_json>:FLOWBASE_BLOCKS_V2 -->`.
Reopening a post runs `parseHTMLToBlocks()` (in `utils/blogBlocks.js`) to rebuild the editable tree. Full block schema: `docs/SRS.md` §4.

### CRM and lead tooling

- **Client Radar** (`radarClient.js`) pulls Hacker News (the latest "Who is hiring?" thread, found via the `whoishiring` author tag; top-level posts only; several stack queries merged), RemoteOK, and Jobicy, and lists freelance-marketplace scanners. The monthly "Freelancer? Seeking freelancer?" thread was last posted in October 2025; the fetcher uses it only if a post from the last 45 days exists. Obfuscated emails (`name [at] domain [dot] com`) are recognised.
- **Opportunity Score** (`radarScoring.js`) is a deterministic 0–100 rule set, not an LLM call: freshness decay (30), reachability (15), tech-stack match (25), and **engagement fit** (30). `classifyEngagement` labels each post `fit` (contract / freelance / part-time / project / retainer wording), `unclear`, or `not_fit` (exclusive full-time, W-2, contract-to-hire, benefits, fixed 40-hour weeks), because the studio serves several clients and does not take exclusive employment. The radar hides `not_fit` posts by default (toggle), and shows a fit badge on every card.
- **Two modes.** With `radar_items` present and filled, Client Radar shows *stored* posts that the `radar-ingest` function fetched server-side (daily via `pg_cron`, or on demand with the Refresh Feeds button): the shared parsing/scoring code runs in Deno, new posts are upserted by `source_url` (existing rows keep their status), never-actioned posts unseen for 45 days are pruned, and a digest of new contract-fit posts scoring at least `DIGEST_MIN_SCORE` is emailed once each. Scores shown in the UI are recomputed in the browser, because freshness decays with time. Without the table, the radar fetches live in the browser as before.
- **Dismissed and imported posts** are stored in `radar_items.status` (shared across devices) in stored mode, and in `localStorage` (`radar_dismissed_v1`) in live mode. Imported posts are also recognised by `crm_leads.source_url` (or, for older leads, the `Post URL:` line in the lead's notes).
- **Pitch drafts** (`utils/pitch.js`) are built in the browser from the lead: they open with the specific post (Hacker News post, job listing, inbound quote, or an App Store rating/update fact), state the engagement model (scoped projects, fixed hours or a light retainer alongside other clients), and make no invented claims (no metrics, timelines or client counts). Radar cards with an email open a ready-to-send `mailto:` draft; the lead drawer offers 3 angles × 3 tones.
- **Follow-up cadence** (`pages/admin/crm/crmCadence.js`): logging an outreach activity (email, LinkedIn, call) sets the next follow-up automatically (+3, +7, then +14 days; no automatic follow-up after the third) and moves a new lead to Contacted. Logging **Reply Received** stops the sequence, marks the lead hot, and schedules a response for the next day. Quick stage moves on the Kanban are written to the lead's timeline.
- **App Rescue Scanner** (prototype, `api/appStoreClient.js` + `RescueScanner.jsx`): searches Apple's public iTunes Search API from the browser and ranks apps by rescue signals (low or falling rating, months since last update, size of user base, a publisher website to enrich). Results are a lead list to check by hand; "Add to CRM" imports the app with its rating and update date in the notes.
- **Reddit and the FlutterFlow forum** are not ingested: Reddit's Data API requires prior approval (and a paid agreement for commercial use), and the forum has no feed. They are one-click search links under *Search Links*.
- **Apollo enrichment** (`apolloClient.js` → `apollo-proxy`): "Find Decision-Maker & Verified Email" from `LeadDetailDrawer` and `ClientRadar`.
- **AI Cold Pitch Engine** (`aiClient.js`): providers are Ollama Cloud, Ollama Local (direct to the daemon or a tunnel — this path is browser → daemon, not through the Edge Function), Groq (Llama 3.3 70B), OpenAI/custom, or the zero-API algorithmic templates (default). Output is 3 angles (Rescue & Refactor, Rapid MVP Delivery, Architecture Advisory) × 3 tones (Senior Engineer, Pragmatic Partner, Direct & Punchy).

---

### Visitor linking (optional)

`page_views.session_key` is a random per-browser ID (`utils/visitor.js`, `localStorage` key `__pv_session`). It is linked to a person only when they submit the quote form (the ID is saved in `quote_requests.visitor_id`; `quote-notify` and "Convert to deal" copy it into `visitor_links`) or open a tracked link from a pitch (`/projects?ref=<16-hex token>`, where the token is `crm_leads.track_token`; the browser calls the `link_visitor` RPC once and the `ref` parameter is removed from the address bar). Admin screens show the history through `VisitHistory`, which reads `page_views` for the linked IDs. Tracking is off for visitors who opt out on `/privacy` or send Do Not Track. There is no fingerprinting or IP lookup. Retention: unlinked views 90 days, linked 365 days (weekly `pg_cron` job). **The `/privacy` notice describes this behaviour; keep it accurate when tracking changes.**

## 7. Public site

| Path | Page |
|---|---|
| `/` | `Home` — hero, tech stack, featured work (`is_featured`, falling back to the first two by `display_order`), CTA |
| `/solutions` | `Solutions` — FlutterFlow fix/guide library: category-filtered post cards backed by `getBlogPosts`, with built-in fallback posts |
| `/blogs`, `/blogs/:slug` | `Blogs` (category filter, Load more) / `BlogDetail` (sticky TOC with scroll-spy, reading-progress bar) |
| `/projects` | `Projects` — cards + deep-dive modal |
| `/prototypes`, `/prototypes/:slug` | `Prototypes`, `PrototypeDetail` — Feature Lab: interactive demos (swipe cards, AI chat, voice chat, map with custom pins, survey matching) driven by `src/prototypes/registry.js`; see `docs/PROTOTYPES.md`. Demos render inside phone / tablet / browser frames (`prototypes/device/`) with a pastel "kawaii" app theme (`prototypes/kawaii.jsx`) |
| `/privacy` | `Privacy` — what is recorded, retention, and a per-browser tracking opt-out |
| `*` | `NotFound` |

`PublicLayout` fetches profile and branding once, drives dynamic branding (nav name/avatar, favicon), fires `trackPageView` on each route change, and hosts the global quote modal. Admin routes don't use this layout, so admin traffic is never counted.

**SEO.** `useDocumentMeta` sets per-page title, description, canonical URL (`https://jerry-dev-studio.web.app/...`), OpenGraph/Twitter tags and JSON-LD (`WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`). Static assets: `sitemap.xml`, `feed.xml` (RSS 2.0), `robots.txt`, `manifest.json`, favicon suite. Because this is a client-rendered SPA, link-preview bots that don't run JS only see the static `index.html` tags, not per-post titles/images; Google's crawler does execute JS. `sitemap.xml` and `feed.xml` are static files and must be updated by hand when posts are added.

---

## 8. Theming and typography

Tailwind v4, configured in CSS via `@theme` in `index.css` — there is no `tailwind.config.js`. FlowBase palette:

- **Canvas:** `#0A0C16`, with fixed radial glows (violet `#7C6CFF` top, sky `#38BDF8` right).
- **Panels:** `#11142A` → `#171B35`, 1px `#232848` borders.
- **Accents:** `#6D5AF6` primary (with glow), `#7C6CFF` decorative violet, `#38BDF8` links/kickers.
- **Typography (self-hosted variable woff2 in `frontend/public/fonts/`):**
  - Display: **Plus Jakarta Sans** (`--font-display`)
  - Body: **Inter** (`--font-sans`)
  - Mono: **JetBrains Mono** (`--font-mono`, `--font-mono-ui`)
  - Plus Jakarta Sans and Inter are preloaded in `index.html` for zero layout shift.

**Fonts are also theme data.** `site_theme.font_display` / `font_mono` can be changed in the Theme Editor (options: Plus Jakarta Sans, Inter, Poppins, Space Grotesk, Manrope, Sora / JetBrains Mono, Fira Code, IBM Plex Mono, Roboto Mono). `applyTheme.js` loads non-self-hosted choices from Google Fonts. **Legacy alias:** earlier schema versions defaulted the theme row to `Manrope` / `Fira Code`; `applyTheme.js` deliberately maps those two values to Plus Jakarta Sans / JetBrains Mono so old rows still render the current brand. The `Manrope` and `Fira Code` `@font-face` blocks and woff2 files remain in the repo only so choosing them in the Theme Editor works offline; they are not part of the default look.

Runtime theming: `utils/applyTheme.js` resolves the `site_theme` row into CSS custom properties (`--color-void`, `--color-panel`, `--color-panel-edge`, `--color-neon-blue`, `--color-neon-indigo`, `--color-accent`, `--theme-radius`, `--theme-shadow`, button/card vars, `--font-display`, `--font-mono-ui`) on `document.documentElement` — no rebuild or redeploy. `App.jsx` applies it once at boot; `ThemeEditor` previews using the same resolvers. One theme, not a gallery. The site is dark-only.

Key component classes: `.system-panel`, `.system-button` / `-primary`, `.system-heading`, `.eyebrow`, `.fb-kicker`, `.fb-grad-text`, `.fb-card`, `.fb-window`, `.fb-cta`, `.fb-stat`, `.fb-chip`, `.skeleton`, `.markdown-body`.

### Mobile standards (320–430px)

Every page and modal must render without horizontal scroll down to 320px. Outer wrappers use `px-4 sm:px-6`; multi-column forms stack with `grid-cols-1 sm:grid-cols-2|3`; modals use `max-h-[92vh] sm:max-h-[85vh] overflow-y-auto` and `p-2.5 sm:p-4`; drawers use `w-[84vw] max-w-xs` or `w-full sm:max-w-xl`.

---

## 9. Local development

```bash
cd frontend
npm install
cp .env.example .env     # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:5173/
npm run build            # -> frontend/dist
npm run lint
```

There is no local backend to start. The dev server talks to whichever Supabase project `.env` points at, so **local development writes to the same database as production unless you point `.env` at a separate project**. Only the anon key belongs in the frontend; never put the service-role key there.

Database setup on a fresh Supabase project: run `supabase/schema.sql` in the SQL Editor (idempotent), then optionally `supabase/seed_scheduled_blogs.sql`, then create the admin user under Authentication → Users and disable public sign-ups.

---

## 10. Deployment

Frontend: `npm run build` then `firebase deploy --only hosting`. Edge Functions: `supabase functions deploy <ai-proxy|apollo-proxy> --project-ref fbeegpzrbocqgyxeqqtc`. Schema changes are applied by running SQL in the Supabase SQL Editor. Full walkthrough in `docs/DEPLOYMENT.md`.

**Known gotcha:** Supabase free-tier projects auto-pause after about a week of inactivity, and a paused project can stop resolving in DNS — which looks exactly like a deleted project (`ENOTFOUND`). Check the dashboard for a "Paused" state before assuming the database is gone. As of 2026-11-09 the project `fbeegpzrbocqgyxeqqtc` resolves and answers REST and Auth requests.

---

## 11. Not built yet / deliberately deferred

- **Email on quote submission** — submissions land in the inbox silently; the unread badge is the only notification.
- **Forgot-password email flow** — password change is self-service while signed in.
- **Server-side search** — admin search boxes filter only already-loaded items.
- **Bulk actions** — no multi-select delete.
- **Per-post link previews** — needs SSR or a prerender/proxy step.
- **Automated tests** — there is no frontend test suite; verification is manual (`docs/TESTING.md`).
- **Role-based admin** — any authenticated user is admin (see §5).
- **Multi-theme gallery** — `site_theme` is a singleton by design.

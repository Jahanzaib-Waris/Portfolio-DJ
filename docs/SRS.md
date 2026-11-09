# Software Requirements Specification (SRS)
## Portfolio-DJ & FlowBase Content Management System

**Document Version:** 2.0.0  
**Status:** Approved / Living Specification  
**Date:** November 2026 (architecture migrated from Django/Vercel to Supabase/Firebase; see `docs/ARCHITECTURE.md`)  
**System Author & Lead Architect:** Jahanzaib Waris  
**Repository:** `Jahanzaib-Waris/Portfolio-DJ`  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a complete description of the **Portfolio-DJ** web platform. It establishes the architectural foundation, functional modules, data models, user interface paradigms, non-functional constraints, and deployment pipelines for both the public-facing developer portfolio and the staff-only administrative Content Management System (CMS).

### 1.2 Document Scope
This document covers:
1. **Public Presentation Layer:** High-performance single-page application (SPA) featuring personal branding, project showcases, interactive case studies, skills matrix, service quote requests, traffic analytics beacon, and the public blog reader.
2. **Administrative Control Panel Layer:** Secure, Supabase-Auth-protected management dashboard managing profile attributes, project portfolios, incoming quote submissions, runtime visual theme customization, traffic analytics reporting, the **FlowBase Block Builder Engine**, and a B2B sales CRM (pipeline, prospects, Client Radar, AI cold-pitch engine, Apollo.io enrichment).
3. **FlowBase Visual Block Builder Engine:** A modular, auto-layout content builder allowing the composition of rich blog articles using Flexbox containers (Rows and Stacks) and atomic elements (text, images, headings, comparison tables, checklists, code cards, callouts, pull quotes, and video embeds) with lossless compilation into standards-compliant HTML.
4. **Backend Layer:** Supabase — PostgreSQL 17 with Row Level Security as the authorization layer, Supabase Auth, Supabase Storage (`media` bucket), and two Deno Edge Functions (`ai-proxy`, `apollo-proxy`). The frontend queries Supabase directly; there is no custom application server. (The legacy Django API in `backend/` is retired and not part of the system.)

### 1.3 Definitions, Acronyms, and Abbreviations
- **API:** Application Programming Interface
- **CMS:** Content Management System
- **CRUD:** Create, Read, Update, Delete
- **RLS:** PostgreSQL Row Level Security
- **Edge Function:** Supabase-hosted Deno serverless function
- **JWT:** JSON Web Token issued by Supabase Auth and refreshed automatically by the client SDK
- **SPA:** Single Page Application (React 19 + Vite)
- **UGC:** User-Generated Content
- **SRS:** Software Requirements Specification
- **FlowBase:** The developer-focused visual design system and component architecture utilizing deep navy canvas (`#0A0C16`), violet primary (`#6D5AF6`), and sky blue (`#38BDF8`) accents.

---

## 2. Overall System Architecture & Tech Stack

### 2.1 High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                 CLIENT LAYER (Firebase Hosting + CDN)                  │
│                                                                        │
│   Public Client (Visitors)             Admin Panel (/admin)            │
│   - Hero & Profile                     - Supabase Auth session         │
│   - Projects & Case Studies            - Dashboard & Analytics         │
│   - Blog Reader & Block Renderers      - FlowBase Block Builder V2     │
│   - Quote Request Form                 - Theme & Branding              │
│   - Analytics Beacon                   - CRM, Client Radar, AI Pitch   │
└──────────────┬───────────────────────────────────┬─────────────────────┘
               │ HTTPS (supabase-js, anon/user JWT)│ HTTPS (user JWT)
               ▼                                   ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│  SUPABASE                           │  │  EDGE FUNCTIONS (Deno)        │
│  - PostgreSQL 17 + RLS policies     │  │  - ai-proxy (Ollama/Groq/     │
│  - Auth (email + password)          │  │    OpenAI)                    │
│  - Storage: public `media` bucket   │  │  - apollo-proxy (Apollo.io)   │
│  - RPCs: get_analytics_summary,     │  │  verify_jwt = true and caller │
│    cleanup_old_page_views           │  │  re-checked with auth.getUser │
└─────────────────────────────────────┘  └───────────────┬───────────────┘
                                                         ▼
                                          Third-party APIs (keys supplied
                                          per request from the admin browser)
```

### 2.2 Technology Stack
- **Frontend Framework:** React 19.x, React Router 7.x
- **Build Tooling & Bundler:** Vite 8.x, Oxlint
- **CSS Architecture:** Tailwind CSS v4, CSS Custom Properties (`@theme` design tokens)
- **Rich Text:** TipTap 3.x; HTML sanitized with DOMPurify
- **Backend Platform:** Supabase (PostgreSQL 17, Auth, Storage, Edge Functions)
- **Hosting:** Firebase Hosting (project `jerry-dev-studio`)

---

## 3. Data Models & Database Schemas

The authoritative definition is `supabase/schema.sql`. "Admin" means an authenticated Supabase user (single-admin deployment; public sign-ups are disabled).

### 3.1 Authentication
Supabase Auth, email + password. There is no separate user table in the app schema. Access to `/admin/*` requires a valid session in the UI, and — the actual security boundary — every admin-only table and storage write is guarded by RLS policies `TO authenticated`.

### 3.2 Profile & Skills
- **`profiles` (singleton):** `name`, `tagline`, `bio`, `photo`, `resume`, `email`, `github_url`, `linkedin_url`, `updated_at`. Public read; admin write.
- **`skills`:** `name`, `description`, `display_order`. Public read; admin write.

### 3.3 Projects & Case Studies
- **`projects`:** `title`, `description`, `tech_stack` (comma-separated text, split into chips in the UI), `thumbnail`, `repo_url`, `live_url`, `display_order`, `is_featured`, `created_at`. Public read; admin write.

### 3.4 Blog Engine
- **`blog_posts`:** `title`, `slug` (unique), `category`, `excerpt`, `content` (compiled HTML plus embedded block metadata, see §4.3), `cover_image`, `published_date`, `is_published`, `created_at`, `updated_at`.
- **Visibility rule (enforced in RLS and mirrored in queries):** anonymous readers see a post only when `is_published = true AND published_date <= CURRENT_DATE`; admins see all. This provides zero-cron scheduled publishing.

### 3.5 Inquiries & Quotes
- **`quote_requests`:** `name`, `email`, `service`, `backend`, `budget`, `timeline`, `project_link`, `project_details`, `submitted_at`. Anonymous **insert only** (policy requires non-empty name, email, details); admin read/update/delete.

### 3.6 Settings & Theming
- **`site_branding` (singleton, id = 1):** `site_name`, `logo`, `favicon`.
- **`site_theme` (singleton, id = 1):** colour tokens (`color_void`, `color_panel`, `color_panel_edge`, `color_neon_blue`, `color_neon_indigo`, `color_accent`, `color_status_green`, `color_status_red`), `font_display` (default Plus Jakarta Sans), `font_mono` (default JetBrains Mono), `radius_scale`, `shadow_intensity`, `button_style`, `card_style`. Resolved to CSS custom properties at runtime without a rebuild.

### 3.7 Analytics
- **`page_views`:** `path`, `referrer`, `is_blog_post`, `slug`, `session_key` (random per-browser id, no PII), `created_at`. Anonymous insert; admin read.
- **RPC `get_analytics_summary(days)`:** aggregated totals, daily series, top pages/posts/referrers, quote trend.
- **RPC `cleanup_old_page_views(retention_days)`:** authenticated-only retention sweep.

### 3.8 CRM
- **`crm_leads`:** contact and company fields, `stage` (`lead`, `contacted`, `proposal`, `negotiation`, `closed_won`, `closed_lost`), `temperature` (`cold`, `warm`, `hot`), `source`, `deal_value`, `currency`, `tech_stack[]`, `notes`, `next_follow_up`, optional `quote_request_id`.
- **`crm_activities`:** `lead_id` (cascades on delete), `type` (`note`, `linkedin_message`, `email`, `call`, `meeting`, `proposal_sent`), `content`.
- Admin-only; no public access.

### 3.9 Client Radar Store
- **`radar_items`** (optional, `supabase/radar.sql`): posts fetched server-side by the `radar-ingest` Edge Function, unique on `source_url`, with `fit`, ingestion-time `score`, and a shared `status` (`new`, `dismissed`, `imported`). Admin-only. `crm_leads.source_url` records the post a lead came from.

### 3.10 Lead Tooling (non-database)
- **Client Radar:** aggregates Hacker News hiring posts, RemoteOK and Jobicy; ranks each item with a rule-based 0–100 Opportunity Score (freshness decay, reachability, tech-stack match, deal-intent signals).
- **AI Cold Pitch Engine:** Ollama Cloud, Ollama Local, Groq, OpenAI/custom, or built-in algorithmic templates; 3 angles × 3 tones.
- **Apollo.io enrichment:** decision-maker and verified-email lookup via `apollo-proxy`.
- Provider keys are held in the admin browser's `localStorage`, never in the database or repository.

---

## 4. FlowBase Visual Block Builder Engine

### 4.1 Concept & Design Philosophy
The FlowBase Visual Block Builder provides a visual, modular publishing experience akin to modern design and development platforms (Figma, Webflow, FlutterFlow). Instead of restricting authors to plain monolithic WYSIWYG boxes, content is arranged in **Auto-Layout Containers** and **Atomic Elements**.

### 4.2 Block Schema Specifications

#### 1. Auto-Layout Container Block (`container`)
- **Role:** High-level flexbox wrapper that arranges children side-by-side (Row) or stacked (Column).
- **Properties:**
  - `direction`: `'row'` | `'column'`
  - `wrap`: `boolean` (controls multi-line wrapping in row mode)
  - `justify`: `'start'` | `'center'` | `'between'` | `'end'`
  - `align`: `'start'` | `'center'` | `'end'` | `'stretch'`
  - `gap`: `'none'` | `'sm'` | `'md'` | `'lg'`
  - `padding`: `'none'` | `'sm'` | `'md'` | `'lg'`
  - `background`: `'none'` | `'subtle'` | `'gradient'` | `'accent'`
  - `border`: `'none'` | `'solid'` | `'dashed'`
  - `radius`: `'none'` | `'md'` | `'lg'` | `'full'`
  - `children`: Array of Atomic or Nested Blocks.
- **Child Sizing Rules:**
  - When inside a Row, child blocks support explicit layout widths: `fill` (`flex: 1 1 0%`), `hug` (`flex: 0 0 auto`), or percentages (`25%`, `33%`, `38%`, `40%`, `50%`, `60%`, `75%`, `100%`).

#### 2. Atomic Elements
- **Heading Block (`heading`):**
  - `level`: `h2`, `h3`, `h4`
  - `kicker`: Optional uppercase monospace eyebrow tag
  - `text`: Heading copy
  - `align`: `left`, `center`, `right`
  - `gradient`: `none`, `neon` (violet-cyan), `emerald`, `amber`
- **Text Block (`text`):** Rich text HTML with inline formatting, bold, italics, links, and code spans.
- **Image Block (`image`):**
  - `src`: Image URL or direct upload to the Supabase Storage `media` bucket
  - `alt`: Accessibility description
  - `caption`: Displayed below image in muted monospace
  - `width`: In-layout width (`auto`, `25%`, `33%`, `40%`, `50%`, `100%`)
  - `height`: Fixed height limits (`auto`, `180px`, `240px`, `300px`, `380px`, `460px`, `560px`)
  - `aspectRatio`: Fixed framing (`auto`, `16/9`, `4/3`, `1/1`, `21/9`, `3/2`)
  - `fit`: `cover` (fills without distortion) | `contain`
  - `radius`: `none`, `md`, `lg`, `full`
- **Comparison & Data Table Block (`table`):**
  - `title`: Optional table header caption
  - `hasHeader`: Boolean (sticky column header row)
  - `striped`: Alternating zebra row shading
  - `compact`: Dense padding mode for large data sets
  - `columns`: Array of `{ id, label, align, width, isHighlight }`
  - `rows`: Array of `{ id, cells: [{ text, type: 'text'|'check'|'image', status: 'yes'|'no', badge, imageSrc }] }`
- **Feature & Bullet List Block (`list`):**
  - `listType`: `unordered` (bullet) | `ordered` (numbered)
  - `style`: Marker style (`check` [✓], `arrow` [→], `bolt` [⚡], `dot` [•])
  - `spacing`: `compact`, `normal`, `relaxed`
  - `items`: Array of `{ id, text }`
- **Video & Media Embed Block (`video`):**
  - `provider`: `youtube`, `vimeo`, `mp4`
  - `url`: Video URL (parsed into responsive sandboxed embed)
  - `aspectRatio`: `16/9`, `4/3`, `21/9`, `1/1`
  - `title`: Accessible video title
  - `caption`: Optional footer text
  - `radius`: Border radius
- **Code Card Block (`code`):**
  - `language`: `dart`, `python`, `javascript`, `typescript`, `bash`, `json`, `yaml`, `html`
  - `filename`: Optional header badge (e.g. `main.dart`, `app_store_review_notes.txt`)
  - `code`: Raw code string rendered with syntax styling tokens
- **Callout Block (`callout`):**
  - `style`: `info` (blue), `tip` (violet), `warning` (amber), `success` (green)
  - `title`: Alert title
  - `text`: Explanation text
- **Pull Quote Block (`quote`):**
  - `quote`: Quotation string
  - `author`: Person name
  - `role`: Title or company attribution
  - `avatar`: Optional avatar image URL
- **Button Block (`button`):**
  - `text`: Label
  - `url`: Link destination
  - `variant`: `primary` (solid brand), `secondary` (outline), `subtle` (dark card)
  - `size`: `sm`, `md`, `lg`
  - `target`: `_self`, `_blank`
  - `fullWidth`: Boolean toggle

### 4.3 Lossless Dual-Format Storage
To ensure complete portability, blog posts are saved in the `BlogPost.content` database field using a lossless dual-format pattern:
1. **HTML Layer:** Clean, semantic HTML with FlowBase CSS utility classes (`fb-table`, `fb-list`, `fb-child-item`, `fb-video-wrapper`) that render instantly for web crawlers, RSS feeds, and public readers without JavaScript compilation.
2. **Metadata Anchor Layer:** The exact JSON block hierarchy is serialized, URI-encoded, and embedded at the bottom within HTML comments:
   `<!-- FLOWBASE_BLOCKS_V2:<encoded_json>:FLOWBASE_BLOCKS_V2 -->`
When an author re-opens the post in the admin panel, `parseHTMLToBlocks()` extracts and reconstructs the live interactive block tree.

---

## 5. Security & Non-Functional Requirements

### 5.1 Authentication & Authorization
- Administrative routes (`/admin/*`) require a Supabase Auth session; the session is persisted and refreshed automatically by the client SDK.
- Authorization is enforced by PostgreSQL RLS, not by the UI route guard. Anonymous callers can only read public content and insert quote requests and page views.
- Edge Functions require a valid user JWT (`verify_jwt = true`) and re-validate it with `auth.getUser()`.
- Password change uses `supabase.auth.updateUser`.
- Public sign-ups must remain disabled, because RLS treats every authenticated user as admin.

### 5.2 Abuse Controls
- **Login:** Supabase Auth's built-in rate limiting.
- **Quote form:** no per-IP throttle; mitigated by RLS input validation and by anonymous users having no read access. (Add an Edge Function or CAPTCHA if abuse appears.)
- **Analytics beacon:** client-side bot filtering and 30-second path de-duplication; table size managed via `cleanup_old_page_views`.

### 5.3 Performance & Optimization
- **Self-Hosted Typography:** Plus Jakarta Sans, Inter and JetBrains Mono are served locally as variable `.woff2` with `font-display: swap`; the two UI faces are preloaded.
- **Egress Reduction:** blog list queries omit the HTML body; a TTL cache (memory + `sessionStorage`) with mutation-based invalidation fronts all reads.
- **Image Optimization:** lazy-loading on compiled block images; `object-fit: cover` framing.
- **Bundle Splitting:** admin and CRM routes are lazy-loaded so the public bundle stays small.
- **Asset Caching:** Firebase Hosting serves js/css/fonts with a one-year `immutable` cache header.

### 5.4 Responsiveness
All public pages and the full admin panel must render without horizontal scrolling from 320px upward (see `docs/ARCHITECTURE.md` §8 for the layout rules).

---

## 6. Multi-Environment & Multi-PC Synchronization

### 6.1 Architecture State vs. Local AI Memory
- **Local AI Workspace Memory:** Context caches maintained by AI development tools (such as Antigravity logs at `~/.gemini/antigravity/brain/`) exist exclusively on the local host machine. They are **not** automatically pushed to GitHub.
- **Global Project Context (Git as Source of Truth):**
  - `CLAUDE.md`: Quick reference commands, directory layout, and operational rules.
  - `docs/ARCHITECTURE.md`: Technical architecture and system behavior reference.
  - `docs/DEPLOYMENT.md`, `docs/TESTING.md`, `docs/QUICK-TEST.md`: Deployment and verification guides.
  - `docs/SRS.md` (This Document): Software Requirements Specification.
  - `git commit history`: Exact chronological record of all architectural updates.
- **Working Across Multiple PCs:**
  When pulling this repository onto another workstation:
  ```bash
  git pull origin master
  ```
  Any AI coding agent (Antigravity, Cursor, Claude Code) reading `CLAUDE.md`, `docs/ARCHITECTURE.md`, and `docs/SRS.md` will instantly possess 100% of the project's context, architecture, design system specifications, and recent enhancements without any loss of continuity.

---

## 7. How to Export / Import into Google Docs

This document is formatted in GitHub Flavored Markdown (GFM). To import this document directly into **Google Docs**:

### Method A: Direct Upload (Recommended)
1. Open [Google Drive](https://drive.google.com).
2. Click **New** &rarr; **File upload** &rarr; Select `docs/SRS.md`.
3. Right-click the uploaded file in Google Drive &rarr; Choose **Open with** &rarr; **Google Docs**.
4. Google Docs automatically parses all tables, headings, code snippets, and lists into native styled document elements.

### Method B: Copy-Paste with Rich Formatting
1. View `docs/SRS.md` on GitHub or in VS Code Markdown Preview.
2. Select all (`Ctrl+A`) and copy (`Ctrl+C`).
3. Open a blank document at [docs.new](https://docs.new) and paste (`Ctrl+V`). Headings, tables, and lists will retain their styling.

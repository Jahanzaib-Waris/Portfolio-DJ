# Software Requirements Specification (SRS)
## Portfolio-DJ & FlowBase Content Management System

**Document Version:** 1.0.0  
**Status:** Approved / Living Specification  
**Date:** September 2026  
**System Author & Lead Architect:** Jahanzaib Waris  
**Repository:** `Jahanzaib-Waris/Portfolio-DJ`  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a complete description of the **Portfolio-DJ** web platform. It establishes the architectural foundation, functional modules, data models, user interface paradigms, non-functional constraints, and deployment pipelines for both the public-facing developer portfolio and the staff-only administrative Content Management System (CMS).

### 1.2 Document Scope
This document covers:
1. **Public Presentation Layer:** High-performance single-page application (SPA) featuring personal branding, project showcases, interactive case studies, skills matrix, service quote requests, traffic analytics beacon, and the public blog reader.
2. **Administrative Control Panel Layer:** Secure, JWT-authenticated management dashboard managing profile attributes, project portfolios, incoming quote submissions, runtime visual theme customization, traffic analytics reporting, and the **FlowBase Block Builder Engine**.
3. **FlowBase Visual Block Builder Engine:** A modular, auto-layout content builder allowing the composition of rich blog articles using Flexbox containers (Rows and Stacks) and atomic elements (text, images, headings, comparison tables, checklists, code cards, callouts, pull quotes, and video embeds) with lossless compilation into standards-compliant HTML.
4. **Backend API Layer:** RESTful API services powered by Django 6 and Django REST Framework (DRF), backed by PostgreSQL (Supabase) in production and SQLite in local development, with S3-compatible cloud media storage.

### 1.3 Definitions, Acronyms, and Abbreviations
- **API:** Application Programming Interface
- **CMS:** Content Management System
- **CRUD:** Create, Read, Update, Delete
- **DRF:** Django REST Framework
- **JWT:** JSON Web Token (Access: 15 minutes, Refresh: 7 days with token rotation)
- **SPA:** Single Page Application (React 19 + Vite)
- **UGC:** User-Generated Content
- **SRS:** Software Requirements Specification
- **FlowBase:** The developer-focused visual design system and component architecture utilizing deep navy canvas (`#0A0C16`), violet primary (`#6D5AF6`), and sky blue (`#38BDF8`) accents.

---

## 2. Overall System Architecture & Tech Stack

### 2.1 High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Vercel Edge)                      │
│                                                                        │
│   Public Client (Visitors)             Admin Panel (Staff Only)         │
│   - Hero & Profile Presentation        - JWT Auth & Session Store      │
│   - Project Gallery & Detail           - Analytics Dashboard           │
│   - Blog Reader & Block Renderers      - FlowBase Block Builder V2     │
│   - Interactive Quote Contact Form     - Theme & Branding Inspector    │
│   - Analytics Beacon                   - Media & Asset Management      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / JSON / Multipart
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    API SERVICE LAYER (Django 6 + DRF)                  │
│                                                                        │
│   Routing & Throttles:                                                 │
│   - Quotas: Quote (5/hr), Track (120/hr), Login (5/min)                │
│   - Auth: SimpleJWT with Token Rotation & Blacklisting                 │
│                                                                        │
│   Core Apps:                                                           │
│   - accounts: Auth & Credentials                                       │
│   - profiles: Bio, Social Links, Skills & Competencies                 │
│   - projects: Case Studies, Featured Flags, Tech Stack Tags            │
│   - blog: BlogPost Engine with Lossless FlowBase Blocks                │
│   - quotes: Inbound Client Inquiries & Lead Management                 │
│   - sitesettings: Dynamic SiteBranding & Runtime SiteTheme            │
│   - analytics: PageView Event Aggregation & Trend Insights            │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       DATABASE STORAGE LAYER         │  │     OBJECT STORAGE LAYER     │
│  - Supabase PostgreSQL (Production)  │  │  - Supabase S3 Storage       │
│  - Local SQLite (Development)        │  │  - Cover Images, Media Assets│
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### 2.2 Technology Stack
- **Frontend Framework:** React 19.x, React Router 7.x
- **Build Tooling & Bundler:** Vite 8.x, Rolldown / ESBuild, Oxlint
- **CSS Architecture:** Tailwind CSS v4, CSS Custom Properties (`@theme` design tokens)
- **Backend Framework:** Django 6.0 (Python 3.13)
- **API Framework:** Django REST Framework (DRF) 3.16+
- **Authentication:** `rest_framework_simplejwt` with server-side blacklist rotation
- **Database:** PostgreSQL (Supabase) in production; SQLite for zero-config local development
- **Media Asset Storage:** Supabase S3-compatible object bucket with `django-storages`
- **Hosting & Infrastructure:** Vercel Serverless Functions (Backend) + Vercel Static Hosting (Frontend)

---

## 3. Data Models & Database Schemas

### 3.1 Accounts & Authentication
- **User:** Built-in Django `AbstractUser`. Access to the administrative panel strictly requires `is_staff = True`.
- **JWT Blacklist:** `OutstandingToken` and `BlacklistedToken` models prevent replay attacks upon refresh token usage.

### 3.2 Profiles & Skills (`profiles` app)
- **`Profile` (Singleton):**
  - `name` (CharField, max 100)
  - `role_title` (CharField, max 150)
  - `tagline` (CharField, max 255)
  - `bio` (TextField)
  - `location` (CharField, max 100)
  - `avatar` (ImageField, upload to `profile/`)
  - `years_of_experience` (PositiveIntegerField)
  - `completed_projects_count` (PositiveIntegerField)
  - `github_url`, `linkedin_url`, `twitter_url`, `whatsapp_number` (URL/CharFields)
  - `resume_file` (FileField, upload to `resumes/`)
- **`Skill`:**
  - `name` (CharField, max 80)
  - `category` (CharField: `frontend`, `backend`, `mobile`, `database`, `devops`, `tools`)
  - `proficiency` (IntegerField: 1–100)
  - `is_featured` (BooleanField, default `False`)
  - `icon_name` (CharField, max 50)
  - `order` (PositiveIntegerField, default 0)

### 3.3 Projects & Case Studies (`projects` app)
- **`Project`:**
  - `title` (CharField, max 150)
  - `slug` (SlugField, unique, max 180)
  - `summary` (CharField, max 255)
  - `description` (TextField)
  - `cover_image` (ImageField, upload to `projects/covers/`)
  - `client_name` (CharField, max 100)
  - `project_type` (CharField: `web`, `mobile`, `saas`, `ecommerce`, `open_source`)
  - `tech_stack` (JSONField: array of string badges)
  - `live_url` (URLField, optional)
  - `github_url` (URLField, optional)
  - `is_featured` (BooleanField, default `False`)
  - `order` (PositiveIntegerField, default 0)
  - `created_at`, `updated_at` (DateTimeFields)

### 3.4 Blog Engine (`blog` app)
- **`BlogPost`:**
  - `title` (CharField, max 200)
  - `slug` (SlugField, unique, max 220)
  - `excerpt` (CharField, max 300)
  - `content` (TextField: stores compiled HTML with embedded lossless JSON block metadata)
  - `cover_image` (ImageField, upload to `blog/covers/`)
  - `published_date` (DateField, default `timezone.now`)
  - `is_published` (BooleanField, default `False`)
  - `created_at`, `updated_at` (DateTimeFields)

### 3.5 Inquiries & Quotes (`quotes` app)
- **`QuoteRequest`:**
  - `full_name` (CharField, max 100)
  - `email` (EmailField)
  - `company_name` (CharField, max 120, optional)
  - `budget_range` (CharField: `<5k`, `5k-10k`, `10k-25k`, `25k+`)
  - `timeline` (CharField: `urgent`, `1-2_months`, `flexible`)
  - `project_type` (CharField: `flutter`, `fullstack`, `web`, `consulting`)
  - `message` (TextField)
  - `is_read` (BooleanField, default `False`)
  - `created_at` (DateTimeField, auto_now_add)

### 3.6 Settings & Theming (`sitesettings` app)
- **`SiteBranding` (Singleton):**
  - `brand_name` (CharField, default `'Jahanzaib Waris'`)
  - `tagline` (CharField, max 200)
  - `logo_light`, `logo_dark`, `favicon` (ImageFields)
- **`SiteTheme` (Singleton):**
  - Holds runtime-editable design tokens: Primary color, Accent color, Dark canvas background, Panel surface color, Border radius, Font families. Resolves to CSS Custom Properties without application rebuild.

### 3.7 Analytics Tracker (`analytics` app)
- **`PageView`:**
  - `path` (CharField, max 255)
  - `referrer` (CharField, max 255, optional)
  - `user_agent` (CharField, max 255)
  - `timestamp` (DateTimeField, auto_now_add)

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
  - `src`: Image URL or direct upload via multipart API
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
- All administrative routes (`/admin/*`) require a valid JWT issued to a staff account (`user.is_staff = True`).
- Token rotation ensures each refresh token is single-use; subsequent requests using an invalidated token fail immediately.
- Password change requires verifying the active current password.

### 5.2 API Rate Limiting & Throttling
- **Quote Form Submission (`POST /api/quotes/`):** 5 requests per hour per IP (`QUOTE_THROTTLE_RATE`).
- **Analytics Beacon (`POST /api/analytics/track/`):** 120 requests per hour per IP (`ANALYTICS_THROTTLE_RATE`).
- **Authentication Endpoint (`POST /api/auth/token/`):** 5 attempts per minute per IP (`LOGIN_THROTTLE_RATE`).

### 5.3 Performance & Optimization
- **Self-Hosted Typography:** Manrope and Fira Code are served locally in `.woff2` format with `font-display: swap` to eliminate external Google Fonts latency.
- **Image Optimization:** Lazy-loading enabled on all compiled block images; responsive viewport bounding via CSS `object-fit: cover`.
- **Bundle Splitting:** Vite chunks vendors and dynamic administrative routes to keep the initial public bundle under 350 kB.

---

## 6. Multi-Environment & Multi-PC Synchronization

### 6.1 Architecture State vs. Local AI Memory
- **Local AI Workspace Memory:** Context caches maintained by AI development tools (such as Antigravity logs at `~/.gemini/antigravity/brain/`) exist exclusively on the local host machine. They are **not** automatically pushed to GitHub.
- **Global Project Context (Git as Source of Truth):**
  - `CLAUDE.md`: Quick reference commands, directory layout, and operational rules.
  - `docs/ARCHITECTURE.md`: Technical architecture and system behavior reference.
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

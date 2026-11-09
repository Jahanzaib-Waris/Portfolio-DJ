# Admin Guide — how the panel works and where to start

A plain-language tour of `/admin` for the studio owner. For internals see `ARCHITECTURE.md`; for set-up and deploy steps see `DEPLOYMENT.md`; for test checklists see `TESTING.md` and `QUICK-TEST.md`.

Sign in at https://jerry-dev-studio.web.app/admin/login with the admin user created in Supabase (Authentication → Users). Public sign-ups should stay disabled: any signed-in user is treated as admin.

---

## 1. Where to start (first 15 minutes)

1. **Dashboard** — read "needs attention" first (follow-ups due, recent quotes), then the counts and traffic.
2. **Settings → Theme (optional tidy-up):** the database still stores the old fonts (Manrope / Fira Code). The site already shows the right ones, but to clean the data choose *Plus Jakarta Sans* as the display font and *JetBrains Mono* as the monospace font, then Save. Just pressing Save without changing them keeps the old values.
3. **Client Radar** — open it, check the header says "Stored results, last fetched …", and look at the top few cards. Dismiss anything irrelevant.
4. **Pick one lead** (a card with a direct email), press **Add to CRM**, open its pitch, and read the draft. This is the whole outreach loop in miniature (section 3).
5. **Settings → API Integrations** — only if you want AI-written pitches or Apollo lookups (both optional; the built-in templates need no keys).
6. Check your Discord channel: you should see the daily digest at ~08:00 Pakistan time, and an alert for every quote request.

---

## 2. The sidebar, one line each

| Section | What it is for |
|---|---|
| **Dashboard** | Attention feed (follow-ups due, new quotes), key counts, pipeline value, 7-day traffic. |
| **Blog** | Write posts with the Visual Block Builder; schedule by publish date; drafts stay private. |
| **Analytics** | Visitors, page views, top pages/posts/referrers, quote trend. |
| **Portfolio** | Projects (case studies), Skills (home page stack), Profile (name, bio, photo, links). |
| **Sales & CRM → Pipeline & Deals** | Kanban of deals by stage with values and follow-up alerts. |
| **Sales & CRM → Lead Prospector** | Table of every lead; search, filter, CSV export. |
| **Sales & CRM → Client Radar** | Finds new leads for you (section 3). |
| **Quote requests** | Messages from your site's quote form (section 4). |
| **Settings** | Account (password), Branding (name, logo, favicon), Theme (colours, fonts), API Integrations (AI providers, Apollo). |

Lists (Blog, Projects, Quotes) are compact tables: one visible action per row and a **⋯** menu for the rest.

---

## 3. Finding and reaching clients (the main workflow)

**What happens by itself:** every day at 03:00 UTC (08:00 in Pakistan) the `radar-ingest` function fetches Hacker News "Who is hiring", Jobicy and RemoteOK, scores each post, saves new ones, and posts a digest of the best new ones to Discord (only posts that are not full-time-only and score 65+, each announced once).

**Your loop:**
1. **Client Radar.** Tabs: *Hacker News Founders*, *Remote Mobile Gigs*, *App Rescue Scanner*, *Search Links*. Each card shows a score (0-100), a fit badge, and how fresh it is.
   - **Fit badge:** *Contract fit* = scoped/contract/part-time/project/retainer wording. *Engagement unclear* = post doesn't say. *Full-time role* = exclusive employment; these are hidden by default (tick the box to see them). This exists because you serve several clients at once.
   - **Score** = freshness (30) + reachability (15) + tech match (25) + engagement fit (30). It is a fixed set of rules, not AI. Click the score to see the breakdown.
   - **Refresh Feeds** runs the server fetch now. **Dismiss** hides a post everywhere (and **Restore** brings it back).
2. **Add to CRM** creates a lead. A post already in the CRM shows "In CRM" and cannot be imported twice.
3. **Open Pitch** opens the lead drawer with a ready draft that quotes the actual post. Choose an angle (Rescue, MVP, Architecture) and tone, edit if you like, then **Open in Email Client** (or copy the LinkedIn text). Cards with an email also have **Send Email**, which opens the same draft directly.
4. **Log to Timeline** after you send. That marks the outreach and schedules the follow-up (see below).
5. No email on the card? **Find Founder (Apollo)** looks one up. It uses Apollo credits (the free plan has about 100 a month), so use it on promising leads only.

**Follow-up cadence (automatic).** Logging an email, LinkedIn message or call sets the next follow-up for +3 days, then +7, then +14; after the third there is no automatic reminder. The first outreach moves a new lead to *Contacted*. When someone answers, log **Reply Received**: the sequence stops, the lead turns hot, and the follow-up becomes tomorrow so you respond fast. Due follow-ups show on the Dashboard and as a badge in the sidebar.

**App Rescue Scanner (prototype).** Search a niche (for example "expense tracker"). Apps with low or falling ratings and no updates for months rank highest, with the publisher's website as the way in. Treat results as a list to check, not a verdict. **Search Links** opens Upwork, Contra, Wellfound, Reddit (r/forhire, r/FlutterFlow) and the FlutterFlow job forum in new tabs; those are manual because their automatic access is restricted or costs money.

---

## 4. Inbound enquiries

1. A visitor submits the quote form.
2. Instantly: a Discord alert, and a CRM lead is created (stage *Lead*, hot, follow-up tomorrow, deal value from the budget they chose).
3. **Quote requests** shows the message; **Reply** opens your email client. The ⋯ menu has "View in CRM pipeline" (or "Convert to deal" if the automatic step hadn't run) and Delete.

No email is sent to the visitor yet (auto-reply is off, because it needs a paid email setup).

---

## 5. Content

- **Blog:** *Blog → Add new*. Build with containers and blocks (text, image, table, list, video, code, callout, quote, button). Posts save as HTML plus the block layout, so they reopen exactly as you left them. Set **publish date + Published** to schedule: the post stays hidden from the public until that date. Use the preview before publishing.
- **Projects / Skills / Profile:** edit and reorder; *Featured* projects appear on the home page.
- **Theme and Branding:** change colours, fonts and logo; the public site updates without a redeploy.
- `sitemap.xml` and `feed.xml` are **not automatic**: add new posts to them by hand (or ask for the generator).

---

## 6. Rules of thumb

- **Never claim results you can't show.** The built-in pitches deliberately contain no invented numbers or timelines. If you add some, keep them true.
- **One-to-one outreach only.** Don't mass-send. Honor "stop" requests straight away; keep a note on the lead. Rules differ by country (US, EU/UK, Canada).
- **Apollo credits and AI keys:** keys you enter under API Integrations are saved in *this browser only*, so repeat them on other devices.
- **Costs:** everything in use is free. Don't add paid email, Reddit API or automation tools without a decision.

---

## 7. When something looks wrong

| Symptom | Check |
|---|---|
| Radar header says "Live results fetched in your browser" | The stored table is empty or unreachable. Press **Refresh Feeds**; if it fails, check the `radar-ingest` function logs in the Supabase dashboard. |
| No Discord digest in the morning | Nothing new above the score threshold is normal. Otherwise check `select * from cron.job_run_details order by start_time desc limit 5;` in the SQL editor, and the function logs. |
| No Discord alert for a quote | Check the `quote-notify` function logs; the lead is still created even if Discord fails. |
| A page shows nothing / `ENOTFOUND` | The free Supabase project may have paused after a quiet week; restore it from the dashboard. |
| A wrong deal value | Edit it on the lead. (Quote budgets map to fixed values: under $500 = 400, $500-$2,000 = 1,250, $2,000-$5,000 = 3,500, $5,000+ = 5,000.) |

---

## 8. Not built yet

Outcome reports (source → reply → call → won) and lost-reason tracking; do-not-contact flag and suppression list; weighted pipeline forecast and drag-and-drop Kanban; smarter Apollo title ranking and credit caching; routing Groq/OpenAI keys through the server; an automatic sitemap generator; email alerts (needs a paid or domain-based setup).

# Manual test checklist

For a fast 15-minute sanity pass instead of this full checklist, see `QUICK-TEST.md`.

There is no automated frontend test suite; `npm run lint` and `npm run build` are the only
automated gates. Everything else is verified by hand with this list. Tick items as you go.

> **Test data warning.** The dev server talks to whichever Supabase project is in
> `frontend/.env`. If that is the production project, everything you create below is real:
> use obviously-named test records ("ZZ test post") and delete them afterwards, or point `.env`
> at a separate Supabase project.

---

## 0. Setup

```bash
cd frontend
cp .env.example .env     # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run lint
npm run build
npm run dev
```

Public site → http://localhost:5173/ · Admin → http://localhost:5173/admin

You need one Supabase Auth user (Dashboard → Authentication → Users) to sign in.

---

## 1. Sign-in and session

- [ ] Correct credentials → lands on the dashboard
- [ ] Wrong password → a clear error, no crash
- [ ] **Reload while signed in** → stays signed in, briefly showing "Restoring session...".
      If it bounces to login, session restore is broken.
- [ ] Visit `/admin/blog` signed out → redirected to login → after signing in, land on
      `/admin/blog` rather than the dashboard
- [ ] **Log out → browser Back** → must NOT show the panel
- [ ] Log out, then reload → still logged out
- [ ] Leave the tab idle for over an hour, then click around → the SDK refreshes the token
      silently, or you are sent to login cleanly (no blank screen, no endless spinner)
- [ ] Sidebar on desktop, hamburger/slide-over drawer on mobile; public navbar/footer do **not**
      appear on admin pages
- [ ] Settings → Account → change password, then sign in with the new one

---

## 2. Blog CMS (Block Builder V2)

### Creating a post

- [ ] "New post" opens an empty editor
- [ ] Typing a title fills the slug (`My First Post` → `my-first-post`)
- [ ] Edit the slug by hand, then keep typing the title → slug stops following it
- [ ] Accents/punctuation are stripped (`Café & Crème!` → `cafe-creme`)
- [ ] Add one of each block: container (row and column), heading, text, image, table, list,
      video, code, callout, quote, button; the properties drawer edits each
- [ ] Save → redirected to the edit URL for the new slug
- [ ] A duplicate slug shows the error on the slug field, not a generic message

### Editing and round-trip

- [ ] Reopen a saved post → the block tree is rebuilt exactly (lossless
      `FLOWBASE_BLOCKS_V2` round trip)
- [ ] The slug does **not** auto-rewrite when you change the title of an existing post
- [ ] "Unsaved changes" appears when dirty and clears after save; closing the tab while dirty
      warns
- [ ] Preview in the editor matches the published page

### Cover image and media

- [ ] Choosing a file shows a preview; Save uploads it to Storage and the public post shows it
- [ ] Replace and Remove work; saving without touching the cover keeps the existing one
- [ ] Images inserted into blocks upload and render

### Publish state and scheduling

- [ ] New posts default to Draft; Publish makes them appear on `/blogs`; Unpublish removes them
- [ ] A draft is listed in `/admin/blog` but invisible on the public site; its URL is 404/empty
      while signed out
- [ ] **Future `published_date` + published** → hidden from `/blogs`, `/blogs/<slug>`, and a raw
      REST call while signed out; visible once the date is today or earlier
- [ ] Delete → confirm dialog → removed; lists refresh without a manual reload

---

## 3. Projects, Skills, Profile, Branding, Theme

- [ ] Projects: create/edit/delete; thumbnail upload/replace/remove; saving without a new file
      keeps the old thumbnail; invalid URLs show an error under the field
- [ ] Display order reorders the public `/projects` page; "Featured" drives Home's Featured Work
- [ ] Case-study modal on `/projects` opens and closes (Escape and backdrop)
- [ ] Skills: add/edit/delete; changes and order show on Home; more than 10 skills all appear
- [ ] Profile: edit name/tagline/bio/photo/resume/links; name and photo drive the navbar and hero
- [ ] Branding: site name updates the tab title; logo and favicon upload and apply
- [ ] Theme: change colours, radius, shadow, button and card style → Save → public site updates;
      the live preview matches the saved result
- [ ] Theme fonts: selecting **Plus Jakarta Sans / JetBrains Mono** (the defaults) renders with the
      self-hosted fonts. A stored `Manrope` / `Fira Code` value still renders as Plus Jakarta
      Sans / JetBrains Mono (legacy alias in `applyTheme.js`).

---

## 4. Quotes, CRM and lead tooling

### Quote inbox

- [ ] Submit the public form (all fields) → the request appears at `/admin/quotes`, newest first
- [ ] The submit returns success even though anonymous users cannot read the row back
- [ ] Row expands to the full message; "Reply" opens the mail client; delete asks to confirm
- [ ] The unread badge in the sidebar updates
- [ ] "Convert to Deal" creates a `crm_leads` row linked to the quote

### CRM

- [ ] Pipeline: move a deal across stages; value totals update; follow-up alerts show for overdue
      dates; mobile list toggle works
- [ ] Prospects: search, filter, **CSV export** downloads and opens correctly
- [ ] Lead drawer: edit fields, log activities of each type, delete an activity, schedule a
      follow-up, outreach shortcuts open the right links

### Client Radar and integrations

- [ ] Radar loads Hacker News / RemoteOK / Jobicy results; one source failing does not blank the page
- [ ] Opportunity scores are 0–100; sorting and the freshness filter work; stale items are flagged
- [ ] Each card shows a fit badge (Contract fit / Engagement unclear / Full-time role); "Hide full-time / employment roles" is on by default and hides the full-time ones
- [ ] "Dismiss" hides a post, survives a reload, and "Show dismissed" brings it back with a Restore link
- [ ] A post already imported shows "In CRM" after a reload, and cannot be imported twice
- [ ] After `radar.sql` and `radar-ingest` are set up: Refresh Feeds shows a "Fetched N posts (M new)" toast, the header says "Stored results, last fetched …", and results are the same after a reload
- [ ] Dismiss a post in one browser: it stays dismissed in another browser (shared status). Import a post: it shows "In CRM" everywhere
- [ ] Stack pills (Flutter, Mobile, Supabase, Contract) filter stored results instantly without a reload
- [ ] With the table missing or empty, the radar still loads live results (header says "Live results fetched in your browser")
- [ ] Run Refresh Feeds twice: no duplicate posts, and previously dismissed posts stay dismissed
- [ ] After the daily schedule runs: a digest arrives listing only new, non-full-time posts, and the same post is not emailed again the next day
- [ ] Lead drawer: log an Email activity on a new lead: stage becomes Contacted and the follow-up is set 3 days out; the second outreach sets +7, the third +14, the fourth clears it. Log "Reply Received": follow-up moves to tomorrow and the lead turns hot
- [ ] Pitch text names the post it came from, mentions working alongside other clients, and contains no made-up numbers or results
- [ ] App Rescue Scanner: search "expense tracker" returns apps; flagged ones show reasons (low rating, months since update); "Add to CRM" creates a lead whose notes include the App Store URL, and the card then shows "In CRM"
- [ ] Search Links tab includes Reddit r/forhire, r/FlutterFlow and the FlutterFlow job-postings forum
- [ ] Help & Guide: the sidebar entry opens `/admin/help`; the search box filters topics; each quick answer jumps to the right section; topic pages show "On this page", the side topic list (a scrolling row on phones) and working Previous/Next links; an unknown topic URL shows a friendly message
- [ ] Submit a test quote: the lead appears in the CRM Pipeline (when `quote-notify` is deployed), you get the alert, and "Convert to deal" in the inbox shows it as already in CRM instead of creating a duplicate
- [ ] Submit the same email twice within a day: only the first gets an auto-reply
- [ ] "Add to CRM" inserts a lead and opens the pitch drawer
- [ ] Integrations: save a key, hide/show the password toggle, "Test connection" succeeds for a
      valid key and fails cleanly for a bad one
- [ ] Pitch Engine: the algorithmic provider generates all 3 angles × 3 tones with no key; a
      configured LLM provider returns text; failures fall back with a toast
- [ ] Apollo: "Find Decision-Maker & Verified Email" fills contact fields (or reports no match).
      Signed out, calling the Edge Function directly returns 401.

---

## 5. Public site

- [ ] Home, Solutions, Blogs, Blog detail, Projects all load with real content
- [ ] `/blogs` category filter and Load more append without duplicates; the button disappears
      on the last page
- [ ] Blog detail: sticky TOC highlights the current section, progress bar tracks scrolling,
      code blocks scroll inside their own box (page does not scroll sideways)
- [ ] **Raw HTML stays inert.** Put `<script>alert(1)</script>` in a post's text and confirm no alert fires
- [ ] Table blocks scroll when too wide; video blocks are responsive
- [ ] Unknown URL → public 404; unknown `/admin/...` URL (signed in) → admin 404
- [ ] Per-page tab titles and meta descriptions differ (`useDocumentMeta`); view-source shows
      canonical + JSON-LD after JS runs
- [ ] `/robots.txt`, `/sitemap.xml`, `/feed.xml` serve their files, not the app shell
- [ ] Analytics: browse a few pages, then `/admin/analytics` shows the views; refreshing the same
      page within 30 seconds does not add a duplicate

---

## 6. Authorization (RLS) — do this after any schema or policy change

Run each against the project URL with only the anon key, expecting the stated result:

```bash
URL=https://<project-ref>.supabase.co ; KEY=<anon key>
curl -s "$URL/rest/v1/quote_requests?select=*"  -H "apikey: $KEY"   # [] or permission error, never rows
curl -s "$URL/rest/v1/crm_leads?select=*"       -H "apikey: $KEY"   # [] or permission error
curl -s "$URL/rest/v1/page_views?select=*"      -H "apikey: $KEY"   # [] or permission error
curl -s "$URL/rest/v1/blog_posts?select=slug,is_published,published_date" -H "apikey: $KEY"  # published, non-future only
curl -s -X POST "$URL/rest/v1/projects" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"title":"x"}'  # must be rejected
curl -s -X POST "$URL/functions/v1/ai-proxy" -H "apikey: $KEY" -d '{}'  # 401, not a result
```

- [ ] All of the above behave as stated
- [ ] A direct anonymous insert into `quote_requests` with an empty `name` is rejected
- [ ] Anonymous storage upload to the `media` bucket is rejected; public read of an existing file works

---

## 7. Mobile (320px – 430px)

Test at 320, 375 and 430 wide (browser devtools device mode):

- [ ] No horizontal scrollbar on any public page or any admin page
- [ ] Forms stack to one column; inputs are not squished
- [ ] Modals fit the screen and scroll internally; drawers do not exceed the viewport
- [ ] Admin sidebar opens as a slide-over drawer; Kanban has the compact list toggle

---

## 8. Production deploy checks

After `firebase deploy --only hosting` (see `DEPLOYMENT.md`):

- [ ] Run `QUICK-TEST.md` against https://jerry-dev-studio.web.app
- [ ] Deep link refresh works (e.g. reload on `/blogs/<slug>` and `/admin/crm`) — proves the SPA rewrite
- [ ] Hard reload shows fonts without a layout jump
- [ ] The built bundle contains the anon key only: search `dist/` for `service_role` → no matches

---

## 9. Known issues, not bugs to report

- **Quote form has no rate limit.** Protection is RLS validation and the lack of anonymous read
  access; add a CAPTCHA or Edge Function if spam appears.
- **Integration keys live in `localStorage`**, so they are per-browser and must be re-entered on
  each device.
- **Any authenticated user is admin.** Keep public sign-ups disabled.
- **`sitemap.xml` and `feed.xml` are static**; new posts must be added by hand.
- **Link-preview bots** (Slack, X, Facebook) see only the static `index.html` tags, not per-post
  titles or images.
- **Supabase free-tier auto-pause** can make the site fail with DNS/`ENOTFOUND` errors after a
  week idle; restore the project from the Supabase dashboard.

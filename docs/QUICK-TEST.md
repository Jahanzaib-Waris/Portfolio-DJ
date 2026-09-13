# Quick test pass

A fast, surface-level walkthrough to confirm the live site works end to end — about 15 minutes,
no technical depth required. For a thorough field-by-field checklist, see `TESTING.md` instead.

Site: `https://portfolio-dj-j1sv.vercel.app` · Admin: `https://portfolio-dj-j1sv.vercel.app/admin`

## 1. Public site (5 min)

- [ ] Homepage loads — hero, tech stack, featured work, footer all show up
- [ ] Nav links work: Home, Projects
- [ ] Open a project card — thumbnail, tags, repo/live links all present
- [ ] Click "Request Quote" (or the hero button) → fill the form → submit → see a success message
- [ ] Visit a made-up URL (e.g. add `/does-not-exist` to the site URL) → see a proper "Page not
      found" page, not a blank screen

## 2. Admin panel (8 min)

- [ ] Log in at `/admin/login`
- [ ] Dashboard shows content counts and a small traffic chart
- [ ] Projects → toggle "Featured" on one → confirm it appears in Home's "Featured Work"
- [ ] Type something in the search box on Projects or Quotes → list narrows correctly
- [ ] Quotes → the request you submitted in step 1 shows up here
- [ ] Settings → Theme → change a color → Save → confirm the public site's button/accent color
      actually changed (no reload needed)
- [ ] Settings → Branding → change the site name → confirm it updates the browser tab title
- [ ] Log out → confirm you land back on the login screen

## 3. Quick security/SEO spot-check (2 min)

- [ ] Try logging in with a wrong password 6 times fast → the 6th attempt should be blocked
      ("too many attempts"), not just "wrong password" again
- [ ] Visit `/robots.txt` and `/sitemap.xml` directly → both should show plain text/XML, not 404
- [ ] Open Home and Projects and check the browser tab title changes for each — it shouldn't
      be the same generic title everywhere

## If something fails

Note which checklist item broke and what you saw (screenshot helps) — that's enough to hand
back for a fix. No need to dig into *why* it broke yourself.

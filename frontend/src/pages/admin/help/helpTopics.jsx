import { B, Go, Note, Ol, P, Table, Ui, Ul } from './HelpBlocks'

// Help content for the admin panel. Each topic has sections; each section has an id
// (used for "On this page" and deep links) and a body made from the blocks in HelpBlocks.
// Keep the wording in sync with the app: button names are written exactly as they appear.

export const helpTopics = [
  /* ---------------------------------------------------------------- 1 */
  {
    slug: 'getting-started',
    title: 'Getting started',
    summary: 'A 15-minute first tour, what each menu item does, and a 5-minute daily routine.',
    keywords: ['start', 'begin', 'first', 'tour', 'sidebar', 'menu', 'routine', 'daily', 'dashboard', 'discord'],
    sections: [
      {
        id: 'first-15-minutes',
        heading: 'Your first 15 minutes',
        body: (
          <Ol>
            <li>
              Open the <Go to="/admin">Dashboard</Go>. Read <B>what needs attention</B> first (follow-ups due and recent quote
              requests), then the counts and the traffic chart.
            </li>
            <li>
              Open <Go to="/admin/crm/radar">Client Radar</Go>. The page header should say <Ui>Stored results, last fetched …</Ui>.
              Look at the top few cards and dismiss anything that isn&rsquo;t relevant.
            </li>
            <li>
              Pick one lead that has an email address and press <Ui>Add to CRM</Ui>, then <Ui>Open Pitch</Ui>. Read the draft. That is
              the whole outreach loop in miniature (see <Go to="/admin/help/outreach">Pitches, outreach and follow-ups</Go>).
            </li>
            <li>
              Check your Discord channel. You get a <B>digest of new leads each morning</B> (about 08:00 in Pakistan) and an
              <B> instant alert for every quote request</B>.
            </li>
            <li>
              Optional: open <Go to="/admin/settings/integrations">API Integrations</Go> to add an Apollo key (finds contacts) or an AI
              provider (polishes pitches). The built-in pitches need no keys.
            </li>
          </Ol>
        ),
      },
      {
        id: 'menu',
        heading: 'What each menu item is for',
        body: (
          <Table
            head={['Menu item', 'Use it to']}
            rows={[
              ['Dashboard', 'See what needs attention, key counts, pipeline value and the last 7 days of traffic.'],
              ['Blog', 'Write, schedule and publish posts with the Visual Block Builder.'],
              ['Analytics', 'See visitors, page views, top pages and posts, and where traffic comes from.'],
              ['Portfolio', 'Edit Projects (case studies), Skills (the home page stack) and your Profile.'],
              ['Sales & CRM', 'Pipeline & Deals (Kanban), Lead Prospector (table of all leads), Client Radar (finds new leads).'],
              ['Quote requests', 'Read enquiries from your website form and turn them into deals.'],
              ['Settings', 'Account (password), Branding (name, logo), Theme (colours, fonts), API Integrations (keys).'],
              ['Help & Guide', 'This section.'],
            ]}
          />
        ),
      },
      {
        id: 'daily-routine',
        heading: 'A 5-minute daily routine',
        body: (
          <>
            <Ol>
              <li>Dashboard: handle anything under <B>needs attention</B> (follow-ups due, new quotes).</li>
              <li>Read the Discord digest, then open Client Radar and scan the top cards.</li>
              <li>Import one to three promising posts with <Ui>Add to CRM</Ui>; <Ui>Dismiss</Ui> the rest.</li>
              <li>Send your pitches, and press <Ui>Log to Timeline</Ui> for each one so the follow-up is scheduled.</li>
              <li>Reply to any quote request the same day.</li>
            </Ol>
            <Note kind="tip">Speed matters. A quick, specific reply to a fresh post or a new quote beats a perfect message sent days later.</Note>
          </>
        ),
      },
      {
        id: 'ground-rules',
        heading: 'Ground rules',
        body: (
          <Ul>
            <li><B>Never claim results you can&rsquo;t show.</B> The built-in pitches contain no invented numbers on purpose.</li>
            <li><B>One-to-one outreach only.</B> No mass sending. Stop contacting anyone who asks you to.</li>
            <li><B>You serve several clients at once.</B> The radar is tuned for scoped contract work, not full-time employment.</li>
            <li><B>Everything in use is free.</B> Check before adding any paid service.</li>
          </Ul>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 2 */
  {
    slug: 'client-radar',
    title: 'Finding clients with Client Radar',
    summary: 'Where leads come from, how the fit badge and score work, and what each button does.',
    keywords: ['radar', 'leads', 'score', 'fit', 'full-time', 'hacker news', 'jobicy', 'remoteok', 'dismiss', 'refresh', 'rescue', 'app store', 'reddit', 'upwork'],
    sections: [
      {
        id: 'tabs',
        heading: 'The four tabs',
        body: (
          <Table
            head={['Tab', 'What it shows']}
            rows={[
              ['Hacker News Founders', 'Posts from the monthly "Who is hiring" thread. Many include a direct email.'],
              ['Remote Mobile Gigs', 'Remote engineering listings from Jobicy and RemoteOK.'],
              ['App Rescue Scanner', 'App Store apps with low ratings or no recent updates (a prototype, see below).'],
              ['Search Links', 'One-click searches on Upwork, Contra, Wellfound, Reddit and the FlutterFlow job forum.'],
            ]}
          />
        ),
      },
      {
        id: 'fit',
        heading: 'The fit badge',
        body: (
          <>
            <P>
              Every post is labelled by whether it looks like work you can take <B>alongside other clients</B>:
            </P>
            <Ul>
              <li><B>Contract fit</B>: the post mentions contract, freelance, part-time, hourly, fixed-price, project or retainer work.</li>
              <li><B>Engagement unclear</B>: the post doesn&rsquo;t say. Worth a look if the tech matches.</li>
              <li><B>Full-time role</B>: exclusive employment (full-time, W-2, contract-to-hire, benefits, fixed 40-hour weeks). These are <B>hidden by default</B>.</li>
            </Ul>
            <Note>Tick <Ui>Hide full-time / employment roles</Ui> off to see them. The reality is that most Hacker News posts are full-time jobs, so expect a short list of real fits.</Note>
          </>
        ),
      },
      {
        id: 'score',
        heading: 'How the score works',
        body: (
          <>
            <P>
              The 0-100 score is a fixed set of rules, <B>not AI</B>. Click the score on a card to see its breakdown:
            </P>
            <Table
              head={['Part', 'Max', 'What earns points']}
              rows={[
                ['Freshness', '30', 'Newer posts score higher; points fade over two weeks and a post older than that counts as stale.'],
                ['Reachability', '15', 'A direct email scores highest; a verified contact or a company website scores less.'],
                ['Tech match', '25', 'Flutter / FlutterFlow scores highest, then general mobile, then Supabase / Firebase / backend.'],
                ['Engagement fit', '30', 'Contract fit scores full marks, unclear scores partly, full-time scores zero.'],
              ]}
            />
            <P>Use the score to decide what to read first. It cannot tell you whether a client is good, so always read the post.</P>
          </>
        ),
      },
      {
        id: 'buttons',
        heading: 'What each button does',
        body: (
          <Ul>
            <li><Ui>Refresh Feeds</Ui>: fetches the sources now instead of waiting for the daily run.</li>
            <li><Ui>Dismiss</Ui> / <Ui>Restore</Ui>: hides a post for good (on every device) or brings it back. Tick <Ui>Show dismissed</Ui> to review them.</li>
            <li><Ui>Add to CRM</Ui>: creates a lead from the post. A post already in the CRM shows <Ui>In CRM</Ui> and can&rsquo;t be added twice.</li>
            <li><Ui>Open Pitch</Ui>: opens the lead with a ready draft.</li>
            <li><Ui>Send Email</Ui> (cards with an email): opens your mail app with the draft already written.</li>
            <li><Ui>Find Founder (Apollo)</Ui>: looks up a decision-maker and email. It uses Apollo credits, so save it for promising leads.</li>
            <li><B>Stack pills</B> (Flutter, Mobile, Supabase, Contract) and <B>Freshness</B> filters narrow the list.</li>
          </Ul>
        ),
      },
      {
        id: 'stored-or-live',
        heading: 'Stored or live results',
        body: (
          <>
            <P>
              The header tells you where the cards come from. <B>Stored results</B> were fetched by the server (every day at 03:00 UTC,
              08:00 in Pakistan, or when you press Refresh Feeds); dismissals and imports are shared across your devices.
              <B> Live results fetched in your browser</B> means the stored list was empty or unreachable, so the page fetched directly.
            </P>
            <Note kind="warn">If you see &ldquo;Live results&rdquo; and Refresh Feeds shows an error, see <Go to="/admin/help/troubleshooting">Troubleshooting</Go>.</Note>
          </>
        ),
      },
      {
        id: 'rescue-scanner',
        heading: 'App Rescue Scanner (prototype)',
        body: (
          <>
            <P>
              Type a niche you build in (for example &ldquo;expense tracker&rdquo;) and press <Ui>Search</Ui>. Apps rank higher when their
              rating is low or falling, they haven&rsquo;t been updated for months, they have a real user base, and the publisher has a
              website you can contact.
            </P>
            <Ul>
              <li>Each result lists why it ranked, with links to the App Store page and the publisher&rsquo;s site.</li>
              <li><Ui>Add to CRM</Ui> imports it, and the pitch then opens with the app&rsquo;s real rating and last-update date.</li>
              <li>Treat results as a list to check by hand, not a verdict. Open the app before contacting anyone.</li>
            </Ul>
          </>
        ),
      },
      {
        id: 'search-links',
        heading: 'Search Links',
        body: (
          <P>
            Upwork, Contra, Wellfound and the Reddit and FlutterFlow forum searches open in a new tab. They are manual on purpose:
            Reddit&rsquo;s automatic access needs approval and a paid agreement for business use, the FlutterFlow forum has no feed, and
            scraping Upwork or LinkedIn can get your account banned.
          </P>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 3 */
  {
    slug: 'outreach',
    title: 'Pitches, outreach and follow-ups',
    summary: 'The lead drawer, how pitches are written, the automatic follow-up schedule, and Apollo.',
    keywords: ['pitch', 'email', 'outreach', 'follow-up', 'follow up', 'cadence', 'reply', 'timeline', 'apollo', 'ai', 'angle', 'tone', 'linkedin', 'drawer'],
    sections: [
      {
        id: 'lead-drawer',
        heading: 'The lead drawer',
        body: (
          <P>
            Opening any lead (from the Pipeline, the Prospector table or Client Radar) shows a side panel with the contact details,
            stage, temperature, deal value, notes, <Ui>Next Follow-Up Date</Ui>, the activity timeline, and the pitch writer. Edit anything and
            save; the activity timeline records what you log.
          </P>
        ),
      },
      {
        id: 'pitches',
        heading: 'How pitches are written',
        body: (
          <>
            <Ul>
              <li><B>Angle:</B> Technical Rescue (fix blockers), Rapid MVP (build and launch), or Architecture (scale a backend).</li>
              <li><B>Tone:</B> three styles, from direct and brief to more consultative.</li>
              <li>The draft <B>opens with where the lead came from</B>: the Hacker News post, the job listing, their quote, or the App Store rating.</li>
              <li>It says you work on scoped projects, fixed blocks of hours or a light retainer <B>alongside other clients</B>, so it isn&rsquo;t read as a job application.</li>
              <li>It contains <B>no invented results</B> (no metrics, timelines or client counts). Keep it that way when you edit.</li>
            </Ul>
            <Note kind="info">
              <Ui>Polish with AI</Ui> rewrites the draft with the AI provider you chose in API Integrations. The built-in pitch needs no key,
              and keys you enter are stored in <B>this browser only</B>, so add them again on another device.
            </Note>
          </>
        ),
      },
      {
        id: 'sending',
        heading: 'Sending and logging',
        body: (
          <Ol>
            <li>Press <Ui>Open in Email Client</Ui> to send from your mail app, or copy the short LinkedIn text.</li>
            <li>After you send, press <Ui>Log to Timeline</Ui>. This records the email <B>and schedules the next follow-up</B>.</li>
            <li>For a call, a LinkedIn message or a note, use the activity form and pick the type.</li>
          </Ol>
        ),
      },
      {
        id: 'cadence',
        heading: 'The follow-up schedule',
        body: (
          <>
            <P>Logging an email, LinkedIn message or call sets the next follow-up automatically:</P>
            <Table
              head={['Outreach attempt', 'Next follow-up', 'Also']}
              rows={[
                ['1st', 'in 3 days', 'A new lead moves to Contacted.'],
                ['2nd', 'in 7 days', ''],
                ['3rd', 'in 14 days', ''],
                ['4th and later', 'none', 'The sequence is finished; decide by hand.'],
              ]}
            />
            <P>
              When someone answers, log <Ui>Reply Received</Ui>. The sequence stops, the lead turns hot, and the follow-up becomes tomorrow so you
              respond quickly. Deals that are Closed Won or Closed Lost are never rescheduled.
            </P>
            <P>Due follow-ups appear on the Dashboard and as a badge on Sales &amp; CRM in the sidebar. You can always change the date by hand.</P>
          </>
        ),
      },
      {
        id: 'apollo',
        heading: 'Finding the right contact (Apollo)',
        body: (
          <>
            <P>
              <Ui>Find Decision-Maker</Ui> (in the drawer) and <Ui>Find Founder (Apollo)</Ui> (on radar cards) search Apollo for a founder or engineering
              lead at the company and fill in the name, email and LinkedIn. Add your Apollo key under <Go to="/admin/settings/integrations">API Integrations</Go> first.
            </P>
            <Note kind="warn">Each lookup can use an Apollo credit (the free plan has about 100 a month). Use it on leads you intend to contact, and check that the company it found is the right one.</Note>
          </>
        ),
      },
      {
        id: 'good-practice',
        heading: 'Good practice',
        body: (
          <Ul>
            <li>Mention one specific thing from their post or app. Generic messages get ignored.</li>
            <li>Pitches for leads already in the CRM use that lead&rsquo;s tracked link, so you can see if they opened your work (see <Go to="/admin/help/visitors">Knowing who visited</Go>).</li>
            <li>Keep it short, offer one clear next step (a 15-minute call), and make it easy to say no.</li>
            <li>Email one person at a time. Rules differ by country (US, EU/UK, Canada), so honour any request to stop and note it on the lead.</li>
          </Ul>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 4 */
  {
    slug: 'pipeline',
    title: 'Pipeline, deals and prospects',
    summary: 'Stages, the numbers at the top, moving deals, and the Lead Prospector table.',
    keywords: ['pipeline', 'kanban', 'deal', 'stage', 'value', 'temperature', 'hot', 'warm', 'cold', 'prospects', 'csv', 'export', 'won', 'lost'],
    sections: [
      {
        id: 'stages',
        heading: 'Stages',
        body: (
          <Table
            head={['Stage', 'Means']}
            rows={[
              ['Lead / Inbound', 'New. You haven’t reached out yet, or they just contacted you.'],
              ['Contacted', 'You have sent a first message.'],
              ['Proposal / Discovery', 'You are scoping the work or have sent a proposal.'],
              ['Negotiation', 'Price or terms are being agreed.'],
              ['Closed Won', 'They said yes.'],
              ['Closed Lost', 'They said no, or went quiet for good.'],
            ]}
          />
        ),
      },
      {
        id: 'numbers',
        heading: 'The numbers at the top',
        body: (
          <Ul>
            <li><B>Total Pipeline</B>: the value of every deal except Closed Lost.</li>
            <li><B>Active Deals</B>: deals still in progress (Lead through Negotiation).</li>
            <li><B>Closed Won</B>: deals you won.</li>
            <li><B>Follow-Ups Due</B>: deals with a follow-up date of today or earlier.</li>
          </Ul>
        ),
      },
      {
        id: 'moving',
        heading: 'Adding and moving deals',
        body: (
          <>
            <Ul>
              <li><Ui>+ Add Deal / Lead</Ui> creates one by hand; deals from Client Radar and your quote form arrive on their own.</li>
              <li>Use the arrow buttons on a card to move it to the next or previous stage. Each move is written to the lead&rsquo;s timeline.</li>
              <li>Click a card to open the lead drawer. On a phone you can switch to a compact list view.</li>
              <li>Filter by temperature or source, or search names, companies, notes and tech.</li>
            </Ul>
            <P>
              <B>Temperature</B> is your own read of how warm they are: hot (ready or replied), warm (interested), cold (no sign yet).
            </P>
          </>
        ),
      },
      {
        id: 'prospects',
        heading: 'Lead Prospector (the table view)',
        body: (
          <P>
            <Go to="/admin/crm/prospects">Lead Prospector</Go> lists every lead in a table. Search by name, company, email, role or stack, filter by stage or
            source, jump to a lead with one click, and use <Ui>Export CSV</Ui> to download the list.
          </P>
        ),
      },
      {
        id: 'values',
        heading: 'Deal values',
        body: (
          <P>
            Set a realistic value on each deal; the totals depend on it. A quote from your website is given a starting value from the budget the
            visitor chose (see <Go to="/admin/help/quotes#budgets">Quote requests</Go>). Edit it any time in the drawer.
          </P>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 5 */
  {
    slug: 'quotes',
    title: 'Inbound quote requests',
    summary: 'What happens when a visitor uses your quote form, and what to do next.',
    keywords: ['quote', 'inbound', 'form', 'enquiry', 'inquiry', 'budget', 'discord', 'alert', 'reply', 'convert'],
    sections: [
      {
        id: 'what-happens',
        heading: 'What happens when someone submits the form',
        body: (
          <Ol>
            <li>A <B>Discord alert</B> arrives straight away with their name, email, service, budget, timeline and message.</li>
            <li>A <B>CRM lead is created automatically</B>: stage Lead, temperature hot, a follow-up for tomorrow, and a starting deal value.</li>
            <li>The request appears under <Go to="/admin/quotes">Quote requests</Go>, newest first.</li>
          </Ol>
        ),
      },
      {
        id: 'inbox',
        heading: 'Working the inbox',
        body: (
          <Ul>
            <li>Click a sender to expand the full message, service, backend, budget and timeline.</li>
            <li><Ui>Reply</Ui> opens your mail app addressed to them.</li>
            <li>The <Ui>⋯</Ui> menu has <Ui>View in CRM pipeline</Ui> (or <Ui>Convert to deal</Ui> if the automatic step didn&rsquo;t run) and <Ui>Delete</Ui>. Converting twice never creates a duplicate.</li>
            <li>The search box filters by name, email and message.</li>
            <li>Under <Ui>Before they contacted you</Ui> you see the pages that sender viewed (see <Go to="/admin/help/visitors">Knowing who visited</Go>).</li>
          </Ul>
        ),
      },
      {
        id: 'budgets',
        heading: 'How budgets become deal values',
        body: (
          <Table
            head={['Budget chosen on the form', 'Starting deal value']}
            rows={[
              ['Under $500', '$400'],
              ['$500 – $2,000', '$1,250'],
              ['$2,000 – $5,000', '$3,500'],
              ['$5,000+', '$5,000'],
              ['Not sure yet', '$0'],
            ]}
          />
        ),
      },
      {
        id: 'no-auto-reply',
        heading: 'No automatic reply to the visitor',
        body: (
          <Note kind="info">
            Visitors don&rsquo;t get an automatic email, because sending from your own address needs a paid or domain-based email service.
            Replying yourself the same day works well; the Discord alert is there so you don&rsquo;t miss one.
          </Note>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 6 */
  {
    slug: 'content',
    title: 'Blog, projects and site settings',
    summary: 'Writing and scheduling posts, managing portfolio content, and changing how the site looks.',
    keywords: ['blog', 'post', 'block builder', 'schedule', 'publish', 'draft', 'projects', 'skills', 'profile', 'theme', 'branding', 'logo', 'font', 'sitemap', 'analytics', 'password'],
    sections: [
      {
        id: 'blog',
        heading: 'Writing a blog post',
        body: (
          <Ol>
            <li>Go to <Go to="/admin/blog/new">Blog → Add new</Go>. Type a title; the web address (slug) fills in for you.</li>
            <li>Build the post from blocks: text, headings, images, tables, lists, video, code, callouts, quotes, buttons, and containers that lay blocks out in rows or columns.</li>
            <li>Select a block to edit its options in the side panel. Posts reopen exactly as you left them.</li>
            <li>Choose a cover image and write a short excerpt (it appears in lists and search results).</li>
            <li>Press <Ui>Save Draft</Ui> to keep a draft, or <Ui>Publish</Ui> to go live (the button reads <Ui>Schedule</Ui> when the publish date is in the future). <Ui>Unpublish</Ui> turns a published post back into a draft.</li>
          </Ol>
        ),
      },
      {
        id: 'scheduling',
        heading: 'Scheduling a post',
        body: (
          <>
            <P>
              Set the <B>publish date</B> to a future day and publish it. The post stays hidden from the public until that date, with no further
              action, while you still see it in the admin list marked <Ui>Scheduled</Ui>. Drafts are never public.
            </P>
            <Note kind="warn">Editing the slug of a published post changes its web address and breaks existing links. Leave it alone unless you must.</Note>
          </>
        ),
      },
      {
        id: 'portfolio',
        heading: 'Projects, skills and profile',
        body: (
          <Ul>
            <li><Go to="/admin/projects">Projects</Go>: add case studies with a thumbnail, tech stack and links. Lower <B>display order</B> shows first; <B>Featured</B> projects appear on the home page.</li>
            <li><Go to="/admin/skills">Skills</Go>: the cards in the home page tech stack, in display order.</li>
            <li><Go to="/admin/profile">Profile</Go>: your name, tagline, bio, photo, resume and links.</li>
          </Ul>
        ),
      },
      {
        id: 'look',
        heading: 'Theme and branding',
        body: (
          <>
            <Ul>
              <li><Go to="/admin/settings/branding">Branding</Go>: site name, logo and favicon.</li>
              <li><Go to="/admin/settings/theme">Theme</Go>: colours, corner roundness, shadows, button and card style, and fonts. The public site picks changes up without a redeploy.</li>
            </Ul>
            <Note kind="info">
              The database still stores the old default fonts (Manrope and Fira Code). The site already shows the correct ones. To tidy the data, choose
              Plus Jakarta Sans and JetBrains Mono in the dropdowns and save; saving without changing them keeps the old values.
            </Note>
          </>
        ),
      },
      {
        id: 'seo-files',
        heading: 'Sitemap and feed',
        body: (
          <P>
            Search engines read <B>sitemap.xml</B> and the RSS <B>feed.xml</B>. Both are files kept by hand, so a new post is not added automatically. Add
            new posts to them when you publish (or ask for an automatic generator to be built).
          </P>
        ),
      },
      {
        id: 'analytics-account',
        heading: 'Analytics and your account',
        body: (
          <Ul>
            <li><Go to="/admin/analytics">Analytics</Go> counts visits to the public site (not your admin pages). Repeat views of the same page within 30 seconds, and bots, are ignored.</li>
            <li><Go to="/admin/settings/account">Account</Go> is where you change your password.</li>
          </Ul>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 7 */
  {
    slug: 'automation',
    title: 'What runs automatically',
    summary: 'The background jobs, where alerts go, and what you still do by hand.',
    keywords: ['automatic', 'automation', 'cron', 'schedule', 'daily', 'discord', 'webhook', 'digest', 'alerts', 'cost', 'free', 'supabase', 'pause'],
    sections: [
      {
        id: 'jobs',
        heading: 'The automatic jobs',
        body: (
          <Table
            head={['What', 'When', 'What it does']}
            rows={[
              ['Radar fetch', 'Every day, 03:00 UTC (08:00 Pakistan)', 'Fetches Hacker News, Jobicy and RemoteOK, scores posts, saves new ones, deletes old untouched ones after 45 days.'],
              ['Discord digest', 'With the radar fetch', 'Posts up to 10 of the best new posts that are not full-time-only and score 65 or more. Each post is announced once.'],
              ['Quote alert', 'Instantly, on each submission', 'Posts the enquiry to Discord and creates the CRM lead.'],
              ['Follow-up scheduling', 'When you log outreach', 'Sets the next reminder (3, 7, then 14 days).'],
            ]}
          />
        ),
      },
      {
        id: 'by-hand',
        heading: 'What you still do by hand',
        body: (
          <Ul>
            <li>Read the leads, choose which to contact, and send every message yourself.</li>
            <li>Check Search Links (Upwork, Contra, Wellfound, Reddit, the FlutterFlow forum).</li>
            <li>Add new posts to the sitemap and feed.</li>
            <li>Apply to the FlutterFlow Expert program (a free source of inbound leads).</li>
          </Ul>
        ),
      },
      {
        id: 'alerts',
        heading: 'Where alerts go',
        body: (
          <P>
            Alerts post to one Discord channel through a webhook. Nothing is sent by email. If you want to move them to another channel or
            rotate the webhook, replace the <B>NOTIFY_WEBHOOK_URL</B> secret on the Supabase project (see the deployment guide in the repository).
          </P>
        ),
      },
      {
        id: 'costs-limits',
        heading: 'Costs and limits',
        body: (
          <Ul>
            <li><B>Cost:</B> everything running today is on free plans.</li>
            <li><B>Apollo:</B> about 100 credits a month on the free plan.</li>
            <li><B>Supabase free tier:</B> a project left idle for about a week can pause. If the site shows errors after a quiet spell, restore the project from the Supabase dashboard.</li>
            <li><B>Visitor data:</B> unlinked page views are deleted after 90 days, linked ones after 12 months (a weekly job).</li>
            <li><B>Not built yet:</B> outcome reports (reply, call, won), a do-not-contact list, weighted pipeline forecasts, and email alerts.</li>
          </Ul>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 7b */
  {
    slug: 'visitors',
    title: 'Knowing who visited',
    summary: 'How a visit becomes linked to a contact, where to see it, tracked links, and the privacy limits.',
    keywords: ['visitor', 'visit', 'tracking', 'tracked link', 'ref', 'privacy', 'opt out', 'do not track', 'identify', 'history', 'browser', 'pages viewed'],
    sections: [
      {
        id: 'how-it-works',
        heading: 'How a visitor becomes a known contact',
        body: (
          <>
            <P>
              Every browser that visits the public site gets a <B>random ID</B> (not a name or email), stored in that browser. Page views are saved with it.
              That ID is linked to a person in only two ways, both of which the person triggers:
            </P>
            <Ol>
              <li><B>They send the quote form.</B> The ID goes with the request, so you can see the pages they read before contacting you.</li>
              <li><B>They open a tracked link</B> from one of your emails. The link carries a private code for that lead, and opening it links their browser to the lead.</li>
            </Ol>
            <P>After that, later visits from the same browser are shown on the lead too.</P>
          </>
        ),
      },
      {
        id: 'where-to-look',
        heading: 'Where to see it',
        body: (
          <Ul>
            <li><B>Lead drawer → Website visits:</B> number of visits, page views, first and last seen, and the pages viewed with their sources.</li>
            <li><B>Quote requests → open a request → Before they contacted you:</B> the same, for the browser that sent the form.</li>
            <li>The Discord alert for a new quote also lists how many pages the sender viewed and which.</li>
          </Ul>
        ),
      },
      {
        id: 'tracked-links',
        heading: 'Tracked links in your pitches',
        body: (
          <>
            <P>
              Every lead has its own tracked link (shown in the lead drawer with a <Ui>Copy</Ui> button). Pitches written for a lead already use it for the portfolio link, so
              you can see whether someone opened your work after your email.
            </P>
            <Note kind="info">
              A lead that is not yet in the CRM has no tracked link. Add it to the CRM first (<Ui>Add to CRM</Ui>), then use <Ui>Open Pitch</Ui>. Send the tracked link only to the person it belongs to; do not post it publicly.
            </Note>
          </>
        ),
      },
      {
        id: 'limits',
        heading: 'What it can and cannot tell you',
        body: (
          <Ul>
            <li>It recognises the <B>same browser on the same device</B>. A private window, cleared site data, or another device looks like a new visitor.</li>
            <li>It does not know who anonymous visitors are, and it will not: there is no fingerprinting, no IP or company lookup, and no social profile matching.</li>
            <li>People who turn tracking off on the privacy page, or whose browser sends Do Not Track, are not recorded or linked at all.</li>
            <li>Opening a link in an email app that pre-loads pages can show a visit the person never made. Treat a single visit as a hint, not proof.</li>
          </Ul>
        ),
      },
      {
        id: 'privacy-notice',
        heading: 'The privacy notice',
        body: (
          <>
            <P>
              The public <B>/privacy</B> page (linked in the site footer and under the quote form) tells visitors what is recorded, why, how long it is kept, and lets
              them switch tracking off. It also states the retention periods: unlinked page views up to 90 days, linked ones up to 12 months. A weekly job deletes older records.
            </P>
            <Note kind="warn">
              Keep the notice accurate. If you add a new tracking tool, change retention, or share visitor data with anyone, update the privacy page first. Privacy law differs by country; if you serve clients in the EU or UK, have the notice reviewed.
            </Note>
          </>
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 8 */
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    summary: 'Symptoms and what to check, in plain steps.',
    keywords: ['problem', 'error', 'not working', 'missing', 'wrong', 'troubleshoot', 'fix', 'discord', 'radar', 'login', 'paused', 'deal value'],
    sections: [
      {
        id: 'radar-live',
        heading: 'Client Radar says "Live results fetched in your browser"',
        body: (
          <>
            <P>The stored list is empty or couldn&rsquo;t be reached, so the page fetched directly. Press <Ui>Refresh Feeds</Ui>.</P>
            <Ul>
              <li>If you get a &ldquo;Server refresh failed&rdquo; message, the fetch function needs attention: check its logs in the Supabase dashboard (Edge Functions → radar-ingest).</li>
              <li>The page still works in live mode, so you are not blocked.</li>
            </Ul>
          </>
        ),
      },
      {
        id: 'no-digest',
        heading: 'No Discord digest this morning',
        body: (
          <Ul>
            <li>It is normal when nothing new scored 65 or more and wasn&rsquo;t full-time-only.</li>
            <li>Otherwise check the daily job&rsquo;s run history in the Supabase SQL editor with <B>select * from cron.job_run_details order by start_time desc limit 5;</B> and the function logs.</li>
          </Ul>
        ),
      },
      {
        id: 'no-quote-alert',
        heading: 'A quote arrived but there was no Discord alert',
        body: (
          <P>
            The enquiry and its CRM lead are saved even if Discord fails. Check the <B>quote-notify</B> function logs; a revoked webhook is the usual cause.
          </P>
        ),
      },
      {
        id: 'wrong-value',
        heading: 'A deal has the wrong value',
        body: <P>Open the lead and edit <Ui>deal value</Ui>. Quote budgets use fixed starting values (see <Go to="/admin/help/quotes#budgets">Quote requests</Go>).</P>,
      },
      {
        id: 'site-errors',
        heading: 'The site or admin shows errors or empty pages',
        body: (
          <Ul>
            <li>Reload and sign in again.</li>
            <li>If errors persist after a quiet week, the free Supabase project may have paused: restore it from the Supabase dashboard.</li>
            <li>A change that isn&rsquo;t showing on the public site may be a cached page; wait a minute and reload.</li>
          </Ul>
        ),
      },
      {
        id: 'keys',
        heading: 'AI or Apollo stopped working on another device',
        body: <P>Keys are saved in the browser you entered them in. Open <Go to="/admin/settings/integrations">API Integrations</Go> on the new device and add them again.</P>,
      },
    ],
  },
]

/** Shortcut questions shown on the help home page. */
export const quickAnswers = [
  { question: 'Where do I start?', slug: 'getting-started', anchor: 'first-15-minutes' },
  { question: 'Why can’t I see full-time jobs?', slug: 'client-radar', anchor: 'fit' },
  { question: 'How is the score worked out?', slug: 'client-radar', anchor: 'score' },
  { question: 'How do follow-ups work?', slug: 'outreach', anchor: 'cadence' },
  { question: 'A quote came in. What now?', slug: 'quotes', anchor: 'what-happens' },
  { question: 'How do I schedule a blog post?', slug: 'content', anchor: 'scheduling' },
  { question: 'Who visited after my email?', slug: 'visitors', anchor: 'tracked-links' },
  { question: 'What runs without me?', slug: 'automation', anchor: 'jobs' },
  { question: 'Something looks wrong', slug: 'troubleshooting', anchor: 'radar-live' },
]

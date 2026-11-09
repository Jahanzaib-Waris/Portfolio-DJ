import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { isDoNotTrack, isOptedOut, setTrackingOptOut } from '../utils/visitor'

const UPDATED = '9 November 2026'

export default function Privacy() {
  useDocumentMeta({
    title: 'Privacy notice — Jerry Dev Studio',
    description: 'What this website records about visitors, why, how long it is kept, and how to switch it off.',
    canonicalPath: '/privacy',
  })

  const { profile } = useOutletContext() || {}
  const [optedOut, setOptedOut] = useState(isOptedOut)
  const dnt = isDoNotTrack()
  const trackingOff = optedOut || dnt

  const toggle = () => {
    const next = !optedOut
    setTrackingOptOut(next)
    setOptedOut(next)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="system-heading text-3xl text-white sm:text-4xl">Privacy notice</h1>
      <p className="mt-2 text-sm text-[#A1A7CA]">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[#C9CEEA]">
        <section>
          <h2 className="mb-2 text-xl font-bold text-white">Who this is about</h2>
          <p>
            This website is run by {profile?.name || 'Jerry Dev Studio'} (Jerry Dev Studio), an independent mobile and
            full-stack engineering studio. This page explains what the site records about you, in plain language.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-white">What the site records</h2>
          <ul className="list-disc space-y-2 pl-5 marker:text-[#6D5AF6]">
            <li>
              <strong className="text-white">Page views.</strong> Which page you opened, when, and the website you came from.
              Each browser gets a random ID, stored in your browser&rsquo;s local storage, so repeat visits can be counted. The
              ID is not your name or email, and the site uses no advertising or third-party tracking tools.
            </li>
            <li>
              <strong className="text-white">The quote form.</strong> If you send a project enquiry, I keep what you type
              (name, email, project details, budget, timeline). I also keep your browser ID with it, so I can see which pages you
              looked at before contacting me and reply with that context.
            </li>
            <li>
              <strong className="text-white">Links in my emails.</strong> A link in an email I send you can contain a private
              code. If you open it, your browser ID is linked to your contact record, so I can see whether and what you looked at
              on this site afterwards.
            </li>
          </ul>
          <p className="mt-3">
            The services that host this site (Firebase Hosting and Supabase) also keep standard technical logs, which can include
            your IP address, under their own policies. This site does not use those logs to identify you.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-white">Why</h2>
          <p>
            To reply to enquiries, to follow up on conversations I have started, and to understand which parts of the site are
            useful. I do not sell data or share it for advertising.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-white">Who else sees it</h2>
          <p>
            Your enquiry is stored with Supabase (database) and a short notification of it is sent to a private Discord channel
            that only I can read. Hosting is on Firebase (Google). Nothing else receives your details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-white">How long it is kept</h2>
          <ul className="list-disc space-y-2 pl-5 marker:text-[#6D5AF6]">
            <li>Page views that are not linked to a contact: up to 90 days.</li>
            <li>Page views linked to a contact: up to 12 months.</li>
            <li>Enquiries and contact records: for as long as they are needed to deal with your enquiry, or until you ask me to delete them.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold text-white">Your choices</h2>
          <p>
            You can switch visit tracking off for this browser. It stops page-view recording and linking, and removes the browser ID
            that is stored here. A browser that sends the &ldquo;Do Not Track&rdquo; signal is respected automatically.
          </p>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-panel-edge bg-panel/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" role="status">
              {dnt
                ? 'Tracking is off: your browser sends Do Not Track.'
                : optedOut
                  ? 'Tracking is off for this browser.'
                  : 'Tracking is on for this browser.'}
            </p>
            {!dnt && (
              <button
                type="button"
                onClick={toggle}
                aria-pressed={optedOut}
                className="rounded-lg border border-panel-edge px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-neon-blue/60"
              >
                {optedOut ? 'Turn tracking back on' : 'Turn tracking off'}
              </button>
            )}
          </div>
          {trackingOff && <p className="mt-2 text-sm text-[#A1A7CA]">You can still contact me through the quote form; it will simply not include a browser ID.</p>}
          <p className="mt-4">
            To see, correct or delete what I hold about you, contact me
            {profile?.email ? (
              <>
                {' '}at <a className="text-neon-blue hover:underline" href={`mailto:${profile.email}`}>{profile.email}</a>
              </>
            ) : (
              <> through the quote form on this site</>
            )}
            . If you are in the EU, UK or another region with data-protection law, you also have the right to complain to your local regulator.
          </p>
        </section>

        <p className="text-sm text-[#A1A7CA]">
          <Link to="/" className="text-neon-blue hover:underline">Back to the home page</Link>
        </p>
      </div>
    </div>
  )
}

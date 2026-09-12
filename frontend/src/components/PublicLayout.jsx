import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { getBranding, getProfile, trackPageView } from '../api/client'
import Footer from './Footer'
import NavBar from './NavBar'
import RequestQuoteModal from './RequestQuoteModal'

// Points the browser tab icon at an admin-uploaded favicon. Falls back to the
// static /favicon.svg from index.html when none has been set.
function applyFavicon(url) {
  if (!url) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

/**
 * Chrome for the public site: navbar, footer, and the global quote modal.
 *
 * Admin routes deliberately sit outside this layout — they have their own shell
 * and shouldn't render the marketing navigation.
 */
export default function PublicLayout() {
  const location = useLocation()
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('loading')
  // Whichever of profile/branding resolves first shouldn't have its title
  // choice clobbered by the other arriving later — a ref survives both
  // `.then` callbacks regardless of which order they settle in.
  const profileNameRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    // Branding provides the fallback title/favicon; the profile name (once
    // loaded) takes over the title, matching the existing behaviour below.
    getBranding()
      .then((data) => {
        if (cancelled) return
        if (!profileNameRef.current) document.title = `${data.site_name} — Portfolio`
        applyFavicon(data.favicon)
      })
      .catch(() => {})

    getProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setProfileState('ready')
        if (data?.name) {
          profileNameRef.current = data.name
          document.title = `${data.name} — Portfolio`
        }
      })
      .catch(() => {
        if (!cancelled) setProfileState('empty')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // One beacon per route change. This layout only wraps public routes, so
  // admin panel navigation never inflates these stats.
  useEffect(() => {
    trackPageView(location.pathname, document.referrer)
  }, [location.pathname])

  const openQuoteModal = useCallback(() => setQuoteModalOpen(true), [])

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar profile={profile} onRequestQuote={openQuoteModal} />

      <main className="flex-1">
        <Outlet context={{ profile, profileState, onRequestQuote: openQuoteModal }} />
      </main>

      <Footer profile={profile} />

      <RequestQuoteModal open={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} />
    </div>
  )
}

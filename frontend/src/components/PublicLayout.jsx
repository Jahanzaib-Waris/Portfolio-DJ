import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { getProfile } from '../api/client'
import Footer from './Footer'
import NavBar from './NavBar'
import RequestQuoteModal from './RequestQuoteModal'

/**
 * Chrome for the public site: navbar, footer, and the global quote modal.
 *
 * Admin routes deliberately sit outside this layout — they have their own shell
 * and shouldn't render the marketing navigation.
 */
export default function PublicLayout() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('loading')

  useEffect(() => {
    let cancelled = false

    getProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setProfileState('ready')
        if (data?.name) document.title = `${data.name} — Portfolio`
      })
      .catch(() => {
        if (!cancelled) setProfileState('empty')
      })

    return () => {
      cancelled = true
    }
  }, [])

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

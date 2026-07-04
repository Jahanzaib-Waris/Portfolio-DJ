import { useEffect, useState } from 'react'
import { getProfile, resumeDownloadUrl } from '../api/client'
import StatusPanel from '../components/StatusPanel'
import SystemButton from '../components/SystemButton'

export default function Home({ onRequestQuote }) {
  const [profile, setProfile] = useState(null)
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setLoadState('ready')
      })
      .catch(() => setLoadState('empty'))
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <StatusPanel className="text-left">
        <p className="system-heading mb-2 text-xs text-neon-purple">// Hunter Status Window</p>

        {loadState === 'loading' && <p className="text-slate-400">Loading status window...</p>}

        {loadState === 'empty' && (
          <p className="text-slate-400">
            Profile not configured yet. Add one in the Django admin to populate this panel.
          </p>
        )}

        {loadState === 'ready' && profile && (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {profile.photo && (
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-32 w-32 shrink-0 rounded-full border-2 border-neon-blue object-cover shadow-[0_0_20px_rgba(63,208,255,0.4)]"
              />
            )}
            <div className="space-y-3">
              <h1 className="system-heading glow-text text-3xl font-bold text-white">{profile.name}</h1>
              {profile.tagline && <p className="text-neon-blue">{profile.tagline}</p>}
              {profile.bio && <p className="leading-relaxed text-slate-300">{profile.bio}</p>}

              <div className="flex flex-wrap gap-3 pt-2">
                {profile.resume && (
                  <SystemButton as="a" href={resumeDownloadUrl}>
                    Download Resume
                  </SystemButton>
                )}
                <SystemButton onClick={onRequestQuote} className="border-neon-purple text-neon-purple">
                  Request Quote
                </SystemButton>
              </div>
            </div>
          </div>
        )}
      </StatusPanel>
    </div>
  )
}

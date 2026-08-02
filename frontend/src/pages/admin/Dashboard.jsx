import { useEffect, useState } from 'react'

import { getBlogPosts, getProjects, getQuoteRequests, getSkills } from '../../api/client'
import { useAuth } from '../../auth/authContext'
import StatusPanel from '../../components/StatusPanel'
import { Skeleton } from '../../components/Skeleton'

// `count` comes from DRF's pagination envelope, so page_size=1 fetches the
// total without pulling every row down.
const sources = [
  { key: 'posts', label: 'Blog posts', fetch: () => getBlogPosts({ page_size: 1 }) },
  { key: 'projects', label: 'Projects', fetch: () => getProjects({ page_size: 1 }) },
  { key: 'skills', label: 'Skills', fetch: () => getSkills({ page_size: 1 }) },
  { key: 'quotes', label: 'Quote requests', fetch: () => getQuoteRequests({ page_size: 1 }) },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({})
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    document.title = 'Dashboard — Control Panel'

    let cancelled = false

    Promise.all(
      sources.map((source) =>
        source
          .fetch()
          // A single failed count shouldn't blank the whole dashboard.
          .then((data) => [source.key, data.count ?? (Array.isArray(data) ? data.length : 0)])
          .catch(() => [source.key, null]),
      ),
    ).then((entries) => {
      if (cancelled) return
      setCounts(Object.fromEntries(entries))
      setLoadState('ready')
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow system-heading text-xs text-neon-indigo">// Overview</p>
      <h1 className="mt-3 text-2xl text-white sm:text-3xl">
        Welcome back, <span className="text-neon-blue">{user?.username}</span>
      </h1>
      <p className="mt-2 text-sm text-slate-400">Content currently published on the site.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map((source) => (
          <StatusPanel key={source.key} className="p-5">
            <p className="system-heading text-xs text-slate-400">{source.label}</p>
            {loadState === 'loading' ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <p className="glow-text mt-1 text-3xl text-neon-blue">
                {counts[source.key] === null ? (
                  <span className="text-base text-status-red">—</span>
                ) : (
                  counts[source.key]
                )}
              </p>
            )}
          </StatusPanel>
        ))}
      </div>

      <StatusPanel className="mt-8 p-6">
        <h2 className="system-heading text-sm text-white">What&rsquo;s next</h2>
        <p className="mt-2 text-sm text-slate-400">
          The API behind this panel already supports full create, update and delete for posts,
          projects, skills and the profile. The editing screens are the next thing to build &mdash;
          the sidebar items marked <span className="text-slate-500">soon</span> are the queue.
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Until then, <span className="text-slate-300">/admin/</span> on the backend still runs the
          Django admin as a fallback.
        </p>
      </StatusPanel>
    </div>
  )
}

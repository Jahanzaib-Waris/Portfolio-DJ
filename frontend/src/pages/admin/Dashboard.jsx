import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAnalyticsSummary, getBlogPosts, getProjects, getQuoteRequests, getSkills } from '../../api/client'
import { useAuth } from '../../auth/authContext'
import AnalyticsChart from '../../components/admin/AnalyticsChart'
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
  const [analytics, setAnalytics] = useState(null)
  const [analyticsState, setAnalyticsState] = useState('loading')

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

    getAnalyticsSummary({ days: 7 })
      .then((data) => {
        if (cancelled) return
        setAnalytics(data)
        setAnalyticsState('ready')
      })
      .catch(() => !cancelled && setAnalyticsState('error'))

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

      <StatusPanel glow={false} className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <p className="system-heading text-sm text-white">Traffic — last 7 days</p>
          <Link to="/admin/analytics" className="text-xs text-neon-blue hover:underline">
            Full analytics &rarr;
          </Link>
        </div>

        {analyticsState === 'loading' && <Skeleton className="mt-4 h-40 w-full" />}
        {analyticsState === 'error' && (
          <p className="mt-4 text-sm text-status-red">Traffic data could not be loaded.</p>
        )}
        {analyticsState === 'ready' && analytics && (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">Page views</p>
                <p className="mt-1 text-2xl text-neon-blue">{analytics.total_views}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Unique visitors</p>
                <p className="mt-1 text-2xl text-neon-blue">{analytics.total_visitors}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Quote leads</p>
                <p className="mt-1 text-2xl text-neon-blue">
                  {analytics.quotes_trend.reduce((sum, d) => sum + d.count, 0)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <AnalyticsChart data={analytics.series} />
            </div>
          </>
        )}
      </StatusPanel>
    </div>
  )
}

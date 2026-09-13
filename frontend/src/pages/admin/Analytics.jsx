import { useEffect, useState } from 'react'

import { getAnalyticsSummary } from '../../api/client'
import AnalyticsChart from '../../components/admin/AnalyticsChart'
import StatusPanel from '../../components/StatusPanel'
import { Skeleton } from '../../components/Skeleton'

const periods = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

function RankedTable({ rows, empty, renderLabel }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">{empty}</p>
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-b border-panel-edge/60 py-1.5 text-sm last:border-0">
          <span className="min-w-0 truncate text-slate-200">{renderLabel(row)}</span>
          <span className="shrink-0 text-slate-400">{row.count}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    document.title = 'Analytics — Control Panel'
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')

    getAnalyticsSummary({ days })
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoadState('ready')
      })
      .catch(() => !cancelled && setLoadState('error'))

    return () => {
      cancelled = true
    }
  }, [days])

  const totalLeads = data?.quotes_trend.reduce((sum, d) => sum + d.count, 0) ?? 0

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white sm:text-3xl">Analytics</h1>
        <div className="flex gap-1 rounded-md border border-panel-edge p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`rounded px-3 py-1 text-xs transition-colors ${
                days === p.value ? 'bg-neon-blue/10 text-neon-blue' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">Traffic and leads across the public site.</p>

      {loadState === 'error' && <p className="mt-8 text-sm text-status-red">Analytics could not be loaded.</p>}

      {loadState === 'loading' && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <StatusPanel key={i} glow={false} className="p-5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-8 w-16" />
              </StatusPanel>
            ))}
          </div>
          <StatusPanel glow={false} className="p-5">
            <Skeleton className="h-48 w-full" />
          </StatusPanel>
        </div>
      )}

      {loadState === 'ready' && data && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatusPanel glow={false} className="p-5">
              <p className="system-heading text-xs text-slate-400">Page views</p>
              <p className="mt-1 text-3xl text-neon-blue">{data.total_views}</p>
            </StatusPanel>
            <StatusPanel glow={false} className="p-5">
              <p className="system-heading text-xs text-slate-400">Unique visitors</p>
              <p className="mt-1 text-3xl text-neon-blue">{data.total_visitors}</p>
            </StatusPanel>
            <StatusPanel glow={false} className="p-5">
              <p className="system-heading text-xs text-slate-400">Quote leads</p>
              <p className="mt-1 text-3xl text-neon-blue">{totalLeads}</p>
            </StatusPanel>
          </div>

          <StatusPanel glow={false} className="p-5">
            <p className="system-heading mb-4 text-sm text-white">Page views over time</p>
            <AnalyticsChart data={data.series} />
          </StatusPanel>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatusPanel glow={false} className="p-5">
              <p className="system-heading mb-3 text-sm text-white">Top pages</p>
              <RankedTable
                rows={data.top_pages}
                empty="No page views recorded yet."
                renderLabel={(row) => row.path}
              />
            </StatusPanel>

            <StatusPanel glow={false} className="p-5">
              <p className="system-heading mb-3 text-sm text-white">Top referrers</p>
              <RankedTable
                rows={data.top_referrers}
                empty="No referrer traffic recorded yet — most visits came directly."
                renderLabel={(row) => row.referrer}
              />
            </StatusPanel>
          </div>
        </div>
      )}
    </div>
  )
}

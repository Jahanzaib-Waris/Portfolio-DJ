import { useEffect, useState } from 'react'
import { getLeadVisitorIds, getVisitHistory } from '../../api/client'
import { Skeleton } from '../Skeleton'

const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const ago = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

const hostOf = (referrer) => {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''
  } catch {
    return ''
  }
}

/**
 * What a known contact has done on the public site.
 *   leadId      – include every browser linked to this lead (quote form or tracked link)
 *   visitorIds  – extra browser IDs to include (e.g. the one sent with a quote request)
 * Needs supabase/visitors.sql for leadId lookups; shows a hint if that isn't applied yet.
 */
export default function VisitHistory({ leadId, visitorIds = [] }) {
  const [state, setState] = useState('loading') // loading | ready | unavailable
  const [history, setHistory] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const extraKey = visitorIds.join('|')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setState('loading')
      try {
        let ids = extraKey ? extraKey.split('|') : []
        let linksUnavailable = false
        if (leadId) {
          try {
            ids = [...ids, ...(await getLeadVisitorIds(leadId))]
          } catch {
            linksUnavailable = true
          }
        }
        if (linksUnavailable && ids.length === 0) {
          if (!cancelled) setState('unavailable')
          return
        }
        const result = await getVisitHistory(ids)
        if (!cancelled) {
          setHistory(result)
          setState('ready')
        }
      } catch {
        if (!cancelled) setState('unavailable')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [leadId, extraKey])

  if (state === 'loading') return <Skeleton className="h-16 w-full" />

  if (state === 'unavailable') {
    return (
      <p className="text-xs text-slate-400">
        Visit tracking isn&rsquo;t set up yet. Apply <span className="font-mono">supabase/visitors.sql</span> to turn it on.
      </p>
    )
  }

  if (!history || history.views.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No visits linked yet. They appear when this person submits the quote form, or opens the tracked link in one of your pitches,
        in the same browser. Tracking is off for visitors who opted out or send Do Not Track.
      </p>
    )
  }

  const shown = showAll ? history.views : history.views.slice(0, 8)

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-200">
        <span className="font-semibold text-white">{history.visits}</span> visit{history.visits === 1 ? '' : 's'},{' '}
        <span className="font-semibold text-white">{history.views.length}</span> page view{history.views.length === 1 ? '' : 's'}
        <span className="text-slate-400">
          {' '}
          &middot; first seen {fmt(history.firstSeen)} &middot; last seen {ago(history.lastSeen)}
        </span>
      </p>
      <ul className="divide-y divide-panel-edge/60 rounded-lg border border-panel-edge bg-abyss/40 text-xs">
        {shown.map((v, i) => (
          <li key={`${v.created_at}-${i}`} className="flex items-center justify-between gap-3 px-3 py-1.5">
            <span className="min-w-0 truncate font-mono text-slate-200">{v.path}</span>
            <span className="shrink-0 text-slate-400">
              {hostOf(v.referrer) ? `from ${hostOf(v.referrer)} · ` : ''}
              {fmt(v.created_at)}
            </span>
          </li>
        ))}
      </ul>
      {history.views.length > 8 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs text-neon-blue hover:underline">
          {showAll ? 'Show fewer' : `Show all ${history.views.length}`}
        </button>
      )}
    </div>
  )
}

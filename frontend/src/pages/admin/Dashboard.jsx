import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getAnalyticsSummary,
  getBlogPosts,
  getCrmLeads,
  getProjects,
  getQuoteRequests,
  getSkills,
} from '../../api/client'
import { useAuth } from '../../auth/authContext'
import AnalyticsChart from '../../components/admin/AnalyticsChart'
import StatusPanel from '../../components/StatusPanel'
import { Skeleton } from '../../components/Skeleton'

export default function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({})
  const [loadState, setLoadState] = useState('loading')
  const [analytics, setAnalytics] = useState(null)
  const [analyticsState, setAnalyticsState] = useState('loading')

  // Action required items
  const [recentQuotes, setRecentQuotes] = useState([])
  const [crmDueLeads, setCrmDueLeads] = useState([])
  const [crmStats, setCrmStats] = useState({ totalPipeline: 0, activeDeals: 0 })

  useEffect(() => {
    document.title = 'Dashboard — Control Panel'
    let cancelled = false

    // Fetch primary stats
    Promise.all([
      getBlogPosts({ page_size: 1 }).catch(() => ({ count: 0 })),
      getProjects({ page_size: 1 }).catch(() => ({ count: 0 })),
      getSkills({ page_size: 1 }).catch(() => ({ count: 0 })),
      getQuoteRequests({ page_size: 5 }).catch(() => ({ items: [], count: 0 })),
      getCrmLeads().catch(() => ({ items: [] })),
    ]).then(([postsData, projectsData, skillsData, quotesData, crmData]) => {
      if (cancelled) return

      const quoteItems = quotesData.items || []
      const crmItems = crmData.items || []

      // Calculate CRM metrics
      let totalPipeline = 0
      let activeDeals = 0
      const today = new Date().toISOString().slice(0, 10)
      const dueLeads = []

      crmItems.forEach((l) => {
        const val = parseFloat(l.deal_value) || 0
        if (l.stage !== 'closed_lost') totalPipeline += val
        if (['lead', 'contacted', 'proposal', 'negotiation'].includes(l.stage)) activeDeals += 1
        if (
          l.next_follow_up &&
          l.next_follow_up.slice(0, 10) <= today &&
          l.stage !== 'closed_won' &&
          l.stage !== 'closed_lost'
        ) {
          dueLeads.push(l)
        }
      })

      setCounts({
        posts: postsData.count ?? (Array.isArray(postsData) ? postsData.length : 0),
        projects: projectsData.count ?? (Array.isArray(projectsData) ? projectsData.length : 0),
        skills: skillsData.count ?? (Array.isArray(skillsData) ? skillsData.length : 0),
        quotes: quotesData.count ?? quoteItems.length,
      })

      setCrmStats({ totalPipeline, activeDeals })
      setRecentQuotes(quoteItems.slice(0, 3))
      setCrmDueLeads(dueLeads.slice(0, 3))
      setLoadState('ready')
    })

    // Fetch analytics
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

  const usernameDisplay =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Admin'

  const statCards = [
    {
      title: 'Blog Posts',
      count: counts.posts,
      sub: 'Drafts & live posts',
      to: '/admin/blog',
      color: 'text-white',
      badge: 'Articles',
    },
    {
      title: 'Portfolio Projects',
      count: counts.projects,
      sub: 'Case studies & work',
      to: '/admin/projects',
      color: 'text-white',
      badge: 'Showcase',
    },
    {
      title: 'Active Deal Pipeline',
      count: `$${(crmStats.totalPipeline || 0).toLocaleString()}`,
      sub: `${crmStats.activeDeals} deals in progress`,
      to: '/admin/crm',
      color: 'text-white',
      badge: 'Sales & CRM',
    },
    {
      title: 'Quote Requests',
      count: counts.quotes,
      sub: 'Inbound client leads',
      to: '/admin/quotes',
      color: 'text-white',
      badge: 'Inbox',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Top Banner & Launchpad */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-panel-edge">
        <div>
          <h1 className="mt-2 text-xl text-white font-bold font-display tracking-tight sm:text-3xl">
            Welcome back, <span className="text-neon-blue">{usernameDisplay}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Studio performance, live publications, and sales pipeline at a glance.
          </p>
        </div>

        {/* Quick Action Launchpad */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            to="/admin/blog/new"
            className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-lg bg-neon-blue/15 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/25 text-xs font-semibold transition-all"
          >
             + New Post
          </Link>
          <Link
            to="/admin/projects/new"
            className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-lg bg-abyss border border-panel-edge text-slate-200 hover:text-white hover:border-slate-400 text-xs font-semibold transition-all"
          >
             + Add Project
          </Link>
          <Link
            to="/admin/crm/radar"
            className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-lg bg-abyss border border-panel-edge text-slate-200 hover:text-white hover:border-slate-400 text-xs font-semibold transition-all"
          >
             Client Radar
          </Link>
          <Link
            to="/admin/crm"
            className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-lg bg-abyss border border-panel-edge text-slate-200 hover:text-white hover:border-slate-400 text-xs font-semibold transition-all"
          >
             + Log Deal
          </Link>
        </div>
      </div>

      {/* Action Required Widget Row */}
      {(crmDueLeads.length > 0 || recentQuotes.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Due CRM Follow-Ups */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                 CRM Follow-Ups Due Today ({crmDueLeads.length})
              </h2>
              <Link to="/admin/crm" className="text-xs text-amber-400 hover:underline">
                View Pipeline &rarr;
              </Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {crmDueLeads.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No follow-ups overdue. Great job!</p>
              ) : (
                crmDueLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    to="/admin/crm"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-panel border border-panel-edge hover:border-amber-500/50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{lead.name}</p>
                      <p className="text-xs text-slate-400">{lead.company || lead.job_title}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        ${lead.deal_value || 0}
                      </span>
                      <p className="text-xs font-mono text-amber-400">Due now</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Quote Requests */}
          <div className="rounded-xl border border-panel-edge bg-panel/60 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-panel-edge">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                 Recent Inbound Quotes
              </h2>
              <Link to="/admin/quotes" className="text-xs text-neon-blue hover:underline">
                Open Inbox &rarr;
              </Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {recentQuotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No inquiries received yet.</p>
              ) : (
                recentQuotes.map((q) => (
                  <Link
                    key={q.id}
                    to="/admin/quotes"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-abyss/60 border border-panel-edge hover:border-neon-blue/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-xs font-bold text-white truncate">{q.name}</p>
                      <p className="text-xs text-slate-400 truncate">{q.service || q.project_details}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(q.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {crmDueLeads.length === 0 && recentQuotes.length === 0 && loadState === 'ready' && (
        <p className="rounded-lg border border-panel-edge bg-panel/60 px-4 py-3 text-sm text-slate-300">
          Nothing needs attention: no follow-ups due and no new quote requests.
        </p>
      )}

      {/* Interactive Metric Cards (Clickable) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.to}
            className="group relative block rounded-xl border border-panel-edge bg-panel/70 p-4 sm:p-5 transition-all duration-200 hover:border-neon-blue/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-300">{card.title}</p>

            {loadState === 'loading' ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className={`mt-1 text-2xl sm:text-3xl font-extrabold font-display tracking-tight tabular-nums ${card.color}`}>
                {card.count}
              </p>
            )}

            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Traffic Chart Panel */}
      <StatusPanel glow={false} className="p-6">
        <div className="flex items-center justify-between pb-3 border-b border-panel-edge">
          <div>
            <p className="system-heading text-sm font-bold text-white">Visitor Traffic & Leads — Last 7 Days</p>
            <p className="text-xs text-slate-400">Daily unique impressions and quote conversions</p>
          </div>
          <Link to="/admin/analytics" className="text-xs text-neon-blue font-semibold hover:underline">
            Full Analytics Details &rarr;
          </Link>
        </div>

        {analyticsState === 'loading' && <Skeleton className="mt-4 h-40 w-full" />}
        {analyticsState === 'error' && (
          <p className="mt-4 text-sm text-status-red">Traffic data could not be loaded.</p>
        )}
        {analyticsState === 'ready' && analytics && (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-abyss/40 border border-panel-edge">
                <p className="text-xs text-slate-400 font-mono">Page views</p>
                <p className="mt-1 text-2xl font-bold font-mono text-neon-blue">{analytics.total_views}</p>
              </div>
              <div className="p-3 rounded-lg bg-abyss/40 border border-panel-edge">
                <p className="text-xs text-slate-400 font-mono">Unique visitors</p>
                <p className="mt-1 text-2xl font-bold font-mono text-neon-blue">{analytics.total_visitors}</p>
              </div>
              <div className="p-3 rounded-lg bg-abyss/40 border border-panel-edge">
                <p className="text-xs text-slate-400 font-mono">Quote conversions</p>
                <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                  {analytics.quotes_trend.reduce((sum, d) => sum + d.count, 0)}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <AnalyticsChart data={analytics.series} />
            </div>
          </>
        )}
      </StatusPanel>
    </div>
  )
}

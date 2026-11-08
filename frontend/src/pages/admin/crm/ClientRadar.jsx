import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCrmLead } from '../../../api/client'
import {
  fetchHNHiringOpportunities,
  fetchRemoteJobs,
  FREELANCE_MARKET_SCANNERS,
} from '../../../api/radarClient'
import SearchInput from '../../../components/admin/SearchInput'
import { useToast } from '../../../components/admin/toastStore'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'
import { Skeleton } from '../../../components/Skeleton'

const TABS = [
  { key: 'hn', label: '🔥 Hacker News Founders', desc: 'Direct startup founder hiring posts with verified contact emails' },
  { key: 'remote', label: '💼 Remote Mobile Gigs', desc: 'Live mobile & engineering roles from Jobicy and RemoteOK' },
  { key: 'scanners', label: '⚡ Freelance Market Scanners', desc: 'Curated 1-click live search scanners for Upwork, Contra & Wellfound' },
]

const FILTER_PILLS = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'flutter', label: 'Flutter & FlutterFlow' },
  { id: 'mobile', label: 'Mobile (iOS / Android)' },
  { id: 'supabase', label: 'Supabase & Backend' },
  { id: 'contract', label: 'Contract / Freelance' },
]

export default function ClientRadar() {
  const [activeTab, setActiveTab] = useState('hn')
  const [search, setSearch] = useState('')
  const [filterPill, setFilterPill] = useState('all')

  const [hnItems, setHnItems] = useState([])
  const [remoteItems, setRemoteItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [importingId, setImportingId] = useState(null)
  const [importedMap, setConvertedMap] = useState({})

  const toast = useToast()

  useEffect(() => {
    document.title = 'Client Radar (Sales Leads) — Control Panel'
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'hn') {
        const query = filterPill === 'all' ? 'mobile' : filterPill
        const data = await fetchHNHiringOpportunities(query)
        setHnItems(data)
      } else if (activeTab === 'remote') {
        const tag = filterPill === 'all' ? 'mobile' : filterPill
        const data = await fetchRemoteJobs(tag)
        setRemoteItems(data)
      }
    } catch {
      toast.error('Failed to load opportunities. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, filterPill, toast])

  useEffect(() => {
    if (activeTab !== 'scanners') {
      loadData()
    }
  }, [activeTab, loadData])

  // Filter items by search query
  const filteredHn = useMemo(() => {
    if (!search.trim()) return hnItems
    const q = search.toLowerCase()
    return hnItems.filter(
      (item) =>
        item.company.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    )
  }, [hnItems, search])

  const filteredRemote = useMemo(() => {
    if (!search.trim()) return remoteItems
    const q = search.toLowerCase()
    return remoteItems.filter(
      (item) =>
        item.company.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    )
  }, [remoteItems, search])

  // 1-Click Import to CRM Pipeline
  const handleImportToCrm = async (item) => {
    setImportingId(item.id)
    try {
      const isHn = item.source === 'hacker_news'
      const payload = {
        name: `${item.company} Hiring Lead`,
        company: item.company,
        job_title: item.title,
        email: item.email || '',
        company_website: item.website || '',
        stage: 'lead',
        temperature: item.isFounderDirect ? 'hot' : 'warm',
        source: isHn ? 'cold_outreach' : 'website_inbound',
        deal_value: 0,
        notes: `[Radar Ingestion: ${item.sourceLabel}]\nPost URL: ${item.url}\nLocation: ${item.location}\nType: ${item.type}\n\nProject Scope / Overview:\n${item.fullText}`,
        tech_stack: ['Flutter', 'Mobile', 'Supabase'],
      }

      const created = await createCrmLead(payload)
      setConvertedMap((prev) => ({ ...prev, [item.id]: created.id }))
      toast.success(`Imported "${item.company}" directly into CRM Pipeline!`)
    } catch (err) {
      toast.error('Failed to import lead: ' + (err.message || 'Unknown error'))
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-panel-edge">
        <div>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span className="text-slate-600 font-mono">/</span>
            <Link to="/admin/crm" className="hover:text-white transition-colors">Sales &amp; CRM</Link>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-slate-200">Client Radar</span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-blue/15 text-neon-blue text-lg">
              📡
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-white sm:text-3xl">
              Live Client Radar
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time client leads &amp; mobile hiring opportunities aggregated from Hacker News, RemoteOK, and freelance platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/crm"
            className="px-3.5 py-1.5 rounded-lg border border-panel-edge bg-abyss text-slate-300 hover:text-white hover:border-slate-400 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>💼</span> View Pipeline
          </Link>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-neon-blue/15 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/25 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <span>🔄</span> {loading ? 'Scanning...' : 'Refresh Feeds'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-neon-blue bg-neon-blue/10 shadow-lg shadow-neon-blue/5'
                  : 'border-panel-edge bg-panel/60 hover:bg-panel/90 text-slate-400'
              }`}
            >
              <p className={`text-sm font-bold font-display ${isActive ? 'text-white' : 'text-slate-200'}`}>
                {tab.label}
              </p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">{tab.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Search & Stack Filter Bar (for HN & Remote tabs) */}
      {activeTab !== 'scanners' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {FILTER_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilterPill(pill.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    filterPill === pill.id
                      ? 'bg-neon-blue text-abyss font-bold shadow-md shadow-neon-blue/20'
                      : 'bg-panel-edge/40 text-slate-400 hover:bg-panel-edge hover:text-white border border-panel-edge'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Keyword Search */}
            <div className="w-full md:w-80">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Filter by company, keyword, or tech..."
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 1: Hacker News Founders -------------------- */}
      {activeTab === 'hn' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Displaying <strong className="text-white">{filteredHn.length}</strong> founder hiring opportunities from Hacker News
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Direct Founder Posts
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-xl border border-panel-edge bg-panel/40 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : filteredHn.length === 0 ? (
            <StatusPanel className="p-12 text-center">
              <p className="text-base font-bold text-white mb-1">No opportunities found for this query</p>
              <p className="text-xs text-slate-400">Try switching filter tags or clicking "Refresh Feeds".</p>
            </StatusPanel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredHn.map((item) => {
                const isImported = Boolean(importedMap[item.id])
                const isImporting = importingId === item.id

                return (
                  <div
                    key={item.id}
                    className="relative flex flex-col justify-between rounded-xl border border-panel-edge bg-panel/75 p-5 transition-all hover:border-panel-edge/80 hover:bg-panel/95 shadow-sm"
                  >
                    <div>
                      {/* Top Meta Line */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold font-display text-white tracking-tight">
                              {item.company}
                            </h3>
                            {item.isFounderDirect && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Direct Email
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-neon-blue mt-0.5">{item.title}</p>
                        </div>

                        <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Location & Tags */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                          📍 {item.location}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                          ⏱️ {item.type}
                        </span>
                      </div>

                      {/* Snippet */}
                      <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-4">
                        {item.description}
                      </p>

                      {/* Detected Email */}
                      {item.email && (
                        <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 font-mono font-medium truncate">
                            ✉️ {item.email}
                          </span>
                          <a
                            href={`mailto:${item.email}?subject=Flutter & Mobile App Development Support — Jerry Dev Studio`}
                            className="text-emerald-400 hover:underline font-semibold ml-2 whitespace-nowrap"
                          >
                            Send Email &rarr;
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-5 pt-3.5 border-t border-panel-edge flex items-center justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>View thread</span>
                        <span>&nearr;</span>
                      </a>

                      <div>
                        {isImported ? (
                          <Link
                            to="/admin/crm"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                          >
                            <span>✓ In Pipeline</span>
                            <span>&rarr;</span>
                          </Link>
                        ) : (
                          <SystemButton
                            size="sm"
                            variant="primary"
                            disabled={isImporting}
                            onClick={() => handleImportToCrm(item)}
                          >
                            {isImporting ? 'Importing...' : '+ Add to CRM'}
                          </SystemButton>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 2: Remote Mobile Gigs -------------------- */}
      {activeTab === 'remote' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Displaying <strong className="text-white">{filteredRemote.length}</strong> live remote listings
            </span>
            <span className="text-neon-blue font-semibold">Jobicy &amp; RemoteOK Feeds</span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-xl border border-panel-edge bg-panel/40 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : filteredRemote.length === 0 ? (
            <StatusPanel className="p-12 text-center">
              <p className="text-base font-bold text-white mb-1">No remote roles found</p>
              <p className="text-xs text-slate-400">Try clearing search or refreshing the feeds.</p>
            </StatusPanel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRemote.map((item) => {
                const isImported = Boolean(importedMap[item.id])
                const isImporting = importingId === item.id

                return (
                  <div
                    key={item.id}
                    className="relative flex flex-col justify-between rounded-xl border border-panel-edge bg-panel/75 p-5 transition-all hover:border-panel-edge/80 hover:bg-panel/95 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold font-display text-white tracking-tight">
                              {item.company}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neon-blue/15 text-neon-blue border border-neon-blue/30">
                              {item.sourceLabel}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 mt-0.5">{item.title}</p>
                        </div>

                        <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                          📍 {item.location}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                          💼 {item.type}
                        </span>
                        {item.salary && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                            💰 {item.salary}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-panel-edge flex items-center justify-between gap-2">
                      <a
                        href={item.applyUrl || item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>Apply / Details</span>
                        <span>&nearr;</span>
                      </a>

                      <div>
                        {isImported ? (
                          <Link
                            to="/admin/crm"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                          >
                            <span>✓ In Pipeline</span>
                            <span>&rarr;</span>
                          </Link>
                        ) : (
                          <SystemButton
                            size="sm"
                            variant="primary"
                            disabled={isImporting}
                            onClick={() => handleImportToCrm(item)}
                          >
                            {isImporting ? 'Importing...' : '+ Add to CRM'}
                          </SystemButton>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 3: Curated Freelance Market Scanners -------------------- */}
      {activeTab === 'scanners' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white">
              Targeted Freelance Project Scanners
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct, pre-filtered live searches for clients specifically requesting FlutterFlow, Flutter, and Supabase assistance.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FREELANCE_MARKET_SCANNERS.map((scanner) => (
              <div
                key={scanner.name}
                className="flex flex-col justify-between rounded-xl border border-panel-edge bg-panel/70 p-5 hover:border-neon-blue/50 hover:bg-panel/90 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-neon-indigo/20 text-neon-indigo border border-neon-indigo/30">
                      {scanner.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300">
                      {scanner.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-display text-white mt-3">
                    {scanner.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {scanner.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-panel-edge">
                  <a
                    href={scanner.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neon-blue/15 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/25 text-xs font-semibold transition-all"
                  >
                    <span>Launch Live Scanner</span>
                    <span>&nearr;</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

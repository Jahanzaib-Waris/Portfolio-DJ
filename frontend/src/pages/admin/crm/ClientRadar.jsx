import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildMailto, buildPitch } from '../../../utils/pitch'
import { enrichCompanyDecisionMaker } from '../../../api/apolloClient'
import {
  createCrmLead,
  getCrmLeads,
  getRadarItems,
  runRadarIngest,
  updateRadarItem,
} from '../../../api/client'
import {
  fetchHNHiringOpportunities,
  fetchRemoteJobs,
  FREELANCE_MARKET_SCANNERS,
} from '../../../api/radarClient'
import {
  computeOpportunityScore,
  detectTechStack,
  formatTimeAgo,
  matchesFreshnessWindow,
} from '../../../api/radarScoring'
import SearchInput from '../../../components/admin/SearchInput'
import { useToast } from '../../../components/admin/toastStore'
import { Skeleton } from '../../../components/Skeleton'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'
import LeadDetailDrawer from './LeadDetailDrawer'
import RescueScanner from './RescueScanner'

const TABS = [
  { key: 'hn', label: 'Hacker News Founders', desc: 'Direct startup founder hiring posts with verified contact emails' },
  { key: 'remote', label: 'Remote Mobile Gigs', desc: 'Live mobile & engineering roles from Jobicy and RemoteOK' },
  { key: 'rescue', label: 'App Rescue Scanner', desc: 'App Store apps with low ratings or no recent updates, ranked as rescue leads (prototype)' },
  { key: 'scanners', label: 'Search Links', desc: 'One-click searches on Upwork, Contra, Wellfound, Reddit and the FlutterFlow forum' },
]

const FILTER_PILLS = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'flutter', label: 'Flutter & FlutterFlow' },
  { id: 'mobile', label: 'Mobile (iOS / Android)' },
  { id: 'supabase', label: 'Supabase & Backend' },
  { id: 'contract', label: 'Contract / Freelance' },
]

const FRESHNESS_PILLS = [
  { id: 'all', label: 'All Freshness' },
  { id: '24h', label: 'Last 24 Hours' },
  { id: '3d', label: 'Last 3 Days' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '14d', label: 'Active (< 14 Days)' },
]

const SORT_OPTIONS = [
  { id: 'score', label: 'Highest Opportunity Score (Default)' },
  { id: 'newest', label: 'Freshness (Newest First)' },
  { id: 'email', label: 'Direct Email First' },
  { id: 'alpha', label: 'Company Name (A-Z)' },
]

const POST_URL_RE = /Post URL: (\S+)/

const DISMISSED_KEY = 'radar_dismissed_v1'

const loadDismissed = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

const itemKey = (item) => item.url || item.id

// Stack pills are applied client-side when results come from the stored radar_items table.
const PILL_PATTERNS = {
  flutter: /flutter/i,
  mobile: /mobile|\bios\b|android|react[\s-]?native/i,
  supabase: /supabase|firebase|backend/i,
}

const matchesPill = (item, pill) => {
  if (pill === 'all') return true
  if (pill === 'contract') return item.opportunity.engagement.fit === 'fit'
  const rx = PILL_PATTERNS[pill]
  if (!rx) return true
  return rx.test(`${item.title} ${item.description} ${item.fullText}`)
}

// source_url may not exist yet on crm_leads (supabase/radar.sql not run); retry without it.
const createRadarLead = async (item) => {
  const payload = buildRadarLeadPayload(item)
  try {
    return await createCrmLead({ ...payload, source_url: item.url })
  } catch (err) {
    if (/source_url/i.test(err?.message || '')) return createCrmLead(payload)
    throw err
  }
}

const FIT_STYLES = {
  fit: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  unclear: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
  not_fit: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
}

const radarSource = (item) => {
  if (item.source === 'hacker_news') return 'hacker_news'
  if (item.source === 'app_store') return 'other'
  return 'job_board'
}

// Ready-to-send draft for a radar post (mailto link), tailored to the post.
const draftMailto = (item) => {
  const lead = buildRadarLeadPayload(item)
  const angle = item.source === 'app_store' ? 'rescue' : 'mvp'
  return buildMailto(item.email, buildPitch({ lead, angle, tone: 'senior', techStack: lead.tech_stack.join(', ') }))
}

// The contact's real name is unknown unless Apollo found a person.
const radarContactName = (item) => {
  if (item.decisionMaker) return item.decisionMaker.split(' (')[0]
  if (item.source === 'app_store') return `${item.company} (app publisher)`
  return `${item.company} (hiring contact)`
}

const buildRadarLeadPayload = (item) => ({
  name: radarContactName(item),
  company: item.company,
  job_title: item.title,
  email: item.email || '',
  linkedin_url: item.linkedin || '',
  company_website: item.website || '',
  stage: 'lead',
  temperature: item.isFounderDirect || item.decisionMaker ? 'hot' : 'warm',
  source: radarSource(item),
  deal_value: 0,
  currency: 'USD',
  notes: `[Radar Ingestion: ${item.sourceLabel}]\nPost URL: ${item.url}\nLocation: ${item.location}\nType: ${item.type}${item.decisionMaker ? `\nVerified Executive: ${item.decisionMaker}` : ''}\n\nProject Scope / Overview:\n${item.fullText}`,
  tech_stack: detectTechStack(item),
})

export default function ClientRadar() {
  const [activeTab, setActiveTab] = useState('hn')
  const [search, setSearch] = useState('')
  const [filterPill, setFilterPill] = useState('all')
  const [freshnessFilter, setFreshnessFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [expandedScoreId, setExpandedScoreId] = useState(null)

  const [hnItems, setHnItems] = useState([])
  const [remoteItems, setRemoteItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [rescueItems, setRescueItems] = useState([])
  // 'db' = results come from the radar_items table filled by the radar-ingest function;
  // 'live' = fetched in the browser (fallback until that table / function is set up).
  const [storeMode, setStoreMode] = useState('live')
  const [storedItems, setStoredItems] = useState([])
  const storeModeRef = useRef('unknown')
  const filterPillRef = useRef('all')

  const [importingId, setImportingId] = useState(null)
  const [importedMap, setConvertedMap] = useState({})
  const [importedLeads, setImportedLeads] = useState({})
  const [existingByUrl, setExistingByUrl] = useState({})
  const [hideNotFit, setHideNotFit] = useState(true)
  const [showDismissed, setShowDismissed] = useState(false)
  const [dismissed, setDismissed] = useState(loadDismissed)
  const [drawerLead, setDrawerLead] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toast = useToast()

  useEffect(() => {
    filterPillRef.current = filterPill
  }, [filterPill])

  useEffect(() => {
    document.title = 'Client Radar (Sales Leads) — Control Panel'
  }, [])

  // Remember which radar posts are already in the CRM (matched by the post URL
  // saved in the lead's notes), so a reload can't import the same post twice.
  useEffect(() => {
    let cancelled = false
    getCrmLeads()
      .then(({ items }) => {
        if (cancelled) return
        const byUrl = {}
        items.forEach((lead) => {
          const match = POST_URL_RE.exec(lead.notes || '')
          if (match) byUrl[match[1]] = lead
          if (lead.source_url) byUrl[lead.source_url] = lead
        })
        setExistingByUrl(byUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const hnList = useMemo(
    () => (storeMode === 'db' ? storedItems.filter((i) => i.source === 'hacker_news') : hnItems),
    [storeMode, storedItems, hnItems],
  )
  const remoteList = useMemo(
    () => (storeMode === 'db' ? storedItems.filter((i) => i.source !== 'hacker_news') : remoteItems),
    [storeMode, storedItems, remoteItems],
  )

  useEffect(() => {
    const all = [...hnList, ...remoteList, ...rescueItems]
    const newlyMatched = all.filter((item) => item.url && existingByUrl[item.url])
    if (newlyMatched.length === 0) return
    setConvertedMap((prev) => {
      const next = { ...prev }
      newlyMatched.forEach((item) => {
        if (!next[item.id]) next[item.id] = existingByUrl[item.url].id
      })
      return next
    })
    setImportedLeads((prev) => {
      const next = { ...prev }
      newlyMatched.forEach((item) => {
        if (!next[item.id]) next[item.id] = existingByUrl[item.url]
      })
      return next
    })
  }, [hnList, remoteList, rescueItems, existingByUrl])

  const isFeedTab = activeTab === 'hn' || activeTab === 'remote'

  const loadLive = useCallback(async () => {
    const pill = filterPillRef.current
    if (activeTab === 'hn') {
      const data = await fetchHNHiringOpportunities(pill === 'all' ? 'mobile' : pill)
      setHnItems(data)
    } else if (activeTab === 'remote') {
      const data = await fetchRemoteJobs(pill === 'all' ? 'mobile' : pill)
      setRemoteItems(data)
    }
  }, [activeTab])

  // Loads from the stored radar_items table when it exists and has rows (optionally
  // running the ingest function first); otherwise falls back to fetching live.
  const loadData = useCallback(
    async ({ ingest = false } = {}) => {
      setLoading(true)
      try {
        if (ingest && storeModeRef.current === 'db') {
          try {
            const result = await runRadarIngest()
            toast.success(`Fetched ${result?.fetched ?? 0} posts (${result?.new ?? 0} new).`)
          } catch (err) {
            toast.error(`Server refresh failed (${err.message || 'unknown error'}); showing stored posts.`)
          }
        }

        if (storeModeRef.current !== 'live') {
          try {
            const rows = await getRadarItems()
            if (rows.length > 0) {
              setStoredItems(rows)
              storeModeRef.current = 'db'
              setStoreMode('db')
              return
            }
          } catch {
            // radar_items not created yet; use live fetching
          }
          storeModeRef.current = 'live'
          setStoreMode('live')
        }

        if (isFeedTab) await loadLive()
      } catch {
        toast.error('Failed to load opportunities. Try refreshing.')
      } finally {
        setLoading(false)
      }
    },
    [isFeedTab, loadLive, toast],
  )

  useEffect(() => {
    if (isFeedTab) {
      loadData()
    }
  }, [isFeedTab, activeTab, loadData])

  // Stack pills re-query the live sources; stored results are filtered locally instead.
  const pillMounted = useRef(false)
  useEffect(() => {
    if (!pillMounted.current) {
      pillMounted.current = true
      return
    }
    if (storeModeRef.current === 'live' && isFeedTab) {
      setLoading(true)
      loadLive()
        .catch(() => toast.error('Failed to load opportunities. Try refreshing.'))
        .finally(() => setLoading(false))
    }
  }, [filterPill, isFeedTab, loadLive, toast])

  const setDismissedPersist = (updater) => {
    setDismissed((prev) => {
      const next = updater(new Set(prev))
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]))
      } catch {
        // storage unavailable; dismissal lasts for this session only
      }
      return next
    })
  }
  const isDismissed = useCallback(
    (item) => item.status === 'dismissed' || dismissed.has(itemKey(item)),
    [dismissed],
  )

  const setStatus = async (item, status) => {
    if (item.dbId) {
      setStoredItems((prev) => prev.map((i) => (i.dbId === item.dbId ? { ...i, status } : i)))
      try {
        await updateRadarItem(item.dbId, { status })
      } catch {
        setStoredItems((prev) => prev.map((i) => (i.dbId === item.dbId ? { ...i, status: item.status } : i)))
        toast.error('Could not update that post. Try again.')
      }
      return
    }
    setDismissedPersist((set) => {
      if (status === 'dismissed') set.add(itemKey(item))
      else set.delete(itemKey(item))
      return set
    })
  }
  const dismissItem = (item) => setStatus(item, 'dismissed')
  const restoreItem = (item) => {
    // A locally dismissed copy of a stored item also lives in the browser set; clear both.
    if (dismissed.has(itemKey(item))) {
      setDismissedPersist((set) => {
        set.delete(itemKey(item))
        return set
      })
    }
    if (item.dbId) return setStatus(item, 'new')
    return undefined
  }

  const dismissedCount = useMemo(
    () => [...hnList, ...remoteList].filter(isDismissed).length,
    [hnList, remoteList, isDismissed],
  )
  const lastUpdated = useMemo(() => {
    if (storeMode !== 'db' || storedItems.length === 0) return null
    return storedItems.reduce((max, i) => (i.lastSeenAt > max ? i.lastSeenAt : max), '')
  }, [storeMode, storedItems])

  // Applies the engagement-fit and dismissed visibility rules to a scored list.
  const applyVisibility = useCallback(
    (list) =>
      list.filter((item) => {
        if (!showDismissed && isDismissed(item)) return false
        if (hideNotFit && item.opportunity.engagement.fit === 'not_fit') return false
        if (storeMode === 'db' && !matchesPill(item, filterPill)) return false
        return true
      }),
    [hideNotFit, showDismissed, isDismissed, storeMode, filterPill],
  )

  // Score and filter HN leads
  const scoredHn = useMemo(() => {
    return hnList.map((item) => ({
      ...item,
      opportunity: computeOpportunityScore(item),
    }))
  }, [hnList])

  const filteredHn = useMemo(() => {
    let list = applyVisibility(scoredHn)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (item) =>
          item.company.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      )
    }

    if (freshnessFilter !== 'all') {
      list = list.filter((item) => matchesFreshnessWindow(item.date, freshnessFilter))
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'score') {
        return b.opportunity.score - a.opportunity.score
      }
      if (sortBy === 'newest') {
        return new Date(b.date || 0) - new Date(a.date || 0)
      }
      if (sortBy === 'email') {
        const aHas = Boolean(a.email)
        const bHas = Boolean(b.email)
        if (aHas !== bHas) return bHas ? 1 : -1
        return b.opportunity.score - a.opportunity.score
      }
      if (sortBy === 'alpha') {
        return a.company.localeCompare(b.company)
      }
      return 0
    })
  }, [scoredHn, search, freshnessFilter, sortBy, applyVisibility])

  // Score and filter Remote leads
  const scoredRemote = useMemo(() => {
    return remoteList.map((item) => ({
      ...item,
      opportunity: computeOpportunityScore(item),
    }))
  }, [remoteList])

  const filteredRemote = useMemo(() => {
    let list = applyVisibility(scoredRemote)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (item) =>
          item.company.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      )
    }

    if (freshnessFilter !== 'all') {
      list = list.filter((item) => matchesFreshnessWindow(item.date, freshnessFilter))
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'score') {
        return b.opportunity.score - a.opportunity.score
      }
      if (sortBy === 'newest') {
        return new Date(b.date || 0) - new Date(a.date || 0)
      }
      if (sortBy === 'email') {
        const aHas = Boolean(a.email)
        const bHas = Boolean(b.email)
        if (aHas !== bHas) return bHas ? 1 : -1
        return b.opportunity.score - a.opportunity.score
      }
      if (sortBy === 'alpha') {
        return a.company.localeCompare(b.company)
      }
      return 0
    })
  }, [scoredRemote, search, freshnessFilter, sortBy, applyVisibility])

  // 1-Click Apollo Enrichment for Radar Leads
  const [enrichingRadarId, setEnrichingRadarId] = useState(null)

  const handleRadarEnrich = async (item) => {
    setEnrichingRadarId(item.id)
    try {
      const contact = await enrichCompanyDecisionMaker({
        domain: item.website,
        company: item.company,
      })

      const updateList = (prevList) =>
        prevList.map((it) => {
          if (it.id !== item.id) return it
          return {
            ...it,
            email: contact.email || it.email,
            decisionMaker: `${contact.name} (${contact.job_title})`,
            linkedin: contact.linkedin_url || it.linkedin,
          }
        })

      setHnItems(updateList)
      setRemoteItems(updateList)
      setStoredItems(updateList)

      toast.success(
        `Found ${contact.name} (${contact.job_title}) ${contact.email ? `• ${contact.email}` : ''}!`
      )
    } catch (err) {
      toast.error(err.message || 'Apollo enrichment failed.')
    } finally {
      setEnrichingRadarId(null)
    }
  }

  // 1-Click Import to CRM Pipeline
  const handleImportToCrm = async (item) => {
    if (item.url && existingByUrl[item.url]) {
      toast.info(`"${item.company}" is already in your CRM.`)
      return
    }
    setImportingId(item.id)
    try {
      const created = await createRadarLead(item)
      setConvertedMap((prev) => ({ ...prev, [item.id]: created.id }))
      setImportedLeads((prev) => ({ ...prev, [item.id]: created }))
      if (item.url) setExistingByUrl((prev) => ({ ...prev, [item.url]: created }))
      if (item.dbId) {
        setStoredItems((prev) =>
          prev.map((i) => (i.dbId === item.dbId ? { ...i, status: 'imported', leadId: created.id } : i)),
        )
        updateRadarItem(item.dbId, { status: 'imported', lead_id: created.id }).catch(() => {})
      }
      toast.success(`Imported "${item.company}". Click "Open Pitch" to review the pitch and reach out.`)
    } catch (err) {
      toast.error('Failed to import lead: ' + (err.message || 'Unknown error'))
    } finally {
      setImportingId(null)
    }
  }

  // Open Lead Drawer directly from Radar card
  const handleOpenLeadDrawer = (item) => {
    const lead = importedLeads[item.id] || {
      id: importedMap[item.id],
      ...buildRadarLeadPayload(item),
    }
    setDrawerLead(lead)
    setDrawerOpen(true)
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
                        <h1 className="text-2xl font-bold font-display tracking-tight text-white sm:text-3xl">
              Live Client Radar
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Client leads &amp; mobile hiring opportunities aggregated from Hacker News, Jobicy, RemoteOK, and freelance platforms.
            {lastUpdated ? (
              <span className="ml-1 text-slate-300">Stored results, last fetched {formatTimeAgo(lastUpdated)}.</span>
            ) : (
              <span className="ml-1 text-slate-300">Live results fetched in your browser.</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/admin/crm"
            className="px-3.5 py-1.5 rounded-lg border border-panel-edge bg-abyss text-slate-300 hover:text-white hover:border-slate-400 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
             View Pipeline
          </Link>
          <button
            type="button"
            onClick={() => loadData({ ingest: true })}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-neon-blue/15 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/25 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
             {loading ? 'Scanning...' : 'Refresh Feeds'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
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

      {/* Search, Freshness & Stack Filter Bar (for HN & Remote tabs) */}
      {isFeedTab && (
        <div className="space-y-3 sm:space-y-3.5 p-3.5 sm:p-4 rounded-xl bg-panel/40 border border-panel-edge">
          {/* Row 1: Primary Tech Stack & Keyword Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono text-slate-400 mr-1 hidden sm:inline">Stack:</span>
              {FILTER_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilterPill(pill.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
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
            <div className="w-full md:w-72">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Filter by company, keyword, or tech..."
              />
            </div>
          </div>

          {/* Row 2: Freshness Window & Opportunity Sorting */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-panel-edge/60 text-xs">
            {/* Freshness Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono text-slate-400 mr-1 hidden sm:inline">Freshness:</span>
              {FRESHNESS_PILLS.map((fp) => (
                <button
                  key={fp.id}
                  type="button"
                  onClick={() => setFreshnessFilter(fp.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    freshnessFilter === fp.id
                      ? 'bg-neon-indigo/25 text-neon-indigo border border-neon-indigo/50 font-semibold shadow-sm'
                      : 'bg-abyss/40 text-slate-400 hover:text-slate-200 border border-panel-edge/60'
                  }`}
                >
                  {fp.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <label htmlFor="radar-sort" className="text-xs font-mono text-slate-400 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="radar-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-abyss border border-panel-edge rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-neon-blue font-medium cursor-pointer flex-1 sm:flex-initial"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-panel text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Engagement fit & dismissed */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2.5 border-t border-panel-edge/60 text-xs text-slate-300">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideNotFit}
                onChange={(e) => setHideNotFit(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#6D5AF6]"
              />
              Hide full-time / employment roles
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDismissed}
                onChange={(e) => setShowDismissed(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#6D5AF6]"
              />
              Show dismissed ({dismissedCount})
            </label>
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
                const opp = item.opportunity || {}
                const isTopOpportunity = opp.score >= 85
                const isStale = opp.isStale
                const isExpanded = expandedScoreId === item.id

                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col justify-between rounded-xl border p-3.5 sm:p-5 transition-all shadow-sm ${
                      isTopOpportunity
                        ? 'border-emerald-500/50 bg-panel/90 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/25'
                        : opp.score >= 70
                        ? 'border-neon-blue/40 bg-panel/85 hover:border-neon-blue/60'
                        : isStale
                        ? 'border-panel-edge/60 bg-panel/40 opacity-80'
                        : 'border-panel-edge bg-panel/75 hover:border-panel-edge/80 hover:bg-panel/95'
                    }`}
                  >
                    <div>
                      {/* Top Meta Line */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold font-display text-white tracking-tight truncate">
                              {item.company}
                            </h3>
                            {item.isFounderDirect && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                Direct Email
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-neon-blue mt-0.5 line-clamp-1">{item.title}</p>
                        </div>

                        {/* Opportunity Score & Freshness Badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedScoreId(isExpanded ? null : item.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${opp.badgeColor}`}
                            title="Click to view/hide AI score breakdown"
                          >
                            <span>{opp.score} pts</span>
                            <span className="text-xs font-sans opacity-85 hidden sm:inline">• {opp.tierLabel}</span>
                          </button>
                          <span className={`text-xs font-mono flex items-center gap-1 ${
                            opp.freshnessStatus === 'urgent'
                              ? 'text-emerald-400 font-semibold'
                              : opp.freshnessStatus === 'fresh'
                              ? 'text-neon-blue'
                              : isStale
                              ? 'text-amber-400 font-medium'
                              : 'text-slate-400'
                          }`}>
                            <span>{isStale ? '⚠️' : ''}</span>
                            <span>{opp.freshnessLabel}</span>
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${FIT_STYLES[opp.engagement?.fit] || FIT_STYLES.unclear}`}
                            title="Whether the post looks like scoped contract work that leaves you free to serve other clients"
                          >
                            {opp.engagement?.label}
                          </span>
                          {isDismissed(item) ? (
                            <button
                              type="button"
                              onClick={() => restoreItem(item)}
                              className="text-xs text-neon-blue hover:underline cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => dismissItem(item)}
                              className="text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Score Breakdown Box */}
                      {isExpanded && (
                        <div className="mt-3 p-3 rounded-lg bg-abyss/85 border border-panel-edge text-xs space-y-1.5 font-mono animate-fade-in">
                          <div className="flex items-center justify-between text-slate-300 pb-1.5 border-b border-panel-edge/60">
                            <span className="font-bold text-white flex items-center gap-1.5">
                               Opportunity Score Breakdown
                            </span>
                            <span className="text-neon-blue font-bold">{opp.score} / 100 pts</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Freshness ({opp.freshnessLabel}):</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.freshness} / 30</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Reachability:</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.reachability} / 15</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Studio Tech Fit:</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.techMatch} / 25</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Engagement fit:</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.dealIntent} / 30</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stale Lead Warning */}
                      {isStale && (
                        <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                          <span>⚠️</span>
                          <span>Posted {opp.freshnessLabel}. Hiring founder may already have filled this position. Focus on 70+ point fresh leads!</span>
                        </div>
                      )}

                      {/* Location & Tags */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                           {item.location}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                           {item.type}
                        </span>
                      </div>

                      {/* Snippet */}
                      <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-4">
                        {item.description}
                      </p>

                      {/* Detected or Enriched Email */}
                      {item.email ? (
                        <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 font-mono font-medium truncate">
                             {item.email}
                          </span>
                          <a
                            href={draftMailto(item)}
                            className="text-emerald-400 hover:underline font-semibold ml-2 whitespace-nowrap"
                          >
                            Send Email →
                          </a>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 rounded-lg bg-abyss/60 border border-panel-edge flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-mono text-xs truncate">
                            No email in post
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRadarEnrich(item)}
                            disabled={enrichingRadarId === item.id}
                            className="text-neon-blue hover:text-white font-semibold ml-2 whitespace-nowrap flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {enrichingRadarId === item.id ? (
                              <>
                                <span className="h-2.5 w-2.5 animate-spin rounded-full border border-neon-blue border-t-transparent" />
                                Scanning Apollo...
                              </>
                            ) : (
                              <>
                                 Find Founder (Apollo)
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Verified Decision Maker Tag */}
                      {item.decisionMaker && (
                        <div className="mt-2 text-xs text-neon-blue font-mono flex items-center justify-between">
                          <span>Verified: <strong className="text-white">{item.decisionMaker}</strong></span>
                          {item.linkedin && (
                            <a
                              href={item.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#70B5F9] hover:underline"
                            >
                              LinkedIn ↗
                            </a>
                          )}
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
                        <span>View thread ↗</span>
                      </a>

                      <div>
                        {isImported ? (
                          <button
                            type="button"
                            onClick={() => handleOpenLeadDrawer(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm"
                            title="Open CRM Pitch & Detail Drawer"
                          >
                            <span>✓ In CRM</span>
                            <span>•</span>
                            <span className="text-neon-blue underline">Open Pitch</span>
                          </button>
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
                const opp = item.opportunity || {}
                const isTopOpportunity = opp.score >= 85
                const isStale = opp.isStale
                const isExpanded = expandedScoreId === item.id

                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col justify-between rounded-xl border p-3.5 sm:p-5 transition-all shadow-sm ${
                      isTopOpportunity
                        ? 'border-emerald-500/50 bg-panel/90 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/25'
                        : opp.score >= 70
                        ? 'border-neon-blue/40 bg-panel/85 hover:border-neon-blue/60'
                        : isStale
                        ? 'border-panel-edge/60 bg-panel/40 opacity-80'
                        : 'border-panel-edge bg-panel/75 hover:border-panel-edge/80 hover:bg-panel/95'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold font-display text-white tracking-tight truncate">
                              {item.company}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-neon-blue/15 text-neon-blue border border-neon-blue/30 shrink-0">
                              {item.sourceLabel}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">{item.title}</p>
                        </div>

                        {/* Opportunity Score & Freshness Badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedScoreId(isExpanded ? null : item.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${opp.badgeColor}`}
                            title="Click to view/hide AI score breakdown"
                          >
                            <span>{opp.score} pts</span>
                            <span className="text-xs font-sans opacity-85 hidden sm:inline">• {opp.tierLabel}</span>
                          </button>
                          <span className={`text-xs font-mono flex items-center gap-1 ${
                            opp.freshnessStatus === 'urgent'
                              ? 'text-emerald-400 font-semibold'
                              : opp.freshnessStatus === 'fresh'
                              ? 'text-neon-blue'
                              : isStale
                              ? 'text-amber-400 font-medium'
                              : 'text-slate-400'
                          }`}>
                            <span>{isStale ? '⚠️' : ''}</span>
                            <span>{opp.freshnessLabel}</span>
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${FIT_STYLES[opp.engagement?.fit] || FIT_STYLES.unclear}`}
                            title="Whether the post looks like scoped contract work that leaves you free to serve other clients"
                          >
                            {opp.engagement?.label}
                          </span>
                          {isDismissed(item) ? (
                            <button
                              type="button"
                              onClick={() => restoreItem(item)}
                              className="text-xs text-neon-blue hover:underline cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => dismissItem(item)}
                              className="text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Score Breakdown Box */}
                      {isExpanded && (
                        <div className="mt-3 p-3 rounded-lg bg-abyss/85 border border-panel-edge text-xs space-y-1.5 font-mono animate-fade-in">
                          <div className="flex items-center justify-between text-slate-300 pb-1.5 border-b border-panel-edge/60">
                            <span className="font-bold text-white flex items-center gap-1.5">
                               Opportunity Score Breakdown
                            </span>
                            <span className="text-neon-blue font-bold">{opp.score} / 100 pts</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Freshness ({opp.freshnessLabel}):</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.freshness} / 30</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Reachability:</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.reachability} / 15</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Studio Tech Fit:</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.techMatch} / 25</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400"> Engagement fit:</span>
                              <span className="text-white font-semibold">+{opp.breakdown?.dealIntent} / 30</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stale Lead Warning */}
                      {isStale && (
                        <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                          <span>⚠️</span>
                          <span>Posted {opp.freshnessLabel}. Remote listings decay quickly. Focus on 70+ point fresh leads!</span>
                        </div>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                           {item.location}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-abyss border border-panel-edge text-slate-300">
                           {item.type}
                        </span>
                        {item.salary && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                             {item.salary}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>

                      {/* Detected or Enriched Email */}
                      {item.email ? (
                        <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 font-mono font-medium truncate">
                             {item.email}
                          </span>
                          <a
                            href={draftMailto(item)}
                            className="text-emerald-400 hover:underline font-semibold ml-2 whitespace-nowrap"
                          >
                            Send Email →
                          </a>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 rounded-lg bg-abyss/60 border border-panel-edge flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-mono text-xs truncate">
                            Direct email not listed
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRadarEnrich(item)}
                            disabled={enrichingRadarId === item.id}
                            className="text-neon-blue hover:text-white font-semibold ml-2 whitespace-nowrap flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {enrichingRadarId === item.id ? (
                              <>
                                <span className="h-2.5 w-2.5 animate-spin rounded-full border border-neon-blue border-t-transparent" />
                                Scanning Apollo...
                              </>
                            ) : (
                              <>
                                 Find Founder (Apollo)
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Verified Decision Maker Tag */}
                      {item.decisionMaker && (
                        <div className="mt-2 text-xs text-neon-blue font-mono flex items-center justify-between">
                          <span>Verified: <strong className="text-white">{item.decisionMaker}</strong></span>
                          {item.linkedin && (
                            <a
                              href={item.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#70B5F9] hover:underline"
                            >
                              LinkedIn ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-panel-edge flex items-center justify-between gap-2">
                      <a
                        href={item.applyUrl || item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>Apply / Details ↗</span>
                      </a>

                      <div>
                        {isImported ? (
                          <button
                            type="button"
                            onClick={() => handleOpenLeadDrawer(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm"
                            title="Open CRM Pitch & Detail Drawer"
                          >
                            <span>✓ In CRM</span>
                            <span>•</span>
                            <span className="text-neon-blue underline">Open Pitch</span>
                          </button>
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
      {activeTab === 'rescue' && (
        <RescueScanner
          items={rescueItems}
          setItems={setRescueItems}
          importedMap={importedMap}
          importingId={importingId}
          onImport={handleImportToCrm}
          onOpenPitch={handleOpenLeadDrawer}
        />
      )}

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
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-neon-indigo/20 text-neon-indigo border border-neon-indigo/30">
                      {scanner.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300">
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
                    <span>Launch Live Scanner ↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRM Lead Detail & AI Pitch Drawer */}
      {drawerLead && (
        <LeadDetailDrawer
          lead={drawerLead}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            setDrawerLead(null)
          }}
          onLeadUpdated={(updated) => setDrawerLead(updated)}
          onLeadDeleted={() => {
            setDrawerOpen(false)
            setDrawerLead(null)
          }}
        />
      )}
    </div>
  )
}

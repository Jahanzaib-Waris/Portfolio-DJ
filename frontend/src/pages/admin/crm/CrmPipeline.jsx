import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCrmLead, getCrmLeads, updateCrmLead } from '../../../api/client'
import SearchInput from '../../../components/admin/SearchInput'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'
import { SOURCES, STAGES, TEMPERATURES } from './crmConstants'
import LeadDetailDrawer from './LeadDetailDrawer'

export default function CrmPipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedTemperature, setSelectedTemperature] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')

  // Selected lead for detail drawer
  const [activeLead, setActiveLead] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // New Deal Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDealForm, setNewDealForm] = useState({
    name: '',
    company: '',
    job_title: '',
    email: '',
    phone: '',
    linkedin_url: '',
    stage: 'lead',
    temperature: 'hot',
    source: 'linkedin',
    deal_value: 2500,
    currency: 'USD',
    notes: '',
  })
  const [creatingDeal, setCreatingDeal] = useState(false)

  useEffect(() => {
    document.title = 'Sales Pipeline — Control Panel'
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCrmLeads()
      setLeads(res.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  // Filtered leads
  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    return leads.filter((item) => {
      if (selectedTemperature !== 'all' && item.temperature !== selectedTemperature) {
        return false
      }
      if (selectedSource !== 'all' && item.source !== selectedSource) {
        return false
      }
      if (!term) return true
      const matchName = (item.name || '').toLowerCase().includes(term)
      const matchCompany = (item.company || '').toLowerCase().includes(term)
      const matchTitle = (item.job_title || '').toLowerCase().includes(term)
      const matchNotes = (item.notes || '').toLowerCase().includes(term)
      const matchTech = Array.isArray(item.tech_stack)
        ? item.tech_stack.some((t) => t.toLowerCase().includes(term))
        : false
      return matchName || matchCompany || matchTitle || matchNotes || matchTech
    })
  }, [leads, search, selectedTemperature, selectedSource])

  // Summary Metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let totalPipeline = 0
    let activeDealsCount = 0
    let wonValue = 0
    let wonCount = 0
    let overdueCount = 0

    leads.forEach((l) => {
      const val = parseFloat(l.deal_value) || 0
      if (l.stage !== 'closed_lost') {
        totalPipeline += val
      }
      if (['lead', 'contacted', 'proposal', 'negotiation'].includes(l.stage)) {
        activeDealsCount += 1
      }
      if (l.stage === 'closed_won') {
        wonValue += val
        wonCount += 1
      }
      if (l.next_follow_up && l.next_follow_up.slice(0, 10) <= today && l.stage !== 'closed_won' && l.stage !== 'closed_lost') {
        overdueCount += 1
      }
    })

    return {
      totalPipeline,
      activeDealsCount,
      wonValue,
      wonCount,
      overdueCount,
    }
  }, [leads])

  // Quick stage move
  const handleQuickMove = async (e, lead, direction) => {
    e.stopPropagation()
    const stageKeys = STAGES.map((s) => s.key)
    const currentIndex = stageKeys.indexOf(lead.stage)
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= stageKeys.length) return

    const nextStage = stageKeys[nextIndex]
    try {
      const updated = await updateCrmLead(lead.id, { stage: nextStage })
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)))
      if (activeLead?.id === lead.id) {
        setActiveLead(updated)
      }
    } catch (err) {
      alert('Failed to move stage: ' + err.message)
    }
  }

  const handleOpenLead = (lead) => {
    setActiveLead(lead)
    setDrawerOpen(true)
  }

  const handleLeadUpdated = (updated) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setActiveLead(updated)
  }

  const handleLeadDeleted = (deletedId) => {
    setLeads((prev) => prev.filter((l) => l.id !== deletedId))
    if (activeLead?.id === deletedId) {
      setActiveLead(null)
      setDrawerOpen(false)
    }
  }

  // Create Deal Submit
  const handleCreateDeal = async (e) => {
    e.preventDefault()
    if (!newDealForm.name.trim()) return
    setCreatingDeal(true)
    try {
      const created = await createCrmLead({
        ...newDealForm,
        deal_value: parseFloat(newDealForm.deal_value) || 0,
        tech_stack: [],
      })
      setLeads((prev) => [created, ...prev])
      setShowAddModal(false)
      setNewDealForm({
        name: '',
        company: '',
        job_title: '',
        email: '',
        phone: '',
        linkedin_url: '',
        stage: 'lead',
        temperature: 'hot',
        source: 'linkedin',
        deal_value: 2500,
        currency: 'USD',
        notes: '',
      })
      handleOpenLead(created)
    } catch (err) {
      alert('Failed to create deal: ' + err.message)
    } finally {
      setCreatingDeal(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow system-heading text-xs text-neon-indigo">// Sales & CRM</p>
          <h1 className="mt-2 text-2xl text-white font-bold sm:text-3xl">Sales Pipeline & Deals</h1>
          <p className="mt-1 text-sm text-slate-400">
            Visual Kanban board and deal tracking for client acquisition, inbound quotes, and outreach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/crm/prospects"
            className="px-3.5 py-2 rounded-md border border-panel-edge text-slate-300 hover:text-white hover:bg-panel-edge/50 text-xs font-semibold transition-colors"
          >
            📋 Lead Prospector Table
          </Link>
          <SystemButton
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5"
          >
            <span>+ Add Deal / Lead</span>
          </SystemButton>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusPanel className="p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">Total Pipeline</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${metrics.totalPipeline.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active + Won opportunities</p>
        </StatusPanel>

        <StatusPanel className="p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">Active Deals</p>
          <p className="text-2xl font-bold text-neon-blue mt-1">
            {metrics.activeDealsCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">In discussion or proposal</p>
        </StatusPanel>

        <StatusPanel className="p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">Closed Won</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            ${metrics.wonValue.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-500/80 mt-1">{metrics.wonCount} deals won</p>
        </StatusPanel>

        <StatusPanel className={`p-4 ${metrics.overdueCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">Follow-Ups Due</p>
          <p className={`text-2xl font-bold mt-1 ${metrics.overdueCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {metrics.overdueCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Due today or overdue</p>
        </StatusPanel>
      </div>

      {/* Filters Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search deals by name, company, stack, notes..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Temperature filter */}
          <select
            value={selectedTemperature}
            onChange={(e) => setSelectedTemperature(e.target.value)}
            className="rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="all">All Temperatures</option>
            {TEMPERATURES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="all">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 p-4 rounded-md bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="mt-6 overflow-x-auto pb-4">
        <div className="min-w-[1100px] grid grid-cols-6 gap-3">
          {STAGES.map((stage, stageIdx) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.key)
            const stageTotal = stageLeads.reduce((acc, curr) => acc + (parseFloat(curr.deal_value) || 0), 0)

            return (
              <div
                key={stage.key}
                className="flex flex-col bg-panel/40 border border-panel-edge rounded-lg p-2.5 min-h-[550px]"
              >
                {/* Column Header */}
                <div className="pb-2.5 mb-2.5 border-b border-panel-edge/60 flex items-center justify-between">
                  <div>
                    <h3 className={`text-xs font-semibold ${stage.color}`}>{stage.label}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ${stageTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-abyss border border-panel-edge text-slate-400">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {loading && stageIdx === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">Loading pipeline...</p>
                  )}

                  {!loading && stageLeads.length === 0 && (
                    <div className="h-24 border border-dashed border-panel-edge/50 rounded flex items-center justify-center text-slate-600 text-xs">
                      No deals
                    </div>
                  )}

                  {stageLeads.map((lead) => {
                    const tempObj = TEMPERATURES.find((t) => t.key === lead.temperature)
                    const isFollowUpDue =
                      lead.next_follow_up &&
                      lead.next_follow_up.slice(0, 10) <= todayStr &&
                      stage.key !== 'closed_won' &&
                      stage.key !== 'closed_lost'

                    return (
                      <div
                        key={lead.id}
                        onClick={() => handleOpenLead(lead)}
                        className="p-3 bg-panel border border-panel-edge hover:border-neon-blue/60 rounded-md cursor-pointer transition-all shadow-sm hover:shadow-md group relative"
                      >
                        {/* Top row: Name & Temperature */}
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-neon-blue transition-colors truncate">
                            {lead.name}
                          </h4>
                          {tempObj && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded border shrink-0 ${tempObj.badge}`}
                            >
                              {tempObj.label}
                            </span>
                          )}
                        </div>

                        {/* Company / Job */}
                        {(lead.company || lead.job_title) && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {lead.job_title ? `${lead.job_title} ` : ''}
                            {lead.company ? `@ ${lead.company}` : ''}
                          </p>
                        )}

                        {/* Value & Source */}
                        <div className="mt-2 pt-2 border-t border-panel-edge/50 flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-emerald-400">
                            ${parseFloat(lead.deal_value || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                            {lead.source?.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Follow-up reminder indicator */}
                        {lead.next_follow_up && (
                          <div
                            className={`mt-2 flex items-center gap-1 text-[10px] font-mono ${
                              isFollowUpDue ? 'text-amber-400 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            <span>⏰ {isFollowUpDue ? 'Due: ' : 'Follow-up: '}</span>
                            <span>{lead.next_follow_up.slice(0, 10)}</span>
                          </div>
                        )}

                        {/* Quick Kanban Move Controls */}
                        <div className="mt-2.5 pt-2 border-t border-panel-edge/40 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={stageIdx === 0}
                            onClick={(e) => handleQuickMove(e, lead, 'prev')}
                            className="p-1 rounded bg-abyss hover:bg-panel-edge text-slate-400 hover:text-white disabled:opacity-20 text-[10px]"
                            title="Move back"
                          >
                            ←
                          </button>
                          <span className="text-[10px] text-slate-500">View details</span>
                          <button
                            type="button"
                            disabled={stageIdx === STAGES.length - 1}
                            onClick={(e) => handleQuickMove(e, lead, 'next')}
                            className="p-1 rounded bg-abyss hover:bg-panel-edge text-slate-400 hover:text-white disabled:opacity-20 text-[10px]"
                            title="Advance stage"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-panel border border-panel-edge rounded-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-panel-edge">
              <h3 className="text-lg font-bold text-white">Create New Lead / Deal</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newDealForm.name}
                    onChange={(e) => setNewDealForm({ ...newDealForm, name: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="e.g. Alex Morgan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Company</label>
                  <input
                    type="text"
                    value={newDealForm.company}
                    onChange={(e) => setNewDealForm({ ...newDealForm, company: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="e.g. Fintech Labs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newDealForm.job_title}
                    onChange={(e) => setNewDealForm({ ...newDealForm, job_title: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="e.g. VP of Product"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Email</label>
                  <input
                    type="email"
                    value={newDealForm.email}
                    onChange={(e) => setNewDealForm({ ...newDealForm, email: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="alex@fintechlabs.io"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={newDealForm.linkedin_url}
                    onChange={(e) => setNewDealForm({ ...newDealForm, linkedin_url: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="https://linkedin.com/in/alex"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Deal Value ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newDealForm.deal_value}
                    onChange={(e) => setNewDealForm({ ...newDealForm, deal_value: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Stage</label>
                  <select
                    value={newDealForm.stage}
                    onChange={(e) => setNewDealForm({ ...newDealForm, stage: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-2 py-1.5 text-xs text-slate-100 outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Temperature</label>
                  <select
                    value={newDealForm.temperature}
                    onChange={(e) => setNewDealForm({ ...newDealForm, temperature: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-2 py-1.5 text-xs text-slate-100 outline-none"
                  >
                    {TEMPERATURES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Source</label>
                  <select
                    value={newDealForm.source}
                    onChange={(e) => setNewDealForm({ ...newDealForm, source: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-2 py-1.5 text-xs text-slate-100 outline-none"
                  >
                    {SOURCES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">Initial Notes</label>
                <textarea
                  rows={3}
                  value={newDealForm.notes}
                  onChange={(e) => setNewDealForm({ ...newDealForm, notes: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                  placeholder="Client requirements, outreach context..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-panel-edge">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDeal}
                  className="px-4 py-2 rounded text-xs font-semibold bg-neon-blue text-abyss hover:bg-neon-blue/90 disabled:opacity-50"
                >
                  {creatingDeal ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Slide-Over Drawer */}
      <LeadDetailDrawer
        lead={activeLead}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
      />
    </div>
  )
}

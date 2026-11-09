import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCrmLead, getCrmLeads } from '../../../api/client'
import SearchInput from '../../../components/admin/SearchInput'
import SystemButton from '../../../components/SystemButton'
import { useToast } from '../../../components/admin/toastStore'
import { SOURCES, STAGES, TEMPERATURES } from './crmConstants'
import LeadDetailDrawer from './LeadDetailDrawer'

export default function CrmProspects() {
  const toast = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedTemperature, setSelectedTemperature] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')

  // Selected lead for detail drawer
  const [activeLead, setActiveLead] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Add Prospect Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProspect, setNewProspect] = useState({
    name: '',
    company: '',
    job_title: '',
    email: '',
    phone: '',
    linkedin_url: '',
    company_website: '',
    stage: 'lead',
    temperature: 'warm',
    source: 'linkedin',
    deal_value: 3000,
    currency: 'USD',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    document.title = 'Lead Prospector — Control Panel'
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCrmLeads()
      setLeads(res.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load prospects')
    } finally {
      setLoading(false)
    }
  }

  // Filtered
  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    return leads.filter((item) => {
      if (selectedTemperature !== 'all' && item.temperature !== selectedTemperature) {
        return false
      }
      if (selectedStage !== 'all' && item.stage !== selectedStage) {
        return false
      }
      if (selectedSource !== 'all' && item.source !== selectedSource) {
        return false
      }
      if (!term) return true
      const matchName = (item.name || '').toLowerCase().includes(term)
      const matchCompany = (item.company || '').toLowerCase().includes(term)
      const matchTitle = (item.job_title || '').toLowerCase().includes(term)
      const matchEmail = (item.email || '').toLowerCase().includes(term)
      const matchNotes = (item.notes || '').toLowerCase().includes(term)
      const matchTech = Array.isArray(item.tech_stack)
        ? item.tech_stack.some((t) => t.toLowerCase().includes(term))
        : false
      return matchName || matchCompany || matchTitle || matchEmail || matchNotes || matchTech
    })
  }, [leads, search, selectedTemperature, selectedStage, selectedSource])

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

  const handleCreateProspect = async (e) => {
    e.preventDefault()
    if (!newProspect.name.trim()) return
    setCreating(true)
    try {
      const created = await createCrmLead({
        ...newProspect,
        deal_value: parseFloat(newProspect.deal_value) || 0,
        tech_stack: [],
      })
      setLeads((prev) => [created, ...prev])
      setShowAddModal(false)
      setNewProspect({
        name: '',
        company: '',
        job_title: '',
        email: '',
        phone: '',
        linkedin_url: '',
        company_website: '',
        stage: 'lead',
        temperature: 'warm',
        source: 'linkedin',
        deal_value: 3000,
        currency: 'USD',
        notes: '',
      })
      toast.success(`Added target prospect "${newProspect.name}"`)
      handleOpenLead(created)
    } catch (err) {
      toast.error('Failed to add prospect: ' + (err.message || 'Unknown error'))
    } finally {
      setCreating(false)
    }
  }

  // Quick CSV Export
  const exportCsv = () => {
    const headers = ['Name', 'Company', 'Job Title', 'Email', 'Phone', 'LinkedIn', 'Stage', 'Temperature', 'Source', 'Value', 'Next Follow Up']
    const rows = filteredLeads.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.job_title || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.linkedin_url || '').replace(/"/g, '""')}"`,
      `"${l.stage || ''}"`,
      `"${l.temperature || ''}"`,
      `"${l.source || ''}"`,
      l.deal_value || 0,
      `"${l.next_follow_up || ''}"`,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.info('Exported filtered prospects to CSV.')
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="mt-2 text-2xl text-white font-bold sm:text-3xl">Lead Prospector</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sales Navigator-style account directory for managing outbound prospects, LinkedIn contacts, and pipeline targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={exportCsv}
            disabled={filteredLeads.length === 0}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md border border-panel-edge text-slate-300 hover:text-white hover:bg-panel-edge/50 text-xs font-semibold transition-colors disabled:opacity-40"
            title="Export filtered prospects to CSV"
          >
             Export CSV
          </button>
          <Link
            to="/admin/crm"
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md border border-panel-edge text-slate-300 hover:text-white hover:bg-panel-edge/50 text-xs font-semibold transition-colors"
          >
             Visual Kanban Pipeline
          </Link>
          <SystemButton
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5"
          >
            <span>+ Add Target Prospect</span>
          </SystemButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search prospects by name, company, email, role, stack..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Temperature */}
          <select
            value={selectedTemperature}
            onChange={(e) => setSelectedTemperature(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[120px] rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="all">All Temperatures</option>
            {TEMPERATURES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Stage */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[120px] rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Source */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[120px] rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-neon-blue"
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

      {/* Table view */}
      <div className="mt-6 overflow-hidden rounded-lg border border-panel-edge bg-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-abyss/60 border-b border-panel-edge text-slate-400 font-mono uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3 px-4">Prospect & Company</th>
                <th className="py-3 px-4">Title / Role</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Next Follow-Up</th>
                <th className="py-3 px-4 text-right">Quick Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-edge/60 text-slate-200">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading lead prospects...
                  </td>
                </tr>
              )}

              {!loading && filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No prospects match your search criteria.
                  </td>
                </tr>
              )}

              {filteredLeads.map((lead) => {
                const tempObj = TEMPERATURES.find((t) => t.key === lead.temperature)
                const stageObj = STAGES.find((s) => s.key === lead.stage)
                const isFollowUpDue =
                  lead.next_follow_up &&
                  lead.next_follow_up.slice(0, 10) <= todayStr &&
                  lead.stage !== 'closed_won' &&
                  lead.stage !== 'closed_lost'

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-abyss/40 transition-colors cursor-pointer group"
                    onClick={() => handleOpenLead(lead)}
                  >
                    {/* Prospect & Company */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                            {lead.name}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {lead.company && <span>{lead.company}</span>}
                            {lead.linkedin_url && (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#0A66C2] hover:text-[#70B5F9] transition-colors"
                                title="LinkedIn Profile"
                              >
                                 LinkedIn
                              </a>
                            )}
                            {lead.company_website && (
                              <a
                                href={lead.company_website.startsWith('http') ? lead.company_website : `https://${lead.company_website}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-neon-blue/80 hover:text-neon-blue transition-colors"
                                title="Company Website"
                              >
                                 Web
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {lead.job_title || <span className="text-slate-600">—</span>}
                    </td>

                    {/* Temperature */}
                    <td className="py-3.5 px-4">
                      {tempObj ? (
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${tempObj.badge}`}>
                          {tempObj.label}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-xs font-medium ${stageObj?.color || 'text-slate-400'}`}>
                        {stageObj?.label || lead.stage}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 text-slate-400 uppercase tracking-wider font-mono text-xs">
                      {lead.source?.replace('_', ' ')}
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      ${parseFloat(lead.deal_value || 0).toLocaleString()}
                    </td>

                    {/* Follow Up */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {lead.next_follow_up ? (
                        <span className={isFollowUpDue ? 'text-amber-400 font-semibold flex items-center gap-1' : 'text-slate-400'}>
                          {isFollowUpDue ? 'Due ' : ''}{lead.next_follow_up.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Quick Outreach */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}?subject=${encodeURIComponent('Quick question regarding engineering / software')}`}
                            className="p-1.5 rounded bg-abyss border border-panel-edge text-neon-blue hover:bg-panel-edge/80 transition-colors"
                            title="Send Email"
                          >
                            Email
                          </a>
                        )}
                        {lead.linkedin_url && (
                          <a
                            href={lead.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#70B5F9] hover:bg-[#0A66C2]/30 transition-colors"
                            title="Open LinkedIn"
                          >
                            LinkedIn
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenLead(lead)}
                          className="px-2 py-1 rounded bg-panel-edge/50 hover:bg-panel-edge text-slate-200 text-xs font-medium transition-colors"
                        >
                          View Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Prospect Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="relative w-full max-w-lg bg-panel border border-panel-edge rounded-lg shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-panel-edge">
              <h3 className="text-base sm:text-lg font-bold text-white">Add Target Prospect</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProspect} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newProspect.name}
                    onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Company</label>
                  <input
                    type="text"
                    value={newProspect.company}
                    onChange={(e) => setNewProspect({ ...newProspect, company: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="e.g. CloudScale Tech"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newProspect.job_title}
                    onChange={(e) => setNewProspect({ ...newProspect, job_title: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="e.g. CTO / Co-founder"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Email</label>
                  <input
                    type="email"
                    value={newProspect.email}
                    onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="sarah@cloudscale.io"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={newProspect.linkedin_url}
                    onChange={(e) => setNewProspect({ ...newProspect, linkedin_url: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="https://linkedin.com/in/sarah"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Company Website</label>
                  <input
                    type="text"
                    value={newProspect.company_website}
                    onChange={(e) => setNewProspect({ ...newProspect, company_website: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                    placeholder="https://cloudscale.io"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Est. Deal Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newProspect.deal_value}
                    onChange={(e) => setNewProspect({ ...newProspect, deal_value: e.target.value })}
                    className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">Temperature</label>
                  <select
                    value={newProspect.temperature}
                    onChange={(e) => setNewProspect({ ...newProspect, temperature: e.target.value })}
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
                    value={newProspect.source}
                    onChange={(e) => setNewProspect({ ...newProspect, source: e.target.value })}
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
                <label className="block text-xs text-slate-400 font-mono mb-1">Prospect Notes</label>
                <textarea
                  rows={3}
                  value={newProspect.notes}
                  onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
                  placeholder="Targeting notes, angle of outreach, tech stack..."
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
                  disabled={creating}
                  className="px-4 py-2 rounded text-xs font-semibold bg-neon-blue text-abyss hover:bg-neon-blue/90 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Add Prospect'}
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

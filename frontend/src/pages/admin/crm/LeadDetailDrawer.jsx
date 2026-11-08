import { useEffect, useState } from 'react'
import {
  addCrmActivity,
  deleteCrmActivity,
  deleteCrmLead,
  getCrmActivities,
  updateCrmLead,
} from '../../../api/client'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { SOURCES, STAGES, TEMPERATURES } from './crmConstants'

const ACTIVITY_TYPES = [
  { key: 'note', label: '📝 Note', icon: '📝' },
  { key: 'email', label: '✉️ Email Sent', icon: '✉️' },
  { key: 'call', label: '📞 Phone Call', icon: '📞' },
  { key: 'linkedin', label: '💼 LinkedIn InMail', icon: '💼' },
  { key: 'meeting', label: '🤝 Meeting Demo', icon: '🤝' },
]

export default function LeadDetailDrawer({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
}) {
  const [formData, setFormData] = useState(null)
  const [techStackInput, setTechStackInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Activities log
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [newActivityType, setNewActivityType] = useState('note')
  const [newActivityContent, setNewActivityContent] = useState('')
  const [addingActivity, setAddingActivity] = useState(false)

  // Delete lead state
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Quick pitch templates
  const [pitchTemplate, setPitchTemplate] = useState('intro')

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        deal_value: lead.deal_value || 0,
        currency: lead.currency || 'USD',
        notes: lead.notes || '',
        next_follow_up: lead.next_follow_up ? lead.next_follow_up.slice(0, 10) : '',
      })
      setTechStackInput(Array.isArray(lead.tech_stack) ? lead.tech_stack.join(', ') : '')
      setSaveSuccess(false)
      setSaveError(null)

      // Fetch activities
      setActivitiesLoading(true)
      getCrmActivities(lead.id)
        .then((data) => setActivities(data))
        .catch(() => setActivities([]))
        .finally(() => setActivitiesLoading(false))
    } else {
      setFormData(null)
      setActivities([])
    }
  }, [lead])

  if (!isOpen || !formData) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (overrideData = null) => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const dataToSave = overrideData || formData
      const techStackArray = techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        name: dataToSave.name,
        company: dataToSave.company,
        job_title: dataToSave.job_title,
        email: dataToSave.email,
        phone: dataToSave.phone,
        linkedin_url: dataToSave.linkedin_url,
        company_website: dataToSave.company_website,
        stage: dataToSave.stage,
        temperature: dataToSave.temperature,
        source: dataToSave.source,
        deal_value: parseFloat(dataToSave.deal_value) || 0,
        currency: dataToSave.currency || 'USD',
        tech_stack: techStackArray,
        notes: dataToSave.notes,
        next_follow_up: dataToSave.next_follow_up || null,
      }

      const updated = await updateCrmLead(lead.id, payload)
      setSaveSuccess(true)
      onLeadUpdated(updated)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setSaveError(err.message || 'Failed to update lead')
    } finally {
      setSaving(false)
    }
  }

  const handleStageChange = async (newStage) => {
    const updatedForm = { ...formData, stage: newStage }
    setFormData(updatedForm)
    await handleSave(updatedForm)
    // Automatically log activity for stage change
    try {
      const stageName = STAGES.find((s) => s.key === newStage)?.label || newStage
      const newAct = await addCrmActivity(lead.id, {
        type: 'note',
        content: `Moved stage to "${stageName}"`,
      })
      setActivities((prev) => [newAct, ...prev])
    } catch {
      // ignore
    }
  }

  const handleAddActivity = async (e) => {
    e.preventDefault()
    if (!newActivityContent.trim()) return
    setAddingActivity(true)
    try {
      const added = await addCrmActivity(lead.id, {
        type: newActivityType,
        content: newActivityContent.trim(),
      })
      setActivities((prev) => [added, ...prev])
      setNewActivityContent('')
    } catch (err) {
      alert('Could not log activity: ' + err.message)
    } finally {
      setAddingActivity(false)
    }
  }

  const handleDeleteActivity = async (actId) => {
    try {
      await deleteCrmActivity(actId)
      setActivities((prev) => prev.filter((a) => a.id !== actId))
    } catch (err) {
      alert('Could not delete activity: ' + err.message)
    }
  }

  const handleDeleteLead = async () => {
    setDeleting(true)
    try {
      await deleteCrmLead(lead.id)
      setPendingDelete(false)
      onLeadDeleted(lead.id)
      onClose()
    } catch (err) {
      alert('Could not delete lead: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // Quick preset follow-up dates
  const setQuickFollowUp = (days) => {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const yyyy = target.getFullYear()
    const mm = String(target.getMonth() + 1).padStart(2, '0')
    const dd = String(target.getDate()).padStart(2, '0')
    handleChange('next_follow_up', `${yyyy}-${mm}-${dd}`)
  }

  // Pitch template generator
  const getPitchContent = () => {
    const name = formData.name || 'there'
    const company = formData.company || 'your team'
    if (pitchTemplate === 'intro') {
      return {
        subject: `Quick question regarding ${company}'s frontend / web engineering`,
        body: `Hi ${name},

I came across your work at ${company} and was impressed by what you are building. I'm Jerry Waris, a full-stack engineer specializing in high-performance web applications (React, Next.js, Node, Supabase/Django).

Are you currently looking to accelerate product development, modernize your user interface, or build new digital features this quarter?

Here is a quick look at my engineering portfolio: https://jerry-dev-studio.web.app/projects

Would you be open to a 10-minute introductory sync this week?

Best regards,
Jerry Waris
Full-Stack Software Engineer`,
      }
    } else if (pitchTemplate === 'followup') {
      return {
        subject: `Following up: engineering & architecture for ${company}`,
        body: `Hi ${name},

Just wanted to briefly follow up on my previous note. I'd love to learn more about the technical challenges ${company} is currently tackling.

Let me know if you have 10 minutes for a quick chat later this week!

Best,
Jerry Waris`,
      }
    } else {
      return {
        subject: `Proposal review & technical discovery for ${company}`,
        body: `Hi ${name},

Thanks for connecting! I have prepared recommendations and technical scope details tailored for ${company}.

Please let me know when you have time for a quick walk-through.

Best,
Jerry Waris`,
      }
    }
  }

  const pitch = getPitchContent()
  const emailLink = formData.email
    ? `mailto:${formData.email}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`
    : null

  const cleanPhone = (formData.phone || '').replace(/[^0-9+]/g, '')
  const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(`Hi ${formData.name || ''}, Jerry Waris here from Jerry Dev Studio.`)}` : null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-panel border-l border-panel-edge h-full flex flex-col shadow-2xl z-10 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-panel/95 backdrop-blur-md px-6 py-4 border-b border-panel-edge flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-neon-blue font-mono font-medium">
                // CRM Prospect / Deal
              </span>
              {formData.temperature && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    TEMPERATURES.find((t) => t.key === formData.temperature)?.badge || ''
                  }`}
                >
                  {TEMPERATURES.find((t) => t.key === formData.temperature)?.label}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white truncate mt-1">
              {formData.name || 'Unnamed Lead'}
              {formData.company && (
                <span className="text-slate-400 font-normal ml-2">@ {formData.company}</span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-neon-blue text-abyss hover:bg-neon-blue/90 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-panel-edge/60 transition-colors"
              title="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {saveError && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
              {saveError}
            </div>
          )}

          {/* Pipeline Stage Bar */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-mono mb-2">
              Pipeline Stage
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {STAGES.map((s) => {
                const isActive = formData.stage === s.key
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleStageChange(s.key)}
                    className={`px-2 py-2 text-xs font-medium rounded-md border text-center transition-all ${
                      isActive
                        ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-sm'
                        : 'border-panel-edge bg-abyss/40 text-slate-400 hover:text-slate-200 hover:bg-panel-edge/40'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 1-Click Outreach Shortcuts (LinkedIn Sales Nav style) */}
          <div className="p-4 rounded-lg bg-abyss/60 border border-panel-edge space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-neon-indigo font-mono font-medium">
                ⚡ 1-Click Outreach Shortcuts
              </span>
              <div className="flex gap-1 text-[11px]">
                {['intro', 'followup', 'proposal'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPitchTemplate(mode)}
                    className={`px-2 py-0.5 rounded capitalize ${
                      pitchTemplate === mode
                        ? 'bg-neon-indigo/30 text-neon-indigo font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {/* LinkedIn InMail / Profile */}
              {formData.linkedin_url ? (
                <a
                  href={formData.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0A66C2]/20 border border-[#0A66C2]/50 text-[#70B5F9] hover:bg-[#0A66C2]/30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Open LinkedIn Profile
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const query = encodeURIComponent(`${formData.name} ${formData.company || ''}`)
                    window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, '_blank')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-panel-edge text-slate-300 hover:text-white hover:bg-panel-edge/50 transition-colors"
                >
                  🔍 Find on LinkedIn
                </button>
              )}

              {/* Email Pitch */}
              {emailLink ? (
                <a
                  href={emailLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-neon-blue/15 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/25 transition-colors"
                >
                  ✉️ Send {pitchTemplate.toUpperCase()} Email
                </a>
              ) : (
                <span className="text-xs text-slate-500 py-1.5 px-2">No email provided</span>
              )}

              {/* WhatsApp */}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/15 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  💬 WhatsApp
                </a>
              )}

              {/* Company Website */}
              {formData.company_website && (
                <a
                  href={formData.company_website.startsWith('http') ? formData.company_website : `https://${formData.company_website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-panel-edge text-slate-300 hover:text-white hover:bg-panel-edge/50 transition-colors"
                >
                  🌐 Visit Website
                </a>
              )}
            </div>

            {/* Template Preview Snippet */}
            <details className="mt-2 text-xs text-slate-400 cursor-pointer">
              <summary className="hover:text-slate-300">View generated pitch preview</summary>
              <div className="mt-2 p-3 bg-panel border border-panel-edge rounded text-slate-300 whitespace-pre-wrap font-sans text-xs select-all">
                <strong>Subject:</strong> {pitch.subject}

{pitch.body}
              </div>
            </details>
          </div>

          {/* Primary Lead Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Company</label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => handleChange('company', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="e.g. Acme Health Inc."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Job Title / Role</label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => handleChange('job_title', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="e.g. Head of Engineering / Founder"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="e.g. founder@acme.com"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Phone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="e.g. +1 555 123 4567"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={formData.linkedin_url || ''}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="https://linkedin.com/in/prospect"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Company Website</label>
              <input
                type="text"
                value={formData.company_website || ''}
                onChange={(e) => handleChange('company_website', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                placeholder="https://acme.com"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Deal Value ({formData.currency || 'USD'})</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.deal_value || 0}
                  onChange={(e) => handleChange('deal_value', e.target.value)}
                  className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
                  placeholder="3500"
                />
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="rounded-md border border-panel-edge bg-abyss/60 px-2 py-2 text-sm text-slate-100 outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Lead Temperature</label>
              <select
                value={formData.temperature || 'warm'}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              >
                {TEMPERATURES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">Lead Source</label>
              <select
                value={formData.source || 'linkedin'}
                onChange={(e) => handleChange('source', e.target.value)}
                className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              >
                {SOURCES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up Reminder */}
          <div className="p-4 rounded-lg bg-abyss/40 border border-panel-edge">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs uppercase tracking-wider text-slate-300 font-mono">
                📅 Next Follow-Up Date
              </label>
              <div className="flex gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickFollowUp(1)}
                  className="px-2 py-1 rounded bg-panel-edge/60 text-slate-300 hover:text-white"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFollowUp(3)}
                  className="px-2 py-1 rounded bg-panel-edge/60 text-slate-300 hover:text-white"
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFollowUp(7)}
                  className="px-2 py-1 rounded bg-panel-edge/60 text-slate-300 hover:text-white"
                >
                  In 1 Week
                </button>
              </div>
            </div>
            <input
              type="date"
              value={formData.next_follow_up || ''}
              onChange={(e) => handleChange('next_follow_up', e.target.value)}
              className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>

          {/* Tech Stack & Tags */}
          <div>
            <label className="block text-xs text-slate-400 font-mono mb-1">
              Tech Stack & Key Needs (comma-separated)
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              placeholder="React, Next.js, Django, Supabase, AI Agents"
            />
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs text-slate-400 font-mono mb-1">
              Internal Deal Notes & Context
            </label>
            <textarea
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              placeholder="Background notes, project scope, budget details, pain points..."
            />
          </div>

          {/* Chronological Activity Timeline (Salesforce Style) */}
          <div className="pt-4 border-t border-panel-edge">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <span>📋 Interaction History & Activity Log</span>
              <span className="text-xs font-normal text-slate-400">({activities.length})</span>
            </h3>

            {/* Quick Activity Composer */}
            <form onSubmit={handleAddActivity} className="p-3 bg-abyss/60 border border-panel-edge rounded-lg space-y-2 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-mono">Log Interaction:</span>
                <div className="flex gap-1">
                  {ACTIVITY_TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setNewActivityType(t.key)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        newActivityType === t.key
                          ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={newActivityContent}
                onChange={(e) => setNewActivityContent(e.target.value)}
                placeholder="Log call discussion, email summary, objection notes..."
                className="w-full rounded border border-panel-edge bg-panel px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingActivity || !newActivityContent.trim()}
                  className="px-3 py-1 bg-neon-indigo/30 hover:bg-neon-indigo/50 border border-neon-indigo/60 text-white rounded text-xs font-semibold disabled:opacity-40"
                >
                  {addingActivity ? 'Adding...' : '+ Log Activity'}
                </button>
              </div>
            </form>

            {/* Timeline Stream */}
            <div className="space-y-2">
              {activitiesLoading && (
                <p className="text-xs text-slate-500 py-2">Loading activities...</p>
              )}
              {!activitiesLoading && activities.length === 0 && (
                <p className="text-xs text-slate-500 py-2">No interactions logged yet. Log the first one above!</p>
              )}
              {activities.map((act) => {
                const typeObj = ACTIVITY_TYPES.find((t) => t.key === act.type) || { icon: '📝', label: act.type }
                const actDate = new Date(act.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <div
                    key={act.id}
                    className="p-3 bg-abyss/40 border border-panel-edge/80 rounded-md text-xs space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{typeObj.icon}</span>
                        <span>{typeObj.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{actDate}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete activity"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{act.content}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Delete lead action */}
          <div className="pt-6 border-t border-panel-edge flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Created: {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
            </span>
            <button
              type="button"
              onClick={() => setPendingDelete(true)}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Delete Lead
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title="Delete Lead?"
        message={`Are you sure you want to delete ${formData.name || 'this lead'}? All logged activities will also be removed.`}
        busy={deleting}
        onConfirm={handleDeleteLead}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  )
}

import { useState } from 'react'
import { submitQuoteRequest } from '../api/client'
import SystemButton from './SystemButton'

const initialForm = { name: '', email: '', project_details: '' }

export default function RequestQuoteModal({ open, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  if (!open) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setError(null)
    try {
      await submitQuoteRequest(form)
      setStatus('success')
      setForm(initialForm)
    } catch {
      setStatus('idle')
      setError('Transmission failed. Please try again.')
    }
  }

  const handleClose = () => {
    setStatus('idle')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={handleClose}>
      <div
        className="system-panel w-full max-w-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="system-heading glow-text text-xl text-neon-blue">Request a Quote</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-neon-blue" aria-label="Close">
            ✕
          </button>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <p className="text-status-green">
              Quest submitted. Your request has been logged &mdash; expect a reply soon.
            </p>
            <SystemButton onClick={handleClose}>Close</SystemButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="system-heading mb-1 block text-xs text-slate-400">Name</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="system-heading mb-1 block text-xs text-slate-400">Email</label>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="system-heading mb-1 block text-xs text-slate-400">Project Details</label>
              <textarea
                required
                name="project_details"
                rows={4}
                value={form.project_details}
                onChange={handleChange}
                className="w-full border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon-blue"
              />
            </div>
            {error && <p className="text-status-red text-sm">{error}</p>}
            <SystemButton type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Submit Request'}
            </SystemButton>
          </form>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getStoredApiKeys,
  saveApiKeys,
  testApolloConnection,
} from '../../../api/apolloClient'
import { inputClass } from '../../../components/admin/formStyles'
import { useToast } from '../../../components/admin/toastStore'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function IntegrationSettings() {
  const toast = useToast()
  const [apolloKey, setApolloKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showApollo, setShowApollo] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)

  const [apolloStatus, setApolloStatus] = useState('unconfigured') // 'connected' | 'error' | 'unconfigured' | 'saved'
  const [testingApollo, setTestingApollo] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'API Integrations — Control Panel'
    const stored = getStoredApiKeys()
    if (stored.apollo) {
      setApolloKey(stored.apollo)
      setApolloStatus(stored.apolloStatus || 'saved')
    }
    if (stored.openai) {
      setOpenaiKey(stored.openai)
    }
  }, [])

  const handleTestApollo = async () => {
    if (!apolloKey.trim()) {
      toast.error('Please enter an Apollo.io API key first.')
      return
    }

    setTestingApollo(true)
    setTestResult(null)
    try {
      const res = await testApolloConnection(apolloKey.trim())
      setTestResult({ ok: true, message: res.message || 'Key verified successfully!' })
      setApolloStatus('connected')
      saveApiKeys({ apollo: apolloKey.trim(), apolloStatus: 'connected' })
      toast.success('Apollo.io API key successfully verified & connected!')
    } catch (err) {
      const msg = err.message || 'Connection failed'
      setTestResult({ ok: false, message: msg })
      setApolloStatus('error')
      toast.error(`Verification failed: ${msg}`)
    } finally {
      setTestingApollo(false)
    }
  }

  const handleSaveAll = (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const trimmedApollo = apolloKey.trim()
      const trimmedOpenai = openaiKey.trim()

      const status = trimmedApollo ? (apolloStatus === 'connected' ? 'connected' : 'saved') : 'unconfigured'
      saveApiKeys({
        apollo: trimmedApollo,
        openai: trimmedOpenai,
        apolloStatus: status,
      })
      setApolloStatus(status)
      toast.success('API Integrations saved securely in your browser!')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    if (window.confirm('Clear all stored integration API keys from this device?')) {
      saveApiKeys({ apollo: '', openai: '', apolloStatus: 'unconfigured' })
      setApolloKey('')
      setOpenaiKey('')
      setApolloStatus('unconfigured')
      setTestResult(null)
      toast.success('API keys cleared from local storage.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-panel-edge">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-slate-400">Settings</span>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-slate-200">API Integrations</span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-blue/15 text-neon-blue text-lg">
              🔌
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-white sm:text-3xl">
              API Integrations
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Connect Apollo.io for 1-click decision-maker discovery, email enrichment, and AI Cold Pitching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SystemButton
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-rose-400"
          >
            Clear Keys
          </SystemButton>
          <SystemButton
            type="button"
            variant="primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </SystemButton>
        </div>
      </div>

      {/* Apollo.io Card */}
      <StatusPanel glow={false} className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-panel-edge">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#2860E1]/15 border border-[#2860E1]/40 flex items-center justify-center text-[#4B83FF] text-xl font-bold font-mono">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Apollo.io Contact Enrichment</h2>
                {apolloStatus === 'connected' && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                    ✓ Connected
                  </span>
                )}
                {apolloStatus === 'saved' && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400">
                    Saved (Untested)
                  </span>
                )}
                {apolloStatus === 'error' && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400">
                    Authentication Error
                  </span>
                )}
                {apolloStatus === 'unconfigured' && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/40 text-slate-400">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Powers 1-click &quot;⚡ Find Decision-Maker &amp; Verified Email&quot; in CRM and Client Radar.
              </p>
            </div>
          </div>
          <a
            href="https://app.apollo.io/#/settings/integrations/api_keys"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neon-blue hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Get Apollo API Key ↗
          </a>
        </div>

        {/* Input & Test */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Apollo.io API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showApollo ? 'text' : 'password'}
                value={apolloKey}
                onChange={(e) => {
                  setApolloKey(e.target.value)
                  setTestResult(null)
                  setApolloStatus(e.target.value.trim() ? 'saved' : 'unconfigured')
                }}
                placeholder="e.g. ap_live_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                className={`${inputClass} pr-24 font-mono text-xs`}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApollo((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showApollo ? 'Hide key' : 'Show key'}
                >
                  {showApollo ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestApollo}
              disabled={testingApollo || !apolloKey.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-neon-blue/15 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/25 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {testingApollo ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
                  Testing Apollo Connection...
                </>
              ) : (
                <>
                  <span>🔌</span> Test Connection
                </>
              )}
            </button>

            {testResult && (
              <span
                className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}
              >
                {testResult.ok ? '✓' : '✗'} {testResult.message}
              </span>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg bg-abyss/60 border border-panel-edge p-4 text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span>💡</span> Setup Guide:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
            <li>Log into your account at <a href="https://app.apollo.io" target="_blank" rel="noreferrer" className="text-neon-blue hover:underline">apollo.io</a>.</li>
            <li>Click <strong>Settings</strong> (gear icon bottom left) &gt; <strong>Integrations</strong> &gt; <strong>API Keys</strong>.</li>
            <li>Click <strong>Create Master Key</strong> (or copy an existing active key).</li>
            <li>Paste your key above, click <strong>Test Connection</strong>, and then <strong>Save Configuration</strong>.</li>
          </ol>
        </div>
      </StatusPanel>

      {/* AI Cold Pitch Engine Card (Optional OpenAI / LLM) */}
      <StatusPanel glow={false} className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-panel-edge">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neon-indigo/15 border border-neon-indigo/40 flex items-center justify-center text-neon-indigo text-xl">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Cold Pitch Engine Key (Optional)</h2>
                {openaiKey.trim() ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                    Configured
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/40 text-slate-400">
                    Algorithmic Mode Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The CRM includes Jerry&apos;s high-converting algorithmic pitch formulas by default. Add an OpenAI key to unlock dynamic LLM re-writing.
              </p>
            </div>
          </div>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neon-blue hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Get OpenAI Key ↗
          </a>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              OpenAI / LLM API Key (Optional)
            </label>
            <div className="relative flex items-center">
              <input
                type={showOpenai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className={`${inputClass} pr-24 font-mono text-xs`}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowOpenai((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showOpenai ? 'Hide key' : 'Show key'}
                >
                  {showOpenai ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </StatusPanel>

      {/* Security & Privacy Notice */}
      <div className="rounded-xl border border-panel-edge bg-abyss/40 p-5 flex items-start gap-3">
        <span className="text-lg">🔒</span>
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Client-Side Security &amp; Privacy</p>
          <p>
            Your API keys are stored exclusively in your local browser&apos;s encrypted storage and sent directly to the secure proxy edge function for validation. Keys are never saved to public database tables or visible in public client bundles.
          </p>
        </div>
      </div>
    </div>
  )
}

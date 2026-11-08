import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAiSettings,
  saveAiSettings,
  testGroqConnection,
  testOllamaConnection,
} from '../../../api/aiClient'
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

  // Apollo State
  const [apolloKey, setApolloKey] = useState('')
  const [showApollo, setShowApollo] = useState(false)
  const [apolloStatus, setApolloStatus] = useState('unconfigured') // 'connected' | 'error' | 'unconfigured' | 'saved'
  const [testingApollo, setTestingApollo] = useState(false)
  const [testResult, setTestResult] = useState(null)

  // AI State
  const [aiProvider, setAiProvider] = useState('algorithmic') // 'ollama' | 'groq' | 'openai' | 'algorithmic'
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState('llama3.2')
  const [groqKey, setGroqKey] = useState('')
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showOpenai, setShowOpenai] = useState(false)
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini')

  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'API Integrations — Control Panel'

    // Load Apollo Keys
    const stored = getStoredApiKeys()
    if (stored.apollo) {
      setApolloKey(stored.apollo)
      setApolloStatus(stored.apolloStatus || 'saved')
    }

    // Load AI Settings
    const ai = getAiSettings()
    setAiProvider(ai.provider || 'algorithmic')
    setOllamaUrl(ai.ollamaUrl || 'http://localhost:11434')
    setOllamaModel(ai.ollamaModel || 'llama3.2')
    setGroqKey(ai.groqKey || '')
    setGroqModel(ai.groqModel || 'llama-3.3-70b-versatile')
    setOpenaiKey(ai.openaiKey || '')
    setOpenaiModel(ai.openaiModel || 'gpt-4o-mini')
  }, [])

  // Test Apollo Connection
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

  // Test AI Connection (Ollama or Groq)
  const handleTestAi = async () => {
    setTestingAi(true)
    setAiTestResult(null)
    try {
      if (aiProvider === 'ollama') {
        const res = await testOllamaConnection(ollamaUrl)
        setAiTestResult({ ok: true, message: res.message })
        toast.success(res.message)
      } else if (aiProvider === 'groq') {
        const res = await testGroqConnection(groqKey)
        setAiTestResult({ ok: true, message: res.message })
        toast.success('Connected to Groq Cloud!')
      }
    } catch (err) {
      setAiTestResult({ ok: false, message: err.message })
      toast.error(err.message)
    } finally {
      setTestingAi(false)
    }
  }

  // Save All Settings
  const handleSaveAll = (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const trimmedApollo = apolloKey.trim()
      const status = trimmedApollo
        ? apolloStatus === 'connected'
          ? 'connected'
          : 'saved'
        : 'unconfigured'

      saveApiKeys({
        apollo: trimmedApollo,
        apolloStatus: status,
      })

      saveAiSettings({
        aiProvider,
        ollamaUrl: ollamaUrl.trim(),
        ollamaModel: ollamaModel.trim(),
        groqKey: groqKey.trim(),
        groqModel: groqModel.trim(),
        openai: openaiKey.trim(),
        openaiModel: openaiModel.trim(),
      })

      setApolloStatus(status)
      toast.success('All integration settings saved securely in your browser!')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  // Clear Keys
  const handleClear = () => {
    if (window.confirm('Clear all stored integration API keys and endpoints from this device?')) {
      saveApiKeys({ apollo: '', apolloStatus: 'unconfigured' })
      saveAiSettings({
        aiProvider: 'algorithmic',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2',
        groqKey: '',
        openai: '',
      })
      setApolloKey('')
      setApolloStatus('unconfigured')
      setTestResult(null)
      setAiProvider('algorithmic')
      setGroqKey('')
      setOpenaiKey('')
      setAiTestResult(null)
      toast.success('Integration settings cleared.')
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
            Connect Apollo.io for sales lead enrichment and configure Ollama, Groq, or OpenAI for the AI Cold Pitch Engine.
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

      {/* -------------------- SECTION 1: Apollo.io Card -------------------- */}
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
      </StatusPanel>

      {/* -------------------- SECTION 2: AI Engine & Ollama Provider Card -------------------- */}
      <StatusPanel glow={false} className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-panel-edge">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neon-indigo/15 border border-neon-indigo/40 flex items-center justify-center text-neon-indigo text-xl">
              🦙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Engine &amp; LLM Provider</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neon-indigo/20 border border-neon-indigo/40 text-neon-indigo uppercase">
                  {aiProvider}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Power personalized pitch generation and technical problem summaries using Ollama, Groq, or OpenAI.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Switcher Tabs */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
            Select Active AI Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'ollama', label: '🦙 Ollama (Local)', desc: '100% Free & Private' },
              { id: 'groq', label: '⚡ Groq (Llama 3)', desc: 'Free Cloud API' },
              { id: 'openai', label: '🤖 OpenAI / Cloud', desc: 'GPT-4o / Compatible' },
              { id: 'algorithmic', label: '📐 Built-in Formulas', desc: 'No AI Key Needed' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setAiProvider(p.id)
                  setAiTestResult(null)
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  aiProvider === p.id
                    ? 'border-neon-blue bg-neon-blue/15 text-white shadow-md'
                    : 'border-panel-edge bg-abyss/40 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* PROVIDER 1: Ollama Settings */}
        {aiProvider === 'ollama' && (
          <div className="space-y-4 rounded-xl bg-abyss/60 border border-panel-edge p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span>🦙</span> Ollama Local / Self-Hosted Configuration
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">Zero Rate Limits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className={`${inputClass} font-mono text-xs`}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Local: <code>http://localhost:11434</code> or Cloudflare Tunnel HTTPS URL
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.2"
                  className={`${inputClass} font-mono text-xs`}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g. <code>llama3.2</code>, <code>mistral</code>, <code>qwen2.5</code>, <code>deepseek-r1</code>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neon-indigo/20 border border-neon-indigo/50 text-neon-indigo hover:bg-neon-indigo/30 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {testingAi ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-neon-indigo border-t-transparent" />
                    Connecting to Ollama...
                  </>
                ) : (
                  <>
                    <span>🦙</span> Test Ollama Connection
                  </>
                )}
              </button>

              {aiTestResult && (
                <span
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                    aiTestResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {aiTestResult.ok ? '✓' : '✗'} {aiTestResult.message}
                </span>
              )}
            </div>

            <div className="rounded-lg bg-panel border border-panel-edge p-3.5 text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300 flex items-center gap-1">
                <span>💡</span> Ollama Browser Quick-Start:
              </p>
              <p>
                To allow your browser to connect to Ollama, start it with CORS enabled:
              </p>
              <pre className="p-2 rounded bg-abyss font-mono text-[11px] text-neon-blue overflow-x-auto">
                OLLAMA_ORIGINS=&quot;*&quot; ollama serve
              </pre>
              <p className="text-[11px] text-slate-400">
                On the production site (<code>https://jerry-dev-studio.web.app</code>), forward your Ollama port using Cloudflare Tunnel (<code>cloudflared tunnel --url http://localhost:11434</code>) and paste the HTTPS URL above to bypass HTTPS mixed content restrictions.
              </p>
            </div>
          </div>
        )}

        {/* PROVIDER 2: Groq Cloud Settings */}
        {aiProvider === 'groq' && (
          <div className="space-y-4 rounded-xl bg-abyss/60 border border-panel-edge p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Groq Free Cloud API (Fast Llama 3.3)
              </span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neon-blue hover:underline"
              >
                Get Free Groq Key (14.4k req/day) ↗
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Groq API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className={`${inputClass} pr-10 font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey((prev) => !prev)}
                    className="absolute right-2 p-1 text-slate-400 hover:text-slate-200"
                  >
                    {showGroqKey ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Groq Model
                </label>
                <select
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                  className={`${inputClass} font-mono text-xs`}
                >
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Fast)</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi || !groqKey.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-neon-blue/15 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/25 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {testingAi ? 'Testing Groq...' : '⚡ Test Groq Connection'}
              </button>

              {aiTestResult && (
                <span
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                    aiTestResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {aiTestResult.ok ? '✓' : '✗'} {aiTestResult.message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* PROVIDER 3: OpenAI Settings */}
        {aiProvider === 'openai' && (
          <div className="space-y-4 rounded-xl bg-abyss/60 border border-panel-edge p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖</span> OpenAI / Custom API Key
              </span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neon-blue hover:underline"
              >
                Get OpenAI Key ↗
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showOpenai ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className={`${inputClass} pr-10 font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenai((prev) => !prev)}
                    className="absolute right-2 p-1 text-slate-400 hover:text-slate-200"
                  >
                    {showOpenai ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className={`${inputClass} font-mono text-xs`}
                />
              </div>
            </div>
          </div>
        )}

        {/* PROVIDER 4: Algorithmic Note */}
        {aiProvider === 'algorithmic' && (
          <div className="rounded-xl bg-abyss/40 border border-panel-edge p-4 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span>📐</span> Built-in Algorithmic Formulas Active
            </p>
            <p className="text-slate-400">
              The CRM will generate senior engineering pitches across the 3 core angles using battle-tested dynamic templates based on the client&apos;s tech stack and job notes. Zero API calls or keys required!
            </p>
          </div>
        )}
      </StatusPanel>

      {/* Security & Privacy Notice */}
      <div className="rounded-xl border border-panel-edge bg-abyss/40 p-5 flex items-start gap-3">
        <span className="text-lg">🔒</span>
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Client-Side Security &amp; Privacy</p>
          <p>
            Your API keys and Ollama endpoints are stored exclusively in your local browser&apos;s private storage. Keys are never saved to public database tables or visible in public client bundles.
          </p>
        </div>
      </div>
    </div>
  )
}

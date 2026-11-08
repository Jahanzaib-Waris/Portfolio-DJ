import { supabase } from './supabase'

/**
 * apolloClient.js
 * Client-side integration for Apollo.io decision-maker discovery & contact enrichment.
 * Proxied via Supabase Edge Function to avoid browser CORS restrictions.
 */

const STORAGE_KEY = 'jerry_studio_api_keys'
const PROXY_ENDPOINT = 'https://fbeegpzrbocqgyxeqqtc.supabase.co/functions/v1/apollo-proxy'

/**
 * Helper to build authenticated headers for Supabase Edge Functions.
 */
async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  return {
    'Content-Type': 'application/json',
    ...(anonKey ? { apikey: anonKey } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Extracts a clean domain hostname from a URL or raw string.
 * e.g. "https://www.flutterflow.io/pricing" -> "flutterflow.io"
 */
export function extractDomain(input = '') {
  if (!input) return ''
  let d = input.trim().toLowerCase()
  d = d.replace(/^https?:\/\//i, '')
  d = d.replace(/^www\./i, '')
  d = d.split('/')[0].split('?')[0].split('#')[0].trim()
  return d
}

/**
 * Retrieves saved API keys from browser localStorage.
 */
export function getStoredApiKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { apollo: '', openai: '', apolloStatus: 'unconfigured' }
    return JSON.parse(raw)
  } catch {
    return { apollo: '', openai: '', apolloStatus: 'unconfigured' }
  }
}

/**
 * Persists API keys to browser localStorage.
 */
export function saveApiKeys(updates = {}) {
  try {
    const current = getStoredApiKeys()
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch (err) {
    console.error('Failed to save API keys to localStorage:', err)
    return null
  }
}

/**
 * Quick getter for Apollo API key.
 */
export function getApolloKey() {
  const keys = getStoredApiKeys()
  return (keys.apollo || '').trim()
}

/**
 * Tests connection to Apollo.io via proxy.
 */
export async function testApolloConnection(apiKey) {
  const key = apiKey || getApolloKey()
  if (!key) {
    throw new Error('Please enter an Apollo.io API key.')
  }

  const authHeaders = await getAuthHeaders()
  const res = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      apiKey: key,
      action: 'test',
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || !data.success) {
    const errMsg = data.error || `Verification failed with HTTP ${res.status}`
    throw new Error(errMsg)
  }

  return { success: true, message: data.message || 'Connected to Apollo.io!' }
}

/**
 * Queries Apollo.io for top decision maker (Founder, CEO, CTO, Head of Eng)
 * matching domain or company name, returning verified contact details.
 */
export async function enrichCompanyDecisionMaker({ domain, company, apiKey }) {
  const key = apiKey || getApolloKey()
  if (!key) {
    throw new Error(
      'Apollo API key not found. Please add your key under Admin > Settings > API Integrations.'
    )
  }

  const clean = extractDomain(domain)
  const comp = (company || '').trim()

  if (!clean && !comp) {
    throw new Error('Please provide either a company website or company name to enrich.')
  }

  const authHeaders = await getAuthHeaders()
  const res = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      apiKey: key,
      action: 'enrich',
      domain: clean,
      company: comp,
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Apollo enrichment failed with HTTP ${res.status}`)
  }

  if (!data.success) {
    throw new Error(data.error || 'No decision-makers found on Apollo for this company.')
  }

  return data.contact
}

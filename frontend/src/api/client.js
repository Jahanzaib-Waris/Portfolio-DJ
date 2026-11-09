import { supabase, isSupabaseConfigured, uploadMedia } from './supabase'

/**
 * Session expired handler callback registered by AuthProvider.
 */
let onSessionExpired = null
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn
}

/**
 * Refresh access token helper (handled automatically by Supabase client).
 */
export async function refreshAccessToken() {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    if (onSessionExpired) onSessionExpired()
    throw new Error('No active Supabase session')
  }
  return data.session.access_token
}

// Fallback dummy client for backward-compatibility if any external module imports default
const apiClient = {
  get: () => Promise.resolve({ data: {} }),
  post: () => Promise.resolve({ data: {} }),
  patch: () => Promise.resolve({ data: {} }),
  delete: () => Promise.resolve({ data: {} }),
}
export default apiClient

/**
 * Helper to normalize payload from FormData or plain Object into a DB-ready object.
 * Uploads any File instances to Supabase Storage before returning the fields.
 */
async function processPayload(payload, folder = 'general') {
  if (!payload) return {}

  if (payload instanceof FormData) {
    const data = {}
    for (const [key, value] of payload.entries()) {
      if (value instanceof File) {
        if (value.size > 0) {
          data[key] = await uploadMedia(value, folder)
        }
      } else if (value === '') {
        data[key] = null
      } else if (value === 'true') {
        data[key] = true
      } else if (value === 'false') {
        data[key] = false
      } else {
        data[key] = value
      }
    }
    return data
  }

  // Plain JSON object: check if any values are File objects
  const data = { ...payload }
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      data[key] = await uploadMedia(value, folder)
    }
  }
  return data
}

/**
 * Helper to build DRF-compatible pagination envelope { count, next, previous, results }.
 */
function toPaginatedResponse(data, count, page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize
  const total = count ?? (Array.isArray(data) ? data.length : 0)
  const hasNext = from + (data?.length || 0) < total

  return {
    count: total,
    next: hasNext ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
    results: data || [],
  }
}

/* ---------------------------------------------------------------- cache layer */

/**
 * In-memory + sessionStorage TTL Caching Layer
 * Drastically reduces Supabase API egress, Realtime connection overhead, and DB queries.
 */
const clientCache = new Map()

export function getCached(key, ttlMs = 5 * 60 * 1000) {
  // 1. Check in-memory map
  const mem = clientCache.get(key)
  if (mem && Date.now() - mem.time < ttlMs) {
    return mem.data
  }

  // 2. Check sessionStorage
  try {
    const raw = sessionStorage.getItem(`__jerry_cache_${key}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Date.now() - parsed.time < ttlMs) {
        clientCache.set(key, parsed)
        return parsed.data
      }
      sessionStorage.removeItem(`__jerry_cache_${key}`)
    }
  } catch {
    // sessionStorage not available or parsing failed
  }

  return null
}

export function setCached(key, data) {
  const item = { data, time: Date.now() }
  clientCache.set(key, item)
  try {
    sessionStorage.setItem(`__jerry_cache_${key}`, JSON.stringify(item))
  } catch {
    // storage quota or private browsing
  }
}

export function invalidateCache(keyPrefix = '') {
  if (!keyPrefix) {
    clientCache.clear()
    try {
      const keys = Object.keys(sessionStorage)
      for (const k of keys) {
        if (k.startsWith('__jerry_cache_')) sessionStorage.removeItem(k)
      }
    } catch {}
    return
  }

  for (const k of clientCache.keys()) {
    if (k.startsWith(keyPrefix)) clientCache.delete(k)
  }

  try {
    const keys = Object.keys(sessionStorage)
    for (const k of keys) {
      if (k.startsWith(`__jerry_cache_${keyPrefix}`)) sessionStorage.removeItem(k)
    }
  } catch {}
}

/* ---------------------------------------------------------------- public site */

export const getProfile = async () => {
  if (!isSupabaseConfigured) return null
  const cached = getCached('profile', 10 * 60 * 1000)
  if (cached) return cached

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, tagline, bio, photo, resume, email, github_url, linkedin_url, updated_at')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  setCached('profile', data)
  return data
}

export const getBranding = async () => {
  if (!isSupabaseConfigured) return { site_name: 'Jerry Dev Studio', logo: '', favicon: '' }
  const cached = getCached('branding', 10 * 60 * 1000)
  if (cached) return cached

  const { data, error } = await supabase
    .from('site_branding')
    .select('id, site_name, logo, favicon, updated_at')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  const res = data || { site_name: 'Jerry Dev Studio' }
  setCached('branding', res)
  return res
}

export const getTheme = async () => {
  if (!isSupabaseConfigured) return null
  const cached = getCached('theme', 10 * 60 * 1000)
  if (cached) return cached

  const { data, error } = await supabase
    .from('site_theme')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  setCached('theme', data)
  return data
}

// Bot detection & 30-second path deduplication
let lastTrackedPath = ''
let lastTrackedTime = 0

// Fire-and-forget page view beacon
export const trackPageView = async (path, referrer = '') => {
  if (!isSupabaseConfigured) return
  try {
    // Ignore automated headless crawlers & test suites
    if (typeof navigator !== 'undefined' && (navigator.webdriver || /bot|crawler|spider|crawling/i.test(navigator.userAgent || ''))) {
      return
    }

    // Deduplicate identical path visits within 30 seconds
    const now = Date.now()
    if (path === lastTrackedPath && now - lastTrackedTime < 30000) {
      return
    }
    lastTrackedPath = path
    lastTrackedTime = now

    const isBlog = path.startsWith('/blogs/')
    const slug = isBlog ? path.replace(/^\/blogs\//, '').replace(/\/$/, '') : ''

    // Hash or generate session key for visitor deduplication
    let sessionKey = localStorage.getItem('__pv_session')
    if (!sessionKey) {
      sessionKey = 's_' + Math.random().toString(36).substring(2, 12)
      localStorage.setItem('__pv_session', sessionKey)
    }

    await supabase.from('page_views').insert({
      path,
      referrer: referrer || '',
      is_blog_post: isBlog,
      slug,
      session_key: sessionKey,
    })
  } catch {
    // Analytics failures must never surface in UI
  }
}

export const getSkills = async (params = {}) => {
  if (!isSupabaseConfigured) return []
  const page = parseInt(params.page, 10) || 1
  const pageSize = parseInt(params.page_size, 10) || 100
  const cacheKey = `skills_${page}_${pageSize}`
  const cached = getCached(cacheKey, 10 * 60 * 1000)
  if (cached) return cached

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('skills')
    .select('id, name, description, display_order', { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to)

  if (error) throw error
  const result = toPaginatedResponse(data, count, page, pageSize)
  setCached(cacheKey, result)
  return result
}

export const getBlogPosts = async (params = {}) => {
  if (!isSupabaseConfigured) return []
  const page = parseInt(params.page, 10) || 1
  const pageSize = parseInt(params.page_size, 10) || 10

  // Check if admin is logged in
  const { data: sessionData } = await supabase.auth.getSession()
  const isAdmin = Boolean(sessionData?.session)

  // Cache only for public visitors
  const cacheKey = `blogs_public_${page}_${pageSize}`
  if (!isAdmin) {
    const cached = getCached(cacheKey, 5 * 60 * 1000)
    if (cached) return cached
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Select only card/list metadata (EXCLUDES multi-kilobyte content column, saving ~90% egress)
  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, category, excerpt, cover_image, published_date, is_published, created_at, updated_at', { count: 'exact' })
    .order('published_date', { ascending: false })

  if (!isAdmin) {
    const todayStr = new Date().toISOString().slice(0, 10)
    query = query.eq('is_published', true).lte('published_date', todayStr)
  }

  const { data, count, error } = await query.range(from, to)
  if (error) throw error
  const result = toPaginatedResponse(data, count, page, pageSize)
  if (!isAdmin) {
    setCached(cacheKey, result)
  }
  return result
}

export const getBlogPost = async (slug) => {
  if (!isSupabaseConfigured) return null
  const { data: sessionData } = await supabase.auth.getSession()
  const isAdmin = Boolean(sessionData?.session)

  const cacheKey = `blog_post_${slug}`
  if (!isAdmin) {
    const cached = getCached(cacheKey, 5 * 60 * 1000)
    if (cached) return cached
  }

  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)

  // Public visitors can only access posts that are published and whose scheduled date has arrived
  if (!isAdmin) {
    const todayStr = new Date().toISOString().slice(0, 10)
    query = query.eq('is_published', true).lte('published_date', todayStr)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!isAdmin && data) {
    setCached(cacheKey, data)
  }
  return data
}

export const getProjects = async (params = {}) => {
  if (!isSupabaseConfigured) return []
  const page = parseInt(params.page, 10) || 1
  const pageSize = parseInt(params.page_size, 10) || 10
  const cacheKey = `projects_${page}_${pageSize}`
  const cached = getCached(cacheKey, 5 * 60 * 1000)
  if (cached) return cached

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('projects')
    .select('id, title, description, tech_stack, thumbnail, repo_url, live_url, display_order, is_featured, created_at', { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Compute tech_stack_list convenience array
  const formatted = (data || []).map((p) => ({
    ...p,
    tech_stack_list: p.tech_stack
      ? p.tech_stack.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  }))

  const result = toPaginatedResponse(formatted, count, page, pageSize)
  setCached(cacheKey, result)
  return result
}

export const submitQuoteRequest = async (payload) => {
  if (!isSupabaseConfigured) return { status: 'mocked' }

  // Clean and map payload strictly to existing quote_requests table columns
  const cleanPayload = {
    name: (payload.name || payload.full_name || '').trim(),
    email: (payload.email || '').trim(),
    service: payload.service || '',
    backend: payload.backend || '',
    budget: payload.budget || '',
    timeline: payload.timeline || '',
    project_link: (payload.project_link || '').trim(),
    project_details: (payload.project_details || payload.details || '').trim(),
  }

  // Do not chain .select() because unauthenticated public visitors do not have SELECT permissions on quote_requests
  const { error } = await supabase
    .from('quote_requests')
    .insert([cleanPayload])

  if (error) throw error
  return { success: true }
}

export const resumeDownloadUrl = '#'

/* --------------------------------------------------------------------- admin */

export const obtainTokens = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error

  return {
    access: data.session.access_token,
    refresh: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.email.split('@')[0],
      is_staff: true,
    },
  }
}

export const blacklistRefreshToken = async () => {
  await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return {
    id: user.id,
    email: user.email,
    username: user.email.split('@')[0],
    is_staff: true,
  }
}

export const changePassword = async (payload) => {
  const { data, error } = await supabase.auth.updateUser({
    password: payload.new_password,
  })
  if (error) throw error
  return data
}

export const updateBranding = async (payload) => {
  const fields = await processPayload(payload, 'branding')
  const { data, error } = await supabase
    .from('site_branding')
    .upsert({ id: 1, ...fields, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  invalidateCache('branding')
  return data
}

export const updateTheme = async (payload) => {
  const fields = await processPayload(payload, 'theme')
  const { data, error } = await supabase
    .from('site_theme')
    .upsert({ id: 1, ...fields, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  invalidateCache('theme')
  return data
}

export const getQuoteRequests = async (params = {}) => {
  const page = parseInt(params.page, 10) || 1
  const pageSize = parseInt(params.page_size, 10) || 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('quote_requests')
    .select('*', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return toPaginatedResponse(data, count, page, pageSize)
}

export const deleteQuoteRequest = async (id) => {
  const { error } = await supabase.from('quote_requests').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

export const getAnalyticsSummary = async (params = {}) => {
  const days = parseInt(params.days, 10) || 30

  // 1. Try RPC get_analytics_summary
  const { data, error } = await supabase.rpc('get_analytics_summary', { days })
  if (!error && data) return data

  // 2. Client-side fallback calculation if stored procedure isn't installed yet
  // Prunes columns and limits scan to prevent excessive egress and memory pressure
  const cutoff = new Date(Date.now() - days * 86400000).toISOString()
  const { data: views } = await supabase
    .from('page_views')
    .select('created_at, session_key, path')
    .gte('created_at', cutoff)
    .limit(10000)

  const { data: quotes } = await supabase
    .from('quote_requests')
    .select('id, submitted_at')
    .gte('submitted_at', cutoff)

  const viewsList = views || []
  const quotesList = quotes || []
  const visitors = new Set(viewsList.map((v) => v.session_key).filter(Boolean))

  // Aggregate daily series
  const dayMap = {}
  viewsList.forEach((v) => {
    const d = v.created_at.slice(0, 10)
    dayMap[d] = (dayMap[d] || 0) + 1
  })
  const series = Object.entries(dayMap).map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day))

  // Aggregate quotes trend
  const qMap = {}
  quotesList.forEach((q) => {
    const d = q.submitted_at.slice(0, 10)
    qMap[d] = (qMap[d] || 0) + 1
  })
  const quotes_trend = Object.entries(qMap).map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day))

  return {
    days,
    total_views: viewsList.length,
    total_visitors: visitors.size,
    series,
    top_pages: [],
    top_posts: [],
    top_referrers: [],
    quotes_trend,
  }
}

/* ----------------------------------------------------------------- blog CMS */

export const createBlogPost = async (payload) => {
  const fields = await processPayload(payload, 'blog')
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([{ ...fields, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) throw error
  invalidateCache('blogs')
  invalidateCache('blog_post_')
  return data
}

export const updateBlogPost = async (slug, payload) => {
  const fields = await processPayload(payload, 'blog')
  const { data, error } = await supabase
    .from('blog_posts')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select()
    .single()

  if (error) throw error
  invalidateCache('blogs')
  invalidateCache('blog_post_')
  return data
}

export const deleteBlogPost = async (slug) => {
  const { error } = await supabase.from('blog_posts').delete().eq('slug', slug)
  if (error) throw error
  invalidateCache('blogs')
  invalidateCache('blog_post_')
  return { success: true }
}

export const uploadBlogImage = async (file) => {
  const url = await uploadMedia(file, 'blog/inline')
  return { url }
}

/* ------------------------------------------------------------------ projects */

export const getProject = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return {
    ...data,
    tech_stack_list: data.tech_stack
      ? data.tech_stack.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  }
}

export const createProject = async (payload) => {
  const fields = await processPayload(payload, 'projects')
  const { data, error } = await supabase
    .from('projects')
    .insert([{ ...fields, created_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) throw error
  invalidateCache('projects')
  return data
}

export const updateProject = async (id, payload) => {
  const fields = await processPayload(payload, 'projects')
  const { data, error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  invalidateCache('projects')
  return data
}

export const deleteProject = async (id) => {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
  invalidateCache('projects')
  return { success: true }
}

/* -------------------------------------------------------------------- skills */

export const createSkill = async (payload) => {
  const { data, error } = await supabase
    .from('skills')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  invalidateCache('skills')
  return data
}

export const updateSkill = async (id, payload) => {
  const { data, error } = await supabase
    .from('skills')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  invalidateCache('skills')
  return data
}

export const deleteSkill = async (id) => {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  if (error) throw error
  invalidateCache('skills')
  return { success: true }
}

/* ------------------------------------------------------------------- profile */

export const createProfile = async (payload) => {
  const fields = await processPayload(payload, 'profile')
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: 1, ...fields, updated_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) throw error
  invalidateCache('profile')
  return data
}

export const updateProfile = async (payload) => {
  const fields = await processPayload(payload, 'profile')
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: 1, ...fields, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  invalidateCache('profile')
  return data
}

/* ------------------------------------------------------------------- CRM & Sales */

export const getCrmLeads = async (params = {}) => {
  let query = supabase.from('crm_leads').select('*', { count: 'exact' })

  if (params.stage && params.stage !== 'all') {
    query = query.eq('stage', params.stage)
  }
  if (params.temperature && params.temperature !== 'all') {
    query = query.eq('temperature', params.temperature)
  }
  if (params.source && params.source !== 'all') {
    query = query.eq('source', params.source)
  }

  // Ordering
  if (params.order === 'value_desc') {
    query = query.order('deal_value', { ascending: false })
  } else if (params.order === 'follow_up_asc') {
    query = query.order('next_follow_up', { ascending: true, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, count, error } = await query
  if (error) throw error
  return { items: data || [], count: count || 0 }
}

export const getCrmLead = async (id) => {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*, quote_requests(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createCrmLead = async (payload) => {
  const { data, error } = await supabase
    .from('crm_leads')
    .insert([
      {
        ...payload,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateCrmLead = async (id, patch) => {
  const { data, error } = await supabase
    .from('crm_leads')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCrmLead = async (id) => {
  const { error } = await supabase.from('crm_leads').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

export const getCrmActivities = async (leadId) => {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const addCrmActivity = async (leadId, payload) => {
  const { data, error } = await supabase
    .from('crm_activities')
    .insert([
      {
        lead_id: leadId,
        type: payload.type || 'note',
        content: payload.content || '',
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCrmActivity = async (activityId) => {
  const { error } = await supabase.from('crm_activities').delete().eq('id', activityId)
  if (error) throw error
  return { success: true }
}

// Estimated deal value (USD) for each budget option offered by the public quote
// form. Lower-middle of each range, so the pipeline total stays conservative.
const BUDGET_DEAL_VALUES = {
  'Under $500': 400,
  '$500 – $2,000': 1250,
  '$2,000 – $5,000': 3500,
  '$5,000+': 5000,
}

export const budgetToDealValue = (budget) => BUDGET_DEAL_VALUES[budget] ?? 0

export const convertQuoteToLead = async (quote) => {
  const dealValue = budgetToDealValue(quote.budget)

  const payload = {
    name: quote.name,
    email: quote.email,
    company: '',
    job_title: 'Inbound Lead',
    phone: '',
    linkedin_url: '',
    company_website: quote.project_link || '',
    stage: 'lead',
    temperature: 'hot',
    source: 'website_inbound',
    deal_value: dealValue,
    currency: 'USD',
    tech_stack: [quote.service, quote.backend].filter(Boolean),
    notes: `Website Quote Submission:\n\nService: ${quote.service}\nBackend: ${quote.backend}\nBudget: ${quote.budget}\nTimeline: ${quote.timeline}\n\nProject Details:\n${quote.project_details}`,
    quote_request_id: quote.id,
  }

  return createCrmLead(payload)
}


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

/* ---------------------------------------------------------------- public site */

export const getProfile = async () => {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getBranding = async () => {
  if (!isSupabaseConfigured) return { site_name: 'Jerry Dev Studio', logo: '', favicon: '' }
  const { data, error } = await supabase
    .from('site_branding')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data || { site_name: 'Jerry Dev Studio' }
}

export const getTheme = async () => {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('site_theme')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// Fire-and-forget page view beacon
export const trackPageView = async (path, referrer = '') => {
  if (!isSupabaseConfigured) return
  try {
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
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('skills')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to)

  if (error) throw error
  return toPaginatedResponse(data, count, page, pageSize)
}

export const getBlogPosts = async (params = {}) => {
  if (!isSupabaseConfigured) return []
  const page = parseInt(params.page, 10) || 1
  const pageSize = parseInt(params.page_size, 10) || 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .order('published_date', { ascending: false })

  // Admin sees drafts and scheduled posts if logged in; public only sees published on or before today
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session) {
    const todayStr = new Date().toISOString().slice(0, 10)
    query = query.eq('is_published', true).lte('published_date', todayStr)
  }

  const { data, count, error } = await query.range(from, to)
  if (error) throw error
  return toPaginatedResponse(data, count, page, pageSize)
}

export const getBlogPost = async (slug) => {
  if (!isSupabaseConfigured) return null
  const { data: sessionData } = await supabase.auth.getSession()
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)

  // Public visitors can only access posts that are published and whose scheduled date has arrived
  if (!sessionData?.session) {
    const todayStr = new Date().toISOString().slice(0, 10)
    query = query.eq('is_published', true).lte('published_date', todayStr)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export const getProjects = async (params = {}) => {
  if (!isSupabaseConfigured) return []
  const page = parseInt(params.page, 10) || 1
  const pageSize = parseInt(params.page_size, 10) || 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
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

  return toPaginatedResponse(formatted, count, page, pageSize)
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
  const cutoff = new Date(Date.now() - days * 86400000).toISOString()
  const { data: views } = await supabase
    .from('page_views')
    .select('*')
    .gte('created_at', cutoff)

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
  return data
}

export const deleteBlogPost = async (slug) => {
  const { error } = await supabase.from('blog_posts').delete().eq('slug', slug)
  if (error) throw error
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
  return data
}

export const deleteProject = async (id) => {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
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
  return data
}

export const deleteSkill = async (id) => {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  if (error) throw error
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
  return data
}

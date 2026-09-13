import axios from 'axios'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/tokenStore'

// In local dev this stays '/api' and Vite's dev-server proxy forwards it to
// Django. In production the frontend and backend are separate Vercel projects
// on different domains, so VITE_API_BASE_URL must point at the deployed API, e.g.
// https://your-api.vercel.app/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// A bare client for the refresh call itself, so the interceptors below can
// never recurse into their own retry logic.
const authClient = axios.create({ baseURL: API_BASE_URL })

// Set by AuthProvider so a failed refresh can drop the app back to the login
// screen. Kept as a callback to avoid importing React state into this module.
let onSessionExpired = null

export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Only one refresh in flight at a time: several requests can 401 together, and
// with token rotation the second refresh would present an already-blacklisted
// token and fail. They all await the same promise instead.
let refreshPromise = null

export function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) return Promise.reject(new Error('No refresh token stored.'))

  if (!refreshPromise) {
    refreshPromise = authClient
      .post('/auth/token/refresh/', { refresh })
      .then((res) => {
        setAccessToken(res.data.access)
        // ROTATE_REFRESH_TOKENS is on server-side, so each refresh returns a new
        // refresh token and blacklists the old one. Failing to store it here
        // would break the *next* refresh.
        if (res.data.refresh) setRefreshToken(res.data.refresh)
        return res.data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const isAuthCall = original?.url?.includes('/auth/token')
    if (error.response?.status !== 401 || original?._retried || isAuthCall) {
      return Promise.reject(error)
    }

    // A 401 on a request we never authenticated is just a protected endpoint
    // being hit anonymously — nothing to refresh.
    if (!getRefreshToken()) return Promise.reject(error)

    original._retried = true

    try {
      const token = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${token}`
      return apiClient(original)
    } catch (refreshError) {
      clearTokens()
      if (onSessionExpired) onSessionExpired()
      return Promise.reject(refreshError)
    }
  },
)

export default apiClient

/* ---------------------------------------------------------------- public site */

export const getProfile = () => apiClient.get('/profile/').then((res) => res.data)

export const getBranding = () => apiClient.get('/settings/branding/').then((res) => res.data)

// Fire-and-forget: callers don't await this, so a failure (throttled, offline)
// should never surface as an error anywhere in the public site.
export const trackPageView = (path, referrer) =>
  apiClient.post('/analytics/track/', { path, referrer }).catch(() => {})

export const getSkills = (params) => apiClient.get('/profile/skills/', { params }).then((res) => res.data)

export const getBlogPosts = (params) => apiClient.get('/blog/posts/', { params }).then((res) => res.data)

export const getBlogPost = (slug) => apiClient.get(`/blog/posts/${slug}/`).then((res) => res.data)

export const getProjects = (params) => apiClient.get('/projects/', { params }).then((res) => res.data)

export const submitQuoteRequest = (payload) => apiClient.post('/quotes/', payload).then((res) => res.data)

export const resumeDownloadUrl = `${API_BASE_URL}/profile/resume/`

/* --------------------------------------------------------------------- admin */

export const obtainTokens = (username, password) =>
  authClient.post('/auth/token/', { username, password }).then((res) => res.data)

export const blacklistRefreshToken = (refresh) =>
  authClient.post('/auth/token/blacklist/', { refresh })

export const getCurrentUser = () => apiClient.get('/auth/me/').then((res) => res.data)

export const changePassword = (payload) => apiClient.post('/auth/change-password/', payload).then((res) => res.data)

export const updateBranding = (payload) =>
  apiClient.patch('/settings/branding/', payload).then((res) => res.data)

export const getTheme = () => apiClient.get('/settings/theme/').then((res) => res.data)

export const updateTheme = (payload) => apiClient.patch('/settings/theme/', payload).then((res) => res.data)

export const getQuoteRequests = (params) => apiClient.get('/quotes/', { params }).then((res) => res.data)

export const getAnalyticsSummary = (params) =>
  apiClient.get('/analytics/summary/', { params }).then((res) => res.data)

/* ----------------------------------------------------------------- blog CMS */

// Payloads are either a plain object (JSON) or FormData when a new cover image
// is being uploaded. Axios sets the multipart content-type itself when handed
// FormData, so nothing extra is needed here.

export const createBlogPost = (payload) =>
  apiClient.post('/blog/posts/', payload).then((res) => res.data)

export const updateBlogPost = (slug, payload) =>
  apiClient.patch(`/blog/posts/${slug}/`, payload).then((res) => res.data)

export const deleteBlogPost = (slug) => apiClient.delete(`/blog/posts/${slug}/`)

// Inline image upload for the rich-text editor's content body — distinct from
// a post's own cover_image field, since a post can hold any number of these.
export const uploadBlogImage = (file) => {
  const data = new FormData()
  data.append('image', file)
  return apiClient.post('/blog/posts/upload_image/', data).then((res) => res.data)
}

/* ------------------------------------------------------------------ projects */

export const getProject = (id) => apiClient.get(`/projects/${id}/`).then((res) => res.data)

export const createProject = (payload) =>
  apiClient.post('/projects/', payload).then((res) => res.data)

export const updateProject = (id, payload) =>
  apiClient.patch(`/projects/${id}/`, payload).then((res) => res.data)

export const deleteProject = (id) => apiClient.delete(`/projects/${id}/`)

/* -------------------------------------------------------------------- skills */

export const createSkill = (payload) =>
  apiClient.post('/profile/skills/', payload).then((res) => res.data)

export const updateSkill = (id, payload) =>
  apiClient.patch(`/profile/skills/${id}/`, payload).then((res) => res.data)

export const deleteSkill = (id) => apiClient.delete(`/profile/skills/${id}/`)

/* ------------------------------------------------------------------- profile */

// Profile is a singleton: POST creates the one row (409 if it exists), PATCH updates it.
export const createProfile = (payload) =>
  apiClient.post('/profile/', payload).then((res) => res.data)

export const updateProfile = (payload) =>
  apiClient.patch('/profile/', payload).then((res) => res.data)

/* -------------------------------------------------------------- quote inbox */

export const deleteQuoteRequest = (id) => apiClient.delete(`/quotes/${id}/`)

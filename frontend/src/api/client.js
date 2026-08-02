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

export const getQuoteRequests = (params) => apiClient.get('/quotes/', { params }).then((res) => res.data)

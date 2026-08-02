// Access token lives in memory only — it's short-lived (15 min) and keeping it
// out of storage means a stored XSS payload can't read it after the fact.
//
// The refresh token has to survive a page reload, so it goes in localStorage.
// That is the deliberate trade-off for this setup: it's readable by any script
// running on the page. Acceptable for a single-admin portfolio; it would not be
// for a multi-tenant app, where an httpOnly cookie is the right answer.

const REFRESH_KEY = 'portfolio.admin.refresh'

let accessToken = null

export const getAccessToken = () => accessToken

export const setAccessToken = (token) => {
  accessToken = token || null
}

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null // private mode / storage disabled
  }
}

export const setRefreshToken = (token) => {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* nothing we can do; the session just won't survive a reload */
  }
}

export const clearTokens = () => {
  accessToken = null
  setRefreshToken(null)
}

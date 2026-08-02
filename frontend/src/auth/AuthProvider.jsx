import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  blacklistRefreshToken,
  getCurrentUser,
  obtainTokens,
  refreshAccessToken,
  setSessionExpiredHandler,
} from '../api/client'
import { AuthContext } from './authContext'
import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from './tokenStore'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // 'booting' matters: on a reload we hold the UI until we know whether the
  // stored refresh token is still good, otherwise the panel would flash the
  // login screen before restoring the session.
  const [status, setStatus] = useState('booting')

  useEffect(() => {
    let cancelled = false

    // A refresh that fails mid-session (expired or blacklisted) drops us here.
    setSessionExpiredHandler(() => {
      setUser(null)
      setStatus('anonymous')
    })

    if (!getRefreshToken()) {
      setStatus('anonymous')
      return
    }

    refreshAccessToken()
      .then(() => getCurrentUser())
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        clearTokens()
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
      setSessionExpiredHandler(null)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await obtainTokens(username, password)
    setAccessToken(data.access)
    setRefreshToken(data.refresh)
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      // Best effort — if the token is already expired the server rejects it,
      // which is fine. Local state gets cleared either way.
      if (refresh) await blacklistRefreshToken(refresh)
    } catch {
      /* ignore */
    }
    clearTokens()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isBooting: status === 'booting',
      login,
      logout,
    }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

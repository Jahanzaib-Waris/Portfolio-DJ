import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../api/supabase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('booting')

  useEffect(() => {
    let cancelled = false

    if (!isSupabaseConfigured) {
      setStatus('anonymous')
      return
    }

    // 1. Initial session check on page boot
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.email.split('@')[0],
            is_staff: true,
          })
          setStatus('authenticated')
        } else {
          setUser(null)
          setStatus('anonymous')
        }
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setStatus('anonymous')
      })

    // 2. Continuous subscription to auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.email.split('@')[0],
          is_staff: true,
        })
        setStatus('authenticated')
      } else {
        setUser(null)
        setStatus('anonymous')
      }
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    const currentUser = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.email.split('@')[0],
      is_staff: true,
    }
    setUser(currentUser)
    setStatus('authenticated')
    return currentUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
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

import { createContext, useContext } from 'react'

// Context and hook live here, apart from the provider component: a module that
// exports both components and non-components breaks Fast Refresh.
export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.')
  return context
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../auth/authContext'

export default function RequireAuth() {
  const { isAuthenticated, isBooting } = useAuth()
  const location = useLocation()

  // Don't decide anything until the boot-time refresh has resolved, or a
  // reload would bounce a perfectly valid session to the login screen.
  if (isBooting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-neon-blue" />
          <span className="system-heading">Restoring session...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // `from` lets the login page send us back where we were headed.
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

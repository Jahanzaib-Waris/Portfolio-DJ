import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/authContext'
import SystemButton from '../../components/SystemButton'

/** Turns a failed login into something user-readable. */
function describeError(error) {
  const msg = error?.message || ''
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Incorrect email or password.'
  }
  if (msg.includes('Email not confirmed')) {
    return 'Please confirm your email address or disable email confirmation in Supabase.'
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts. Try again shortly.'
  }
  return msg || 'Cannot sign in. Please verify your credentials.'
}

export default function AdminLogin() {
  const { login, isAuthenticated, isBooting } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Sign in — Control Panel'
  }, [])

  // Already signed in: redirect to destination
  if (!isBooting && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/admin'} replace />
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(form.email, form.password)
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch (err) {
      setError(describeError(err))
      setForm((prev) => ({ ...prev, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-neon-blue'

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="system-panel p-8">
          <p className="eyebrow system-heading text-xs text-neon-indigo">// Restricted</p>
          <h1 className="mt-3 text-2xl text-white">Control Panel</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your admin account.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="system-heading mb-1 block text-xs text-slate-400">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="admin@example.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="system-heading mb-1 block text-xs text-slate-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-status-red">
                {error}
              </p>
            )}

            <SystemButton type="submit" variant="primary" disabled={submitting} className="w-full">
              {submitting ? 'Signing in...' : 'Sign in'}
            </SystemButton>
          </form>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-xs text-slate-500 transition-colors hover:text-neon-blue"
        >
          &larr; Back to site
        </Link>
      </div>
    </div>
  )
}

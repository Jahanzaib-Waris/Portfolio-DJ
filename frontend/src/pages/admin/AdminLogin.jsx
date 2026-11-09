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

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function AdminLogin() {
  const { login, isAuthenticated, isBooting } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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
    'w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 focus:ring-offset-1 focus:ring-offset-void'

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="system-panel p-8">
          <h1 className="mt-3 text-2xl text-white">Control Panel</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your admin account.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="system-heading mb-1.5 block text-xs font-semibold text-slate-300">
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
              <label htmlFor="password" className="system-heading mb-1.5 block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded focus-visible:outline-neon-blue"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
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
          className="mt-6 block text-center text-xs text-slate-400 transition-colors hover:text-neon-blue"
        >
          &larr; Back to site
        </Link>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'

import { changePassword } from '../../../api/client'
import Field from '../../../components/admin/Field'
import { inputClass } from '../../../components/admin/formStyles'
import { useToast } from '../../../components/admin/toastStore'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'

const empty = { new_password: '', confirm_password: '' }

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

export default function AccountSettings() {
  const [form, setForm] = useState(empty)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    document.title = 'Account — Control Panel'
  }, [])

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setSaved(false)
  }

  const toast = useToast()

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    setFormError(null)
    setSaved(false)

    if (form.new_password !== form.confirm_password) {
      const err = 'Passwords do not match.'
      setFieldErrors({ confirm_password: err })
      toast.error(err)
      setSaving(false)
      return
    }

    if (form.new_password.length < 6) {
      const err = 'Password must be at least 6 characters.'
      setFieldErrors({ new_password: err })
      toast.error(err)
      setSaving(false)
      return
    }

    try {
      await changePassword({
        new_password: form.new_password,
      })
      setForm(empty)
      setSaved(true)
      toast.success('Admin password updated successfully!')
    } catch (error) {
      const err = error?.message || 'Failed to change password. Try again.'
      setFormError(err)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white sm:text-3xl">Account</h1>
        {saved && <span className="text-xs text-status-green font-medium">✓ Password updated</span>}
      </div>
      <p className="mt-2 text-sm text-slate-400">Change the password used to sign in to this control panel.</p>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-status-red">
          {formError}
        </p>
      )}

      <StatusPanel glow={false} className="mt-6 space-y-4 p-5">
        <form onSubmit={save} className="space-y-4">
          <Field label="New password" htmlFor="new_password" error={fieldErrors.new_password}>
            <div className="relative">
              <input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.new_password}
                onChange={(e) => update({ new_password: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded focus-visible:outline-neon-blue"
                aria-label={showNew ? 'Hide password' : 'Show password'}
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>

          <Field
            label="Confirm new password"
            htmlFor="confirm_password"
            error={fieldErrors.confirm_password}
          >
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={(e) => update({ confirm_password: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded focus-visible:outline-neon-blue"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>

          <SystemButton type="submit" disabled={saving} variant="primary">
            {saving ? 'Updating...' : 'Change password'}
          </SystemButton>
        </form>
      </StatusPanel>
    </div>
  )
}

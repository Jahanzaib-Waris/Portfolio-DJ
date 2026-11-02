import { useEffect, useState } from 'react'

import { changePassword } from '../../../api/client'
import Field from '../../../components/admin/Field'
import { inputClass } from '../../../components/admin/formStyles'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'

const empty = { new_password: '', confirm_password: '' }

export default function AccountSettings() {
  const [form, setForm] = useState(empty)
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

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    setFormError(null)
    setSaved(false)

    if (form.new_password !== form.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match.' })
      setSaving(false)
      return
    }

    if (form.new_password.length < 6) {
      setFieldErrors({ new_password: 'Password must be at least 6 characters.' })
      setSaving(false)
      return
    }

    try {
      await changePassword({
        new_password: form.new_password,
      })
      setForm(empty)
      setSaved(true)
    } catch (error) {
      setFormError(error?.message || 'Failed to change password. Try again.')
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
            <input
              id="new_password"
              type="password"
              required
              autoComplete="new-password"
              value={form.new_password}
              onChange={(e) => update({ new_password: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field
            label="Confirm new password"
            htmlFor="confirm_password"
            error={fieldErrors.confirm_password}
          >
            <input
              id="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => update({ confirm_password: e.target.value })}
              className={inputClass}
            />
          </Field>

          <SystemButton type="submit" disabled={saving} variant="primary">
            {saving ? 'Updating...' : 'Change password'}
          </SystemButton>
        </form>
      </StatusPanel>
    </div>
  )
}

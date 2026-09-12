import { useEffect, useMemo, useRef, useState } from 'react'

import { getBranding, updateBranding } from '../../../api/client'
import Field from '../../../components/admin/Field'
import { fileInputClass, inputClass } from '../../../components/admin/formStyles'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'
import { Skeleton } from '../../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../../utils/apiErrors'
import buildPayload from '../../../utils/buildPayload'

function ImageField({ label, hint, accept, existing, file, onChange, onRemove, error, previewClass }) {
  const inputRef = useRef(null)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <Field label={label} hint={hint} error={error}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className={fileInputClass}
      />
      {(preview || existing) && (
        <div className="mt-2 flex items-center gap-3">
          <img src={preview || existing} alt={`${label} preview`} className={previewClass} />
          <button
            type="button"
            onClick={() => {
              onRemove()
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="text-xs text-slate-400 transition-colors hover:text-status-red"
          >
            Remove
          </button>
        </div>
      )}
    </Field>
  )
}

export default function BrandingSettings() {
  const [siteName, setSiteName] = useState('')
  const [loadState, setLoadState] = useState('loading')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const [existingLogo, setExistingLogo] = useState(null)
  const [existingFavicon, setExistingFavicon] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [removeFavicon, setRemoveFavicon] = useState(false)

  useEffect(() => {
    document.title = 'Branding — Control Panel'

    let cancelled = false
    getBranding()
      .then((branding) => {
        if (cancelled) return
        setSiteName(branding.site_name || '')
        setExistingLogo(branding.logo || null)
        setExistingFavicon(branding.favicon || null)
        setLoadState('ready')
      })
      .catch(() => !cancelled && setLoadState('error'))

    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setFieldErrors({})
    setFormError(null)
    setSaved(false)

    try {
      const removals = [...(removeLogo ? ['logo'] : []), ...(removeFavicon ? ['favicon'] : [])]
      const payload = buildPayload(
        { site_name: siteName },
        { logo: logoFile, favicon: faviconFile },
        removals,
      )
      const result = await updateBranding(payload)

      setExistingLogo(result.logo || null)
      setExistingFavicon(result.favicon || null)
      setLogoFile(null)
      setFaviconFile(null)
      setRemoveLogo(false)
      setRemoveFavicon(false)
      setDirty(false)
      setSaved(true)
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error))
      setFormError(formErrorFrom(error))
    } finally {
      setSaving(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-status-red">Branding settings could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white sm:text-3xl">Branding</h1>
        <div className="flex items-center gap-3 text-xs">
          {dirty && <span className="text-accent">Unsaved changes</span>}
          {saved && !dirty && <span className="text-status-green">Saved</span>}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Site name, logo and favicon — used in the browser tab and this panel&rsquo;s header.
      </p>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-status-red">
          {formError}
        </p>
      )}

      <StatusPanel glow={false} className="mt-6 space-y-4 p-5">
        <Field label="Site name" htmlFor="site_name" error={messageFor(fieldErrors, 'site_name')}>
          <input
            id="site_name"
            value={siteName}
            onChange={(e) => {
              setSiteName(e.target.value)
              setDirty(true)
              setSaved(false)
            }}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            label="Logo"
            accept="image/*"
            existing={!removeLogo ? existingLogo : null}
            file={logoFile}
            previewClass="h-12 w-12 rounded-md border border-panel-edge object-contain bg-abyss/60"
            onChange={(file) => {
              setLogoFile(file)
              if (file) setRemoveLogo(false)
              setDirty(true)
              setSaved(false)
            }}
            onRemove={() => {
              setLogoFile(null)
              setRemoveLogo(true)
              setDirty(true)
              setSaved(false)
            }}
            error={messageFor(fieldErrors, 'logo')}
          />

          <ImageField
            label="Favicon"
            hint="(square image)"
            accept="image/png,image/svg+xml,image/x-icon"
            existing={!removeFavicon ? existingFavicon : null}
            file={faviconFile}
            previewClass="h-12 w-12 rounded-md border border-panel-edge object-contain bg-abyss/60"
            onChange={(file) => {
              setFaviconFile(file)
              if (file) setRemoveFavicon(false)
              setDirty(true)
              setSaved(false)
            }}
            onRemove={() => {
              setFaviconFile(null)
              setRemoveFavicon(true)
              setDirty(true)
              setSaved(false)
            }}
            error={messageFor(fieldErrors, 'favicon')}
          />
        </div>
      </StatusPanel>

      <div className="mt-6">
        <SystemButton onClick={save} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save changes'}
        </SystemButton>
      </div>
    </div>
  )
}

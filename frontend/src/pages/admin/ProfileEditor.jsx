import { useEffect, useMemo, useRef, useState } from 'react'

import { createProfile, getProfile, updateProfile } from '../../api/client'
import Field from '../../components/admin/Field'
import { fileInputClass, inputClass } from '../../components/admin/formStyles'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../utils/apiErrors'
import buildPayload from '../../utils/buildPayload'

const empty = {
  name: '',
  tagline: '',
  bio: '',
  email: '',
  github_url: '',
  linkedin_url: '',
}

export default function ProfileEditor() {
  const [form, setForm] = useState(empty)
  const [loadState, setLoadState] = useState('loading')
  // The Profile row may not exist yet — the API 404s until it's created once.
  const [exists, setExists] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [dirty, setDirty] = useState(false)

  const [existingPhoto, setExistingPhoto] = useState(null)
  const [existingResume, setExistingResume] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const photoRef = useRef(null)
  const resumeRef = useRef(null)

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  )

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  useEffect(() => {
    document.title = 'Profile — Control Panel'

    let cancelled = false
    getProfile()
      .then((profile) => {
        if (cancelled) return
        setForm({
          name: profile.name || '',
          tagline: profile.tagline || '',
          bio: profile.bio || '',
          email: profile.email || '',
          github_url: profile.github_url || '',
          linkedin_url: profile.linkedin_url || '',
        })
        setExistingPhoto(profile.photo || null)
        setExistingResume(profile.resume || null)
        setExists(true)
        setLoadState('ready')
      })
      .catch((error) => {
        if (cancelled) return
        // 404 is the expected "not configured yet" state, not a failure.
        if (error?.response?.status === 404) {
          setExists(false)
          setLoadState('ready')
        } else {
          setLoadState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setFieldErrors({})
    setFormError(null)
    setSaved(false)

    try {
      const payload = buildPayload(
        form,
        { photo: photoFile, resume: resumeFile },
        removePhoto ? ['photo'] : [],
      )
      const result = exists ? await updateProfile(payload) : await createProfile(payload)

      setExists(true)
      setDirty(false)
      setSaved(true)
      setExistingPhoto(result.photo || null)
      setExistingResume(result.resume || null)
      setPhotoFile(null)
      setResumeFile(null)
      setRemovePhoto(false)
      if (photoRef.current) photoRef.current.value = ''
      if (resumeRef.current) resumeRef.current.value = ''
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error))
      setFormError(formErrorFrom(error))
    } finally {
      setSaving(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-status-red">The profile could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <p className="eyebrow system-heading text-xs text-neon-indigo">// Content</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white sm:text-3xl">Profile</h1>
        <div className="flex items-center gap-3 text-xs">
          {dirty && <span className="text-accent">Unsaved changes</span>}
          {saved && !dirty && <span className="text-status-green">Saved</span>}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {exists
          ? 'Drives the home page hero, navbar branding and footer.'
          : 'No profile exists yet — filling this in creates it.'}
      </p>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-status-red">
          {formError}
        </p>
      )}

      <StatusPanel glow={false} className="mt-6 space-y-4 p-5">
        <Field label="Name" htmlFor="name" error={messageFor(fieldErrors, 'name')}>
          <input
            id="name"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Tagline"
          hint="(one line under your name)"
          htmlFor="tagline"
          error={messageFor(fieldErrors, 'tagline')}
        >
          <input
            id="tagline"
            maxLength={200}
            value={form.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Bio" htmlFor="bio" error={messageFor(fieldErrors, 'bio')}>
          <textarea
            id="bio"
            rows={4}
            value={form.bio}
            onChange={(e) => update({ bio: e.target.value })}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={messageFor(fieldErrors, 'email')}>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="GitHub URL" htmlFor="github_url" error={messageFor(fieldErrors, 'github_url')}>
            <input
              id="github_url"
              type="url"
              value={form.github_url}
              onChange={(e) => update({ github_url: e.target.value })}
              placeholder="https://github.com/..."
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="LinkedIn URL" htmlFor="linkedin_url" error={messageFor(fieldErrors, 'linkedin_url')}>
          <input
            id="linkedin_url"
            type="url"
            value={form.linkedin_url}
            onChange={(e) => update({ linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/..."
            className={inputClass}
          />
        </Field>
      </StatusPanel>

      <StatusPanel glow={false} className="mt-5 grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Photo" error={messageFor(fieldErrors, 'photo')}>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setPhotoFile(file)
              if (file) setRemovePhoto(false)
              setDirty(true)
            }}
            className={fileInputClass}
          />
          {(photoPreview || (existingPhoto && !removePhoto)) && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={photoPreview || existingPhoto}
                alt="Profile preview"
                className="h-14 w-14 rounded-full border border-panel-edge object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null)
                  setRemovePhoto(true)
                  if (photoRef.current) photoRef.current.value = ''
                  setDirty(true)
                }}
                className="text-xs text-slate-400 transition-colors hover:text-status-red"
              >
                Remove
              </button>
            </div>
          )}
          {removePhoto && <p className="mt-2 text-xs text-accent">Photo will be removed on save.</p>}
        </Field>

        <Field label="Resume" hint="(PDF)" error={messageFor(fieldErrors, 'resume')}>
          <input
            ref={resumeRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setResumeFile(e.target.files?.[0] || null)
              setDirty(true)
            }}
            className={fileInputClass}
          />
          {resumeFile ? (
            <p className="mt-2 text-xs text-slate-400">Selected: {resumeFile.name}</p>
          ) : (
            existingResume && (
              <a
                href={existingResume}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-neon-blue hover:glow-text"
              >
                View current resume
              </a>
            )
          )}
        </Field>
      </StatusPanel>

      <div className="mt-6">
        <SystemButton onClick={save} disabled={saving} variant="primary">
          {saving ? 'Saving...' : exists ? 'Save changes' : 'Create profile'}
        </SystemButton>
      </div>
    </div>
  )
}

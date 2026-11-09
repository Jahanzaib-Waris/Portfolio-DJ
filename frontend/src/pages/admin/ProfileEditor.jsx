import { useEffect, useMemo, useRef, useState } from 'react'

import { createProfile, getProfile, updateProfile } from '../../api/client'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import Field from '../../components/admin/Field'
import { fileInputClass, inputClass } from '../../components/admin/formStyles'
import { useToast } from '../../components/admin/toastStore'
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
  const toast = useToast()
  const [form, setForm] = useState(empty)
  const [loadState, setLoadState] = useState('loading')
  // The Profile row may not exist yet — the API 404s until it's created once.
  const [exists, setExists] = useState(false)

  const [saving, setSaving] = useState(false)
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
  }

  const save = async () => {
    setSaving(true)
    setFieldErrors({})
    setFormError(null)

    try {
      const payload = buildPayload(
        form,
        { photo: photoFile, resume: resumeFile },
        removePhoto ? ['photo'] : [],
      )
      const saved = exists ? await updateProfile(payload) : await createProfile(payload)

      setExists(true)
      setDirty(false)
      setExistingPhoto(saved.photo || null)
      setExistingResume(saved.resume || null)
      setPhotoFile(null)
      setResumeFile(null)
      setRemovePhoto(false)
      if (photoRef.current) photoRef.current.value = ''
      if (resumeRef.current) resumeRef.current.value = ''
      toast.success('Studio profile updated successfully!')
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error))
      const err = formErrorFrom(error) || error?.message || 'Failed to save profile'
      setFormError(err)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-status-red">The profile could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Portfolio', to: '/admin/projects' },
          { label: 'Profile' },
        ]}
        title="Studio Profile"
        subtitle="Drives the home page hero, navbar branding, bio, and social metadata."
        dirty={dirty}
        saving={saving}
        onSave={save}
        saveLabel={exists ? 'Save Changes' : 'Create Profile'}
      />

      {formError && (
        <div role="alert" className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm">
          {formError}
        </div>
      )}

      <StatusPanel glow={false} className="space-y-5 p-6">
        <Field label="Display Name" htmlFor="name" error={messageFor(fieldErrors, 'name')}>
          <input
            id="name"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className={inputClass}
            placeholder="Jerry Waris"
          />
        </Field>

        <Field label="Professional Tagline" htmlFor="tagline" error={messageFor(fieldErrors, 'tagline')}>
          <input
            id="tagline"
            value={form.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            className={inputClass}
            placeholder="FlutterFlow Architect & Full-Stack Engineer"
          />
        </Field>

        <Field label="Biography" htmlFor="bio" error={messageFor(fieldErrors, 'bio')}>
          <textarea
            id="bio"
            rows={5}
            value={form.bio}
            onChange={(e) => update({ bio: e.target.value })}
            className={inputClass}
            placeholder="Tell prospective clients and employers about your engineering background, specializations, and approach..."
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Public Contact Email" htmlFor="email" error={messageFor(fieldErrors, 'email')}>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              className={inputClass}
              placeholder="contact@studio.com"
            />
          </Field>

          <Field label="GitHub Profile URL" htmlFor="github_url" error={messageFor(fieldErrors, 'github_url')}>
            <input
              id="github_url"
              type="url"
              value={form.github_url}
              onChange={(e) => update({ github_url: e.target.value })}
              placeholder="https://github.com/..."
              className={inputClass}
            />
          </Field>

          <Field label="LinkedIn Profile URL" htmlFor="linkedin_url" error={messageFor(fieldErrors, 'linkedin_url')}>
            <input
              id="linkedin_url"
              type="url"
              value={form.linkedin_url}
              onChange={(e) => update({ linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 pt-4 border-t border-panel-edge">
          <Field label="Profile Avatar / Photo" error={messageFor(fieldErrors, 'photo')}>
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
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={photoPreview || existingPhoto}
                  alt="Profile"
                  className="h-16 w-16 rounded-full border border-panel-edge object-cover shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setRemovePhoto(true)
                    if (photoRef.current) photoRef.current.value = ''
                    setDirty(true)
                  }}
                  className="px-2.5 py-1 text-xs rounded border border-panel-edge text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                >
                  Remove Photo
                </button>
              </div>
            )}
            {removePhoto && <p className="mt-2 text-xs text-amber-400">Photo will be removed on save.</p>}
          </Field>

          <Field label="Resume / CV Document" hint="(PDF file)" error={messageFor(fieldErrors, 'resume')}>
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
              <p className="mt-2 text-xs text-slate-300">Selected: {resumeFile.name}</p>
            ) : (
              existingResume && (
                <a
                  href={existingResume}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-neon-blue hover:underline"
                >
                  <span>View current uploaded resume</span>
                  <span>↗</span>
                </a>
              )
            )}
          </Field>
        </div>
      </StatusPanel>

      <div className="mt-6 flex justify-end">
        <SystemButton onClick={save} disabled={saving} variant="primary">
          {saving ? 'Saving...' : exists ? 'Save Changes' : 'Create Profile'}
        </SystemButton>
      </div>
    </div>
  )
}

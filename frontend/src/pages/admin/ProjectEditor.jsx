import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { createProject, getProject, updateProject } from '../../api/client'
import Field from '../../components/admin/Field'
import { fileInputClass, inputClass } from '../../components/admin/formStyles'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../utils/apiErrors'
import buildPayload from '../../utils/buildPayload'

const empty = {
  title: '',
  description: '',
  tech_stack: '',
  repo_url: '',
  live_url: '',
  display_order: 0,
  is_featured: false,
}

export default function ProjectEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()

  const [form, setForm] = useState(empty)
  const [loadState, setLoadState] = useState(isNew ? 'ready' : 'loading')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [dirty, setDirty] = useState(false)

  const [existingThumb, setExistingThumb] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [removeThumb, setRemoveThumb] = useState(false)
  const fileRef = useRef(null)

  const thumbPreview = useMemo(
    () => (thumbFile ? URL.createObjectURL(thumbFile) : null),
    [thumbFile],
  )

  useEffect(() => {
    return () => {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    }
  }, [thumbPreview])

  useEffect(() => {
    document.title = isNew ? 'New project — Control Panel' : 'Edit project — Control Panel'
  }, [isNew])

  useEffect(() => {
    if (isNew) return

    let cancelled = false
    getProject(id)
      .then((project) => {
        if (cancelled) return
        setForm({
          title: project.title || '',
          description: project.description || '',
          tech_stack: project.tech_stack || '',
          repo_url: project.repo_url || '',
          live_url: project.live_url || '',
          display_order: project.display_order ?? 0,
          is_featured: project.is_featured ?? false,
        })
        setExistingThumb(project.thumbnail || null)
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [isNew, id])

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

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null
    setThumbFile(file)
    if (file) setRemoveThumb(false)
    setDirty(true)
  }

  const clearThumb = () => {
    setThumbFile(null)
    setRemoveThumb(true)
    if (fileRef.current) fileRef.current.value = ''
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    setFieldErrors({})
    setFormError(null)

    try {
      const payload = buildPayload(
        form,
        { thumbnail: thumbFile },
        removeThumb ? ['thumbnail'] : [],
      )
      const saved = isNew ? await createProject(payload) : await updateProject(id, payload)

      setDirty(false)
      setExistingThumb(saved.thumbnail || null)
      setThumbFile(null)
      setRemoveThumb(false)
      if (fileRef.current) fileRef.current.value = ''
      if (isNew) navigate(`/admin/projects/${saved.id}/edit`, { replace: true })
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
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-status-red">That project could not be loaded.</p>
        <Link to="/admin/projects" className="mt-4 inline-block text-sm text-neon-blue">
          &larr; Back to projects
        </Link>
      </div>
    )
  }

  const previewTags = form.tech_stack
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <Link to="/admin/projects" className="text-xs text-slate-400 transition-colors hover:text-neon-blue">
        &larr; Back to projects
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white">{isNew ? 'New project' : 'Edit project'}</h1>
        {dirty && <span className="text-xs text-accent">Unsaved changes</span>}
      </div>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-status-red">
          {formError}
        </p>
      )}

      <StatusPanel glow={false} className="mt-6 space-y-4 p-5">
        <Field label="Title" htmlFor="title" error={messageFor(fieldErrors, 'title')}>
          <input
            id="title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Description" htmlFor="description" error={messageFor(fieldErrors, 'description')}>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Tech stack"
          hint="(comma separated)"
          htmlFor="tech_stack"
          error={messageFor(fieldErrors, 'tech_stack')}
        >
          <input
            id="tech_stack"
            value={form.tech_stack}
            onChange={(e) => update({ tech_stack: e.target.value })}
            placeholder="Django, React, Tailwind"
            className={inputClass}
          />
          {previewTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {previewTags.map((tag) => (
                <span
                  key={tag}
                  className="border border-neon-indigo/50 px-2 py-0.5 text-[10px] text-neon-indigo"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Repo URL" htmlFor="repo_url" error={messageFor(fieldErrors, 'repo_url')}>
            <input
              id="repo_url"
              type="url"
              value={form.repo_url}
              onChange={(e) => update({ repo_url: e.target.value })}
              placeholder="https://github.com/..."
              className={inputClass}
            />
          </Field>

          <Field label="Live URL" htmlFor="live_url" error={messageFor(fieldErrors, 'live_url')}>
            <input
              id="live_url"
              type="url"
              value={form.live_url}
              onChange={(e) => update({ live_url: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Display order"
            hint="(lower shows first)"
            htmlFor="display_order"
            error={messageFor(fieldErrors, 'display_order')}
          >
            <input
              id="display_order"
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) => update({ display_order: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Featured" hint="(shown on the home page)">
            <label className="flex items-center gap-2 pt-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => update({ is_featured: e.target.checked })}
                className="h-4 w-4 rounded border-panel-edge bg-abyss/60 accent-neon-blue"
              />
              Show in Featured Work
            </label>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Thumbnail" error={messageFor(fieldErrors, 'thumbnail')}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className={fileInputClass}
            />
            {(thumbPreview || (existingThumb && !removeThumb)) && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={thumbPreview || existingThumb}
                  alt="Thumbnail preview"
                  className="h-12 w-20 rounded border border-panel-edge object-cover"
                />
                <button
                  type="button"
                  onClick={clearThumb}
                  className="text-xs text-slate-400 transition-colors hover:text-status-red"
                >
                  Remove
                </button>
              </div>
            )}
            {removeThumb && (
              <p className="mt-2 text-xs text-accent">Thumbnail will be removed on save.</p>
            )}
          </Field>
        </div>
      </StatusPanel>

      <div className="mt-6">
        <SystemButton onClick={save} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save'}
        </SystemButton>
      </div>
    </div>
  )
}

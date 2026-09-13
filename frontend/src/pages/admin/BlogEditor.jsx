import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { createBlogPost, getBlogPost, updateBlogPost } from '../../api/client'
import RichTextEditor from '../../components/admin/RichTextEditor'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../utils/apiErrors'
import buildPayload from '../../utils/buildPayload'
import slugify from '../../utils/slugify'

const today = () => new Date().toISOString().slice(0, 10)

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  published_date: today(),
  is_published: false,
}

const inputClass =
  'w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-neon-blue'

export default function BlogEditor() {
  const { slug: routeSlug } = useParams()
  const isNew = !routeSlug
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyPost)
  const [loadState, setLoadState] = useState(isNew ? 'ready' : 'loading')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [dirty, setDirty] = useState(false)

  const [existingCover, setExistingCover] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [removeCover, setRemoveCover] = useState(false)
  const fileInputRef = useRef(null)

  // Once the author edits the slug by hand, stop overwriting it from the title.
  const slugTouched = useRef(false)

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  )

  useEffect(() => {
    // Object URLs leak until revoked.
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  useEffect(() => {
    document.title = isNew ? 'New post — Control Panel' : 'Edit post — Control Panel'
  }, [isNew])

  useEffect(() => {
    if (isNew) return

    let cancelled = false
    getBlogPost(routeSlug)
      .then((post) => {
        if (cancelled) return
        setForm({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          published_date: post.published_date || today(),
          is_published: Boolean(post.is_published),
        })
        setExistingCover(post.cover_image || null)
        slugTouched.current = true // an existing slug is a published URL; don't rewrite it
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [isNew, routeSlug])

  // Warn before losing an unsaved draft to a tab close or reload.
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }, [])

  const handleTitle = (value) => {
    // Only mirror the title into the slug while it's still untouched.
    update(slugTouched.current ? { title: value } : { title: value, slug: slugify(value) })
  }

  const handleSlug = (value) => {
    slugTouched.current = true
    update({ slug: slugify(value) })
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null
    setCoverFile(file)
    if (file) setRemoveCover(false)
    setDirty(true)
  }

  const clearCover = () => {
    setCoverFile(null)
    setRemoveCover(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDirty(true)
  }

  const payloadFor = (isPublished) =>
    buildPayload(
      {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        published_date: form.published_date,
        is_published: isPublished,
      },
      { cover_image: coverFile },
      removeCover ? ['cover_image'] : [],
    )

  const save = async (publishOverride) => {
    setSaving(true)
    setFieldErrors({})
    setFormError(null)

    // "Save & publish" / "Unpublish" override the current flag for this save.
    const isPublished = publishOverride === undefined ? form.is_published : publishOverride

    try {
      const payload = payloadFor(isPublished)
      const saved = isNew
        ? await createBlogPost(payload)
        : await updateBlogPost(routeSlug, payload)

      setDirty(false)
      // The slug is the lookup key, so renaming it changes this page's URL.
      navigate(`/admin/blog/${saved.slug}/edit`, { replace: true })
      setExistingCover(saved.cover_image || null)
      setCoverFile(null)
      setRemoveCover(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setForm((prev) => ({ ...prev, is_published: Boolean(saved.is_published) }))
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error))
      setFormError(formErrorFrom(error))
    } finally {
      setSaving(false)
    }
  }

  const errorFor = (field) => {
    const message = messageFor(fieldErrors, field)
    return message ? <p className="mt-1 text-xs text-status-red">{message}</p> : null
  }

  if (loadState === 'loading') {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-status-red">That post could not be loaded.</p>
        <Link to="/admin/blog" className="mt-4 inline-block text-sm text-neon-blue">
          &larr; Back to posts
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <Link to="/admin/blog" className="text-xs text-slate-400 transition-colors hover:text-neon-blue">
        &larr; Back to posts
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white">{isNew ? 'New post' : 'Edit post'}</h1>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-accent">Unsaved changes</span>}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              form.is_published ? 'bg-status-green/10 text-status-green' : 'bg-accent/10 text-accent'
            }`}
          >
            {form.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-status-red">
          {formError}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <StatusPanel glow={false} className="space-y-4 p-5">
          <div>
            <label htmlFor="title" className="system-heading mb-1 block text-xs text-slate-400">
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => handleTitle(e.target.value)}
              className={inputClass}
            />
            {errorFor('title')}
          </div>

          <div>
            <label htmlFor="slug" className="system-heading mb-1 block text-xs text-slate-400">
              Slug <span className="text-slate-600">(the URL: /blogs/{form.slug || '...'})</span>
            </label>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => handleSlug(e.target.value)}
              className={inputClass}
            />
            {errorFor('slug')}
          </div>

          <div>
            <label htmlFor="excerpt" className="system-heading mb-1 block text-xs text-slate-400">
              Excerpt <span className="text-slate-600">(shown on the blog list)</span>
            </label>
            <textarea
              id="excerpt"
              rows={2}
              maxLength={300}
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              className={inputClass}
            />
            <p className="mt-1 text-right text-[10px] text-slate-600">{form.excerpt.length}/300</p>
            {errorFor('excerpt')}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="published_date" className="system-heading mb-1 block text-xs text-slate-400">
                Published date
              </label>
              <input
                id="published_date"
                type="date"
                value={form.published_date}
                onChange={(e) => update({ published_date: e.target.value })}
                className={inputClass}
              />
              {errorFor('published_date')}
            </div>

            <div>
              <span className="system-heading mb-1 block text-xs text-slate-400">Cover image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border file:border-panel-edge file:bg-abyss/60 file:px-3 file:py-1.5 file:text-xs file:text-slate-200"
              />
              {errorFor('cover_image')}

              {(coverPreview || (existingCover && !removeCover)) && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={coverPreview || existingCover}
                    alt="Cover preview"
                    className="h-12 w-20 rounded border border-panel-edge object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearCover}
                    className="text-xs text-slate-400 transition-colors hover:text-status-red"
                  >
                    Remove
                  </button>
                </div>
              )}
              {removeCover && <p className="mt-2 text-xs text-accent">Cover will be removed on save.</p>}
            </div>
          </div>
        </StatusPanel>

        <StatusPanel glow={false} className="p-5">
          <RichTextEditor value={form.content} onChange={(content) => update({ content })} />
          {errorFor('content')}
        </StatusPanel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SystemButton onClick={() => save()} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save'}
        </SystemButton>

        {form.is_published ? (
          <SystemButton onClick={() => save(false)} disabled={saving}>
            Unpublish
          </SystemButton>
        ) : (
          <SystemButton onClick={() => save(true)} disabled={saving}>
            Save &amp; publish
          </SystemButton>
        )}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { createBlogPost, getBlogPost, updateBlogPost } from '../../api/client'
import RichTextEditor from '../../components/admin/RichTextEditor'
import BlogBlockBuilder from '../../components/admin/BlogBlockBuilder'
import BlockPropertiesDrawer from '../../components/admin/BlockPropertiesDrawer'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../utils/apiErrors'
import buildPayload from '../../utils/buildPayload'
import slugify from '../../utils/slugify'
import { compileBlocksToHTML, parseHTMLToBlocks, createDefaultBlock } from '../../utils/blogBlocks'

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

  // Editor modes: 'blocks' (Gutenberg / Elementor modular canvas) or 'classic' (TipTap WYSIWYG)
  const [editorMode, setEditorMode] = useState('blocks')
  const [blocks, setBlocks] = useState([createDefaultBlock('paragraph')])
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState('settings') // 'settings' | 'block'

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

        // Parse content into blocks
        const parsed = parseHTMLToBlocks(post.content || '')
        setBlocks(parsed)
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

  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks)
    // Synchronize compiled HTML to form.content so save always has latest HTML
    const compiled = compileBlocksToHTML(newBlocks)
    setForm((prev) => ({ ...prev, content: compiled }))
    setDirty(true)
  }

  const handleSelectBlock = (blockId) => {
    setSelectedBlockId(blockId)
    if (blockId) {
      setSidebarOpen(true)
      setSidebarTab('block')
    }
  }

  const handleUpdateSelectedBlock = (patch) => {
    const index = blocks.findIndex((b) => b.id === selectedBlockId)
    if (index === -1) return
    const next = [...blocks]
    next[index] = { ...next[index], ...patch }
    handleBlocksChange(next)
  }

  const handleDeleteBlock = (index) => {
    const target = blocks[index]
    const next = blocks.filter((_, i) => i !== index)
    handleBlocksChange(next.length > 0 ? next : [createDefaultBlock('paragraph')])
    if (selectedBlockId === target?.id) {
      setSelectedBlockId(null)
      setSidebarTab('settings')
    }
  }

  const handleDuplicateBlock = (index) => {
    const target = blocks[index]
    const clone = { ...JSON.parse(JSON.stringify(target)), id: createBlockId() }
    const next = [...blocks]
    next.splice(index + 1, 0, clone)
    handleBlocksChange(next)
    setSelectedBlockId(clone.id)
    setSidebarTab('block')
  }

  const handleMoveBlock = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= blocks.length) return
    const next = [...blocks]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    handleBlocksChange(next)
  }

  const switchMode = (newMode) => {
    if (newMode === editorMode) return
    if (newMode === 'classic') {
      // Compiling current blocks to HTML before switching to classic editor
      const compiled = compileBlocksToHTML(blocks)
      setForm((prev) => ({ ...prev, content: compiled }))
      setSelectedBlockId(null)
      setSidebarTab('settings')
    } else if (newMode === 'blocks') {
      // Re-parsing HTML back to blocks
      const parsed = parseHTMLToBlocks(form.content)
      setBlocks(parsed)
    }
    setEditorMode(newMode)
  }

  const payloadFor = (isPublished) => {
    // Ensure content is up to date based on active editor mode
    const content = editorMode === 'blocks' ? compileBlocksToHTML(blocks) : form.content
    return buildPayload(
      {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content,
        published_date: form.published_date,
        is_published: isPublished,
      },
      { cover_image: coverFile },
      removeCover ? ['cover_image'] : [],
    )
  }

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

  const selectedBlockIndex = useMemo(
    () => blocks.findIndex((b) => b.id === selectedBlockId),
    [blocks, selectedBlockId],
  )
  const selectedBlock = selectedBlockIndex !== -1 ? blocks[selectedBlockIndex] : null

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
    <div className="mx-auto max-w-7xl pb-16">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-panel-edge/80 bg-abyss/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/blog"
            className="rounded-lg border border-panel-edge/80 bg-white/[0.02] p-1.5 text-xs text-slate-400 transition-colors hover:border-neon-blue hover:text-white"
            title="Back to post list"
          >
            &larr;
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-tight">
                {form.title ? form.title : isNew ? 'Untitled Post' : 'Edit Post'}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide ${
                  form.is_published ? 'bg-status-green/10 text-status-green' : 'bg-accent/10 text-accent'
                }`}
              >
                {form.is_published ? 'Published' : 'Draft'}
              </span>
              {dirty && <span className="text-[11px] text-accent font-medium">• Unsaved changes</span>}
            </div>
            {form.slug && (
              <span className="font-mono text-[11px] text-slate-500">/blogs/{form.slug}</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Sidebar settings */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              sidebarOpen
                ? 'border-neon-blue/60 bg-neon-blue/10 text-neon-blue'
                : 'border-panel-edge bg-abyss/60 text-slate-400 hover:text-white'
            }`}
            title="Toggle post settings panel"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Post Settings
          </button>

          <SystemButton onClick={() => save()} disabled={saving} variant="primary">
            {saving ? 'Saving...' : 'Save Draft'}
          </SystemButton>

          {form.is_published ? (
            <SystemButton onClick={() => save(false)} disabled={saving}>
              Unpublish
            </SystemButton>
          ) : (
            <SystemButton onClick={() => save(true)} disabled={saving}>
              Publish
            </SystemButton>
          )}
        </div>
      </div>

      {formError && (
        <div className="mb-4 rounded-xl border border-status-red/40 bg-status-red/10 p-3 text-xs text-status-red">
          {formError}
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Main Content Area (8 cols if sidebar open, 12 cols if collapsed) */}
        <div className={`${sidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          {/* Inline Title & Excerpt Quick Field */}
          <StatusPanel glow={false} className="p-5 space-y-3">
            <div>
              <input
                id="title"
                placeholder="Post Title..."
                value={form.title}
                onChange={(e) => handleTitle(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 outline-none"
              />
              {errorFor('title')}
            </div>

            <div>
              <input
                id="slug"
                placeholder="url-slug (auto-generated from title)"
                value={form.slug}
                onChange={(e) => handleSlug(e.target.value)}
                className="w-full font-mono text-xs text-slate-400 bg-transparent placeholder-slate-700 outline-none"
              />
              {errorFor('slug')}
            </div>
          </StatusPanel>

          {/* Builder Canvas */}
          <StatusPanel glow={false} className="p-5">
            {/* Mode Switcher */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-panel-edge/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Editor Mode:</span>
                <div className="flex items-center rounded-lg border border-panel-edge bg-abyss/80 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => switchMode('blocks')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                      editorMode === 'blocks'
                        ? 'bg-neon-blue/20 text-neon-blue shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Block Builder (Gutenberg)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('classic')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                      editorMode === 'classic'
                        ? 'bg-neon-blue/20 text-neon-blue shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Classic Editor
                  </button>
                </div>
              </div>
            </div>

            {editorMode === 'blocks' ? (
              <BlogBlockBuilder
                blocks={blocks}
                onChange={handleBlocksChange}
                selectedBlockId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
              />
            ) : (
              <RichTextEditor value={form.content} onChange={(content) => update({ content })} />
            )}

            {errorFor('content')}
          </StatusPanel>
        </div>

        {/* Collapsible Sidebar: Post Settings vs Block Inspector (4 cols) */}
        {sidebarOpen && (
          <div className="lg:col-span-4 space-y-4">
            <StatusPanel glow={false} className="p-0 overflow-hidden border border-panel-edge/80">
              {/* Tab Selector Header */}
              <div className="flex items-center justify-between border-b border-panel-edge/60 bg-abyss/80 px-3 py-2">
                <div className="flex items-center gap-1 rounded-lg border border-panel-edge bg-slate-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('settings')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      sidebarTab === 'settings'
                        ? 'bg-neon-blue/20 text-neon-blue font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Post Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('block')}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      sidebarTab === 'block'
                        ? 'bg-neon-blue/20 text-neon-blue font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Block Inspector</span>
                    {selectedBlock && (
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-blue" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  title="Close sidebar"
                  className="rounded p-1 text-slate-500 hover:bg-panel-edge hover:text-slate-200 text-xs"
                >
                  &times;
                </button>
              </div>

              {/* Tab Content: Block Inspector */}
              {sidebarTab === 'block' ? (
                selectedBlock ? (
                  <BlockPropertiesDrawer
                    block={selectedBlock}
                    index={selectedBlockIndex}
                    totalBlocks={blocks.length}
                    onUpdate={handleUpdateSelectedBlock}
                    onClose={() => setSidebarTab('settings')}
                    onDelete={handleDeleteBlock}
                    onDuplicate={handleDuplicateBlock}
                    onMove={handleMoveBlock}
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <p className="text-slate-400 font-medium">No block selected</p>
                    <p className="text-[11px] leading-relaxed">
                      Click any block on the canvas to inspect and edit its properties here.
                    </p>
                  </div>
                )
              ) : (
                /* Tab Content: Post Settings */
                <div className="p-4 space-y-4">
                  <div>
                    <label htmlFor="published_date" className="system-heading mb-1 block text-xs text-slate-400">
                      Publication Date
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
                    <label htmlFor="excerpt" className="system-heading mb-1 block text-xs text-slate-400">
                      Summary / Excerpt
                    </label>
                    <textarea
                      id="excerpt"
                      rows={3}
                      maxLength={300}
                      placeholder="Short post preview for listing cards and SEO meta..."
                      value={form.excerpt}
                      onChange={(e) => update({ excerpt: e.target.value })}
                      className={inputClass}
                    />
                    <p className="mt-1 text-right text-[10px] text-slate-500">{form.excerpt.length}/300</p>
                    {errorFor('excerpt')}
                  </div>

                  <div>
                    <span className="system-heading mb-1 block text-xs text-slate-400">Featured Cover Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="w-full text-xs text-slate-400 file:mr-2 file:rounded file:border file:border-panel-edge file:bg-abyss/60 file:px-2.5 file:py-1 file:text-xs file:text-slate-200"
                    />
                    {errorFor('cover_image')}

                    {(coverPreview || (existingCover && !removeCover)) && (
                      <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-panel-edge bg-abyss/80 p-2">
                        <img
                          src={coverPreview || existingCover}
                          alt="Cover preview"
                          className="h-14 w-20 rounded border border-panel-edge object-cover"
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
                    {removeCover && <p className="mt-1.5 text-xs text-accent">Cover will be removed on save.</p>}
                  </div>
                </div>
              )}
            </StatusPanel>
          </div>
        )}
      </div>
    </div>
  )
}

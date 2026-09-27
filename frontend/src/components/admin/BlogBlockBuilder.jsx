import { useState } from 'react'
import MiniRichTextEditor from './MiniRichTextEditor'
import { createBlockId, createDefaultBlock } from '../../utils/blogBlocks'
import { uploadBlogImage } from '../../api/client'

const AVAILABLE_BLOCKS = [
  {
    type: 'paragraph',
    label: 'Text / Paragraph',
    desc: 'Rich text paragraph with inline links, bold, code & lists',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    ),
  },
  {
    type: 'heading',
    label: 'Heading & Subhead',
    desc: 'H2, H3 or H4 with optional kicker/tagline',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 4v16m12-16v16m-12-8h12" />
      </svg>
    ),
  },
  {
    type: 'callout',
    label: 'Callout / Notice Box',
    desc: 'Highlighted note, tip, warning, or success box',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'code',
    label: 'Code Snippet',
    desc: 'Terminal or code window with language tag & title',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    type: 'image',
    label: 'Image & Caption',
    desc: 'Upload file or image URL with layout options',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'quote',
    label: 'Quote / Testimonial',
    desc: 'Styled pull quote with speaker & role attribution',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    type: 'cta',
    label: 'CTA / Action Banner',
    desc: 'FlowBase gradient action card with direct link button',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    type: 'columns',
    label: '2-Column Split',
    desc: 'Side-by-side comparison, code & text, or 2 content halves',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1zm10 0h-4a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1z" />
      </svg>
    ),
  },
  {
    type: 'divider',
    label: 'Horizontal Rule / Divider',
    desc: 'Section break with hairline gradient accent',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 12H4" />
      </svg>
    ),
  },
]

export default function BlogBlockBuilder({ blocks, onChange }) {
  const [insertIndex, setInsertIndex] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const updateBlock = (index, patch) => {
    const next = [...blocks]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const removeBlock = (index) => {
    const next = blocks.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [createDefaultBlock('paragraph')])
  }

  const duplicateBlock = (index) => {
    const target = blocks[index]
    const clone = { ...JSON.parse(JSON.stringify(target)), id: createBlockId() }
    const next = [...blocks]
    next.splice(index + 1, 0, clone)
    onChange(next)
  }

  const moveBlock = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= blocks.length) return
    const next = [...blocks]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onChange(next)
  }

  const handleAddBlock = (type, targetIndex = null) => {
    const newBlock = createDefaultBlock(type)
    const next = [...blocks]
    if (targetIndex === null || targetIndex === undefined) {
      next.push(newBlock)
    } else {
      next.splice(targetIndex, 0, newBlock)
    }
    onChange(next)
    setInsertIndex(null)
  }

  // Drag and Drop reordering handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveBlock(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="fb-builder space-y-4">
      {/* Top Header / Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-edge/60 pb-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-neon-blue">Modular Content Builder</span>
          <p className="text-xs text-slate-400">
            Add, edit, and drag-and-drop Gutenberg/Elementor style content blocks for this post.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInsertIndex(blocks.length)}
          className="system-button-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Add Block
        </button>
      </div>

      {/* Block Canvas */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index

          return (
            <div
              key={block.id || index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`group relative rounded-xl border transition-all ${
                isDragging
                  ? 'opacity-40 border-dashed border-neon-blue bg-neon-blue/5'
                  : isDragOver
                  ? 'border-neon-blue ring-2 ring-neon-blue/30 bg-abyss/80'
                  : 'border-panel-edge/80 bg-abyss/40 hover:border-panel-edge'
              }`}
            >
              {/* Block Header / Action Bar */}
              <div className="flex items-center justify-between border-b border-panel-edge/50 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    title="Drag to reorder"
                    className="cursor-grab text-slate-500 hover:text-slate-200 active:cursor-grabbing"
                  >
                    ⠿
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-neon-blue/90">
                    {block.type}
                  </span>
                  <span className="text-[10px] text-slate-600">#{index + 1}</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Up / Down Controls */}
                  <button
                    type="button"
                    onClick={() => moveBlock(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded p-1 hover:bg-panel-edge/60 hover:text-slate-200 disabled:opacity-20"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, index + 1)}
                    disabled={index === blocks.length - 1}
                    title="Move down"
                    className="rounded p-1 hover:bg-panel-edge/60 hover:text-slate-200 disabled:opacity-20"
                  >
                    &darr;
                  </button>
                  {/* Insert below */}
                  <button
                    type="button"
                    onClick={() => setInsertIndex(index + 1)}
                    title="Insert block below"
                    className="rounded p-1 hover:bg-panel-edge/60 hover:text-neon-blue"
                  >
                    +
                  </button>
                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => duplicateBlock(index)}
                    title="Duplicate block"
                    className="rounded p-1 hover:bg-panel-edge/60 hover:text-slate-200"
                  >
                    &#x2398;
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    title="Delete block"
                    className="rounded p-1 hover:bg-panel-edge/60 hover:text-status-red"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Block Content Editor Form */}
              <div className="p-3">
                <BlockForm
                  block={block}
                  index={index}
                  onUpdate={(patch) => updateBlock(index, patch)}
                />
              </div>

              {/* In-between Add Handle button */}
              <div className="relative flex justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => setInsertIndex(index + 1)}
                  className="absolute -bottom-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-panel-edge bg-slate-900 text-xs text-slate-400 opacity-0 transition-all hover:scale-110 hover:border-neon-blue hover:text-neon-blue group-hover:opacity-100"
                  title="Add block here"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State / Bottom Add Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => setInsertIndex(blocks.length)}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-panel-edge px-4 py-3 text-xs text-slate-400 transition-colors hover:border-neon-blue hover:bg-abyss/50 hover:text-neon-blue"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add another block
        </button>
      </div>

      {/* Block Type Picker Modal */}
      {insertIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-panel-edge bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-panel-edge pb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Choose a Block</h3>
                <p className="text-xs text-slate-400">Select the component you want to add to this post</p>
              </div>
              <button
                type="button"
                onClick={() => setInsertIndex(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-panel-edge hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {AVAILABLE_BLOCKS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleAddBlock(item.type, insertIndex)}
                  className="flex items-start gap-3 rounded-xl border border-panel-edge/70 bg-white/[0.02] p-3 text-left transition-all hover:border-neon-blue hover:bg-neon-blue/5 group"
                >
                  <div className="rounded-lg border border-panel-edge/80 bg-abyss/80 p-2 text-neon-blue group-hover:border-neon-blue">
                    {item.icon}
                  </div>
                  <div>
                    <strong className="block text-xs font-semibold text-slate-100 group-hover:text-neon-blue">
                      {item.label}
                    </strong>
                    <span className="text-[11px] leading-tight text-slate-400">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setInsertIndex(null)}
                className="rounded-lg border border-panel-edge px-3 py-1.5 text-xs text-slate-300 hover:bg-panel-edge"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Field editors per block type
 */
function BlockForm({ block, onUpdate }) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded border border-panel-edge bg-abyss/60 p-0.5 text-xs">
              {['h2', 'h3', 'h4'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdate({ level: lvl })}
                  className={`rounded px-2 py-0.5 font-mono uppercase ${
                    block.level === lvl ? 'bg-neon-blue text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Optional eyebrow / kicker (e.g. THE FIX, OVERVIEW)"
              value={block.kicker || ''}
              onChange={(e) => onUpdate({ kicker: e.target.value })}
              className="flex-1 rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
          </div>
          <input
            type="text"
            placeholder="Heading text..."
            value={block.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-2 text-base font-semibold text-white placeholder-slate-600 focus:border-neon-blue outline-none"
          />
        </div>
      )

    case 'paragraph':
      return (
        <div>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Type your paragraph text, links, lists..."
          />
        </div>
      )

    case 'callout':
      return (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Callout Style:</span>
            {[
              { id: 'tip', label: 'Tip (Violet)', color: 'text-violet-400 border-violet-500/40' },
              { id: 'info', label: 'Info (Blue)', color: 'text-sky-400 border-sky-500/40' },
              { id: 'warning', label: 'Warning (Amber)', color: 'text-amber-400 border-amber-500/40' },
              { id: 'success', label: 'Success (Green)', color: 'text-emerald-400 border-emerald-500/40' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => onUpdate({ style: style.id })}
                className={`rounded border px-2 py-0.5 text-xs ${
                  block.style === style.id
                    ? `${style.color} bg-white/[0.06] font-semibold ring-1 ring-white/20`
                    : 'border-panel-edge text-slate-500 hover:text-slate-300'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Callout title (optional, e.g. 'Pro Tip', 'Notice')"
            value={block.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
          />
          <textarea
            rows={2}
            placeholder="Callout message or explanation..."
            value={block.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-neon-blue outline-none"
          />
        </div>
      )

    case 'code':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filename (e.g. Info.plist, auth_service.dart)"
              value={block.filename || ''}
              onChange={(e) => onUpdate({ filename: e.target.value })}
              className="flex-1 rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
            <select
              value={block.language || 'dart'}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-2.5 py-1 text-xs text-slate-200 focus:border-neon-blue outline-none"
            >
              <option value="dart">Dart / Flutter</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="bash">Bash / Terminal</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="xml">XML / Plist</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <textarea
            rows={6}
            placeholder="Paste code snippet here..."
            value={block.code || ''}
            onChange={(e) => onUpdate({ code: e.target.value })}
            className="w-full font-mono rounded border border-panel-edge bg-slate-950 p-3 text-xs text-emerald-300 placeholder-slate-700 focus:border-neon-blue outline-none"
          />
        </div>
      )

    case 'image': {
      const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
          const { url } = await uploadBlogImage(file)
          onUpdate({ src: url })
        } catch {
          alert('Failed to upload image')
        }
      }

      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Image Source (URL or Upload)</label>
              <input
                type="text"
                placeholder="https://... or upload below"
                value={block.src || ''}
                onChange={(e) => onUpdate({ src: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1.5 w-full text-xs text-slate-400 file:mr-2 file:rounded file:border file:border-panel-edge file:bg-abyss/80 file:px-2 file:py-1 file:text-xs file:text-slate-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Alt Text &amp; Caption</label>
              <input
                type="text"
                placeholder="Alt description for screen readers"
                value={block.alt || ''}
                onChange={(e) => onUpdate({ alt: e.target.value })}
                className="mb-1.5 w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
              />
              <input
                type="text"
                placeholder="Caption under image (optional)"
                value={block.caption || ''}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
              />
            </div>
          </div>
          {block.src && (
            <div className="mt-2 flex items-center gap-3 rounded border border-panel-edge/60 bg-abyss/80 p-2">
              <img
                src={block.src}
                alt={block.alt || 'Preview'}
                className="h-14 max-w-[120px] rounded object-cover"
              />
              <span className="text-xs text-slate-400 truncate">{block.caption || block.src}</span>
            </div>
          )}
        </div>
      )
    }

    case 'quote':
      return (
        <div className="space-y-2">
          <textarea
            rows={2}
            placeholder="Quote text..."
            value={block.quote || ''}
            onChange={(e) => onUpdate({ quote: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-2 text-sm italic text-slate-200 placeholder-slate-600 focus:border-neon-blue outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Speaker / Author name"
              value={block.author || ''}
              onChange={(e) => onUpdate({ author: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Role / Title (e.g. Lead Engineer)"
              value={block.role || ''}
              onChange={(e) => onUpdate({ role: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-2.5">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Heading (e.g. Need FlutterFlow help?)"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs font-semibold text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Supporting description..."
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Button Label"
              value={block.buttonText || ''}
              onChange={(e) => onUpdate({ buttonText: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Button URL (/ #start, etc)"
              value={block.buttonUrl || ''}
              onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
            />
            <select
              value={block.variant || 'primary'}
              onChange={(e) => onUpdate({ variant: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-2 py-1.5 text-xs text-slate-200 focus:border-neon-blue outline-none"
            >
              <option value="primary">Primary (#6D5AF6)</option>
              <option value="secondary">Outline / Subtle</option>
            </select>
          </div>
        </div>
      )

    case 'columns':
      return (
        <div className="space-y-2">
          <span className="text-[11px] text-slate-400">2-Column Layout (Left &amp; Right content):</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase text-neon-blue">Left Column</span>
              <MiniRichTextEditor
                value={block.left || ''}
                onChange={(left) => onUpdate({ left })}
                placeholder="Left column content..."
              />
            </div>
            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase text-neon-blue">Right Column</span>
              <MiniRichTextEditor
                value={block.right || ''}
                onChange={(right) => onUpdate({ right })}
                placeholder="Right column content..."
              />
            </div>
          </div>
        </div>
      )

    case 'divider':
      return (
        <div className="flex items-center gap-3 py-2 text-slate-500">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-panel-edge to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Horizontal Rule</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-panel-edge to-transparent" />
        </div>
      )

    case 'classic':
    default:
      return (
        <div>
          <span className="mb-1.5 block text-xs text-accent">
            Classic / Raw HTML post content (legacy format)
          </span>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Post content..."
          />
        </div>
      )
  }
}

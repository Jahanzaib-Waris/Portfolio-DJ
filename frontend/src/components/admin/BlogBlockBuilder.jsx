import { useState } from 'react'
import MiniRichTextEditor from './MiniRichTextEditor'
import { createBlockId, createDefaultBlock } from '../../utils/blogBlocks'
import { uploadBlogImage } from '../../api/client'

const AVAILABLE_BLOCKS = [
  {
    category: 'Essential Content',
    blocks: [
      {
        type: 'paragraph',
        label: 'Paragraph / Rich Text',
        badge: 'Text',
        desc: 'Rich text paragraph with links, bold, italic & formatting',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        ),
      },
      {
        type: 'heading',
        label: 'Heading & Subhead',
        badge: 'Title',
        desc: 'H2, H3, H4 with optional kicker/tagline',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 4v16m12-16v16m-12-8h12" />
          </svg>
        ),
      },
      {
        type: 'text_image',
        label: 'Text with Floating Image',
        badge: 'Popular',
        desc: 'Flow paragraph text wrapped around a right or left floated image',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h7v7H4V5zm0 10h16m-6-4h6m-6-4h6M4 19h16" />
          </svg>
        ),
      },
      {
        type: 'list',
        label: 'List (Bullets or Numbered)',
        badge: 'Items',
        desc: 'Bulleted checklist or numbered procedural steps',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    category: 'Media & Code',
    blocks: [
      {
        type: 'image',
        label: 'Image & Caption',
        badge: 'Media',
        desc: 'Stand-alone boxed, wide or full bleed image with caption',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        type: 'code',
        label: 'Code Card / Terminal',
        badge: 'Dev',
        desc: 'IDE dark card with window dots, filename & language tag',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
      },
      {
        type: 'callout',
        label: 'Callout / Alert Box',
        badge: 'Notice',
        desc: 'Highlighted Tip, Info, Warning, or Success box',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        type: 'quote',
        label: 'Pull Quote / Testimonial',
        badge: 'Quote',
        desc: 'Large stylized quote with speaker name and role badge',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        ),
      },
    ],
  },
  {
    category: 'Layout & Conversion',
    blocks: [
      {
        type: 'columns',
        label: 'Multi-Column Grid',
        badge: 'Layout',
        desc: '50/50, 60/40, 40/60, or 3-Column side-by-side builder',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1zm10 0h-4a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1z" />
          </svg>
        ),
      },
      {
        type: 'stats',
        label: 'Key Stats / Metric Cards',
        badge: 'Data',
        desc: 'Side-by-side metric badges (e.g. 99.9% uptime, 500k+ users)',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        type: 'faq',
        label: 'Collapsible Accordion / FAQ',
        badge: 'UI',
        desc: 'Expandable Q&A accordion questions and answers',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        type: 'cta',
        label: 'CTA / Action Banner',
        badge: 'Convert',
        desc: 'FlowBase gradient action card with direct link button',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        ),
      },
      {
        type: 'button',
        label: 'Standalone Button / Link',
        badge: 'Link',
        desc: 'Centered or aligned primary button linking to any page',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        ),
      },
      {
        type: 'divider',
        label: 'Hairline Divider',
        badge: 'Break',
        desc: 'Subtle hairline section separator',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 12H4" />
          </svg>
        ),
      },
    ],
  },
]

export default function BlogBlockBuilder({ blocks, onChange }) {
  const [insertIndex, setInsertIndex] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [collapsedMap, setCollapsedMap] = useState({})
  const [searchBlockQuery, setSearchBlockQuery] = useState('')

  const toggleCollapse = (id) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const collapseAll = () => {
    const map = {}
    blocks.forEach((b) => {
      map[b.id] = true
    })
    setCollapsedMap(map)
  }

  const expandAll = () => {
    setCollapsedMap({})
  }

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
    setSearchBlockQuery('')
  }

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

  const getBlockSummary = (block) => {
    switch (block.type) {
      case 'heading':
        return block.text ? `"${block.text}" (${block.level?.toUpperCase()})` : 'Untitled Heading'
      case 'paragraph': {
        const text = (block.html || '').replace(/<[^>]*>/g, '').trim()
        return text ? (text.length > 60 ? text.substring(0, 60) + '…' : text) : 'Empty paragraph'
      }
      case 'text_image':
        return `Floating ${block.float || 'right'} image with text`
      case 'callout':
        return `${block.style?.toUpperCase() || 'INFO'}: ${block.title || block.text?.substring(0, 40) || 'Notice'}`
      case 'code':
        return block.filename ? `${block.filename} (${block.language})` : `${block.language?.toUpperCase()} snippet`
      case 'image':
        return block.caption || block.src || 'Image'
      case 'quote':
        return block.author ? `Quote by ${block.author}` : 'Pull quote'
      case 'columns':
        return `Layout: ${block.layout || 'equal'}`
      case 'stats':
        return `${block.items?.length || 0} Stat metrics`
      case 'faq':
        return `${block.items?.length || 0} Accordion questions`
      case 'cta':
        return block.heading || 'Call to Action'
      case 'button':
        return `Button: "${block.text || 'Link'}"`
      case 'divider':
        return 'Divider Line'
      default:
        return 'Content Block'
    }
  }

  const allFilteredBlocks = AVAILABLE_BLOCKS.map((cat) => ({
    ...cat,
    blocks: cat.blocks.filter(
      (b) =>
        b.label.toLowerCase().includes(searchBlockQuery.toLowerCase()) ||
        b.desc.toLowerCase().includes(searchBlockQuery.toLowerCase()) ||
        b.type.toLowerCase().includes(searchBlockQuery.toLowerCase()),
    ),
  })).filter((cat) => cat.blocks.length > 0)

  return (
    <div className="fb-builder space-y-3">
      {/* Compact Builder Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-panel-edge/80 bg-white/[0.015] px-3.5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neon-blue/15 text-neon-blue">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-slate-200">Content Blocks</span>
          </div>
          <span className="rounded-full bg-panel-edge/60 px-2 py-0.5 text-[11px] text-slate-400">
            {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Collapse / Expand All */}
          <button
            type="button"
            onClick={collapseAll}
            title="Collapse all blocks to compact view"
            className="rounded-md border border-panel-edge/60 px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-panel-edge/40 hover:text-slate-200"
          >
            Collapse All
          </button>
          <button
            type="button"
            onClick={expandAll}
            title="Expand all blocks"
            className="rounded-md border border-panel-edge/60 px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-panel-edge/40 hover:text-slate-200"
          >
            Expand All
          </button>

          {/* Primary Add Block */}
          <button
            type="button"
            onClick={() => setInsertIndex(blocks.length)}
            className="system-button-primary flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold shadow-xs transition-transform active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
            </svg>
            Add Block
          </button>
        </div>
      </div>

      {/* Block List Canvas */}
      <div className="space-y-2">
        {blocks.map((block, index) => {
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index
          const isCollapsed = Boolean(collapsedMap[block.id])

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
                  ? 'opacity-30 border-dashed border-neon-blue bg-neon-blue/5'
                  : isDragOver
                  ? 'border-neon-blue ring-2 ring-neon-blue/30 bg-abyss/90'
                  : 'border-panel-edge/70 bg-abyss/40 hover:border-panel-edge'
              }`}
            >
              {/* Compact Block Header (Collapsible & Reorderable) */}
              <div
                onClick={() => toggleCollapse(block.id)}
                className="flex cursor-pointer items-center justify-between border-b border-panel-edge/40 bg-white/[0.015] px-3 py-2 text-xs select-none hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                    className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing text-sm"
                  >
                    ⠿
                  </span>
                  <span className="rounded bg-neon-blue/15 px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold text-neon-blue">
                    {block.type.replace('_', ' ')}
                  </span>
                  <span className="truncate text-xs text-slate-300 font-medium">
                    {getBlockSummary(block)}
                  </span>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* Up / Down */}
                  <button
                    type="button"
                    onClick={() => moveBlock(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200 disabled:opacity-20"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, index + 1)}
                    disabled={index === blocks.length - 1}
                    title="Move down"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200 disabled:opacity-20"
                  >
                    &darr;
                  </button>
                  {/* Insert below */}
                  <button
                    type="button"
                    onClick={() => setInsertIndex(index + 1)}
                    title="Insert block below"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-neon-blue"
                  >
                    +
                  </button>
                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => duplicateBlock(index)}
                    title="Duplicate block"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200"
                  >
                    &#x2398;
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    title="Delete block"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-status-red"
                  >
                    &times;
                  </button>
                  {/* Collapse / Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCollapse(block.id)}
                    title={isCollapsed ? 'Expand block' : 'Collapse block'}
                    className="ml-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200"
                  >
                    {isCollapsed ? '▾' : '▴'}
                  </button>
                </div>
              </div>

              {/* Block Content Editor Form (only when expanded) */}
              {!isCollapsed && (
                <div className="p-3.5">
                  <BlockForm
                    block={block}
                    index={index}
                    onUpdate={(patch) => updateBlock(index, patch)}
                  />
                </div>
              )}

              {/* In-between Add Handle button */}
              <div className="relative flex justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => setInsertIndex(index + 1)}
                  className="absolute -bottom-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-panel-edge bg-slate-900 text-[11px] text-slate-400 opacity-0 transition-all hover:scale-110 hover:border-neon-blue hover:text-neon-blue group-hover:opacity-100 shadow-md"
                  title="Insert block here"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Add Bar */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => setInsertIndex(blocks.length)}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-panel-edge px-4 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-neon-blue hover:bg-abyss/50 hover:text-neon-blue"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add another block
        </button>
      </div>

      {/* Block Type Picker Modal with Search & Categories */}
      {insertIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-panel-edge bg-slate-950 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-panel-edge p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Add Block</h3>
                  <p className="text-xs text-slate-400">Choose a component to insert at position #{insertIndex + 1}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInsertIndex(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-panel-edge hover:text-white"
                >
                  &times;
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative">
                <input
                  type="text"
                  placeholder="Search blocks (e.g. image, quote, columns, float)..."
                  value={searchBlockQuery}
                  onChange={(e) => setSearchBlockQuery(e.target.value)}
                  className="w-full rounded-lg border border-panel-edge bg-abyss/70 px-3 py-1.5 pl-8 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
                  autoFocus
                />
                <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Modal Categories & Blocks */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {allFilteredBlocks.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {cat.category}
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {cat.blocks.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddBlock(item.type, insertIndex)}
                        className="flex items-start gap-3 rounded-xl border border-panel-edge/60 bg-white/[0.015] p-2.5 text-left transition-all hover:border-neon-blue hover:bg-neon-blue/5 group"
                      >
                        <div className="rounded-lg border border-panel-edge/80 bg-abyss/80 p-2 text-neon-blue group-hover:border-neon-blue shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="block text-xs font-semibold text-slate-100 group-hover:text-neon-blue truncate">
                              {item.label}
                            </strong>
                            {item.badge && (
                              <span className="rounded bg-white/[0.06] px-1 py-0.2 text-[9px] text-slate-400 font-normal">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] leading-tight text-slate-400 line-clamp-2">{item.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-panel-edge p-3 text-right">
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
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded border border-panel-edge bg-abyss/60 p-0.5 text-xs">
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
              placeholder="Eyebrow / Kicker (e.g. THE PROBLEM, OVERVIEW)"
              value={block.kicker || ''}
              onChange={(e) => onUpdate({ kicker: e.target.value })}
              className="flex-1 rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <input
            type="text"
            placeholder="Heading text..."
            value={block.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-neon-blue outline-none"
          />
        </div>
      )

    case 'paragraph':
      return (
        <div>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Write your text here..."
          />
        </div>
      )

    case 'text_image': {
      const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
          const { url } = await uploadBlogImage(file)
          onUpdate({ imageSrc: url })
        } catch {
          alert('Failed to upload image')
        }
      }

      return (
        <div className="space-y-3">
          {/* Float controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-panel-edge/60 bg-white/[0.015] p-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Image Float:</span>
              <div className="flex items-center rounded border border-panel-edge bg-abyss/60 p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdate({ float: 'right' })}
                  className={`rounded px-2 py-0.5 text-xs ${
                    block.float === 'right' ? 'bg-neon-blue text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Float Right &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ float: 'left' })}
                  className={`rounded px-2 py-0.5 text-xs ${
                    block.float === 'left' ? 'bg-neon-blue text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  &larr; Float Left
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Size:</span>
              <div className="flex items-center rounded border border-panel-edge bg-abyss/60 p-0.5">
                {[
                  { id: 'small', label: 'Small (28%)' },
                  { id: 'medium', label: 'Medium (42%)' },
                  { id: 'large', label: 'Large (52%)' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => onUpdate({ imageWidth: sz.id })}
                    className={`rounded px-2 py-0.5 text-[11px] ${
                      (block.imageWidth || 'medium') === sz.id
                        ? 'bg-neon-blue text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image source and metadata */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Image Source (URL or Upload)</label>
              <input
                type="text"
                placeholder="https://... or upload"
                value={block.imageSrc || ''}
                onChange={(e) => onUpdate({ imageSrc: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1 w-full text-xs text-slate-400 file:mr-2 file:rounded file:border file:border-panel-edge file:bg-abyss/80 file:px-2 file:py-1 file:text-xs file:text-slate-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Caption &amp; Alt Text</label>
              <input
                type="text"
                placeholder="Alt description for screen readers"
                value={block.alt || ''}
                onChange={(e) => onUpdate({ alt: e.target.value })}
                className="mb-1 w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
              />
              <input
                type="text"
                placeholder="Caption under floating image (optional)"
                value={block.caption || ''}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
              />
            </div>
          </div>

          {/* Text Editor (Wraps around image on public page) */}
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">Wrapped Article Text</label>
            <MiniRichTextEditor
              value={block.html || ''}
              onChange={(html) => onUpdate({ html })}
              placeholder="Type article text that flows around the floating image..."
            />
          </div>
        </div>
      )
    }

    case 'callout':
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
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
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
          />
          <textarea
            rows={2}
            placeholder="Callout explanation..."
            value={block.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-neon-blue outline-none"
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
              className="flex-1 rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <select
              value={block.language || 'dart'}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-2 py-1 text-xs text-slate-200 focus:border-neon-blue outline-none"
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
            rows={5}
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
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Layout:</span>
            {['standard', 'wide', 'full'].map((lay) => (
              <button
                key={lay}
                type="button"
                onClick={() => onUpdate({ layout: lay })}
                className={`rounded border px-2 py-0.5 text-xs uppercase font-mono ${
                  (block.layout || 'standard') === lay
                    ? 'border-neon-blue bg-neon-blue/15 text-neon-blue font-semibold'
                    : 'border-panel-edge text-slate-400'
                }`}
              >
                {lay}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <input
                type="text"
                placeholder="Image URL or upload"
                value={block.src || ''}
                onChange={(e) => onUpdate({ src: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1 w-full text-xs text-slate-400 file:mr-2 file:rounded file:border file:border-panel-edge file:bg-abyss/80 file:px-2 file:py-1 file:text-xs file:text-slate-300"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Caption under image"
                value={block.caption || ''}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
              />
            </div>
          </div>
          {block.src && (
            <div className="mt-1 flex items-center gap-3 rounded border border-panel-edge/60 bg-abyss/80 p-2">
              <img src={block.src} alt={block.alt || 'Preview'} className="h-12 max-w-[100px] rounded object-cover" />
              <span className="text-xs text-slate-400 truncate">{block.caption || block.src}</span>
            </div>
          )}
        </div>
      )
    }

    case 'columns': {
      const layouts = [
        { id: 'equal', label: '50 / 50' },
        { id: 'wide-left', label: '60 / 40' },
        { id: 'wide-right', label: '40 / 60' },
        { id: 'three-col', label: '3 Columns (33/33/33)' },
      ]

      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Column Ratio:</span>
            {layouts.map((lay) => (
              <button
                key={lay.id}
                type="button"
                onClick={() => onUpdate({ layout: lay.id })}
                className={`rounded border px-2.5 py-0.5 text-xs ${
                  (block.layout || 'equal') === lay.id
                    ? 'border-neon-blue bg-neon-blue/15 text-neon-blue font-semibold'
                    : 'border-panel-edge text-slate-400 hover:text-slate-200'
                }`}
              >
                {lay.label}
              </button>
            ))}
          </div>

          {block.layout === 'three-col' ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase text-neon-blue">Col 1</span>
                <MiniRichTextEditor
                  value={block.left || ''}
                  onChange={(left) => onUpdate({ left })}
                  placeholder="Column 1 content..."
                />
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase text-neon-blue">Col 2</span>
                <MiniRichTextEditor
                  value={block.center || ''}
                  onChange={(center) => onUpdate({ center })}
                  placeholder="Column 2 content..."
                />
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] uppercase text-neon-blue">Col 3</span>
                <MiniRichTextEditor
                  value={block.right || ''}
                  onChange={(right) => onUpdate({ right })}
                  placeholder="Column 3 content..."
                />
              </div>
            </div>
          ) : (
            <div
              className={`grid gap-3 ${
                block.layout === 'wide-left'
                  ? 'sm:grid-cols-[1.6fr_1fr]'
                  : block.layout === 'wide-right'
                  ? 'sm:grid-cols-[1fr_1.6fr]'
                  : 'sm:grid-cols-2'
              }`}
            >
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
          )}
        </div>
      )
    }

    case 'stats': {
      const items = block.items || []
      const updateItem = (i, patch) => {
        const next = [...items]
        next[i] = { ...next[i], ...patch }
        onUpdate({ items: next })
      }
      const addItem = () => onUpdate({ items: [...items, { value: '100%', label: 'Label' }] })
      const removeItem = (i) => onUpdate({ items: items.filter((_, idx) => idx !== i) })

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Metric Badges:</span>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-neon-blue hover:underline"
            >
              + Add Metric
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {items.map((stat, i) => (
              <div key={i} className="rounded border border-panel-edge bg-abyss/60 p-2 space-y-1 relative">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="absolute right-1 top-1 text-slate-500 hover:text-status-red text-xs px-1"
                >
                  &times;
                </button>
                <input
                  type="text"
                  placeholder="Value (e.g. 99.9%)"
                  value={stat.value || ''}
                  onChange={(e) => updateItem(i, { value: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs font-bold text-white outline-none focus:border-neon-blue"
                />
                <input
                  type="text"
                  placeholder="Label (e.g. Uptime)"
                  value={stat.label || ''}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-300 outline-none focus:border-neon-blue"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'faq': {
      const items = block.items || []
      const updateItem = (i, patch) => {
        const next = [...items]
        next[i] = { ...next[i], ...patch }
        onUpdate({ items: next })
      }
      const addItem = () => onUpdate({ items: [...items, { question: '', answer: '' }] })
      const removeItem = (i) => onUpdate({ items: items.filter((_, idx) => idx !== i) })

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Accordion Questions:</span>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-neon-blue hover:underline"
            >
              + Add Question
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="rounded border border-panel-edge bg-abyss/60 p-2.5 space-y-1.5 relative">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="absolute right-2 top-2 text-slate-500 hover:text-status-red text-xs px-1"
                >
                  &times;
                </button>
                <input
                  type="text"
                  placeholder="Question / Title"
                  value={item.question || ''}
                  onChange={(e) => updateItem(i, { question: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-slate-950 px-3 py-1 text-xs font-semibold text-white outline-none focus:border-neon-blue"
                />
                <textarea
                  rows={2}
                  placeholder="Answer explanation..."
                  value={item.answer || ''}
                  onChange={(e) => updateItem(i, { answer: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-neon-blue"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'button':
      return (
        <div className="grid gap-2 sm:grid-cols-4 items-center">
          <input
            type="text"
            placeholder="Button text"
            value={block.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
          />
          <input
            type="text"
            placeholder="URL (/ #start, etc)"
            value={block.url || ''}
            onChange={(e) => onUpdate({ url: e.target.value })}
            className="rounded border border-panel-edge bg-abyss/60 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
          />
          <select
            value={block.align || 'left'}
            onChange={(e) => onUpdate({ align: e.target.value })}
            className="rounded border border-panel-edge bg-abyss/60 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="left">Align Left</option>
            <option value="center">Align Center</option>
            <option value="right">Align Right</option>
          </select>
          <select
            value={block.variant || 'primary'}
            onChange={(e) => onUpdate({ variant: e.target.value })}
            className="rounded border border-panel-edge bg-abyss/60 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="primary">Primary (#6D5AF6)</option>
            <option value="secondary">Outline</option>
          </select>
        </div>
      )

    case 'quote':
      return (
        <div className="space-y-2">
          <textarea
            rows={2}
            placeholder="Quote text..."
            value={block.quote || ''}
            onChange={(e) => onUpdate({ quote: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/60 px-3 py-2 text-sm italic text-slate-200 placeholder-slate-500 focus:border-neon-blue outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Speaker / Author name"
              value={block.author || ''}
              onChange={(e) => onUpdate({ author: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Role / Title (e.g. Lead Engineer)"
              value={block.role || ''}
              onChange={(e) => onUpdate({ role: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Heading (e.g. Need FlutterFlow help?)"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Supporting description..."
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Button Label"
              value={block.buttonText || ''}
              onChange={(e) => onUpdate({ buttonText: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Button URL (/ #start, etc)"
              value={block.buttonUrl || ''}
              onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <select
              value={block.variant || 'primary'}
              onChange={(e) => onUpdate({ variant: e.target.value })}
              className="rounded border border-panel-edge bg-abyss/60 px-2 py-1 text-xs text-slate-200 focus:border-neon-blue outline-none"
            >
              <option value="primary">Primary (#6D5AF6)</option>
              <option value="secondary">Outline / Subtle</option>
            </select>
          </div>
        </div>
      )

    case 'divider':
      return (
        <div className="flex items-center gap-3 py-1.5 text-slate-500">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-panel-edge to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-600">Hairline Divider</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-panel-edge to-transparent" />
        </div>
      )

    case 'classic':
    default:
      return (
        <div>
          <span className="mb-1 block text-xs text-accent">
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

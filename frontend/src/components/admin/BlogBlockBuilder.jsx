import { useState } from 'react'
import BlockPreviewRenderer from './BlockPreviewRenderer'
import { createBlockId, createDefaultBlock } from '../../utils/blogBlocks'

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

export default function BlogBlockBuilder({
  blocks,
  onChange,
  selectedBlockId,
  onSelectBlock,
}) {
  const [insertIndex, setInsertIndex] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [searchBlockQuery, setSearchBlockQuery] = useState('')

  const removeBlock = (index) => {
    const next = blocks.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [createDefaultBlock('paragraph')])
    if (selectedBlockId === blocks[index]?.id) {
      onSelectBlock(null)
    }
  }

  const duplicateBlock = (index) => {
    const target = blocks[index]
    const clone = { ...JSON.parse(JSON.stringify(target)), id: createBlockId() }
    const next = [...blocks]
    next.splice(index + 1, 0, clone)
    onChange(next)
    onSelectBlock(clone.id)
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
    // Automatically select newly added block to open its properties drawer
    onSelectBlock(newBlock.id)
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
    <div className="fb-builder space-y-4">
      {/* Canvas Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-panel-edge/80 bg-white/[0.015] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-blue/15 text-neon-blue text-xs font-bold">
            ✦
          </span>
          <span className="text-xs font-semibold text-slate-200">Live Post Canvas</span>
          <span className="text-[11px] text-slate-500 font-normal">
            (Tap any block to customize in the side properties panel)
          </span>
        </div>

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

      {/* Live Canvas of Blocks */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index
          const isSelected = selectedBlockId === block.id

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
                  : isSelected
                  ? 'border-neon-blue bg-neon-blue/[0.02] shadow-md ring-1 ring-neon-blue/40'
                  : 'border-panel-edge/70 bg-abyss/40 hover:border-panel-edge'
              }`}
            >
              {/* Subtle Canvas Hover Bar with Quick Floating Actions */}
              <div className="flex items-center justify-between border-b border-panel-edge/30 bg-white/[0.015] px-3 py-1.5 text-xs select-none">
                <div className="flex items-center gap-2">
                  <span
                    title="Drag to reorder"
                    className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing text-sm"
                  >
                    ⠿
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-neon-blue">
                    {block.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">#{index + 1}</span>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200 disabled:opacity-20 text-xs"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, index + 1)}
                    disabled={index === blocks.length - 1}
                    title="Move down"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200 disabled:opacity-20 text-xs"
                  >
                    &darr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertIndex(index + 1)}
                    title="Insert block below"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-neon-blue text-xs"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateBlock(index)}
                    title="Duplicate block"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-slate-200 text-xs"
                  >
                    &#x2398;
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    title="Delete block"
                    className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-status-red text-xs"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Pure Visual Preview Component (Clean, true-to-design, no messy inline forms) */}
              <BlockPreviewRenderer
                block={block}
                isSelected={isSelected}
                onSelect={() => onSelectBlock(block.id)}
              />

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

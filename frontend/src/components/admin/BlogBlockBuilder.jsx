import { useState } from 'react'
import BlockPreviewRenderer from './BlockPreviewRenderer'
import { createBlockId, createDefaultBlock } from '../../utils/blogBlocks'

const ATOMIC_AND_LAYOUT_BLOCKS = [
  {
    category: 'Layout & Structure',
    blocks: [
      {
        type: 'container',
        label: 'Auto-Layout Container (Row / Stack)',
        badge: 'Layout',
        desc: 'Figma / FlutterFlow style flex container: arranges images, text & buttons side-by-side or stacked',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM9 4v16" />
          </svg>
        ),
      },
      {
        type: 'divider',
        label: 'Divider Line',
        badge: 'Break',
        desc: 'Subtle gradient or hairline section separator',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 12H4" />
          </svg>
        ),
      },
    ],
  },
  {
    category: 'Core Content Elements',
    blocks: [
      {
        type: 'heading',
        label: 'Heading & Subhead',
        badge: 'Text',
        desc: 'H2, H3, H4 with optional kicker/eyebrow tag & text alignment',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 4v16m12-16v16m-12-8h12" />
          </svg>
        ),
      },
      {
        type: 'text',
        label: 'Text / Paragraph',
        badge: 'Text',
        desc: 'Rich text block with bold, italic, inline code, and links',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        ),
      },
      {
        type: 'image',
        label: 'Image',
        badge: 'Media',
        desc: 'Single image element with flexible width, cover/contain fit & caption',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        type: 'list',
        label: 'Feature & Bullet List',
        badge: 'List',
        desc: 'Numbered or icon bullet list (checks, dots, arrows, bolts) with spacing options',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        type: 'button',
        label: 'Action Button / Link',
        badge: 'Action',
        desc: 'Primary brand button (#6D5AF6), outline, or subtle link card',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        ),
      },
      {
        type: 'icon_badge',
        label: 'Icon Badge / Highlight',
        badge: 'UI',
        desc: 'Pill badge with icon (bolt, check, star, terminal) for highlights',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
      },
    ],
  },
  {
    category: 'Engineering & Rich Media',
    blocks: [
      {
        type: 'table',
        label: 'Comparison & Data Table',
        badge: 'Data',
        desc: 'Feature comparison or benchmark table with badges, checks, and image cells',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        type: 'video',
        label: 'Video / Media Embed',
        badge: 'Media',
        desc: 'YouTube, Vimeo, or direct MP4 video player with custom aspect ratios',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        type: 'code',
        label: 'Code Card / Terminal',
        badge: 'Dev',
        desc: 'Syntax card with filename header and programming language tag',
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
        desc: 'Highlighted note box (Tip, Warning, Info, Success)',
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
        desc: 'Quotation with author citation and role attribution',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
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
    onChange(next.length > 0 ? next : [createDefaultBlock('text')])
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

  const allFilteredBlocks = ATOMIC_AND_LAYOUT_BLOCKS.map((cat) => ({
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
            ⊞
          </span>
          <span className="text-xs font-semibold text-slate-200">Visual Canvas</span>
          <span className="text-[11px] text-slate-500 font-normal">
            (Tap any container or atomic element to inspect properties)
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
          Add Element / Container
        </button>
      </div>

      {/* Live Canvas */}
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
              {/* Floating Action Bar */}
              <div className="flex items-center justify-between border-b border-panel-edge/30 bg-white/[0.015] px-3 py-1.5 text-xs select-none">
                <div className="flex items-center gap-2">
                  <span
                    title="Drag to reorder"
                    className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing text-sm"
                  >
                    ⠿
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-neon-blue">
                    {block.type === 'container' ? 'Container (Auto-Layout)' : block.type}
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

              {/* Visual Preview */}
              <BlockPreviewRenderer
                block={block}
                isSelected={isSelected}
                onSelect={(id) => onSelectBlock(id || block.id)}
                selectedBlockId={selectedBlockId}
                onSelectChild={(childId) => onSelectBlock(childId)}
              />

              {/* In-between Add Handle button */}
              <div className="relative flex justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => setInsertIndex(index + 1)}
                  className="absolute -bottom-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-panel-edge bg-slate-900 text-[11px] text-slate-400 opacity-0 transition-all hover:scale-110 hover:border-neon-blue hover:text-neon-blue group-hover:opacity-100 shadow-md"
                  title="Insert element here"
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
          Add Element or Container
        </button>
      </div>

      {/* Add Modal */}
      {insertIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-panel-edge bg-slate-950 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-panel-edge p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Add Element or Container</h3>
                  <p className="text-xs text-slate-400">Choose an atomic element or auto-layout container to insert at #{insertIndex + 1}</p>
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
                  placeholder="Search elements (e.g. container, row, image, text, button)..."
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

            {/* Modal Categories */}
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

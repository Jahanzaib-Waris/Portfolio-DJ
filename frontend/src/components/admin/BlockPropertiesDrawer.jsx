import MiniRichTextEditor from './MiniRichTextEditor'
import { uploadBlogImage } from '../../api/client'

/**
 * Elementor / Gutenberg style Side Properties Drawer.
 * Appears when any block is clicked on the canvas.
 */
export default function BlockPropertiesDrawer({ block, index, totalBlocks, onUpdate, onClose, onDelete, onDuplicate, onMove }) {
  if (!block) return null

  return (
    <div className="flex h-full flex-col bg-slate-950/95 backdrop-blur-md">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-panel-edge/80 px-4 py-3 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neon-blue/15 text-neon-blue font-mono text-xs font-bold uppercase">
            # {index + 1}
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white capitalize leading-none">
              {block.type.replace('_', ' ')} Properties
            </h3>
            <span className="font-mono text-[10px] text-slate-400">Block Inspector</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Reorder Up/Down */}
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            title="Move Block Up"
            className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-white disabled:opacity-20 text-xs"
          >
            &uarr;
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === totalBlocks - 1}
            title="Move Block Down"
            className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-white disabled:opacity-20 text-xs"
          >
            &darr;
          </button>
          {/* Duplicate */}
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            title="Duplicate Block"
            className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-white text-xs"
          >
            &#x2398;
          </button>
          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(index)}
            title="Delete Block"
            className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-status-red text-xs"
          >
            &times;
          </button>
          {/* Close Drawer */}
          <button
            type="button"
            onClick={onClose}
            title="Close Drawer"
            className="ml-1 rounded-md border border-panel-edge/80 p-1 text-slate-400 hover:bg-panel-edge hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Drawer Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DrawerFields block={block} onUpdate={onUpdate} />
      </div>

      {/* Drawer Footer */}
      <div className="border-t border-panel-edge/80 px-4 py-2.5 bg-white/[0.015] flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">Changes update canvas live</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-panel-edge px-3 py-1 text-xs text-slate-300 hover:bg-panel-edge"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function DrawerFields({ block, onUpdate }) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Heading Level</label>
            <div className="flex items-center gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {['h2', 'h3', 'h4'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdate({ level: lvl })}
                  className={`flex-1 rounded py-1 font-mono uppercase font-semibold ${
                    block.level === lvl ? 'bg-neon-blue text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Eyebrow / Kicker Tag (Optional)</label>
            <input
              type="text"
              placeholder="e.g. THE PROBLEM, OVERVIEW"
              value={block.kicker || ''}
              onChange={(e) => onUpdate({ kicker: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Heading Text</label>
            <textarea
              rows={2}
              placeholder="Type heading text..."
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-2 text-sm font-semibold text-white placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    case 'paragraph':
      return (
        <div className="space-y-2">
          <label className="mb-1 block text-xs text-slate-400 font-medium">Paragraph Content</label>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Type text, links, lists..."
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
        <div className="space-y-3.5">
          {/* Float alignment */}
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Image Float Side</label>
            <div className="flex items-center gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => onUpdate({ float: 'right' })}
                className={`flex-1 rounded py-1 font-medium ${
                  block.float === 'right' ? 'bg-neon-blue text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Float Right &rarr;
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ float: 'left' })}
                className={`flex-1 rounded py-1 font-medium ${
                  block.float === 'left' ? 'bg-neon-blue text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                &larr; Float Left
              </button>
            </div>
          </div>

          {/* Width */}
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Image Width on Desktop</label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {[
                { id: 'small', label: 'Small (28%)' },
                { id: 'medium', label: 'Medium (42%)' },
                { id: 'large', label: 'Large (52%)' },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => onUpdate({ imageWidth: sz.id })}
                  className={`rounded py-1 text-[11px] font-medium ${
                    (block.imageWidth || 'medium') === sz.id
                      ? 'bg-neon-blue text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image source */}
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Image Source (URL or File)</label>
            <input
              type="text"
              placeholder="https://... or upload below"
              value={block.imageSrc || ''}
              onChange={(e) => onUpdate({ imageSrc: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1.5 w-full text-xs text-slate-400 file:mr-2 file:rounded file:border file:border-panel-edge file:bg-abyss/80 file:px-2 file:py-1 file:text-xs file:text-slate-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Caption &amp; Alt Text</label>
            <input
              type="text"
              placeholder="Caption under floating image"
              value={block.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className="mb-1.5 w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <input
              type="text"
              placeholder="Alt description for screen readers"
              value={block.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>

          {/* Wrapped text */}
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Wrapped Text Content</label>
            <MiniRichTextEditor
              value={block.html || ''}
              onChange={(html) => onUpdate({ html })}
              placeholder="Article text that wraps around the image..."
            />
          </div>
        </div>
      )
    }

    case 'callout':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Callout Theme</label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {[
                { id: 'tip', label: 'Tip (Violet)' },
                { id: 'info', label: 'Info (Blue)' },
                { id: 'warning', label: 'Warning (Amber)' },
                { id: 'success', label: 'Success (Green)' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdate({ style: style.id })}
                  className={`rounded py-1 text-xs font-medium ${
                    block.style === style.id
                      ? 'bg-neon-blue text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Callout Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Pro Tip, Important Notice"
              value={block.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Callout Message</label>
            <textarea
              rows={4}
              placeholder="Type message explanation..."
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    case 'code':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Syntax Language</label>
            <select
              value={block.language || 'dart'}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-200 focus:border-neon-blue outline-none"
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

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Card Header Filename</label>
            <input
              type="text"
              placeholder="e.g. Info.plist, auth_service.dart"
              value={block.filename || ''}
              onChange={(e) => onUpdate({ filename: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Code Snippet</label>
            <textarea
              rows={8}
              placeholder="Paste code snippet here..."
              value={block.code || ''}
              onChange={(e) => onUpdate({ code: e.target.value })}
              className="w-full font-mono rounded-lg border border-panel-edge bg-slate-950 p-3 text-xs text-emerald-300 placeholder-slate-700 focus:border-neon-blue outline-none"
            />
          </div>
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
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Display Layout</label>
            <div className="flex items-center gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {['standard', 'wide', 'full'].map((lay) => (
                <button
                  key={lay}
                  type="button"
                  onClick={() => onUpdate({ layout: lay })}
                  className={`flex-1 rounded py-1 font-mono uppercase font-semibold ${
                    (block.layout || 'standard') === lay
                      ? 'bg-neon-blue text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lay}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Image URL or File Upload</label>
            <input
              type="text"
              placeholder="https://..."
              value={block.src || ''}
              onChange={(e) => onUpdate({ src: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1.5 w-full text-xs text-slate-400 file:mr-2 file:rounded file:border file:border-panel-edge file:bg-abyss/80 file:px-2 file:py-1 file:text-xs file:text-slate-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Caption</label>
            <input
              type="text"
              placeholder="Caption below image (optional)"
              value={block.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Alt Text</label>
            <input
              type="text"
              placeholder="Alt description for accessibility"
              value={block.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )
    }

    case 'columns': {
      const layouts = [
        { id: 'equal', label: '50 / 50' },
        { id: 'wide-left', label: '60 / 40' },
        { id: 'wide-right', label: '40 / 60' },
        { id: 'three-col', label: '3 Columns' },
      ]

      return (
        <div className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Column Ratio</label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {layouts.map((lay) => (
                <button
                  key={lay.id}
                  type="button"
                  onClick={() => onUpdate({ layout: lay.id })}
                  className={`rounded py-1 text-xs font-medium ${
                    (block.layout || 'equal') === lay.id
                      ? 'bg-neon-blue text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lay.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-neon-blue font-mono uppercase">Left / Col 1</label>
            <MiniRichTextEditor
              value={block.left || ''}
              onChange={(left) => onUpdate({ left })}
              placeholder="Column 1..."
            />
          </div>

          {block.layout === 'three-col' && (
            <div>
              <label className="mb-1 block text-xs text-neon-blue font-mono uppercase">Center / Col 2</label>
              <MiniRichTextEditor
                value={block.center || ''}
                onChange={(center) => onUpdate({ center })}
                placeholder="Column 2..."
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-neon-blue font-mono uppercase">Right / Col {block.layout === 'three-col' ? '3' : '2'}</label>
            <MiniRichTextEditor
              value={block.right || ''}
              onChange={(right) => onUpdate({ right })}
              placeholder="Column right..."
            />
          </div>
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
      const addItem = () => onUpdate({ items: [...items, { value: '100%', label: 'Metric Label' }] })
      const removeItem = (i) => onUpdate({ items: items.filter((_, idx) => idx !== i) })

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium">Metric Items</label>
            <button type="button" onClick={addItem} className="text-xs text-neon-blue hover:underline">
              + Add Metric
            </button>
          </div>
          <div className="space-y-2">
            {items.map((stat, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-panel-edge bg-abyss/80 p-2">
                <input
                  type="text"
                  placeholder="99.9%"
                  value={stat.value || ''}
                  onChange={(e) => updateItem(i, { value: e.target.value })}
                  className="w-20 rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs font-bold text-white outline-none focus:border-neon-blue"
                />
                <input
                  type="text"
                  placeholder="Metric Label"
                  value={stat.label || ''}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  className="flex-1 rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-300 outline-none focus:border-neon-blue"
                />
                <button type="button" onClick={() => removeItem(i)} className="text-slate-500 hover:text-status-red text-xs px-1">
                  &times;
                </button>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium">Q&amp;A Items</label>
            <button type="button" onClick={addItem} className="text-xs text-neon-blue hover:underline">
              + Add Question
            </button>
          </div>
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-panel-edge bg-abyss/80 p-2.5 space-y-1.5 relative">
                <button type="button" onClick={() => removeItem(i)} className="absolute right-2 top-2 text-slate-500 hover:text-status-red text-xs px-1">
                  &times;
                </button>
                <input
                  type="text"
                  placeholder="Question title"
                  value={item.question || ''}
                  onChange={(e) => updateItem(i, { question: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs font-semibold text-white outline-none focus:border-neon-blue pr-6"
                />
                <textarea
                  rows={2}
                  placeholder="Answer explanation..."
                  value={item.answer || ''}
                  onChange={(e) => updateItem(i, { answer: e.target.value })}
                  className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-300 outline-none focus:border-neon-blue"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'button':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Button Label</label>
            <input
              type="text"
              placeholder="e.g. Get Started, View Projects"
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Target URL</label>
            <input
              type="text"
              placeholder="e.g. /#start or https://..."
              value={block.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Alignment</label>
              <select
                value={block.align || 'left'}
                onChange={(e) => onUpdate({ align: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Style</label>
              <select
                value={block.variant || 'primary'}
                onChange={(e) => onUpdate({ variant: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="primary">Primary (#6D5AF6)</option>
                <option value="secondary">Outline</option>
              </select>
            </div>
          </div>
        </div>
      )

    case 'quote':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Quote Text</label>
            <textarea
              rows={3}
              placeholder="Type quote..."
              value={block.quote || ''}
              onChange={(e) => onUpdate({ quote: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-2 text-sm italic text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Author Name</label>
            <input
              type="text"
              placeholder="e.g. Jerry Waris"
              value={block.author || ''}
              onChange={(e) => onUpdate({ author: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Role / Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Lead Engineer"
              value={block.role || ''}
              onChange={(e) => onUpdate({ role: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Heading</label>
            <input
              type="text"
              placeholder="CTA Heading"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs font-semibold text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Description</label>
            <textarea
              rows={2}
              placeholder="Supporting description..."
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Button Label</label>
              <input
                type="text"
                placeholder="Get Started"
                value={block.buttonText || ''}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Button URL</label>
              <input
                type="text"
                placeholder="/#start"
                value={block.buttonUrl || ''}
                onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
              />
            </div>
          </div>
        </div>
      )

    case 'divider':
      return (
        <div className="py-6 text-center text-xs text-slate-500">
          <p>Hairline section divider</p>
          <span className="text-[11px] text-slate-600">Renders as subtle gradient rule on the page</span>
        </div>
      )

    case 'classic':
    default:
      return (
        <div className="space-y-2">
          <label className="mb-1 block text-xs text-slate-400 font-medium">Classic Content HTML</label>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Post content..."
          />
        </div>
      )
  }
}

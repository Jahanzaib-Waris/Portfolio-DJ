import MiniRichTextEditor from './MiniRichTextEditor'
import { uploadBlogImage } from '../../api/client'
import { createDefaultBlock } from '../../utils/blogBlocks'

/**
 * Inspector Drawer that controls either Container layout (flex direction, justify, gap, children)
 * or Atomic element properties (text, image, button, callout, icon).
 */
export default function BlockPropertiesDrawer({
  block,
  index,
  totalBlocks,
  onUpdate,
  onClose,
  onDelete,
  onDuplicate,
  onMove,
}) {
  if (!block) return null

  return (
    <div className="flex h-full flex-col bg-slate-950/95 backdrop-blur-md">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-panel-edge/80 px-4 py-3 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neon-blue/15 text-neon-blue font-mono text-xs font-bold uppercase">
            {block.type === 'container' ? '⊞' : '✦'}
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white capitalize leading-none">
              {block.type.replace('_', ' ')} Inspector
            </h3>
            <span className="font-mono text-[10px] text-slate-400">
              {block.type === 'container' ? 'Auto-Layout Container' : 'Atomic Element'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onMove && typeof index === 'number' && (
            <>
              <button
                type="button"
                onClick={() => onMove(index, index - 1)}
                disabled={index === 0}
                title="Move Up"
                className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-white disabled:opacity-20 text-xs"
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={() => onMove(index, index + 1)}
                disabled={index === totalBlocks - 1}
                title="Move Down"
                className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-white disabled:opacity-20 text-xs"
              >
                &darr;
              </button>
            </>
          )}
          {onDuplicate && typeof index === 'number' && (
            <button
              type="button"
              onClick={() => onDuplicate(index)}
              title="Duplicate"
              className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-white text-xs"
            >
              &#x2398;
            </button>
          )}
          {onDelete && typeof index === 'number' && (
            <button
              type="button"
              onClick={() => onDelete(index)}
              title="Delete"
              className="rounded p-1 text-slate-400 hover:bg-panel-edge/60 hover:text-status-red text-xs"
            >
              &times;
            </button>
          )}
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

      {/* Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DrawerFields block={block} onUpdate={onUpdate} />
      </div>

      {/* Drawer Footer */}
      <div className="border-t border-panel-edge/80 px-4 py-2.5 bg-white/[0.015] flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">Updates live on canvas</span>
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
    /* =========================================================================
       CONTAINER / FLEXBOX (Auto-Layout Row / Column like Figma/FlutterFlow)
       ========================================================================= */
    case 'container': {
      const children = block.children || []

      const addChild = (type) => {
        const newChild = createDefaultBlock(type)
        onUpdate({ children: [...children, newChild] })
      }

      const removeChild = (i) => {
        onUpdate({ children: children.filter((_, idx) => idx !== i) })
      }

      return (
        <div className="space-y-4">
          {/* Direction: Row vs Column */}
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Layout Direction</label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => onUpdate({ direction: 'row' })}
                className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium ${
                  (block.direction || 'row') === 'row'
                    ? 'bg-neon-blue text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>&rarr; Horizontal (Row)</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ direction: 'column' })}
                className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium ${
                  block.direction === 'column'
                    ? 'bg-neon-blue text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>&darr; Vertical (Stack)</span>
              </button>
            </div>
          </div>

          {/* Alignment & Justify */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Justify (Main Axis)</label>
              <select
                value={block.justify || 'start'}
                onChange={(e) => onUpdate({ justify: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="start">Start (Left)</option>
                <option value="center">Center</option>
                <option value="between">Space Between</option>
                <option value="end">End (Right)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Align (Cross Axis)</label>
              <select
                value={block.align || 'center'}
                onChange={(e) => onUpdate({ align: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="start">Top</option>
                <option value="center">Center</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
          </div>

          {/* Spacing & Gap */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Item Gap</label>
              <select
                value={block.gap || 'md'}
                onChange={(e) => onUpdate({ gap: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="none">None (0px)</option>
                <option value="sm">Small (12px)</option>
                <option value="md">Medium (24px)</option>
                <option value="lg">Large (36px)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Padding</label>
              <select
                value={block.padding || 'md'}
                onChange={(e) => onUpdate({ padding: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>

          {/* Background & Border Card Styling */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 font-medium">Background</label>
              <select
                value={block.background || 'none'}
                onChange={(e) => onUpdate({ background: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/80 px-2 py-1 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="none">Transparent</option>
                <option value="subtle">Subtle Card</option>
                <option value="gradient">Gradient Dark</option>
                <option value="accent">Purple Accent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 font-medium">Border</label>
              <select
                value={block.border || 'solid'}
                onChange={(e) => onUpdate({ border: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/80 px-2 py-1 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="none">None</option>
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 font-medium">Corners</label>
              <select
                value={block.radius || 'lg'}
                onChange={(e) => onUpdate({ radius: e.target.value })}
                className="w-full rounded border border-panel-edge bg-abyss/80 px-2 py-1 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="none">Square (0)</option>
                <option value="md">Medium</option>
                <option value="lg">Rounded</option>
                <option value="full">Pill</option>
              </select>
            </div>
          </div>

          {/* Child Blocks Inside Container */}
          <div className="border-t border-panel-edge/80 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold">
                Children ({children.length})
              </label>
              <span className="text-[10px] text-slate-500">Tap on canvas to edit child</span>
            </div>

            <div className="space-y-1.5">
              {children.map((child, i) => (
                <div
                  key={child.id || i}
                  className="flex items-center justify-between rounded-lg border border-panel-edge/60 bg-abyss/60 px-3 py-1.5 text-xs text-slate-300"
                >
                  <span className="font-mono text-[10px] uppercase text-neon-blue font-bold">
                    {i + 1}. {child.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="text-slate-500 hover:text-status-red text-xs px-1"
                    title="Remove child block"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add child buttons */}
            <div className="pt-1.5">
              <span className="mb-1 block text-[10px] text-slate-500 font-mono uppercase">Add Child into Container:</span>
              <div className="flex flex-wrap gap-1">
                {['text', 'image', 'heading', 'icon_badge', 'button'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addChild(t)}
                    className="rounded border border-panel-edge bg-abyss/80 px-2 py-1 text-[11px] text-slate-300 hover:border-neon-blue hover:text-white"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    /* =========================================================================
       ATOMIC: HEADING
       ========================================================================= */
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

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Alignment</label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {['left', 'center', 'right'].map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdate({ align: al })}
                  className={`rounded py-1 text-xs capitalize ${
                    (block.align || 'left') === al ? 'bg-neon-blue text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>
        </div>
      )

    /* =========================================================================
       ATOMIC: TEXT / PARAGRAPH
       ========================================================================= */
    case 'text':
    case 'paragraph':
      return (
        <div className="space-y-2">
          <label className="mb-1 block text-xs text-slate-400 font-medium">Text Content</label>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Type text, links, lists..."
          />
        </div>
      )

    /* =========================================================================
       ATOMIC: IMAGE
       ========================================================================= */
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
            <label className="mb-1 block text-xs text-slate-400 font-medium">Image URL or Upload</label>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Width in Layout</label>
              <select
                value={block.width || '100%'}
                onChange={(e) => onUpdate({ width: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="auto">Auto</option>
                <option value="25%">25% (Small)</option>
                <option value="33%">33% (One Third)</option>
                <option value="42%">42% (Medium)</option>
                <option value="50%">50% (Half Width)</option>
                <option value="100%">100% (Full Width)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Object Fit</label>
              <select
                value={block.fit || 'cover'}
                onChange={(e) => onUpdate({ fit: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="cover">Cover (Fill space)</option>
                <option value="contain">Contain (Full aspect)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Caption (Optional)</label>
            <input
              type="text"
              placeholder="Caption below image"
              value={block.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Alt Text</label>
            <input
              type="text"
              placeholder="Accessibility alt description"
              value={block.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )
    }

    /* =========================================================================
       ATOMIC: ICON BADGE
       ========================================================================= */
    case 'icon_badge': {
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Badge Text</label>
            <input
              type="text"
              placeholder="e.g. Pro Tip, High Performance"
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Icon</label>
              <select
                value={block.icon || 'bolt'}
                onChange={(e) => onUpdate({ icon: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="bolt">⚡ Bolt</option>
                <option value="star">★ Star</option>
                <option value="check">✓ Check</option>
                <option value="shield">🛡️ Shield</option>
                <option value="sparkles">✨ Sparkles</option>
                <option value="terminal">⌨️ Terminal</option>
                <option value="heart">♥ Heart</option>
                <option value="code">&lt;/&gt; Code</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Color Variant</label>
              <select
                value={block.variant || 'primary'}
                onChange={(e) => onUpdate({ variant: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="primary">Purple (Brand)</option>
                <option value="emerald">Green</option>
                <option value="amber">Amber</option>
                <option value="sky">Blue</option>
                <option value="slate">Subtle Slate</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    /* =========================================================================
       ATOMIC: BUTTON
       ========================================================================= */
    case 'button':
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Button Label</label>
            <input
              type="text"
              placeholder="e.g. Get Started"
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Link URL</label>
            <input
              type="text"
              placeholder="/#start"
              value={block.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Button Style</label>
            <select
              value={block.variant || 'primary'}
              onChange={(e) => onUpdate({ variant: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
            >
              <option value="primary">Primary Solid (#6D5AF6)</option>
              <option value="secondary">Outline</option>
              <option value="subtle">Subtle Dark Card</option>
            </select>
          </div>
        </div>
      )

    /* =========================================================================
       ATOMIC: CODE SNIPPET
       ========================================================================= */
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
            <label className="mb-1 block text-xs text-slate-400 font-medium">Header Filename</label>
            <input
              type="text"
              placeholder="e.g. Info.plist, auth_service.dart"
              value={block.filename || ''}
              onChange={(e) => onUpdate({ filename: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Code</label>
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

    /* =========================================================================
       ATOMIC: CALLOUT
       ========================================================================= */
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
            <label className="mb-1 block text-xs text-slate-400 font-medium">Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Pro Tip, Warning"
              value={block.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Message Body</label>
            <textarea
              rows={3}
              placeholder="Message explanation..."
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    /* =========================================================================
       ATOMIC: QUOTE
       ========================================================================= */
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
              placeholder="e.g. Jahanzaib Waris"
              value={block.author || ''}
              onChange={(e) => onUpdate({ author: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Role / Title</label>
            <input
              type="text"
              placeholder="e.g. Lead FlutterFlow Engineer"
              value={block.role || ''}
              onChange={(e) => onUpdate({ role: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    /* =========================================================================
       DIVIDER
       ========================================================================= */
    case 'divider':
      return (
        <div className="space-y-3">
          <label className="mb-1 block text-xs text-slate-400 font-medium">Divider Style</label>
          <div className="grid grid-cols-2 gap-2">
            {['gradient', 'hairline'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onUpdate({ style: st })}
                className={`rounded border py-2 text-xs capitalize ${
                  (block.style || 'gradient') === st
                    ? 'border-neon-blue bg-neon-blue/15 text-neon-blue font-semibold'
                    : 'border-panel-edge text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )

    /* =========================================================================
       CLASSIC
       ========================================================================= */
    case 'classic':
    default:
      return (
        <div className="space-y-2">
          <label className="mb-1 block text-xs text-slate-400 font-medium">Classic Post HTML</label>
          <MiniRichTextEditor
            value={block.html || ''}
            onChange={(html) => onUpdate({ html })}
            placeholder="Post content..."
          />
        </div>
      )
  }
}

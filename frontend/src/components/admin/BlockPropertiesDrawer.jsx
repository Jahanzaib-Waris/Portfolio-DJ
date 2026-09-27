import MiniRichTextEditor from './MiniRichTextEditor'
import { uploadBlogImage } from '../../api/client'
import { createDefaultBlock, createBlockId } from '../../utils/blogBlocks'

/**
 * Inspector Drawer that controls either Container layout (flex direction, justify, gap, children)
 * or Atomic element properties (text, image, button, callout, icon).
 */
export default function BlockPropertiesDrawer({
  block,
  index,
  totalBlocks,
  parentBlock,
  onSelectBlock,
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
              {parentBlock ? (
                <button
                  type="button"
                  onClick={() => onSelectBlock && onSelectBlock(parentBlock.id)}
                  className="text-neon-blue hover:underline font-medium"
                  title="Click to select parent container"
                >
                  Inside {parentBlock.direction === 'column' ? 'Stack' : 'Row'} &uarr;
                </button>
              ) : block.type === 'container' ? (
                'Auto-Layout Container'
              ) : (
                'Atomic Element'
              )}
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
        {parentBlock && (
          <ChildLayoutSection
            block={block}
            parentBlock={parentBlock}
            onUpdate={onUpdate}
            onSelectBlock={onSelectBlock}
          />
        )}
        <DrawerFields block={block} onUpdate={onUpdate} onSelectBlock={onSelectBlock} />
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

function DrawerFields({ block, onUpdate, onSelectBlock }) {
  switch (block.type) {
    /* =========================================================================
       CONTAINER / FLEXBOX (Auto-Layout Row / Column like Figma/FlutterFlow)
       ========================================================================= */
    case 'container': {
      const children = block.children || []
      const isCol = block.direction === 'column'

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
                onClick={() =>
                  onUpdate({
                    direction: 'row',
                    align: block.align === 'stretch' ? 'start' : block.align || 'start',
                  })
                }
                className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium ${
                  !isCol
                    ? 'bg-neon-blue text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>&rarr; Horizontal (Row)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    direction: 'column',
                    align: block.align === 'start' ? 'stretch' : block.align || 'stretch',
                  })
                }
                className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium ${
                  isCol
                    ? 'bg-neon-blue text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>&darr; Vertical (Stack)</span>
              </button>
            </div>
          </div>

          {/* Wrap / Responsive Stacking */}
          {!isCol && (
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Line Wrapping</label>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => onUpdate({ wrap: true })}
                  className={`rounded py-1 text-xs font-medium ${
                    block.wrap !== false
                      ? 'bg-neon-blue text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wrap (Multi-Line)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ wrap: false })}
                  className={`rounded py-1 text-xs font-medium ${
                    block.wrap === false
                      ? 'bg-neon-blue text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No Wrap (Single Row)
                </button>
              </div>
            </div>
          )}

          {/* Alignment & Justify */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">
                Justify ({isCol ? 'Main / Vertical' : 'Main / Horizontal'})
              </label>
              <select
                value={block.justify || 'start'}
                onChange={(e) => onUpdate({ justify: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="start">{isCol ? 'Top (Start)' : 'Left (Start)'}</option>
                <option value="center">Center</option>
                <option value="between">Space Between</option>
                <option value="end">{isCol ? 'Bottom (End)' : 'Right (End)'}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">
                Align ({isCol ? 'Cross / Horizontal' : 'Cross / Vertical'})
              </label>
              <select
                value={block.align || (isCol ? 'stretch' : 'start')}
                onChange={(e) => onUpdate({ align: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                {isCol ? (
                  <>
                    <option value="stretch">Stretch (Full Width)</option>
                    <option value="start">Left (Start)</option>
                    <option value="center">Center</option>
                    <option value="end">Right (End)</option>
                  </>
                ) : (
                  <>
                    <option value="start">Top (Start)</option>
                    <option value="center">Center (Middle)</option>
                    <option value="end">Bottom (End)</option>
                    <option value="stretch">Stretch (Match Height)</option>
                  </>
                )}
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
              <span className="text-[10px] text-slate-500">Tap child below or canvas to edit</span>
            </div>

            <div className="space-y-1.5">
              {children.map((child, i) => (
                <div
                  key={child.id || i}
                  className="flex items-center justify-between rounded-lg border border-panel-edge/60 bg-abyss/60 px-3 py-1.5 text-xs text-slate-300 hover:border-neon-blue/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectBlock && onSelectBlock(child.id)}
                    className="flex flex-1 items-center gap-2 text-left font-mono text-[11px] text-slate-200 hover:text-neon-blue"
                    title="Click to edit child properties"
                  >
                    <span className="font-bold text-neon-blue">#{i + 1}</span>
                    <span className="uppercase">{child.type}</span>
                    <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-slate-400">
                      {child.layoutWidth || child.width || 'fill'}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectBlock && onSelectBlock(child.id)}
                      className="text-[11px] text-slate-400 hover:text-white"
                      title="Edit child"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      className="text-slate-500 hover:text-status-red text-xs px-1"
                      title="Remove child block"
                    >
                      &times;
                    </button>
                  </div>
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
            <label className="mb-1 block text-xs text-slate-400 font-medium">Text Gradient Accent</label>
            <div className="grid grid-cols-4 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
              {[
                { id: 'none', label: 'Plain' },
                { id: 'neon', label: 'Neon' },
                { id: 'emerald', label: 'Emerald' },
                { id: 'amber', label: 'Amber' },
              ].map((grad) => (
                <button
                  key={grad.id}
                  type="button"
                  onClick={() => onUpdate({ gradient: grad.id })}
                  className={`rounded py-1 text-[11px] capitalize ${
                    (block.gradient || 'none') === grad.id
                      ? 'bg-neon-blue text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {grad.label}
                </button>
              ))}
            </div>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Height Limit</label>
              <select
                value={block.height || 'auto'}
                onChange={(e) => onUpdate({ height: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="auto">Auto (Natural)</option>
                <option value="180px">180px (Compact)</option>
                <option value="240px">240px (Small)</option>
                <option value="300px">300px (Medium)</option>
                <option value="380px">380px (Standard)</option>
                <option value="460px">460px (Large)</option>
                <option value="560px">560px (Hero / Tall)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Aspect Ratio</label>
              <select
                value={block.aspectRatio || 'auto'}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="auto">Auto</option>
                <option value="16/9">16:9 (Widescreen)</option>
                <option value="4/3">4:3 (Classic)</option>
                <option value="1/1">1:1 (Square)</option>
                <option value="21/9">21:9 (Cinematic)</option>
                <option value="3/2">3:2 (Photo)</option>
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
          <div className="grid grid-cols-2 gap-2">
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
            <div>
              <label className="mb-1 block text-xs text-slate-400 font-medium">Size</label>
              <select
                value={block.size || 'md'}
                onChange={(e) => onUpdate({ size: e.target.value })}
                className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Link Target</label>
            <select
              value={block.target || '_self'}
              onChange={(e) => onUpdate({ target: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
            >
              <option value="_self">Same Tab (_self)</option>
              <option value="_blank">New Tab (_blank)</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-panel-edge bg-abyss/80 px-3 py-2">
            <span className="text-xs text-slate-300">Expand Full Width</span>
            <input
              type="checkbox"
              checked={block.fullWidth || false}
              onChange={(e) => onUpdate({ fullWidth: e.target.checked })}
              className="accent-neon-blue cursor-pointer"
            />
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
          <div>
            <label className="mb-1 block text-xs text-slate-400 font-medium">Author Avatar URL (Optional)</label>
            <input
              type="text"
              placeholder="https://... avatar image"
              value={block.avatar || ''}
              onChange={(e) => onUpdate({ avatar: e.target.value })}
              className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
            />
          </div>
        </div>
      )

    /* =========================================================================
       ATOMIC: TABLE (Comparison & Benchmarks)
       ========================================================================= */
    case 'table':
      return <TableBlockEditor block={block} onUpdate={onUpdate} />

    /* =========================================================================
       ATOMIC: LIST (Bullets & Numbered)
       ========================================================================= */
    case 'list':
      return <ListBlockEditor block={block} onUpdate={onUpdate} />

    /* =========================================================================
       ATOMIC: VIDEO EMBED
       ========================================================================= */
    case 'video':
      return <VideoBlockEditor block={block} onUpdate={onUpdate} />

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

function ChildLayoutSection({ block, parentBlock, onUpdate, onSelectBlock }) {
  if (!parentBlock) return null
  const isParentCol = parentBlock.direction === 'column'

  return (
    <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/[0.04] p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase font-bold text-neon-blue flex items-center gap-1">
          <span>⊞</span> Child Sizing in {isParentCol ? 'Stack (Col)' : 'Row'}
        </span>
        <button
          type="button"
          onClick={() => onSelectBlock && onSelectBlock(parentBlock.id)}
          className="text-[10px] text-slate-400 hover:text-neon-blue underline"
        >
          Select Container &uarr;
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] text-slate-400 font-medium">Width / Space</label>
          <select
            value={
              block.layoutWidth ||
              (block.width && block.width !== '100%'
                ? block.width
                : ['button', 'icon_badge'].includes(block.type)
                ? 'hug'
                : 'fill')
            }
            onChange={(e) => onUpdate({ layoutWidth: e.target.value, width: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/90 px-2 py-1 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            {isParentCol ? (
              <>
                <option value="fill">100% (Full Width)</option>
                <option value="hug">Hug (Auto / Fit)</option>
              </>
            ) : (
              <>
                <option value="fill">Fill Remaining (1fr)</option>
                <option value="hug">Hug (Auto / Fit)</option>
                <option value="25%">25% (Quarter)</option>
                <option value="33%">33% (One Third)</option>
                <option value="40%">40% (Medium)</option>
                <option value="50%">50% (Half Width)</option>
                <option value="60%">60% (Wide)</option>
                <option value="66%">66% (Two Thirds)</option>
                <option value="75%">75% (Three Quarters)</option>
                <option value="100%">100% (Full Row)</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-slate-400 font-medium">Align Self</label>
          <select
            value={block.alignSelf || 'auto'}
            onChange={(e) => onUpdate({ alignSelf: e.target.value })}
            className="w-full rounded border border-panel-edge bg-abyss/90 px-2 py-1 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="auto">Auto (Inherit)</option>
            <option value="start">{isParentCol ? 'Left' : 'Top'}</option>
            <option value="center">Center</option>
            <option value="end">{isParentCol ? 'Right' : 'Bottom'}</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   TABLE BLOCK EDITOR
   ========================================================================= */
function TableBlockEditor({ block, onUpdate }) {
  const columns = block.columns || []
  const rows = block.rows || []

  const handleAddColumn = () => {
    const newColId = createBlockId()
    const nextColNum = columns.length + 1
    const newColumns = [
      ...columns,
      { id: newColId, label: `Col ${nextColNum}`, align: 'center', width: 'auto' },
    ]
    const newRows = rows.map((r) => ({
      ...r,
      cells: [...(r.cells || []), { text: '-', type: 'text' }],
    }))
    onUpdate({ columns: newColumns, rows: newRows })
  }

  const handleRemoveColumn = (colIndex) => {
    if (columns.length <= 1) return
    const newColumns = columns.filter((_, idx) => idx !== colIndex)
    const newRows = rows.map((r) => ({
      ...r,
      cells: (r.cells || []).filter((_, idx) => idx !== colIndex),
    }))
    onUpdate({ columns: newColumns, rows: newRows })
  }

  const handleUpdateColumn = (colIndex, updates) => {
    const newColumns = columns.map((c, idx) => (idx === colIndex ? { ...c, ...updates } : c))
    onUpdate({ columns: newColumns })
  }

  const handleAddRow = () => {
    const newRow = {
      id: createBlockId(),
      cells: columns.map(() => ({ text: '', type: 'text' })),
    }
    onUpdate({ rows: [...rows, newRow] })
  }

  const handleRemoveRow = (rowIndex) => {
    if (rows.length <= 1) return
    onUpdate({ rows: rows.filter((_, idx) => idx !== rowIndex) })
  }

  const handleUpdateCell = (rowIndex, colIndex, updates) => {
    const newRows = rows.map((r, rIdx) => {
      if (rIdx !== rowIndex) return r
      const newCells = (r.cells || []).map((c, cIdx) =>
        cIdx === colIndex ? { ...c, ...updates } : c
      )
      return { ...r, cells: newCells }
    })
    onUpdate({ rows: newRows })
  }

  return (
    <div className="space-y-4">
      {/* Table Title & Appearance */}
      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">Table Title (Optional)</label>
        <input
          type="text"
          placeholder="e.g. Feature Comparison, Benchmarks"
          value={block.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center justify-between rounded-lg border border-panel-edge bg-abyss/80 px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer">
          <span>Striped Rows</span>
          <input
            type="checkbox"
            checked={block.striped !== false}
            onChange={(e) => onUpdate({ striped: e.target.checked })}
            className="accent-neon-blue cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-panel-edge bg-abyss/80 px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer">
          <span>Compact Density</span>
          <input
            type="checkbox"
            checked={block.compact || false}
            onChange={(e) => onUpdate({ compact: e.target.checked })}
            className="accent-neon-blue cursor-pointer"
          />
        </label>
      </div>

      {/* Columns Manager */}
      <div className="rounded-xl border border-panel-edge/80 bg-abyss/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Columns ({columns.length})</span>
          <button
            type="button"
            onClick={handleAddColumn}
            className="rounded border border-neon-blue/40 bg-neon-blue/15 px-2 py-0.5 text-[11px] font-medium text-neon-blue hover:bg-neon-blue hover:text-white"
          >
            + Add Column
          </button>
        </div>

        <div className="space-y-2">
          {columns.map((col, colIdx) => (
            <div
              key={col.id || colIdx}
              className="rounded-lg border border-panel-edge bg-abyss/90 p-2 text-xs space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Column Header"
                  value={col.label || ''}
                  onChange={(e) => handleUpdateColumn(colIdx, { label: e.target.value })}
                  className="flex-1 rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
                />
                <button
                  type="button"
                  disabled={columns.length <= 1}
                  onClick={() => handleRemoveColumn(colIdx)}
                  className="rounded p-1 text-slate-500 hover:text-status-red disabled:opacity-20"
                  title="Delete column"
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Alignment */}
                <div className="flex items-center gap-1">
                  {['left', 'center', 'right'].map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => handleUpdateColumn(colIdx, { align: al })}
                      className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${
                        (col.align || 'left') === al
                          ? 'bg-neon-blue text-white font-medium'
                          : 'bg-panel-edge/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>

                {/* Highlight toggle */}
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={col.isHighlight || false}
                    onChange={(e) => handleUpdateColumn(colIdx, { isHighlight: e.target.checked })}
                    className="accent-neon-blue"
                  />
                  <span>Highlight</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rows & Cells Manager */}
      <div className="rounded-xl border border-panel-edge/80 bg-abyss/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Table Rows ({rows.length})</span>
          <button
            type="button"
            onClick={handleAddRow}
            className="rounded border border-neon-blue/40 bg-neon-blue/15 px-2 py-0.5 text-[11px] font-medium text-neon-blue hover:bg-neon-blue hover:text-white"
          >
            + Add Row
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, rowIdx) => (
            <div
              key={row.id || rowIdx}
              className="rounded-lg border border-panel-edge/90 bg-slate-950/70 p-2.5 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-panel-edge/50 pb-1.5">
                <span className="text-[11px] font-mono font-semibold text-slate-300">
                  Row {rowIdx + 1}
                </span>
                <button
                  type="button"
                  disabled={rows.length <= 1}
                  onClick={() => handleRemoveRow(rowIdx)}
                  className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-status-red/10 hover:text-status-red disabled:opacity-20"
                >
                  Delete Row
                </button>
              </div>

              {/* Cells for this row */}
              <div className="space-y-2">
                {columns.map((col, colIdx) => {
                  const cell = (row.cells && row.cells[colIdx]) || { text: '', type: 'text' }
                  return (
                    <div
                      key={col.id || colIdx}
                      className="rounded border border-panel-edge/60 bg-abyss/60 p-1.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[140px]">
                          {col.label || `Col ${colIdx + 1}`}
                        </span>
                        <select
                          value={cell.type || 'text'}
                          onChange={(e) =>
                            handleUpdateCell(rowIdx, colIdx, {
                              type: e.target.value,
                              status: e.target.value === 'check' ? (cell.status || 'yes') : undefined,
                            })
                          }
                          className="rounded border border-panel-edge bg-slate-900 px-1 py-0.5 text-[10px] text-slate-300 outline-none"
                        >
                          <option value="text">Text / Badge</option>
                          <option value="check">Check (✓ / ✕)</option>
                          <option value="image">Image / Logo</option>
                        </select>
                      </div>

                      {cell.type === 'check' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCell(rowIdx, colIdx, { status: 'yes' })}
                            className={`flex-1 rounded py-1 text-xs font-semibold ${
                              cell.status === 'yes'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-900 text-slate-500 hover:text-white'
                            }`}
                          >
                            ✓ Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCell(rowIdx, colIdx, { status: 'no' })}
                            className={`flex-1 rounded py-1 text-xs font-semibold ${
                              cell.status === 'no'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-slate-900 text-slate-500 hover:text-white'
                            }`}
                          >
                            ✕ No
                          </button>
                        </div>
                      ) : cell.type === 'image' ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Image / Icon URL (https://...)"
                            value={cell.imageSrc || ''}
                            onChange={(e) =>
                              handleUpdateCell(rowIdx, colIdx, { imageSrc: e.target.value })
                            }
                            className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-neon-blue outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Optional label text"
                            value={cell.text || ''}
                            onChange={(e) =>
                              handleUpdateCell(rowIdx, colIdx, { text: e.target.value })
                            }
                            className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:border-neon-blue outline-none"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Cell text..."
                            value={cell.text || ''}
                            onChange={(e) =>
                              handleUpdateCell(rowIdx, colIdx, { text: e.target.value })
                            }
                            className="w-full rounded border border-panel-edge bg-slate-950 px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-neon-blue outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Optional badge tag (e.g. Fast, New)"
                            value={cell.badge || ''}
                            onChange={(e) =>
                              handleUpdateCell(rowIdx, colIdx, { badge: e.target.value })
                            }
                            className="w-full rounded border border-panel-edge/80 bg-slate-950/60 px-2 py-0.5 text-[11px] text-amber-300 placeholder-slate-600 focus:border-neon-blue outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   LIST BLOCK EDITOR
   ========================================================================= */
function ListBlockEditor({ block, onUpdate }) {
  const items = block.items || []

  const handleAddItem = () => {
    const newItem = { id: createBlockId(), text: '' }
    onUpdate({ items: [...items, newItem] })
  }

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return
    onUpdate({ items: items.filter((_, idx) => idx !== index) })
  }

  const handleUpdateItem = (index, text) => {
    const newItems = items.map((item, idx) => (idx === index ? { ...item, text } : item))
    onUpdate({ items: newItems })
  }

  const isOrdered = block.listType === 'ordered'

  return (
    <div className="space-y-4">
      {/* Type: Unordered vs Ordered */}
      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">List Format</label>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => onUpdate({ listType: 'unordered' })}
            className={`rounded py-1 text-xs font-medium ${
              !isOrdered
                ? 'bg-neon-blue text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✦ Bullet List
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ listType: 'ordered' })}
            className={`rounded py-1 text-xs font-medium ${
              isOrdered
                ? 'bg-neon-blue text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Numbered List
          </button>
        </div>
      </div>

      {/* Bullet Marker Style (if unordered) */}
      {!isOrdered && (
        <div>
          <label className="mb-1 block text-xs text-slate-400 font-medium">Bullet Marker Style</label>
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
            {[
              { id: 'check', label: '✓ Check' },
              { id: 'arrow', label: '→ Arrow' },
              { id: 'bolt', label: '⚡ Bolt' },
              { id: 'dot', label: '• Dot' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onUpdate({ style: st.id })}
                className={`rounded py-1 text-[11px] capitalize ${
                  (block.style || 'check') === st.id
                    ? 'bg-neon-blue text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Item Spacing */}
      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">Line Spacing</label>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
          {['compact', 'normal', 'relaxed'].map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => onUpdate({ spacing: sp })}
              className={`rounded py-1 text-xs capitalize ${
                (block.spacing || 'normal') === sp
                  ? 'bg-neon-blue text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Items Manager */}
      <div className="rounded-xl border border-panel-edge/80 bg-abyss/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">List Items ({items.length})</span>
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded border border-neon-blue/40 bg-neon-blue/15 px-2 py-0.5 text-[11px] font-medium text-neon-blue hover:bg-neon-blue hover:text-white"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-2">
              <span className="mt-2 font-mono text-[11px] text-slate-500 w-4 text-right">
                {isOrdered ? `${idx + 1}.` : '•'}
              </span>
              <textarea
                rows={2}
                placeholder="Enter list item..."
                value={item.text || ''}
                onChange={(e) => handleUpdateItem(idx, e.target.value)}
                className="flex-1 rounded-lg border border-panel-edge bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-neon-blue outline-none"
              />
              <button
                type="button"
                disabled={items.length <= 1}
                onClick={() => handleRemoveItem(idx)}
                className="mt-1.5 rounded p-1 text-slate-500 hover:text-status-red disabled:opacity-20"
                title="Remove item"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   VIDEO BLOCK EDITOR
   ========================================================================= */
function VideoBlockEditor({ block, onUpdate }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">Video Provider</label>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-panel-edge bg-abyss/80 p-1 text-xs">
          {[
            { id: 'youtube', label: 'YouTube' },
            { id: 'vimeo', label: 'Vimeo' },
            { id: 'mp4', label: 'Direct MP4' },
          ].map((pv) => (
            <button
              key={pv.id}
              type="button"
              onClick={() => onUpdate({ provider: pv.id })}
              className={`rounded py-1 text-xs capitalize ${
                (block.provider || 'youtube') === pv.id
                  ? 'bg-neon-blue text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {pv.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">Video URL / Share Link</label>
        <input
          type="text"
          placeholder={
            block.provider === 'youtube'
              ? 'https://www.youtube.com/watch?v=...'
              : block.provider === 'vimeo'
              ? 'https://vimeo.com/...'
              : 'https://domain.com/video.mp4'
          }
          value={block.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          Paste standard video URL. Embed link is automatically generated.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400 font-medium">Aspect Ratio</label>
          <select
            value={block.aspectRatio || '16/9'}
            onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
            className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="16/9">16:9 (Standard HD)</option>
            <option value="4/3">4:3 (Classic)</option>
            <option value="21/9">21:9 (Ultrawide)</option>
            <option value="1/1">1:1 (Square)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400 font-medium">Border Radius</label>
          <select
            value={block.radius || 'lg'}
            onChange={(e) => onUpdate({ radius: e.target.value })}
            className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-neon-blue"
          >
            <option value="none">Sharp (None)</option>
            <option value="md">Rounded (MD)</option>
            <option value="lg">Smooth (LG)</option>
            <option value="full">Pill / Max</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">Video Title (Optional)</label>
        <input
          type="text"
          placeholder="e.g. Architecture Overview Demo"
          value={block.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400 font-medium">Caption (Optional)</label>
        <input
          type="text"
          placeholder="Caption text below video..."
          value={block.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          className="w-full rounded-lg border border-panel-edge bg-abyss/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-neon-blue outline-none"
        />
      </div>
    </div>
  )
}


import { useState } from 'react'

import MarkdownContent from '../MarkdownContent'

/**
 * Split-pane Markdown editor.
 *
 * Side by side from `lg` up; below that the panes become tabs, since two
 * columns of prose on a phone is useless.
 */
export default function MarkdownEditor({ value, onChange, id = 'content' }) {
  const [mobilePane, setMobilePane] = useState('write')

  const tabClass = (pane) =>
    `rounded-md px-3 py-1 text-xs transition-colors ${
      mobilePane === pane ? 'bg-neon-blue/10 text-neon-blue' : 'text-slate-400 hover:text-slate-200'
    }`

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="system-heading text-xs text-slate-400">
          Content <span className="text-slate-600">(Markdown)</span>
        </label>

        <div className="flex gap-1 lg:hidden">
          <button type="button" onClick={() => setMobilePane('write')} className={tabClass('write')}>
            Write
          </button>
          <button type="button" onClick={() => setMobilePane('preview')} className={tabClass('preview')}>
            Preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck="true"
          className={`min-h-[28rem] w-full resize-y rounded-md border border-panel-edge bg-abyss/60 p-3 font-mono-ui text-sm leading-relaxed text-slate-100 outline-none transition-colors focus:border-neon-blue ${
            mobilePane === 'write' ? '' : 'hidden lg:block'
          }`}
          placeholder="# Your post&#10;&#10;Write in Markdown. The preview renders with the same component the live site uses."
        />

        <div
          className={`min-h-[28rem] overflow-auto rounded-md border border-panel-edge bg-void/40 p-4 ${
            mobilePane === 'preview' ? '' : 'hidden lg:block'
          }`}
        >
          {value?.trim() ? (
            <MarkdownContent className="text-slate-300">{value}</MarkdownContent>
          ) : (
            <p className="text-sm text-slate-600">Preview appears here.</p>
          )}
        </div>
      </div>
    </div>
  )
}

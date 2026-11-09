import { Link } from 'react-router-dom'
import { tableWrapClass, tdClass, thClass } from '../../../components/admin/formStyles'

// Small building blocks for the help topics, so the content stays readable and consistent.

export function P({ children }) {
  return <p className="text-sm leading-relaxed text-slate-300">{children}</p>
}

export function Ul({ children }) {
  return <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300 marker:text-slate-500">{children}</ul>
}

export function Ol({ children }) {
  return <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300 marker:font-semibold marker:text-slate-400">{children}</ol>
}

export function B({ children }) {
  return <strong className="font-semibold text-white">{children}</strong>
}

/** A button or menu label as it appears in the app. */
export function Ui({ children }) {
  return (
    <span className="whitespace-nowrap rounded border border-panel-edge bg-abyss px-1.5 py-0.5 text-xs font-medium text-slate-100">
      {children}
    </span>
  )
}

const NOTE_STYLES = {
  info: 'border-neon-blue/60 bg-neon-blue/5',
  warn: 'border-amber-500/60 bg-amber-500/5',
  tip: 'border-emerald-500/60 bg-emerald-500/5',
}
const NOTE_LABELS = { info: 'Good to know', warn: 'Careful', tip: 'Tip' }

export function Note({ kind = 'info', children }) {
  return (
    <div className={`rounded-r-lg border-l-2 px-4 py-3 text-sm leading-relaxed text-slate-300 ${NOTE_STYLES[kind]}`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{NOTE_LABELS[kind]}</p>
      {children}
    </div>
  )
}

/** Link to another admin page. */
export function Go({ to, children }) {
  return (
    <Link to={to} className="font-medium text-neon-blue hover:underline">
      {children}
    </Link>
  )
}

/** rows: array of arrays of cell content. head: array of column titles. */
export function Table({ head, rows }) {
  return (
    <div className={`${tableWrapClass} !mt-0`}>
      <table className="w-full text-sm">
        <thead className="border-b border-panel-edge">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className={thClass}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-panel-edge/70">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`${tdClass} align-top text-slate-300 ${j === 0 ? 'whitespace-nowrap font-medium text-white' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

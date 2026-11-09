// Shared pieces for the prototype demos, so every demo looks like part of one showcase.

/** Window-style frame used around every demo. */
export function DemoShell({ title, children, onReset, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-panel-edge bg-panel/80 shadow-[0_30px_80px_-40px_rgba(124,108,255,0.45)] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-panel-edge bg-abyss/70 px-4 py-2.5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <p className="min-w-0 truncate text-xs font-medium text-[#A1A7CA]">{title}</p>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-panel-edge px-2 py-0.5 text-[11px] font-medium text-[#A1A7CA] sm:inline">
            Dummy data
          </span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-panel-edge px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-neon-indigo hover:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  )
}

const AVATAR_GRADIENTS = [
  'from-[#7C6CFF] to-[#38BDF8]',
  'from-[#F472B6] to-[#7C6CFF]',
  'from-[#34D399] to-[#38BDF8]',
  'from-[#FBBF24] to-[#F472B6]',
  'from-[#60A5FA] to-[#A78BFA]',
  'from-[#2DD4BF] to-[#818CF8]',
]

/** Initials avatar on a gradient: no photos, so no real people and no image loading. */
export function Avatar({ name, index = 0, size = 'h-10 w-10', text = 'text-sm', ring = '' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} ${size} ${text} ${ring}`}
    >
      {initials}
    </span>
  )
}

export function Chip({ children, active = false, onClick, className = '' }) {
  const base = 'rounded-full border px-3 py-1 text-xs font-medium transition-colors'
  const tone = active
    ? 'border-neon-indigo bg-neon-indigo/20 text-white'
    : 'border-panel-edge bg-abyss/60 text-[#C9CEEA] hover:border-slate-400'
  if (!onClick) return <span className={`${base} ${tone} ${className}`}>{children}</span>
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} ${tone} ${className}`}>
      {children}
    </button>
  )
}

const ICONS = {
  'swipe-cards': <path d="M8 7l-4 4 4 4M16 7l4 4-4 4M12 4v14" />,
  'ai-chat': <path d="M5 6h14a1 1 0 011 1v8a1 1 0 01-1 1h-6l-4 3v-3H5a1 1 0 01-1-1V7a1 1 0 011-1z" />,
  'voice-chat': <path d="M12 4a3 3 0 013 3v4a3 3 0 11-6 0V7a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v3" />,
  'nearby-map': <path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10zm0-8a2 2 0 100-4 2 2 0 000 4z" />,
  'survey-match': <path d="M5 6h14M5 12h8M5 18h5M17 14l2 2 3-4" />,
}

export function ProtoIcon({ slug, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[slug] || ICONS['ai-chat']}
    </svg>
  )
}

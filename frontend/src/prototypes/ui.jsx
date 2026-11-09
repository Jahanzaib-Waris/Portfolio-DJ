// Shared pieces for the prototype demos, so every demo looks like part of one showcase.

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

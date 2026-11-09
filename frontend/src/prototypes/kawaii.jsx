// Building blocks for the "app inside the device" look: soft pastels, thick rounded shapes and
// hand-drawn animal faces. Each prototype picks one accent via a `kw-<colour>` class on its
// screen, and these components read the --kw-accent* variables that class defines.

const FACE_BG = ['#FFD6E8', '#E3D9FF', '#CFF3E4', '#FFE3CF', '#D5ECFF', '#FFF0B8']
const INK = '#4A3B5C'

/** The drawing of a face on a 64 x 64 canvas (no wrapper, so it can sit inside other SVGs). */
export function FaceArt({ seed = 0 }) {
  const animal = seed % 4 // 0 cat, 1 bear, 2 bunny, 3 chick
  const eyes = Math.floor(seed / 4) % 3 // dots, happy arcs, sparkly
  const mouth = Math.floor(seed / 12) % 2 // smile, cat-mouth
  const head = '#FFFDFB'
  return (
    <g>
      <circle cx="32" cy="32" r="32" fill={FACE_BG[seed % FACE_BG.length]} />
      {animal === 0 && (
        <>
          <polygon points="13,30 17,8 31,19" fill={head} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="51,30 47,8 33,19" fill={head} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points="18,24 19,14 26,19" fill="#FFB3CF" />
          <polygon points="46,24 45,14 38,19" fill="#FFB3CF" />
        </>
      )}
      {animal === 1 && (
        <>
          <circle cx="16" cy="19" r="7.5" fill={head} stroke={INK} strokeWidth="1.6" />
          <circle cx="48" cy="19" r="7.5" fill={head} stroke={INK} strokeWidth="1.6" />
          <circle cx="16" cy="19" r="3.2" fill="#FFB3CF" />
          <circle cx="48" cy="19" r="3.2" fill="#FFB3CF" />
        </>
      )}
      {animal === 2 && (
        <>
          <ellipse cx="23" cy="13" rx="5.5" ry="12" fill={head} stroke={INK} strokeWidth="1.6" />
          <ellipse cx="41" cy="13" rx="5.5" ry="12" fill={head} stroke={INK} strokeWidth="1.6" />
          <ellipse cx="23" cy="14" rx="2.4" ry="8" fill="#FFB3CF" />
          <ellipse cx="41" cy="14" rx="2.4" ry="8" fill="#FFB3CF" />
        </>
      )}
      <ellipse cx="32" cy="37" rx="21" ry="19" fill={head} stroke={INK} strokeWidth="1.6" />
      {animal === 3 && (
        <>
          <path d="M28 18c2-6 6-6 8 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          <polygon points="29,41 35,41 32,46" fill="#FFB35C" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      )}
      {eyes === 0 && (
        <>
          <circle cx="24" cy="36" r="2.4" fill={INK} />
          <circle cx="40" cy="36" r="2.4" fill={INK} />
        </>
      )}
      {eyes === 1 && <path d="M20.5 37.5q3.5-5 7 0M36.5 37.5q3.5-5 7 0" fill="none" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />}
      {eyes === 2 && (
        <>
          <circle cx="24" cy="36" r="3.2" fill={INK} />
          <circle cx="40" cy="36" r="3.2" fill={INK} />
          <circle cx="25" cy="35" r="1.1" fill="#fff" />
          <circle cx="41" cy="35" r="1.1" fill="#fff" />
        </>
      )}
      <ellipse cx="18.5" cy="42" rx="4" ry="2.4" fill="#FF9EC4" opacity="0.65" />
      <ellipse cx="45.5" cy="42" rx="4" ry="2.4" fill="#FF9EC4" opacity="0.65" />
      {animal !== 3 && (mouth === 0 ? (
        <path d="M28.5 43q3.5 3.8 7 0" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <path d="M27 42q2.5 3 5 0q2.5 3 5 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  )
}

export function KawaiiFace({ seed = 0, className = 'h-12 w-12', title }) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <FaceArt seed={seed} />
    </svg>
  )
}

/** A twinkling four-point star used as decoration. */
export function Sparkle({ className = 'h-4 w-4', delay = 0 }) {
  return (
    <svg viewBox="0 0 24 24" className={`kw-twinkle ${className}`} style={{ animationDelay: `${delay}ms` }} aria-hidden="true">
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor" />
    </svg>
  )
}

/** Pill used for filters, tags and persona pickers. */
export function KChip({ children, active = false, onClick, className = '', small = false }) {
  const size = small ? 'px-2.5 py-0.5 text-[11px]' : 'px-3.5 py-1.5 text-xs'
  const tone = active
    ? 'border-(--kw-accent) bg-(--kw-accent) text-kw-ink'
    : 'border-kw-line bg-white text-kw-muted hover:border-(--kw-accent)'
  const base = `inline-flex items-center rounded-full border-2 font-bold transition-colors ${size} ${tone} ${className}`
  if (!onClick) return <span className={base}>{children}</span>
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} cursor-pointer`}>
      {children}
    </button>
  )
}

/** Chunky rounded button. variant: 'primary' (accent fill) | 'soft' (tinted) | 'plain' (white). */
export function KButton({ children, onClick, disabled, variant = 'primary', className = '', type = 'button', ...rest }) {
  const tones = {
    primary: 'bg-(--kw-accent) text-kw-ink border-(--kw-accent) kw-pop',
    soft: 'bg-(--kw-accent-soft) text-(--kw-accent-ink) border-(--kw-accent-soft)',
    plain: 'bg-white text-kw-ink border-kw-line',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-extrabold transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${tones[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/**
 * Screen scaffold for a demo: coloured accent scope, an app bar, a scrolling body and an
 * optional pinned footer. `accent` is pink | lavender | peach | mint | lemon.
 */
export function AppScreen({ accent, title, subtitle, action, children, footer, bodyClassName = '', scroll = true }) {
  return (
    <div className={`kw-${accent} flex h-full min-h-0 flex-col bg-kw-bg`}>
      <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-1">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 truncate text-xl font-black leading-tight text-kw-ink @2xl:text-2xl">
            {title}
            <Sparkle className="h-3.5 w-3.5 text-(--kw-accent)" />
          </h2>
          {subtitle && <p className="truncate text-xs font-semibold text-kw-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className={`kw-scroll relative min-h-0 flex-1 ${scroll ? 'overflow-y-auto' : 'overflow-hidden'} ${bodyClassName}`}>{children}</div>
      {footer}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { AppScreen, FaceArt, KButton, KChip, KawaiiFace } from '../kawaii'
import { CATEGORIES, CATEGORY_COLOURS, ORIGIN, pins } from './data'
import { KM_PER_UNIT, MAP_H, MAP_W, filterPins, fullView, nearbyList, panTo, panView, zoomView } from './geo'

// Street layout for the stylised map. Drawn here rather than loaded from a map provider,
// so the demo has no external requests; a real build swaps this for Google Maps or Mapbox.
const STREETS_H = [90, 200, 330, 450, 560]
const STREETS_V = [120, 260, 400, 500, 640, 780, 900]
const BLOCKS = [
  [140, 110, 100, 70, '#FFE7F1'], [280, 110, 100, 70, '#EFE8FF'], [660, 220, 100, 100, '#FFF1D6'],
  [140, 220, 100, 100, '#E2F4FF'], [420, 340, 60, 100, '#FFE7F1'], [520, 340, 100, 100, '#EFE8FF'],
  [800, 350, 80, 90, '#FFF1D6'], [280, 350, 100, 90, '#E2F4FF'], [420, 220, 60, 100, '#FFE7F1'],
]

function MapBackdrop() {
  return (
    <g>
      <rect width={MAP_W} height={MAP_H} fill="#EEF9F4" />
      <path d="M-20 520 C 200 470, 320 570, 520 600 S 900 625, 1020 560 V 660 H -20 Z" fill="#BFE6FA" />
      <path d="M-20 545 C 200 495, 320 592, 520 622 S 900 645, 1020 585" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="2 14" strokeLinecap="round" opacity="0.8" />
      <rect x="640" y="60" width="190" height="120" rx="40" fill="#CDEFD3" />
      <rect x="60" y="360" width="150" height="110" rx="38" fill="#CDEFD3" />
      <rect x="420" y="400" width="120" height="70" rx="30" fill="#CDEFD3" />
      {[[690, 100], [740, 130], [790, 95], [110, 400], [165, 430], [455, 430], [500, 420]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="13" fill="#A7E3B4" />
      ))}
      {BLOCKS.map(([x, y, w, h, c]) => (
        <rect key={`${x}${y}`} x={x} y={y} width={w} height={h} rx="14" fill={c} />
      ))}
      {STREETS_H.map((y) => (
        <line key={`h${y}`} x1="0" x2={MAP_W} y1={y} y2={y} stroke="#fff" strokeWidth="10" />
      ))}
      {STREETS_V.map((x) => (
        <line key={`v${x}`} y1="0" y2={MAP_H} x1={x} x2={x} stroke="#fff" strokeWidth="10" />
      ))}
      <path d="M0 610 L1000 70" stroke="#FFF0B8" strokeWidth="18" strokeLinecap="round" />
      <g fill="#7F7298" fontSize="22" fontWeight="800" opacity="0.7">
        <text x="70" y="70">Greenfield</text>
        <text x="420" y="55">Old Town</text>
        <text x="760" y="610">Riverside</text>
      </g>
    </g>
  )
}

function Pin({ pin, seed, scale, selected, dim, onSelect }) {
  const colour = CATEGORY_COLOURS[pin.category]
  const label = `${pin.name}, ${pin.type}, ${pin.category}, ${pin.distanceKm.toFixed(1)} kilometres away`
  return (
    <g
      transform={`translate(${pin.x} ${pin.y}) scale(${scale})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      opacity={dim ? 0.35 : 1}
      style={{ cursor: 'pointer', outline: 'none' }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onSelect(pin.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(pin.id)
        }
      }}
    >
      <ellipse cx="0" cy="19" rx="13" ry="4" fill="#4A3B5C" opacity="0.18" />
      {selected && <circle r="31" fill="none" stroke="#4A3B5C" strokeWidth="3" strokeDasharray="5 4" />}
      {pin.type === 'person' ? (
        <>
          <circle r="19" fill="#fff" stroke={colour} strokeWidth="4" />
          <g transform="translate(-15 -15) scale(0.47)">
            <FaceArt seed={seed} />
          </g>
          {pin.online && <circle cx="14" cy="-14" r="5.5" fill="#4FD6A0" stroke="#fff" strokeWidth="2.5" />}
        </>
      ) : (
        <>
          <rect x="-17" y="-17" width="34" height="34" rx="11" fill="#fff" stroke={colour} strokeWidth="4" />
          <path d="M-6 9V-9M-6 -9h13l-3.5 5.5L7 2H-6" fill={colour} stroke={colour} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

export default function MapPins() {
  const [types, setTypes] = useState(['person', 'project'])
  const [category, setCategory] = useState('All')
  const [radiusKm, setRadiusKm] = useState(1.8)
  const [view, setView] = useState(fullView())
  const [selectedId, setSelectedId] = useState(null)
  const [responded, setResponded] = useState({})
  const drag = useRef(null)
  const svgRef = useRef(null)
  const [mapPx, setMapPx] = useState(600)

  // Pins are sized from the map's real on-screen width so they stay tappable on a phone
  // (about 24px) without becoming huge on a desktop (34px at most).
  useEffect(() => {
    const el = svgRef.current
    if (!el) return undefined
    const measure = () => setMapPx(el.getBoundingClientRect().width || 600)
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const filtered = useMemo(() => filterPins(pins, { types, category, radiusKm, origin: ORIGIN }), [types, category, radiusKm])
  const nearby = useMemo(() => nearbyList(filtered), [filtered])
  const selected = filtered.find((p) => p.id === selectedId) || null
  const seedOf = (id) => pins.findIndex((p) => p.id === id)
  const unit = view.w / MAP_W // map units per drawing unit, for strokes
  const pinPx = Math.min(34, Math.max(24, mapPx / 14))
  const scale = (view.w / mapPx) * (pinPx / 38) // 38 = pin diameter in map units
  const radiusUnits = radiusKm / KM_PER_UNIT
  const zoomed = view.w < MAP_W

  const toggleType = (t) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const select = (id) => {
    setSelectedId(id)
    const pin = pins.find((p) => p.id === id)
    if (pin && zoomed) setView((v) => panTo(v, pin.x, pin.y))
  }

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current || !zoomed) return
    const rect = svgRef.current.getBoundingClientRect()
    const unitsPerPx = view.w / rect.width
    const dx = (e.clientX - drag.current.x) * unitsPerPx
    const dy = (e.clientY - drag.current.y) * unitsPerPx
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => panView(v, -dx, -dy))
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const act = (pin) => setResponded((r) => ({ ...r, [pin.id]: !r[pin.id] }))
  const ordered = [...filtered].sort((a, b) => (a.id === selectedId) - (b.id === selectedId))

  return (
    <AppScreen accent="mint" scroll={false} title="Nearby" subtitle="People and projects around you">
      <div className="flex h-full min-h-0 flex-col @2xl:flex-row">
        <div className="flex min-w-0 shrink-0 flex-col px-5 pb-3 @2xl:flex-1">
          <div className="kw-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
            <KChip active={types.includes('person')} onClick={() => toggleType('person')} className="shrink-0">
              People
            </KChip>
            <KChip active={types.includes('project')} onClick={() => toggleType('project')} className="shrink-0">
              Projects
            </KChip>
            <span className="mx-0.5 w-px shrink-0 self-stretch bg-kw-line" aria-hidden="true" />
            {['All', ...CATEGORIES].map((c) => (
              <KChip key={c} small active={category === c} onClick={() => setCategory(c)} className="shrink-0">
                {c}
              </KChip>
            ))}
          </div>

          <label className="mb-2 flex items-center gap-3 text-xs font-extrabold text-kw-muted">
            Radius
            <input
              type="range"
              min="0.4"
              max="3"
              step="0.1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="min-w-0 flex-1 accent-[#5FD6B0]"
              aria-valuetext={`${radiusKm.toFixed(1)} kilometres`}
            />
            <span className="w-14 text-right text-kw-ink">{radiusKm.toFixed(1)} km</span>
          </label>

          <div className="relative overflow-hidden rounded-3xl border-2 border-kw-line shadow-[0_10px_0_-4px_var(--kw-accent-soft)]">
            <svg
              ref={svgRef}
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              className="block w-full select-none"
              style={{ aspectRatio: `${MAP_W} / ${MAP_H}`, touchAction: zoomed ? 'none' : 'pan-y', cursor: zoomed ? 'grab' : 'default' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              role="group"
              aria-label="Map of nearby people and projects"
            >
              <MapBackdrop />
              <circle cx={ORIGIN.x} cy={ORIGIN.y} r={radiusUnits} fill="rgba(111,221,184,0.16)" stroke="#3FBF98" strokeWidth={3 * unit} strokeDasharray={`${9 * unit} ${7 * unit}`} />
              {ordered.map((pin) => (
                <Pin key={pin.id} pin={pin} seed={seedOf(pin.id)} scale={scale} selected={pin.id === selectedId} dim={!pin.inRange} onSelect={select} />
              ))}
              <g transform={`translate(${ORIGIN.x} ${ORIGIN.y}) scale(${scale})`} aria-label="You are here" role="img">
                <circle r="18" fill="#6FDDB8" opacity="0.35" />
                <circle r="9" fill="#fff" stroke="#3FBF98" strokeWidth="5" />
              </g>
            </svg>

            <div className="absolute right-2 top-2 flex flex-col gap-1.5">
              <button type="button" onClick={() => setView((v) => zoomView(v, 0.75))} aria-label="Zoom in" className="h-8 w-8 rounded-xl border-2 border-kw-line bg-white text-lg font-black text-kw-ink shadow-sm">
                +
              </button>
              <button type="button" onClick={() => setView((v) => zoomView(v, 1.33))} aria-label="Zoom out" className="h-8 w-8 rounded-xl border-2 border-kw-line bg-white text-lg font-black text-kw-ink shadow-sm">
                &minus;
              </button>
            </div>
            <p className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-kw-muted">{zoomed ? 'Drag to pan' : 'Illustrated map'}</p>
          </div>
        </div>

        <aside className="kw-scroll min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto px-5 pb-4 @2xl:w-80 @2xl:flex-none @2xl:border-l-2 @2xl:border-kw-line @2xl:pt-1">
          {selected ? (
            <div className="rounded-3xl border-2 border-(--kw-accent) bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  {selected.type === 'person' ? (
                    <KawaiiFace seed={seedOf(selected.id)} className="h-12 w-12" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-4 bg-white" style={{ borderColor: CATEGORY_COLOURS[selected.category] }}>
                      <svg className="h-6 w-6" viewBox="-10 -12 20 24" aria-hidden="true">
                        <path d="M-6 9V-9M-6 -9h13l-3.5 5.5L7 2H-6" fill={CATEGORY_COLOURS[selected.category]} stroke={CATEGORY_COLOURS[selected.category]} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-black text-kw-ink">{selected.name}</p>
                    <p className="text-xs font-bold text-kw-muted">
                      {selected.type === 'person' ? 'Person' : 'Project'} &middot; {selected.category} &middot; {selected.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Close details" className="text-kw-muted hover:text-kw-ink">
                  &#x2715;
                </button>
              </div>
              <p className="mt-2 text-sm font-semibold text-kw-ink">{selected.detail}</p>
              {selected.type === 'person' ? (
                <p className="mt-1 text-xs font-bold text-kw-muted">{selected.online ? 'Online now' : 'Offline'}</p>
              ) : (
                <p className="mt-1 text-xs font-bold text-kw-muted">
                  {selected.when} &middot; {selected.going + (responded[selected.id] ? 1 : 0)} of {selected.spots} going
                </p>
              )}
              <KButton variant={responded[selected.id] ? 'soft' : 'primary'} onClick={() => act(selected)} className="mt-3 w-full">
                {selected.type === 'person' ? (responded[selected.id] ? 'Wave sent' : 'Say hi') : responded[selected.id] ? "You're going (tap to leave)" : 'Join'}
              </KButton>
            </div>
          ) : (
            <p className="rounded-3xl border-2 border-dashed border-kw-line p-4 text-sm font-semibold text-kw-muted">Tap a pin or a list item to see details.</p>
          )}

          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-kw-muted">
              Within {radiusKm.toFixed(1)} km ({nearby.length})
            </p>
            {nearby.length === 0 ? (
              <p className="mt-2 text-sm font-semibold text-kw-muted">Nothing in range. Increase the radius or change the filters.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {nearby.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => select(p.id)}
                      aria-pressed={p.id === selectedId}
                      className={`flex w-full items-center gap-2.5 rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold transition-colors ${
                        p.id === selectedId ? 'border-(--kw-accent) bg-(--kw-accent-soft)' : 'border-kw-line bg-white hover:border-(--kw-accent)'
                      }`}
                    >
                      <span className="h-3.5 w-3.5 shrink-0" style={{ background: CATEGORY_COLOURS[p.category], borderRadius: p.type === 'person' ? '999px' : '5px' }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-kw-ink">{p.name}</span>
                      <span className="shrink-0 text-xs text-kw-muted">{p.distanceKm.toFixed(1)} km</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </AppScreen>
  )
}

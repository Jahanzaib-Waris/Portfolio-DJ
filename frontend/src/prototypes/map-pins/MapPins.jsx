import { useEffect, useMemo, useRef, useState } from 'react'
import { Chip, DemoShell } from '../ui'
import { CATEGORIES, CATEGORY_COLOURS, ORIGIN, pins } from './data'
import { KM_PER_UNIT, MAP_H, MAP_W, filterPins, fullView, nearbyList, panTo, panView, zoomView } from './geo'

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

// Street layout for the stylised map. Drawn here rather than loaded from a map provider,
// so the demo has no external requests; a real build swaps this for Google Maps or Mapbox.
const STREETS_H = [90, 200, 330, 450, 560]
const STREETS_V = [120, 260, 400, 500, 640, 780, 900]

function MapBackdrop() {
  return (
    <g>
      <rect width={MAP_W} height={MAP_H} fill="#0F1330" />
      <path d="M-20 520 C 200 470, 320 570, 520 600 S 900 625, 1020 560 V 660 H -20 Z" fill="#10304A" />
      <rect x="640" y="60" width="190" height="120" rx="28" fill="#12342B" />
      <rect x="60" y="360" width="150" height="110" rx="26" fill="#12342B" />
      <rect x="420" y="400" width="120" height="70" rx="22" fill="#12342B" />
      {STREETS_H.map((y) => (
        <line key={`h${y}`} x1="0" x2={MAP_W} y1={y} y2={y} stroke="#1B2150" strokeWidth="9" />
      ))}
      {STREETS_V.map((x) => (
        <line key={`v${x}`} y1="0" y2={MAP_H} x1={x} x2={x} stroke="#1B2150" strokeWidth="9" />
      ))}
      <path d="M0 610 L1000 70" stroke="#232A66" strokeWidth="16" />
      <g fill="#A1A7CA" fontSize="22" fontWeight="600" opacity="0.4">
        <text x="70" y="70">Greenfield</text>
        <text x="420" y="55">Old Town</text>
        <text x="760" y="610">Riverside</text>
      </g>
    </g>
  )
}

function Pin({ pin, scale, selected, dim, onSelect }) {
  const colour = CATEGORY_COLOURS[pin.category]
  const label = `${pin.name}, ${pin.type}, ${pin.category}, ${pin.distanceKm.toFixed(1)} kilometres away`
  return (
    <g
      transform={`translate(${pin.x} ${pin.y}) scale(${scale})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      opacity={dim ? 0.28 : 1}
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
      {selected && <circle r="30" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="5 4" />}
      {pin.type === 'person' ? (
        <>
          <circle r="17" fill={colour} stroke="#0F1330" strokeWidth="3" />
          <text textAnchor="middle" dy="5" fontSize="13" fontWeight="700" fill="#0F1330">
            {initials(pin.name)}
          </text>
          {pin.online && <circle cx="13" cy="-13" r="5" fill="#3fb950" stroke="#0F1330" strokeWidth="2" />}
        </>
      ) : (
        <>
          <rect x="-16" y="-16" width="32" height="32" rx="9" fill="#0F1330" stroke={colour} strokeWidth="3" />
          <path d="M-6 8V-8M-6 -8h12l-3 5 3 5h-12" fill={colour} stroke={colour} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
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
  // (about 22px) without becoming huge on a desktop (30px at most).
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
  const unit = view.w / MAP_W // map units per drawing unit, for strokes
  const pinPx = Math.min(30, Math.max(22, mapPx / 16))
  const scale = (view.w / mapPx) * (pinPx / 34) // 34 = pin diameter in map units
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

  const reset = () => {
    setTypes(['person', 'project'])
    setCategory('All')
    setRadiusKm(1.8)
    setView(fullView())
    setSelectedId(null)
    setResponded({})
  }

  const ordered = [...filtered].sort((a, b) => (a.id === selectedId) - (b.id === selectedId))

  return (
    <DemoShell title="Nearby people and projects" onReset={reset}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={types.includes('person')} onClick={() => toggleType('person')}>
          People
        </Chip>
        <Chip active={types.includes('project')} onClick={() => toggleType('project')}>
          Projects
        </Chip>
        <span className="mx-1 hidden h-4 w-px bg-panel-edge sm:inline-block" aria-hidden="true" />
        {['All', ...CATEGORIES].map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#C9CEEA]">
        <label className="flex items-center gap-2">
          Radius
          <input
            type="range"
            min="0.4"
            max="3"
            step="0.1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-32 accent-[#6D5AF6] sm:w-44"
            aria-valuetext={`${radiusKm.toFixed(1)} kilometres`}
          />
          <span className="w-14 font-semibold text-white">{radiusKm.toFixed(1)} km</span>
        </label>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="#38BDF8" />
          </svg>
          Person
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" aria-hidden="true">
            <rect x="2" y="2" width="16" height="16" rx="5" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
          </svg>
          Project or event
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="relative min-w-0 overflow-hidden rounded-xl border border-panel-edge">
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
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r={radiusUnits} fill="rgba(124,108,255,0.10)" stroke="#7C6CFF" strokeWidth={2 * unit} strokeDasharray={`${8 * unit} ${6 * unit}`} />
            {ordered.map((pin) => (
              <Pin key={pin.id} pin={pin} scale={scale} selected={pin.id === selectedId} dim={!pin.inRange} onSelect={select} />
            ))}
            <g transform={`translate(${ORIGIN.x} ${ORIGIN.y}) scale(${scale})`} aria-label="You are here" role="img">
              <circle r="16" fill="#7C6CFF" opacity="0.25" />
              <circle r="8" fill="#fff" stroke="#6D5AF6" strokeWidth="4" />
            </g>
          </svg>

          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button type="button" onClick={() => setView((v) => zoomView(v, 0.75))} aria-label="Zoom in" className="h-8 w-8 rounded-lg border border-panel-edge bg-abyss/90 text-lg font-bold text-white hover:border-slate-400">
              +
            </button>
            <button type="button" onClick={() => setView((v) => zoomView(v, 1.33))} aria-label="Zoom out" className="h-8 w-8 rounded-lg border border-panel-edge bg-abyss/90 text-lg font-bold text-white hover:border-slate-400">
              &minus;
            </button>
          </div>
          <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-abyss/80 px-2 py-1 text-[11px] text-[#A1A7CA]">
            {zoomed ? 'Drag to pan' : 'Stylised map, no map service used'}
          </p>
        </div>

        <aside className="min-w-0 space-y-3">
          {selected ? (
            <div className="rounded-xl border border-neon-indigo/50 bg-abyss/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{selected.name}</p>
                  <p className="text-xs text-[#A1A7CA]">
                    {selected.type === 'person' ? 'Person' : 'Project'} &middot; {selected.category} &middot; {selected.distanceKm.toFixed(1)} km away
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Close details" className="text-slate-400 hover:text-white">
                  &#x2715;
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-200">{selected.detail}</p>
              {selected.type === 'person' ? (
                <p className="mt-1 text-xs text-[#A1A7CA]">{selected.online ? 'Online now' : 'Offline'}</p>
              ) : (
                <p className="mt-1 text-xs text-[#A1A7CA]">
                  {selected.when} &middot; {selected.going + (responded[selected.id] ? 1 : 0)} of {selected.spots} going
                </p>
              )}
              <button
                type="button"
                onClick={() => act(selected)}
                className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  responded[selected.id] ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-neon-indigo bg-neon-indigo/20 text-white hover:bg-neon-indigo/30'
                }`}
              >
                {selected.type === 'person' ? (responded[selected.id] ? 'Wave sent' : 'Say hi') : responded[selected.id] ? "You're going (tap to leave)" : 'Join'}
              </button>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-panel-edge p-4 text-sm text-[#A1A7CA]">Tap a pin or a list item to see details.</p>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A7CA]">
              Within {radiusKm.toFixed(1)} km ({nearby.length})
            </p>
            {nearby.length === 0 ? (
              <p className="mt-2 text-sm text-[#A1A7CA]">Nothing in range. Increase the radius or change the filters.</p>
            ) : (
              <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {nearby.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => select(p.id)}
                      aria-pressed={p.id === selectedId}
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
                        p.id === selectedId ? 'border-neon-indigo bg-neon-indigo/15' : 'border-panel-edge bg-abyss/40 hover:border-slate-400'
                      }`}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: CATEGORY_COLOURS[p.category], borderRadius: p.type === 'person' ? '999px' : '3px' }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-slate-100">{p.name}</span>
                      <span className="shrink-0 text-xs text-[#A1A7CA]">{p.distanceKm.toFixed(1)} km</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </DemoShell>
  )
}

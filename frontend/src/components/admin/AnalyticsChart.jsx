import { useMemo, useState } from 'react'

const HEIGHT = 200
const PADDING = { top: 16, right: 12, bottom: 24, left: 36 }

function niceMax(value) {
  if (value <= 0) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * A single-series line+area chart with a hover crosshair. Deliberately not a
 * generic charting library — one series, no legend needed (the title above
 * it names the series), gridlines + a handful of date labels for orientation.
 */
export default function AnalyticsChart({ data, color = 'var(--color-neon-blue)', width = 640 }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const innerWidth = width - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom

  const maxValue = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.count))), [data])

  const points = useMemo(() => {
    if (data.length === 0) return []
    return data.map((d, i) => {
      const x = data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth
      const y = innerHeight - (d.count / maxValue) * innerHeight
      return { x: x + PADDING.left, y: y + PADDING.top, ...d }
    })
  }, [data, innerWidth, innerHeight, maxValue])

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No data in this period yet.</p>
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${innerHeight + PADDING.top} L ${points[0].x} ${innerHeight + PADDING.top} Z`

  const gridLines = [0, 0.5, 1].map((f) => ({
    y: PADDING.top + innerHeight * (1 - f),
    value: Math.round(maxValue * f),
  }))

  // First, middle, last — enough to orient without cluttering the axis.
  const labelIndices = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  )

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    let nearest = 0
    let best = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x)
      if (dist < best) {
        best = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => (
          <g key={g.y}>
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={g.y}
              y2={g.y}
              stroke="var(--color-panel-edge)"
              strokeWidth="1"
            />
            <text x={PADDING.left - 8} y={g.y} textAnchor="end" dominantBaseline="middle" className="fill-slate-500 text-[10px]">
              {g.value}
            </text>
          </g>
        ))}

        {labelIndices.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={HEIGHT - 6}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            className="fill-slate-500 text-[10px]"
          >
            {formatDay(points[i].day)}
          </text>
        ))}

        <path d={areaPath} fill="url(#analytics-area)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={innerHeight + PADDING.top}
              stroke="var(--color-panel-edge)"
              strokeWidth="1"
            />
            <circle cx={hovered.x} cy={hovered.y} r="4" fill={color} stroke="var(--color-void)" strokeWidth="2" />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-panel-edge bg-abyss px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${(hovered.x / width) * 100}%` }}
        >
          <p className="text-slate-400">{formatDay(hovered.day)}</p>
          <p className="font-semibold text-white">{hovered.count}</p>
        </div>
      )}
    </div>
  )
}

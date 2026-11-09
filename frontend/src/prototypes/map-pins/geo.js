// Pure map helpers for the "nearby" prototype: distances, filtering, and zoom/pan limits.
// The map is a 1000 x 640 drawing; 1000 units = 5 km.

export const MAP_W = 1000
export const MAP_H = 640
export const KM_PER_UNIT = 0.005
export const MIN_VIEW_W = 280

export const distanceKm = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * KM_PER_UNIT

/**
 * Applies the visitor's filters. Every pin that matches the type and category filters is
 * returned with its distance and an `inRange` flag; the map dims out-of-range pins and the
 * list shows only in-range ones.
 */
export function filterPins(pins, { types, category, radiusKm, origin }) {
  return pins
    .filter((p) => types.includes(p.type) && (category === 'All' || p.category === category))
    .map((p) => {
      const d = distanceKm(p, origin)
      return { ...p, distanceKm: d, inRange: d <= radiusKm }
    })
}

export const nearbyList = (filtered) => filtered.filter((p) => p.inRange).sort((a, b) => a.distanceKm - b.distanceKm)

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const fullView = () => ({ x: 0, y: 0, w: MAP_W, h: MAP_H })

/** Zooms around the view's centre. factor < 1 zooms in, > 1 zooms out. */
export function zoomView(view, factor) {
  const w = clamp(view.w * factor, MIN_VIEW_W, MAP_W)
  const h = (w * MAP_H) / MAP_W
  const cx = view.x + view.w / 2
  const cy = view.y + view.h / 2
  return panTo({ x: 0, y: 0, w, h }, cx, cy)
}

/** Moves the view by dx, dy map units, staying inside the map. */
export function panView(view, dx, dy) {
  return {
    ...view,
    x: clamp(view.x + dx, 0, MAP_W - view.w),
    y: clamp(view.y + dy, 0, MAP_H - view.h),
  }
}

/** Centres the view on a map point, staying inside the map. */
export function panTo(view, cx, cy) {
  return {
    ...view,
    x: clamp(cx - view.w / 2, 0, MAP_W - view.w),
    y: clamp(cy - view.h / 2, 0, MAP_H - view.h),
  }
}

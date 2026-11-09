// App Store "rescue" lead finder. Uses Apple's public iTunes Search API (no key, allows
// browser calls) to find apps whose public signals suggest they need engineering help:
// low or falling ratings and no recent updates. The seller's website is the contact path.

const ITUNES_SEARCH = 'https://itunes.apple.com/search'
const DAY_MS = 86400000

export const APP_STORE_COUNTRIES = [
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'de', label: 'Germany' },
]

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : '')

/** Scores how strongly an app looks like a rescue opportunity (0-100) and explains why. */
export function scoreRescue(app, now = Date.now()) {
  const reasons = []
  let score = 0

  const rating = app.averageUserRating
  const count = app.userRatingCount || 0
  if (typeof rating === 'number' && count >= 20) {
    const pts = rating <= 3.0 ? 40 : rating <= 3.5 ? 32 : rating <= 4.0 ? 20 : rating <= 4.3 ? 8 : 0
    if (pts) reasons.push(`Rated ${rating.toFixed(1)} across ${count.toLocaleString()} ratings`)
    score += pts
  }

  const curRating = app.averageUserRatingForCurrentVersion
  const curCount = app.userRatingCountForCurrentVersion || 0
  if (typeof rating === 'number' && typeof curRating === 'number' && curCount >= 10 && rating - curRating >= 0.4) {
    score += 15
    reasons.push(`Current version rated lower (${curRating.toFixed(1)} vs ${rating.toFixed(1)} overall)`)
  }

  const updated = app.currentVersionReleaseDate ? new Date(app.currentVersionReleaseDate).getTime() : NaN
  if (!Number.isNaN(updated)) {
    const days = (now - updated) / DAY_MS
    const pts = days > 540 ? 25 : days > 365 ? 20 : days > 180 ? 10 : 0
    if (pts) reasons.push(`Not updated for ${Math.round(days / 30)} months`)
    score += pts
  }

  score += count >= 1000 ? 10 : count >= 100 ? 6 : count >= 20 ? 2 : 0
  if (app.sellerUrl) score += 10

  return { score: Math.min(100, score), reasons }
}

/** Maps an iTunes result to the item shape Client Radar uses for CRM import. */
export function appToRadarItem(app, country = 'us', now = Date.now()) {
  const { score, reasons } = scoreRescue(app, now)
  const ratingLine =
    typeof app.averageUserRating === 'number'
      ? `App Store rating: ${app.averageUserRating.toFixed(1)} (${(app.userRatingCount || 0).toLocaleString()} ratings)`
      : 'App Store rating: not enough ratings'
  const updated = fmtDate(app.currentVersionReleaseDate)
  const description = (app.description || '').replace(/\s+/g, ' ').trim()

  return {
    id: `app-${app.trackId}`,
    source: 'app_store',
    sourceLabel: 'App Store (rescue lead)',
    company: app.sellerName || app.artistName || 'App publisher',
    title: `App rescue: ${app.trackName}`,
    location: country.toUpperCase(),
    type: 'Project (rescue)',
    employmentType: '',
    email: null,
    website: app.sellerUrl || '',
    url: app.trackViewUrl,
    description: `${ratingLine}. Last updated: ${updated}.`,
    fullText: `${ratingLine}\nLast updated: ${updated}\nCategory: ${app.primaryGenreName || ''}\nVersion: ${app.version || ''}\n\n${description.slice(0, 600)}`,
    date: app.currentVersionReleaseDate,
    isFounderDirect: false,
    rescue: { score, reasons },
    app: {
      name: app.trackName,
      icon: app.artworkUrl100 || app.artworkUrl60 || '',
      rating: app.averageUserRating ?? null,
      ratingCount: app.userRatingCount || 0,
      genre: app.primaryGenreName || '',
      updated,
    },
  }
}

export async function searchApps(term, { country = 'us', limit = 200 } = {}) {
  const query = term.trim()
  if (!query) return []
  const url = `${ITUNES_SEARCH}?term=${encodeURIComponent(query)}&entity=software&country=${country}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`App Store search failed (${res.status})`)
  const data = await res.json()
  const now = Date.now()
  return (data.results || [])
    .filter((app) => app.trackId && app.trackViewUrl)
    .map((app) => appToRadarItem(app, country, now))
    .sort((a, b) => b.rescue.score - a.rescue.score)
}

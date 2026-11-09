/**
 * radarScoring.js
 * Rule-based opportunity scoring (0 - 100) and freshness decay calculator for Client Radar leads.
 *
 * Scoring Model (rule-based, no LLM):
 * 1. Freshness & Time Decay (30 pts max) — Recency heavily dictates reply rate
 * 2. Reachability & Direct Contact (15 pts max) — Direct founder email or Apollo-enrichable domain
 * 3. Studio Tech Match (25 pts max) — FlutterFlow, Flutter, Mobile, Supabase
 * 4. Engagement Fit (30 pts max) — Project/contract work that leaves the studio free to
 *    serve other clients, vs. exclusive full-time employment (see classifyEngagement)
 */

// Wording that signals scoped, non-exclusive work.
const FIT_RE =
  /\b(contract(?:or|ing)?|freelanc\w*|part[\s-]?time|hourly|fixed[\s-]?price|project[\s-]?based|per[\s-]project|retainer|short[\s-]?term|b2b|1099|consult\w*|time[\s-]?boxed)\b/i
// Employment wording that takes a contractor off the market or isn't a contract at all.
const HARD_NOT_FIT_RE =
  /contract[\s-]to[\s-]hire|\bw[\s-]?2\b|\b(health|dental|medical) (insurance|benefits)\b|\b401\(?k\)?\b|\bpaid time off\b|\bPTO\b|\b(35|40)\s*(hours|hrs)\b|\bon-?site (only|required)\b/i
const FULL_TIME_RE = /\bfull[\s-]?time\b|\bpermanent\b|\bemployee\b/i

/**
 * Classifies whether a posting suits a studio that works for several clients at once.
 * Returns { fit: 'fit' | 'unclear' | 'not_fit', label }.
 *   fit      – contract / freelance / part-time / project wording, no employment red flags
 *   not_fit  – exclusive full-time, W-2, contract-to-hire, benefits, fixed 40h weeks
 *   unclear  – the post doesn't say
 * `employmentType` is only trusted when the source supplies it (e.g. Jobicy).
 */
export function classifyEngagement(item) {
  const text = `${item.employmentType || ''} ${item.title || ''} ${item.fullText || item.description || ''}`
  const hasFit = FIT_RE.test(text)
  const hardNotFit = HARD_NOT_FIT_RE.test(text)
  const fullTime = FULL_TIME_RE.test(text)

  if (hasFit && !hardNotFit) return { fit: 'fit', label: 'Contract fit' }
  if (hardNotFit || fullTime) return { fit: 'not_fit', label: 'Full-time role' }
  return { fit: 'unclear', label: 'Engagement unclear' }
}

/**
 * Calculates human-friendly relative time string.
 * e.g. "3h ago", "1d ago", "5d ago", "2w ago"
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return 'Recent'
  const time = new Date(dateString).getTime()
  if (isNaN(time)) return 'Recent'

  const now = Date.now()
  const diffMs = Math.max(0, now - time)
  const diffMinutes = Math.floor(diffMs / (60 * 1000))
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffMinutes < 60) {
    return `${Math.max(1, diffMinutes)}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays === 1) {
    return '1d ago'
  }
  if (diffDays < 14) {
    return `${diffDays}d ago`
  }
  const diffWeeks = Math.floor(diffDays / 7)
  return `${diffWeeks}w ago`
}

/**
 * Checks if a lead falls within a given freshness window.
 * @param {string} dateString
 * @param {'all' | '24h' | '3d' | '7d' | '14d'} window
 */
export function matchesFreshnessWindow(dateString, window = 'all') {
  if (window === 'all') return true
  if (!dateString) return true

  const time = new Date(dateString).getTime()
  if (isNaN(time)) return true

  const diffMs = Date.now() - time
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour

  switch (window) {
    case '24h':
      return diffMs <= 24 * oneHour
    case '3d':
      return diffMs <= 3 * oneDay
    case '7d':
      return diffMs <= 7 * oneDay
    case '14d':
      return diffMs <= 14 * oneDay
    default:
      return true
  }
}

/**
 * Computes a composite 0-100 Opportunity Score for any radar lead.
 */
export function computeOpportunityScore(item) {
  const breakdown = {
    freshness: 0,
    reachability: 0,
    techMatch: 0,
    dealIntent: 0,
  }

  // 1. Freshness & Decay (Max 30 pts)
  const time = item.date ? new Date(item.date).getTime() : Date.now()
  const diffHours = isNaN(time) ? 12 : Math.max(0, (Date.now() - time) / (60 * 60 * 1000))
  const diffDays = diffHours / 24

  let freshnessStatus = 'fresh'
  let isStale = false

  if (diffHours < 12) {
    breakdown.freshness = 30
    freshnessStatus = 'urgent' // Hot post, founders online now
  } else if (diffHours < 24) {
    breakdown.freshness = 26
    freshnessStatus = 'urgent'
  } else if (diffDays <= 3) {
    breakdown.freshness = 19
    freshnessStatus = 'fresh'
  } else if (diffDays <= 7) {
    breakdown.freshness = 12
    freshnessStatus = 'moderate'
  } else if (diffDays <= 14) {
    breakdown.freshness = 5
    freshnessStatus = 'aging'
  } else {
    breakdown.freshness = 0
    freshnessStatus = 'stale'
    isStale = true
  }

  // 2. Reachability & Direct Contact (Max 15 pts)
  if (item.email) {
    breakdown.reachability = 15 // Direct email ready
  } else if (item.decisionMaker) {
    breakdown.reachability = 13 // Apollo-verified executive found
  } else if (item.website) {
    breakdown.reachability = 8 // Domain available for 1-click Apollo scan
  } else {
    breakdown.reachability = 2
  }

  // 3. Studio Tech Match (Max 25 pts)
  const searchableText = `${item.title || ''} ${item.description || ''} ${item.fullText || ''}`.toLowerCase()

  if (/flutterflow|flutter\b/i.test(searchableText)) {
    breakdown.techMatch = 25 // Direct core studio focus
  } else if (/mobile|ios|android|react native/i.test(searchableText)) {
    breakdown.techMatch = 18 // Mobile engineering
  } else if (/supabase|firebase|backend|full-stack|dart\b/i.test(searchableText)) {
    breakdown.techMatch = 12 // Supporting stack
  } else {
    breakdown.techMatch = 5 // General tech
  }

  // 4. Engagement Fit (Max 30 pts)
  const engagement = classifyEngagement(item)
  if (engagement.fit === 'fit') {
    breakdown.dealIntent = 30
  } else if (engagement.fit === 'unclear') {
    breakdown.dealIntent = 12
  } else {
    breakdown.dealIntent = 0
  }

  // Total Score (Clamped between 0 and 100)
  const totalScore = Math.min(
    100,
    Math.max(0, breakdown.freshness + breakdown.reachability + breakdown.techMatch + breakdown.dealIntent)
  )

  // Tier Classification
  let tier = 'moderate'
  let tierLabel = 'Moderate Match'
  let badgeColor = 'bg-amber-500/15 border-amber-500/40 text-amber-300'
  let glowEffect = false

  if (totalScore >= 85) {
    tier = 'hot'
    tierLabel = 'Top Priority'
    badgeColor = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
    glowEffect = true
  } else if (totalScore >= 70) {
    tier = 'strong'
    tierLabel = 'High Match'
    badgeColor = 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue shadow-sm'
    glowEffect = true
  } else if (totalScore < 50 || isStale || engagement.fit === 'not_fit') {
    tier = 'low'
    tierLabel = isStale ? 'Stale Lead' : engagement.fit === 'not_fit' ? 'Not a fit' : 'Low Probability'
    badgeColor = 'bg-slate-500/15 border-slate-500/30 text-slate-400'
  }

  return {
    score: totalScore,
    tier,
    tierLabel,
    badgeColor,
    glowEffect,
    freshnessLabel: formatTimeAgo(item.date),
    freshnessStatus,
    isStale,
    engagement,
    breakdown,
  }
}

const TECH_PATTERNS = [
  ['FlutterFlow', /flutterflow/i],
  ['Flutter', /\bflutter\b/i],
  ['Dart', /\bdart\b/i],
  ['React Native', /react[\s-]?native/i],
  ['iOS', /\bios\b|swift(ui)?\b/i],
  ['Android', /\bandroid\b|kotlin/i],
  ['Supabase', /supabase/i],
  ['Firebase', /firebase/i],
  ['Node.js', /node\.?js/i],
  ['Python', /\bpython\b|django|fastapi/i],
  ['React', /\breact\b(?![\s-]?native)/i],
]

/** Tech tags that actually appear in a radar item's text (empty when none match). */
export function detectTechStack(item) {
  const text = `${item.title || ''} ${item.description || ''} ${item.fullText || ''}`
  return TECH_PATTERNS.filter(([, rx]) => rx.test(text)).map(([name]) => name)
}

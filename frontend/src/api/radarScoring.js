/**
 * radarScoring.js
 * AI-powered opportunity scoring (0 - 100) and freshness decay calculator for Client Radar leads.
 *
 * Scoring Model:
 * 1. Freshness & Time Decay (35 pts max) — Recency heavily dictates reply rate
 * 2. Reachability & Direct Contact (30 pts max) — Direct founder email or Apollo-enrichable domain
 * 3. Studio Tech Match (25 pts max) — FlutterFlow, Flutter, Mobile, Supabase
 * 4. Deal Intent & Structure (10 pts max) — Contract/freelance vs full-time
 */

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

  // 1. Freshness & Decay (Max 35 pts)
  const time = item.date ? new Date(item.date).getTime() : Date.now()
  const diffHours = isNaN(time) ? 12 : Math.max(0, (Date.now() - time) / (60 * 60 * 1000))
  const diffDays = diffHours / 24

  let freshnessStatus = 'fresh'
  let isStale = false

  if (diffHours < 12) {
    breakdown.freshness = 35
    freshnessStatus = 'urgent' // Hot post, founders online now
  } else if (diffHours < 24) {
    breakdown.freshness = 30
    freshnessStatus = 'urgent'
  } else if (diffDays <= 3) {
    breakdown.freshness = 22
    freshnessStatus = 'fresh'
  } else if (diffDays <= 7) {
    breakdown.freshness = 14
    freshnessStatus = 'moderate'
  } else if (diffDays <= 14) {
    breakdown.freshness = 6
    freshnessStatus = 'aging'
  } else {
    breakdown.freshness = 0
    freshnessStatus = 'stale'
    isStale = true
  }

  // 2. Reachability & Direct Contact (Max 30 pts)
  if (item.email) {
    breakdown.reachability = 30 // Direct email ready
  } else if (item.decisionMaker) {
    breakdown.reachability = 25 // Apollo-verified executive found
  } else if (item.website) {
    breakdown.reachability = 15 // Domain available for 1-click Apollo scan
  } else {
    breakdown.reachability = 5
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

  // 4. Deal Intent & Structure (Max 10 pts)
  const typeText = `${item.type || ''} ${searchableText}`.toLowerCase()
  if (/contract|freelance|consult|part-time|hourly|b2b/i.test(typeText)) {
    breakdown.dealIntent = 10 // Fastest to contract/close
  } else if (/founder|founding|seed|series a|pre-seed|equity/i.test(typeText)) {
    breakdown.dealIntent = 8 // Direct founder or early startup
  } else {
    breakdown.dealIntent = 4 // Standard full-time role
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
  } else if (totalScore < 50 || isStale) {
    tier = 'low'
    tierLabel = isStale ? 'Stale Lead' : 'Low Probability'
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
    breakdown,
  }
}

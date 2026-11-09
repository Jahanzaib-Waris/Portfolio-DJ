/**
 * radarClient.js — browser-side radar fetching (live fallback when the server-side
 * radar_items table / radar-ingest function aren't set up yet) plus the curated
 * freelance scanner links. Parsing lives in supabase/functions/_shared/radar/.
 */
import { fetchHnItems, fetchRemoteItems } from '../../../supabase/functions/_shared/radar/sources.js'

export {
  decodeHtmlEntities,
  extractEmail,
  extractWebsite,
  stripHtml,
} from '../../../supabase/functions/_shared/radar/text.js'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes cache
const memoryCache = new Map()

function getCached(key) {
  const item = memoryCache.get(key)
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data
  }
  try {
    const raw = sessionStorage.getItem(`__radar_cache_${key}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Date.now() - parsed.time < CACHE_TTL_MS) {
        memoryCache.set(key, parsed)
        return parsed.data
      }
      sessionStorage.removeItem(`__radar_cache_${key}`)
    }
  } catch {}
  return null
}

function setCache(key, data) {
  const entry = { data, time: Date.now() }
  memoryCache.set(key, entry)
  try {
    sessionStorage.setItem(`__radar_cache_${key}`, JSON.stringify(entry))
  } catch {}
}


export async function fetchHNHiringOpportunities(query = '') {
  const cacheKey = `hn2_${query}`
  const cached = getCached(cacheKey)
  if (cached) return cached
  const results = await fetchHnItems(query)
  setCache(cacheKey, results)
  return results
}

export async function fetchRemoteJobs(filterTag = 'mobile') {
  const cacheKey = `remote_${filterTag}`
  const cached = getCached(cacheKey)
  if (cached) return cached
  const items = await fetchRemoteItems(filterTag)
  setCache(cacheKey, items)
  return items
}

/**
 * 3. Curated Freelance Market Scanners
 * Direct high-converting searches pre-configured for client opportunities
 */
export const FREELANCE_MARKET_SCANNERS = [
  {
    name: 'Upwork — FlutterFlow Fixed Price & Hourly',
    platform: 'Upwork',
    query: 'FlutterFlow',
    badge: 'High Intent',
    description: 'Clients specifically seeking FlutterFlow specialists for new apps, bug fixes, and custom code.',
    url: 'https://www.upwork.com/nx/search/jobs/?q=flutterflow&sort=recency',
    category: 'FlutterFlow',
  },
  {
    name: 'Upwork — Flutter Mobile App MVP Builds',
    platform: 'Upwork',
    query: 'Flutter mobile MVP',
    badge: 'High Budget',
    description: 'Startups hiring cross-platform iOS & Android engineers for greenfield MVPs.',
    url: 'https://www.upwork.com/nx/search/jobs/?q=flutter%20mobile%20mvp&sort=recency',
    category: 'Flutter',
  },
  {
    name: 'Upwork — Supabase + Flutter Integration',
    platform: 'Upwork',
    query: 'Supabase Flutter',
    badge: 'Backend & DB',
    description: 'Projects needing database schema, Row Level Security (RLS), edge functions, and auth.',
    url: 'https://www.upwork.com/nx/search/jobs/?q=supabase%20flutter&sort=recency',
    category: 'Supabase',
  },
  {
    name: 'Contra — Flutter & Mobile Freelance Gigs',
    platform: 'Contra',
    query: 'Flutter',
    badge: 'Commission Free',
    description: 'Direct high-paying client contracts on Contra with zero commission fees.',
    url: 'https://contra.com/freelance-jobs?q=flutter',
    category: 'Mobile',
  },
  {
    name: 'Wellfound (AngelList) — Early Mobile Startups',
    platform: 'Wellfound',
    query: 'Mobile Engineer / Contract',
    badge: 'Funded Startups',
    description: 'Seed and Series-A startups hiring mobile contractors and founding mobile engineers.',
    url: 'https://wellfound.com/jobs?roles[]=Mobile%20Engineer',
    category: 'Startups',
  },
  {
    name: 'Y Combinator "Work at a Startup" — Mobile',
    platform: 'Y Combinator',
    query: 'Mobile Engineer',
    badge: 'YC Backed',
    description: 'Active job openings at YC-backed companies building mobile products.',
    url: 'https://www.workatastartup.com/companies?demographic=any&role=eng&has_equity=any',
    category: 'Startups',
  },
]

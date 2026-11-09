/**
 * radarClient.js
 * Real-time opportunity discovery engine pulling from:
 * 1. Hacker News Algolia API ("Who is Hiring" startup founder threads with direct contact emails)
 * 2. RemoteOK & Jobicy (live remote mobile/engineering listings)
 * 3. Curated Freelance Market Scanners (Upwork, Contra, Wellfound)
 */

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

/**
 * Decodes all HTML entities (including hex entities like &#x2F;, &#x27;)
 */
export function decodeHtmlEntities(str = '') {
  if (!str) return ''
  let out = str

  // 1. Browser DOMParser for standard named & numeric entities
  try {
    const doc = new DOMParser().parseFromString(out, 'text/html')
    out = doc.body.textContent || ''
  } catch {
    // ignore
  }

  // 2. Comprehensive replacement table for entities common in Hacker News / Algolia
  return out
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/gi, '/')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#x26;/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&nearr;/gi, '↗')
    .replace(/&rarr;/gi, '→')
    .replace(/&hellip;/gi, '…')
}

/**
 * Extracts clean plain text from HTML string with decoded entities and preserved line structure.
 */
export function stripHtml(html = '') {
  if (!html) return ''

  // 1. Convert breaks and paragraphs to clean line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '') // remove all other HTML tags

  // 2. Decode entities
  text = decodeHtmlEntities(text)

  // 3. Clean up spacing per line while preserving meaningful line breaks
  const lines = text
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0))

  return lines.join('\n').trim()
}

/**
 * Extracts the first detected email address from text.
 */
export function extractEmail(text = '') {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (match) return match[0]

  // Obfuscated forms people use on HN: "name [at] domain [dot] com", "name (at) domain (dot) com"
  const obf = text.match(
    /([a-zA-Z0-9._%+-]+)\s*[[(]\s*at\s*[\])]\s*([a-zA-Z0-9-]+(?:\s*[[(]?\s*dot\s*[\])]?\s*[a-zA-Z0-9-]+)*)/i,
  )
  if (obf) {
    const domain = obf[2].replace(/\s*[[(]?\s*dot\s*[\])]?\s*/gi, '.')
    if (/\.[a-zA-Z]{2,}$/.test(domain)) return `${obf[1]}@${domain}`
  }
  return null
}

/**
 * Extracts company website from HTML anchors or text.
 */
export function extractWebsite(rawHtml = '', cleanText = '') {
  // A. Check href in raw HTML
  const match = rawHtml.match(/href="([^"'\s]+)"/i)
  let url = ''
  if (match) {
    url = decodeHtmlEntities(match[1])
  } else {
    // B. Check naked URLs in clean text (e.g. https://domain.com)
    const textMatch = cleanText.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s),]+)?/i)
    if (textMatch) {
      url = textMatch[0]
    }
  }

  if (!url || url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
    return ''
  }
  return url.replace(/[),]+$/, '')
}

const HN_API = 'https://hn.algolia.com/api/v1'

// Queries run in parallel and merged when no specific stack filter is chosen.
const HN_DEFAULT_QUERIES = ['flutterflow', 'flutter', '"react native"', 'supabase', '"mobile app"', 'ios']

/**
 * Finds the newest monthly threads posted by the official `whoishiring` account.
 * Filtering by author is reliable; searching the title text can pick the wrong thread
 * ("Who wants to be hired?" is posted the same day as "Who is hiring?").
 */
async function findLatestWhoIsHiringThreads() {
  const res = await fetch(`${HN_API}/search_by_date?tags=story,author_whoishiring&hitsPerPage=20`)
  if (!res.ok) throw new Error('Failed to list whoishiring threads')
  const hits = (await res.json()).hits || []

  const latest = (re) => hits.find((h) => re.test(h.title || ''))
  const hiring = latest(/who is hiring/i)

  // The "Freelancer? Seeking freelancer?" thread was last posted in October 2025; the
  // account now posts "Who wants to be hired?" instead (people seeking work, not
  // clients). Only use the freelancer thread if a recent one exists.
  let freelancer = null
  try {
    const fr = await fetch(`${HN_API}/search_by_date?tags=story,author_whoishiring&query=freelancer&hitsPerPage=5`)
    if (fr.ok) {
      const candidate = ((await fr.json()).hits || []).find((h) =>
        /freelancer\?\s*seeking freelancer/i.test(h.title || ''),
      )
      const ageDays = candidate ? (Date.now() - new Date(candidate.created_at).getTime()) / 86400000 : Infinity
      if (candidate && ageDays <= 45) freelancer = candidate
    }
  } catch {
    // optional source
  }
  return [
    hiring && { kind: 'hiring', id: hiring.objectID, title: hiring.title },
    freelancer && { kind: 'freelancer', id: freelancer.objectID, title: freelancer.title },
  ].filter(Boolean)
}

async function fetchThreadComments(threadId, query) {
  const url = `${HN_API}/search?tags=comment,story_${threadId}&query=${encodeURIComponent(query)}&hitsPerPage=100`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch comments for thread ${threadId}`)
  const hits = (await res.json()).hits || []
  // Top-level posts only; replies are discussion, not job posts.
  return hits.filter((h) => String(h.parent_id) === String(threadId))
}

function parseHnPost(h, thread) {
  const raw = h.comment_text || ''
  const clean = stripHtml(raw)
  const email = extractEmail(clean)
  const website = extractWebsite(raw, clean)
  const lower = clean.toLowerCase()

  const isFreelancerThread = thread.kind === 'freelancer'
  // The freelancer thread mixes people offering their services with people seeking
  // freelancers; only the latter are leads.
  if (isFreelancerThread && !/seeking\s+freelancer/i.test(clean.slice(0, 80))) return null

  // HN comments standard: Company | Role | Location | Remote/Onsite | Salary
  const firstLine = clean.split('\n')[0] || ''
  const pipes = firstLine.split('|').map((s) => decodeHtmlEntities(s.trim())).filter(Boolean)
  const parts = isFreelancerThread ? pipes.filter((p) => !/^seeking\s+freelancer/i.test(p)) : pipes

  const rawCompany = parts[0] && parts[0].length < 60 && !isFreelancerThread ? parts[0] : h.author
  const company = decodeHtmlEntities(rawCompany).replace(/^[#\s*]+/, '').trim()
  const roleIdx = isFreelancerThread ? 0 : 1
  const role =
    parts[roleIdx] && parts[roleIdx].length < 100
      ? decodeHtmlEntities(parts[roleIdx])
      : isFreelancerThread
        ? 'Freelance project'
        : 'Software Engineer / Mobile'
  const location = parts[roleIdx + 1] ? decodeHtmlEntities(parts[roleIdx + 1]) : 'Remote'

  const singleLineClean = clean.replace(/\n+/g, ' ')
  const description = singleLineClean.slice(0, 320) + (singleLineClean.length > 320 ? '...' : '')

  return {
    id: `hn-${h.objectID}`,
    source: 'hacker_news',
    sourceLabel: isFreelancerThread ? 'Hacker News (Freelancer thread)' : 'Hacker News (Who is hiring)',
    company,
    title: role,
    location,
    type: isFreelancerThread
      ? 'Freelance'
      : lower.includes('contract') || lower.includes('freelance')
        ? 'Contract'
        : 'Not specified',
    employmentType: isFreelancerThread ? 'Freelance' : '',
    email,
    url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    website,
    description,
    fullText: clean,
    date: h.created_at,
    threadTitle: thread.title,
    isFounderDirect: Boolean(email),
  }
}

/**
 * 1. Fetch live Hacker News opportunities from the latest "Who is hiring?" and
 *    "Freelancer? Seeking freelancer?" threads.
 */
export async function fetchHNHiringOpportunities(query = '') {
  const cacheKey = `hn2_${query}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const threads = await findLatestWhoIsHiringThreads()
    if (threads.length === 0) return []

    const q = query.trim().toLowerCase()
    const queries = !q || q === 'all' || q === 'mobile' ? HN_DEFAULT_QUERIES : [q]

    const fetches = threads.flatMap((thread) =>
      queries.map((term) =>
        fetchThreadComments(thread.id, term)
          .then((hits) => hits.map((h) => ({ h, thread })))
          .catch(() => []),
      ),
    )
    const merged = (await Promise.all(fetches)).flat()

    const seen = new Set()
    const results = []
    for (const { h, thread } of merged) {
      if (seen.has(h.objectID) || !h.comment_text || h.comment_text.length < 50) continue
      seen.add(h.objectID)
      const item = parseHnPost(h, thread)
      if (item) results.push(item)
    }

    results.sort((a, b) => new Date(b.date) - new Date(a.date))
    setCache(cacheKey, results)
    return results
  } catch (err) {
    console.warn('Error fetching HN opportunities:', err)
    return []
  }
}

/**
 * 2. Fetch live remote jobs from Jobicy & RemoteOK
 */
export async function fetchRemoteJobs(filterTag = 'mobile') {
  const cacheKey = `remote_${filterTag}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const items = []

  // A. Fetch Jobicy
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25&industry=engineering')
    if (res.ok) {
      const data = await res.json()
      const jobs = data.jobs || []
      jobs.forEach((j) => {
        const cleanDesc = stripHtml(j.jobDescription || '')
        const isMobileOrFlutter =
          cleanDesc.toLowerCase().includes('flutter') ||
          cleanDesc.toLowerCase().includes('mobile') ||
          cleanDesc.toLowerCase().includes('ios') ||
          cleanDesc.toLowerCase().includes('android') ||
          cleanDesc.toLowerCase().includes('react native') ||
          (j.jobTitle && /mobile|flutter|ios|android/i.test(j.jobTitle))

        items.push({
          id: `jobicy-${j.id}`,
          source: 'jobicy',
          sourceLabel: 'Jobicy Remote',
          company: j.companyName || 'Tech Startup',
          title: j.jobTitle || 'Mobile Engineer',
          location: j.jobGeo || 'Anywhere (Remote)',
          type: Array.isArray(j.jobType) ? j.jobType.join(', ') : j.jobType || 'Remote',
          employmentType: Array.isArray(j.jobType) ? j.jobType.join(', ') : j.jobType || '',
          email: null,
          url: j.url || '',
          applyUrl: j.url || '',
          website: '',
          description: cleanDesc.slice(0, 320) + (cleanDesc.length > 320 ? '...' : ''),
          fullText: cleanDesc,
          date: j.pubDate || new Date().toISOString(),
          highlight: isMobileOrFlutter,
          tags: Array.isArray(j.jobType) ? j.jobType : [],
        })
      })
    }
  } catch (err) {
    console.warn('Jobicy fetch warning:', err)
  }

  // B. Fetch RemoteOK
  try {
    const res = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(filterTag || 'mobile')}`)
    if (res.ok) {
      const data = await res.json()
      const jobs = Array.isArray(data) ? data.slice(1, 20) : []
      jobs.forEach((j) => {
        if (!j.position) return
        const cleanDesc = stripHtml(j.description || '')
        items.push({
          id: `rok-${j.id}`,
          source: 'remoteok',
          sourceLabel: 'RemoteOK',
          company: j.company || 'Remote Tech Co',
          title: j.position,
          location: j.location || 'Worldwide',
          type: j.tags?.includes('contract') ? 'Contract' : 'Not specified',
          employmentType: j.tags?.includes('contract') ? 'Contract' : '',
          salary: j.salary_min && j.salary_max ? `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}` : null,
          email: null,
          url: j.url || j.apply_url || '',
          applyUrl: j.apply_url || j.url || '',
          website: '',
          description: cleanDesc.slice(0, 320) + (cleanDesc.length > 320 ? '...' : ''),
          fullText: cleanDesc,
          date: j.date || new Date().toISOString(),
          highlight: Boolean(j.tags?.some((t) => /flutter|mobile|ios|android/i.test(t))),
          tags: Array.isArray(j.tags) ? j.tags.slice(0, 5) : [],
        })
      })
    }
  } catch (err) {
    console.warn('RemoteOK fetch warning:', err)
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.date) - new Date(a.date))
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

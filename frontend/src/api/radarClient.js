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
  return match ? match[0] : null
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

/**
 * 1. Fetch live Hacker News "Who is Hiring" opportunities
 */
export async function fetchHNHiringOpportunities(query = '') {
  const cacheKey = `hn_${query}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    // 1. Get the latest "Who is hiring?" story ID
    const storyRes = await fetch(
      'https://hn.algolia.com/api/v1/search_by_date?tags=story,ask_hn&query=Who+is+hiring&hitsPerPage=1',
    )
    if (!storyRes.ok) throw new Error('Failed to find latest HN Who is hiring thread')
    const storyData = await storyRes.json()
    const latestStory = storyData.hits?.[0]
    if (!latestStory) return []

    const storyId = latestStory.objectID
    const storyTitle = latestStory.title

    // 2. Fetch comments matching filter or broad mobile/engineering terms
    const searchQuery = query.trim()
    const commentsUrl = `https://hn.algolia.com/api/v1/search?tags=comment,story_${storyId}&query=${encodeURIComponent(
      searchQuery,
    )}&hitsPerPage=60`

    const commentsRes = await fetch(commentsUrl)
    if (!commentsRes.ok) throw new Error('Failed to fetch comments for Who is hiring')
    const commentsData = await commentsRes.json()

    const results = (commentsData.hits || [])
      .filter((h) => h.comment_text && h.comment_text.length > 50)
      .map((h) => {
        const raw = h.comment_text || ''
        const clean = stripHtml(raw)
        const email = extractEmail(clean)
        const website = extractWebsite(raw, clean)

        // HN comments standard: Company | Role | Location | Remote/Onsite | Salary
        const firstLine = clean.split('\n')[0] || ''
        const pipes = firstLine.split('|').map((s) => decodeHtmlEntities(s.trim()))

        const rawCompany = pipes[0] && pipes[0].length < 60 ? pipes[0] : h.author
        const company = decodeHtmlEntities(rawCompany).replace(/^[#\s*]+/, '').trim()
        const role = pipes[1] && pipes[1].length < 100 ? decodeHtmlEntities(pipes[1]) : 'Software Engineer / Mobile'
        const location = pipes[2] ? decodeHtmlEntities(pipes[2]) : 'Remote'

        // Single-line preview snippet for card display
        const singleLineClean = clean.replace(/\n+/g, ' ')
        const description = singleLineClean.slice(0, 320) + (singleLineClean.length > 320 ? '...' : '')

        return {
          id: `hn-${h.objectID}`,
          source: 'hacker_news',
          sourceLabel: 'Hacker News (Founder Direct)',
          company,
          title: role,
          location,
          type: clean.toLowerCase().includes('contract') || clean.toLowerCase().includes('freelance') ? 'Contract' : 'Full-time / Contract',
          email,
          url: `https://news.ycombinator.com/item?id=${h.objectID}`,
          website,
          description,
          fullText: clean,
          date: h.created_at,
          threadTitle: storyTitle,
          isFounderDirect: Boolean(email),
        }
      })

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
          type: j.tags?.includes('contract') ? 'Contract' : 'Full-Time',
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

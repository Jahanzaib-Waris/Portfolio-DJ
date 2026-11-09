// Radar data sources. Pure fetch + parsing (no DOM, no caching), shared by the browser
// fallback (frontend/src/api/radarClient.js) and the radar-ingest Edge Function.
import { decodeHtmlEntities, extractEmail, extractWebsite, stripHtml } from './text.js'

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
 * Fetch live Hacker News opportunities from the latest "Who is hiring?" and
 *    "Freelancer? Seeking freelancer?" threads.
 */
export async function fetchHnItems(query = '') {
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
    return results
  } catch (err) {
    console.warn('Error fetching HN opportunities:', err)
    return []
  }
}

/**
 * Fetch live remote jobs from Jobicy & RemoteOK
 */
export async function fetchRemoteItems(filterTag = 'mobile') {
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
  return items
}


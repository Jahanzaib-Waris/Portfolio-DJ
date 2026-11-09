// Pure text helpers for radar posts. No DOM or browser APIs, so this file runs
// unchanged in the browser (Vite) and in Supabase Edge Functions (Deno).

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  nearr: '↗',
  rarr: '→',
  larr: '←',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  bull: '•',
  middot: '·',
  copy: '©',
}

/** Decodes numeric (&#47; &#x2F;) and common named HTML entities. */
export function decodeHtmlEntities(str = '') {
  if (!str) return ''
  return str.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      try {
        return Number.isFinite(code) ? String.fromCodePoint(code) : match
      } catch {
        return match
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

/** Extracts clean plain text from an HTML string, preserving line structure. */
export function stripHtml(html = '') {
  if (!html) return ''

  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')

  text = decodeHtmlEntities(text)

  const lines = text
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0))

  return lines.join('\n').trim()
}

/** First email address in the text, including "name [at] domain [dot] com" forms. */
export function extractEmail(text = '') {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (match) return match[0]

  const obf = text.match(
    /([a-zA-Z0-9._%+-]+)\s*[[(]\s*at\s*[\])]\s*([a-zA-Z0-9-]+(?:\s*[[(]?\s*dot\s*[\])]?\s*[a-zA-Z0-9-]+)*)/i,
  )
  if (obf) {
    const domain = obf[2].replace(/\s*[[(]?\s*dot\s*[\])]?\s*/gi, '.')
    if (/\.[a-zA-Z]{2,}$/.test(domain)) return `${obf[1]}@${domain}`
  }
  return null
}

/** Company website from an HTML anchor, or a bare URL in the text. */
export function extractWebsite(rawHtml = '', cleanText = '') {
  const match = rawHtml.match(/href="([^"'\s]+)"/i)
  let url = ''
  if (match) {
    url = decodeHtmlEntities(match[1])
  } else {
    const textMatch = cleanText.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s),]+)?/i)
    if (textMatch) url = textMatch[0]
  }

  if (!url || url.includes('ycombinator.com')) return ''
  return url.replace(/[),]+$/, '')
}

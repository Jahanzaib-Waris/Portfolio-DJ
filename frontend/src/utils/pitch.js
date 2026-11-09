// Algorithmic (no-API) cold pitch builder for the CRM lead drawer and Client Radar.
//
// Rules for the copy in this file:
//  * No invented results. Do not add metrics, timelines, client counts or outcomes
//    ("shipped in 21 days", "60% faster", "100k users") unless they are true and you
//    can show them. Describe what you do, link the portfolio, and let the call prove it.
//  * State the engagement model: scoped projects, fixed blocks of hours or retainers,
//    alongside other clients. It is not an application for an employee job.
//  * Reference the specific post when the lead came from one.

export const PORTFOLIO_URL = 'https://jerry-dev-studio.web.app/projects'
export const SITE_URL = 'https://jerry-dev-studio.web.app'

const ANGLE_COPY = {
  rescue: {
    topic: 'getting unstuck on FlutterFlow / Flutter issues',
    paragraph:
      'I help teams get past Flutter and FlutterFlow blockers: custom Dart actions, state-management bugs, slow Supabase queries, and App Store or Play Store rejections.',
    subject: (company) => `Help unblocking ${company}'s mobile app`,
  },
  mvp: {
    topic: 'building and launching a mobile MVP',
    paragraph:
      'I build production-ready Flutter / FlutterFlow apps on Supabase for iOS and Android, from a scoped MVP through store submission, with code you own and can hand to any developer later.',
    subject: (company) => `Building ${company}'s mobile MVP`,
  },
  scale: {
    topic: 'hardening and scaling a Flutter + Supabase backend',
    paragraph:
      'I help teams harden and scale Flutter apps on Supabase: Row-Level Security, query performance, modular Dart architecture, and release pipelines.',
    subject: (company) => `Backend and architecture support for ${company}`,
  },
}

const ENGAGEMENT_LINE =
  'I work as an independent engineer on scoped projects, fixed blocks of hours, or a light retainer, alongside other clients, so you can get the help without making a full-time hire.'

const firstNameOf = (name) => {
  const raw = (name || '').trim()
  if (!raw) return 'there'
  const lower = raw.toLowerCase()
  if (['lead', 'hiring', 'contact', 'publisher', 'team'].some((w) => lower.includes(w))) return 'there'
  return raw.split(' ')[0]
}

/** One-line opener that refers to where the lead actually came from. */
function buildOpener(lead, angle) {
  const company = (lead.company || '').trim()
  const role = (lead.job_title || '').trim()
  const notes = lead.notes || ''
  const topic = ANGLE_COPY[angle].topic

  const rating = notes.match(/App Store rating:\s*([\d.]+)\s*\(([\d,]+) ratings\)/i)
  const updated = notes.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/i)
  if (rating && /app rescue/i.test(role)) {
    const appName = role.replace(/^app rescue:\s*/i, '')
    return `I came across ${appName} on the App Store. It's rated ${rating[1]} across ${rating[2]} ratings${updated ? ` and was last updated on ${updated[1]}` : ''}, and I thought I might be able to help.`
  }

  if (lead.source === 'hacker_news') {
    return `I saw your post on Hacker News${role && !/^software engineer/i.test(role) ? ` for "${role}"` : ''}${company ? ` at ${company}` : ''} and wanted to reach out directly.`
  }
  if (lead.source === 'job_board') {
    return `I saw your listing${role ? ` for "${role}"` : ''}${company ? ` at ${company}` : ''} and wanted to reach out directly.`
  }
  if (lead.source === 'website_inbound') {
    return `Thanks for getting in touch about your project.`
  }
  return `I came across ${company || 'your team'} and wanted to reach out about ${topic}.`
}

const SIGN_OFF = `Best,
Jerry Waris
Jerry Dev Studio
${SITE_URL}`

/**
 * Builds { subject, body, inmail } for a lead.
 *   lead      – CRM-lead-shaped object (name, company, job_title, source, notes)
 *   angle     – 'rescue' | 'mvp' | 'scale'
 *   tone      – 'senior' | 'consultant' | 'punchy'
 *   techStack – free-text stack the lead uses (defaults to Flutter & Supabase)
 */
export function buildPitch({ lead = {}, angle = 'rescue', tone = 'senior', techStack = '' }) {
  const copy = ANGLE_COPY[angle] || ANGLE_COPY.rescue
  const angleKey = ANGLE_COPY[angle] ? angle : 'rescue'
  const first = firstNameOf(lead.name)
  const company = (lead.company || '').trim() || 'your team'
  const stack = (techStack || '').trim() || 'Flutter & Supabase'
  const opener = buildOpener(lead, angleKey)

  const subject = copy.subject(company)
  const inmail = `Hi ${first}, ${opener} I work on ${stack} projects as an independent engineer. Examples: ${PORTFOLIO_URL}`.slice(0, 300)

  let body
  if (tone === 'punchy') {
    body = `Hi ${first},

${opener}

${copy.paragraph}

${ENGAGEMENT_LINE}

Examples of my work: ${PORTFOLIO_URL}

Open to a quick call this week?

${SIGN_OFF}`
  } else if (tone === 'consultant') {
    body = `Hi ${first},

${opener}

Delays on a mobile product usually cost more than the fix itself. ${copy.paragraph}

For ${company}, I'd start with a short call to understand the current state of the work (${stack}), then propose a clearly scoped piece of work with a fixed price or a fixed number of hours, so you know the cost up front.

${ENGAGEMENT_LINE}

Examples of my work: ${PORTFOLIO_URL}

Would 15 minutes this week be useful? If the timing isn't right, no problem at all.

${SIGN_OFF}`
  } else {
    body = `Hi ${first},

${opener}

I'm Jerry Waris, a senior mobile and full-stack engineer working with ${stack}. ${copy.paragraph}

${ENGAGEMENT_LINE}

Examples of my work: ${PORTFOLIO_URL}

Would a 15-minute call this week make sense? If now isn't the right time, no problem.

${SIGN_OFF}`
  }

  return { subject, body, inmail }
}

/** mailto: link carrying a ready-to-send draft. */
export function buildMailto(email, pitch) {
  if (!email) return null
  return `mailto:${email}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`
}

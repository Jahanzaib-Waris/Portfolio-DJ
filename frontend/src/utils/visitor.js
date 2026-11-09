// Visitor identity for the public site.
//
// A visitor is a random ID stored in the browser's localStorage. It is only ever tied to a
// person when they (a) submit the quote form, which sends the ID along, or (b) open a
// tracked link from one of my emails (?ref=<token>). Tracking is off when the browser sends
// Do Not Track or the visitor opts out on /privacy. There is no fingerprinting and no IP lookup.

const ID_KEY = '__pv_session'
const OPT_OUT_KEY = '__pv_optout'
const LINKED_KEY = '__pv_linked'

export const VISITOR_ID_RE = /^s_[a-z0-9]{6,32}$/
export const TRACK_TOKEN_RE = /^[a-f0-9]{16}$/

const dntEnabled = () =>
  typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (typeof window !== 'undefined' && window.doNotTrack === '1'))

/** True when the browser sends Do Not Track (tracking is then disabled automatically). */
export const isDoNotTrack = () => dntEnabled()

/** True when the visitor chose to opt out on the privacy page. */
export function isOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export const isTrackingAllowed = () => !dntEnabled() && !isOptedOut()

/** Turns tracking off (and forgets this browser's ID) or back on. */
export function setTrackingOptOut(optOut) {
  try {
    if (optOut) {
      localStorage.setItem(OPT_OUT_KEY, '1')
      localStorage.removeItem(ID_KEY)
      localStorage.removeItem(LINKED_KEY)
    } else {
      localStorage.removeItem(OPT_OUT_KEY)
    }
  } catch {
    // storage unavailable: nothing is being stored anyway
  }
}

/** This browser's visitor ID, created on first use. Null when tracking is off or storage is blocked. */
export function getVisitorId() {
  if (!isTrackingAllowed()) return null
  try {
    const existing = localStorage.getItem(ID_KEY)
    if (existing && VISITOR_ID_RE.test(existing)) return existing

    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const id = 's_' + Array.from(bytes, (b) => (b % 36).toString(36)).join('')
    localStorage.setItem(ID_KEY, id)
    return id
  } catch {
    return null
  }
}

/**
 * If the URL carries ?ref=<token> (a tracked link from one of my emails), link this browser to that
 * lead once, then remove the parameter from the address bar so it isn't copied or shared along.
 * `linkFn(token, visitorId)` performs the server call.
 */
export async function captureTrackedRef(linkFn) {
  if (typeof window === 'undefined') return
  let url
  try {
    url = new URL(window.location.href)
  } catch {
    return
  }
  const token = url.searchParams.get('ref')
  if (token === null) return

  url.searchParams.delete('ref')
  try {
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  } catch {
    // history unavailable; the parameter just stays visible
  }

  if (!TRACK_TOKEN_RE.test(token) || !isTrackingAllowed()) return
  const visitorId = getVisitorId()
  if (!visitorId) return

  try {
    const linked = JSON.parse(localStorage.getItem(LINKED_KEY) || '[]')
    if (linked.includes(token)) return
    await linkFn(token, visitorId)
    localStorage.setItem(LINKED_KEY, JSON.stringify([...linked, token].slice(-20)))
  } catch {
    // linking is best-effort and must never affect the page
  }
}

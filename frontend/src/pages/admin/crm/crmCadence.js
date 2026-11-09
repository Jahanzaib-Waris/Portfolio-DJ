// Follow-up cadence for outreach. Logging an outreach activity (email, LinkedIn, call)
// schedules the next follow-up automatically; a reply stops the sequence.
import { localDateStr } from '../../../utils/dates.js'

/** Activity types that count as an outreach attempt. */
export const OUTREACH_TYPES = ['email', 'linkedin', 'call']

/** Days to wait after outreach attempt 1, 2 and 3. After the third, the sequence ends. */
export const CADENCE_DAYS = [3, 7, 14]

const addDays = (days, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days)
  return localDateStr(d)
}

/**
 * Plans what should happen after the user logs an activity.
 *   type            – activity type just logged
 *   priorOutreach   – number of outreach activities already logged BEFORE this one
 *   stage           – the lead's current stage
 * Returns { nextFollowUp: 'YYYY-MM-DD' | null, stage, temperature?, step?, message } or null
 * when the activity doesn't affect the sequence.
 */
export function planAfterActivity({ type, priorOutreach = 0, stage, from = new Date() }) {
  const closed = stage === 'closed_won' || stage === 'closed_lost'
  if (closed) return null

  if (type === 'reply') {
    return {
      nextFollowUp: addDays(1, from),
      stage,
      temperature: 'hot',
      message: 'Reply logged: sequence stopped, respond by tomorrow.',
    }
  }

  if (!OUTREACH_TYPES.includes(type)) return null

  const nextStage = stage === 'lead' ? 'contacted' : stage
  const stepIndex = priorOutreach // 0-based index of the attempt just logged
  if (stepIndex < CADENCE_DAYS.length) {
    const days = CADENCE_DAYS[stepIndex]
    return {
      nextFollowUp: addDays(days, from),
      stage: nextStage,
      step: stepIndex + 1,
      message: `Follow-up set for ${addDays(days, from)} (attempt ${stepIndex + 1} of ${CADENCE_DAYS.length}).`,
    }
  }
  return {
    nextFollowUp: null,
    stage: nextStage,
    step: stepIndex + 1,
    message: 'Sequence finished: no automatic follow-up after the third attempt.',
  }
}

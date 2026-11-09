// Pure scoring for the survey-matching prototype.
//
// Each profile is scored on six factors. Every factor gives a fraction from 0 to 1 and has a
// weight; the total is the weighted average on a 0-100 scale. The "nearby" weight grows with
// how much the person said distance matters. Showing the breakdown (not just a number) is the
// point of the demo: a client can see, and tune, exactly how recommendations are made.

import { CONNECT_OPTIONS, GOAL_OPTIONS } from './data.js'

export const BASE_WEIGHTS = { interests: 35, social: 20, connect: 15, goal: 15, time: 10 }
const NEARBY_WEIGHT = { 0: 5, 1: 10, 2: 15, 3: 20 } // by "how much does distance matter" (0 to 3)
const NEARBY_RANGE_KM = { 1: 25, 2: 12, 3: 6 } // distance at which the nearby fraction reaches 0

export const FACTOR_LABELS = {
  interests: 'Shared interests',
  social: 'Social energy',
  connect: 'How you like to connect',
  goal: 'What you are looking for',
  time: 'Time commitment',
  nearby: 'Distance',
}

const labelOf = (options, id) => options.find((o) => o.id === id)?.label.toLowerCase() || id

/** The six factors for one profile: { fraction, weight, note }. */
export function factorsFor(answers, profile) {
  const shared = profile.interests.filter((i) => answers.interests.includes(i))
  const denom = Math.min(answers.interests.length, profile.interests.length) || 1
  const importance = answers.nearby ?? 2
  const distanceFraction = importance === 0 ? 1 : Math.max(0, 1 - profile.distanceKm / NEARBY_RANGE_KM[importance])

  return {
    interests: {
      fraction: shared.length / denom,
      weight: BASE_WEIGHTS.interests,
      note: shared.length ? `Shares ${shared.join(', ')}` : 'No shared interests',
    },
    social: {
      fraction: 1 - Math.abs(answers.social - profile.social) / 4,
      weight: BASE_WEIGHTS.social,
      note: Math.abs(answers.social - profile.social) <= 1 ? 'Similar social energy' : 'Different social energy',
    },
    connect: {
      fraction: profile.connect.includes(answers.connect) ? 1 : 0,
      weight: BASE_WEIGHTS.connect,
      note: profile.connect.includes(answers.connect) ? `Also likes ${labelOf(CONNECT_OPTIONS, answers.connect)}` : 'Prefers a different way to connect',
    },
    goal: {
      fraction: profile.goals.includes(answers.goal) ? 1 : 0,
      weight: BASE_WEIGHTS.goal,
      note: profile.goals.includes(answers.goal) ? `Also wants to ${labelOf(GOAL_OPTIONS, answers.goal)}` : 'Looking for something different',
    },
    time: {
      fraction: 1 - Math.abs(answers.time - profile.time) / 4,
      weight: BASE_WEIGHTS.time,
      note: Math.abs(answers.time - profile.time) <= 1 ? 'Similar time commitment' : 'Different time commitment',
    },
    nearby: {
      fraction: distanceFraction,
      weight: NEARBY_WEIGHT[importance],
      note: `${profile.distanceKm} km away`,
    },
  }
}

/** Scores one profile: { total (0-100), parts: [{ key, label, points, max, note }], reasons: string[] }. */
export function scoreProfile(answers, profile) {
  const factors = factorsFor(answers, profile)
  const keys = Object.keys(factors)
  const weightSum = keys.reduce((sum, k) => sum + factors[k].weight, 0)

  const parts = keys.map((key) => ({
    key,
    label: FACTOR_LABELS[key],
    points: (factors[key].fraction * factors[key].weight * 100) / weightSum,
    max: (factors[key].weight * 100) / weightSum,
    note: factors[key].note,
  }))
  const total = Math.round(parts.reduce((sum, p) => sum + p.points, 0))

  const reasons = parts
    .filter((p) => p.points / p.max >= 0.75)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((p) => p.note)

  return { total, parts, reasons }
}

/** Every profile with its score, best first (nearest wins ties). */
export function rankProfiles(answers, profiles) {
  return profiles
    .map((profile) => ({ profile, ...scoreProfile(answers, profile) }))
    .sort((a, b) => b.total - a.total || a.profile.distanceKm - b.profile.distanceKm)
}

/** Whether a survey step can be left, so the form never advances with a missing answer. */
export function isStepValid(step, answers) {
  switch (step) {
    case 0:
      return answers.interests.length >= 1 && answers.interests.length <= 4
    case 2:
      return Boolean(answers.connect)
    case 3:
      return Boolean(answers.goal)
    default:
      return true
  }
}

// Pure logic for the swipe-cards prototype (kept separate from the UI so it can be tested).
//
// Direction rules for this demo: swipe LEFT = save to favourites, swipe RIGHT = skip.

export const SWIPE_THRESHOLD = 90 // px dragged before a release counts as a swipe
export const FLING_VELOCITY = 0.5 // px per ms; a quick flick counts even if it is short
const MIN_FLING_DISTANCE = 30

/** 'favourite' | 'skip' | null for a released drag of dx pixels at the given horizontal velocity. */
export function decideSwipe(dx, velocityX = 0) {
  if (dx <= -SWIPE_THRESHOLD || (dx < -MIN_FLING_DISTANCE && velocityX <= -FLING_VELOCITY)) return 'favourite'
  if (dx >= SWIPE_THRESHOLD || (dx > MIN_FLING_DISTANCE && velocityX >= FLING_VELOCITY)) return 'skip'
  return null
}

export const createDeck = (items) => ({ queue: [...items], favourites: [], skipped: [], history: [] })

export function deckReducer(state, action) {
  switch (action.type) {
    case 'swipe': {
      const [top, ...rest] = state.queue
      if (!top) return state
      const favourite = action.direction === 'favourite'
      return {
        queue: rest,
        favourites: favourite ? [...state.favourites, top] : state.favourites,
        skipped: favourite ? state.skipped : [...state.skipped, top],
        history: [...state.history, { item: top, direction: action.direction }],
      }
    }
    case 'undo': {
      const last = state.history[state.history.length - 1]
      if (!last) return state
      return {
        queue: [last.item, ...state.queue],
        favourites: state.favourites.filter((i) => i.id !== last.item.id),
        skipped: state.skipped.filter((i) => i.id !== last.item.id),
        history: state.history.slice(0, -1),
      }
    }
    case 'reset':
      return createDeck(action.items)
    default:
      return state
  }
}

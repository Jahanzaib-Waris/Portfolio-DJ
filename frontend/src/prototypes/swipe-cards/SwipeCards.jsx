import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Avatar, Chip, DemoShell } from '../ui'
import usePrefersReducedMotion from '../usePrefersReducedMotion'
import { profiles } from './data'
import { createDeck, decideSwipe, deckReducer, SWIPE_THRESHOLD } from './swipeLogic'

const EXIT_MS = 260

export default function SwipeCards() {
  const reduced = usePrefersReducedMotion()
  const [deck, dispatch] = useReducer(deckReducer, profiles, createDeck)
  const [drag, setDrag] = useState({ dx: 0, dy: 0, active: false })
  const [exit, setExit] = useState(null) // 'favourite' | 'skip' while the top card flies off
  const [announce, setAnnounce] = useState('')
  const start = useRef(null)
  const last = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const commit = useCallback(
    (direction) => {
      if (exit || deck.queue.length === 0) return
      const person = deck.queue[0]
      setAnnounce(direction === 'favourite' ? `${person.name} saved to favourites` : `${person.name} skipped`)
      const finish = () => {
        dispatch({ type: 'swipe', direction })
        setExit(null)
        setDrag({ dx: 0, dy: 0, active: false })
      }
      if (reduced) return finish()
      setExit(direction)
      timer.current = setTimeout(finish, EXIT_MS)
    },
    [deck.queue, exit, reduced],
  )

  const onPointerDown = (e) => {
    if (exit) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    last.current = { x: e.clientX, t: performance.now(), v: 0 }
    setDrag({ dx: 0, dy: 0, active: true })
  }

  const onPointerMove = (e) => {
    if (!start.current) return
    const now = performance.now()
    const dt = Math.max(1, now - last.current.t)
    last.current = { x: e.clientX, t: now, v: (e.clientX - last.current.x) / dt }
    setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y, active: true })
  }

  const onPointerUp = () => {
    if (!start.current) return
    const direction = decideSwipe(drag.dx, last.current?.v ?? 0)
    start.current = null
    if (direction) commit(direction)
    else setDrag({ dx: 0, dy: 0, active: false })
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      commit('favourite')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      commit('skip')
    } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') {
      e.preventDefault()
      dispatch({ type: 'undo' })
    }
  }

  const visible = deck.queue.slice(0, 3)
  const done = deck.queue.length === 0
  const favOpacity = Math.min(1, Math.max(0, -drag.dx / SWIPE_THRESHOLD))
  const skipOpacity = Math.min(1, Math.max(0, drag.dx / SWIPE_THRESHOLD))

  const topStyle = () => {
    if (exit) {
      const x = exit === 'favourite' ? -700 : 700
      return { transform: `translate(${x}px, ${drag.dy * 0.3}px) rotate(${x * 0.04}deg)`, transition: `transform ${EXIT_MS}ms ease-in` }
    }
    if (drag.active) return { transform: `translate(${drag.dx}px, ${drag.dy * 0.3}px) rotate(${drag.dx * 0.06}deg)`, transition: 'none' }
    return { transform: 'translate(0,0) rotate(0)', transition: reduced ? 'none' : 'transform 220ms cubic-bezier(0.2,0.7,0.2,1)' }
  }

  return (
    <DemoShell title="Swipe cards" onReset={() => dispatch({ type: 'reset', items: profiles })}>
      <div className="mx-auto max-w-sm">
        <div
          tabIndex={0}
          role="group"
          aria-label="Card stack. Left arrow saves to favourites, right arrow skips, Backspace undoes."
          onKeyDown={onKeyDown}
          className="relative mx-auto h-[26rem] w-full select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-neon-indigo sm:h-[28rem]"
        >
          {done && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-edge bg-abyss/50 p-6 text-center">
              <p className="text-lg font-bold text-white">You&rsquo;ve seen everyone</p>
              <p className="mt-1 text-sm text-[#A1A7CA]">
                {deck.favourites.length} saved &middot; {deck.skipped.length} skipped
              </p>
              <button
                type="button"
                onClick={() => dispatch({ type: 'reset', items: profiles })}
                className="system-button system-button-primary mt-5 px-5 py-2.5 text-sm font-semibold"
              >
                Start over
              </button>
            </div>
          )}

          {visible
            .map((person, i) => {
              const isTop = i === 0
              const style = isTop
                ? topStyle()
                : { transform: `translateY(${i * 10}px) scale(${1 - i * 0.05})`, transition: reduced ? 'none' : 'transform 220ms' }
              return (
                <article
                  key={person.id}
                  onPointerDown={isTop ? onPointerDown : undefined}
                  onPointerMove={isTop ? onPointerMove : undefined}
                  onPointerUp={isTop ? onPointerUp : undefined}
                  onPointerCancel={isTop ? onPointerUp : undefined}
                  style={{ ...style, zIndex: 10 - i, touchAction: 'pan-y' }}
                  className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-panel-edge bg-raised ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                  aria-hidden={!isTop}
                >
                  <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-[#2A2260] via-[#1B2150] to-[#12283F]">
                    <Avatar name={person.name} index={person.id} size="h-28 w-28" text="text-4xl" ring="ring-4 ring-white/10" />
                    {isTop && (
                      <>
                        <span
                          style={{ opacity: favOpacity }}
                          className="absolute left-4 top-4 -rotate-12 rounded-lg border-2 border-[#F472B6] px-3 py-1 text-sm font-extrabold tracking-wider text-[#F472B6]"
                        >
                          FAVOURITE
                        </span>
                        <span
                          style={{ opacity: skipOpacity }}
                          className="absolute right-4 top-4 rotate-12 rounded-lg border-2 border-slate-300 px-3 py-1 text-sm font-extrabold tracking-wider text-slate-200"
                        >
                          SKIP
                        </span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2 bg-panel p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {person.name}, {person.age}
                      </h3>
                      <span className="shrink-0 text-xs text-[#A1A7CA]">
                        {person.distanceKm} km &middot; {person.city}
                      </span>
                    </div>
                    <p className="text-sm text-[#C9CEEA]">{person.tagline}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {person.interests.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                  </div>
                </article>
              )
            })
            .reverse()}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => commit('favourite')}
            disabled={done || !!exit}
            aria-label="Save to favourites (left swipe)"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[#F472B6]/50 bg-[#F472B6]/10 text-[#F472B6] transition-colors hover:bg-[#F472B6]/20 disabled:opacity-40"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0112 6.4 5.3 5.3 0 0121.3 12C19 16.4 12 21 12 21z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={deck.history.length === 0 || !!exit}
            aria-label="Undo last swipe"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-panel-edge text-slate-300 transition-colors hover:border-slate-400 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => commit('skip')}
            disabled={done || !!exit}
            aria-label="Skip (right swipe)"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-400/40 bg-slate-400/10 text-slate-200 transition-colors hover:bg-slate-400/20 disabled:opacity-40"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-[#A1A7CA]">
          Drag a card, use the buttons, or press &larr; to favourite and &rarr; to skip.
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {announce}
        </p>

        <div className="mt-5 border-t border-panel-edge pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A7CA]">Favourites ({deck.favourites.length})</p>
          {deck.favourites.length === 0 ? (
            <p className="mt-2 text-sm text-[#A1A7CA]">Swipe left on someone to save them here.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {deck.favourites.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-full border border-panel-edge bg-abyss/60 py-1 pl-1 pr-3 text-xs text-slate-200">
                  <Avatar name={p.name} index={p.id} size="h-6 w-6" text="text-[10px]" />
                  {p.name.split(' ')[0]}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DemoShell>
  )
}

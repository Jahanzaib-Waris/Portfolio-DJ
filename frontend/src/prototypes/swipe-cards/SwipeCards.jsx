import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useDevice } from '../device/deviceContext'
import { AppScreen, KChip, KawaiiFace, Sparkle } from '../kawaii'
import usePrefersReducedMotion from '../usePrefersReducedMotion'
import { profiles } from './data'
import { createDeck, decideSwipe, deckReducer, SWIPE_THRESHOLD } from './swipeLogic'

const EXIT_MS = 260

export default function SwipeCards() {
  const reduced = usePrefersReducedMotion()
  const { scale } = useDevice()
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
  // The frame may be shrunk to fit the page; the card should still follow the finger 1:1.
  const local = (px) => px / scale

  const topStyle = () => {
    if (exit) {
      const x = exit === 'favourite' ? -700 : 700
      return { transform: `translate(${x}px, ${local(drag.dy) * 0.3}px) rotate(${x * 0.04}deg)`, transition: `transform ${EXIT_MS}ms ease-in` }
    }
    if (drag.active) return { transform: `translate(${local(drag.dx)}px, ${local(drag.dy) * 0.3}px) rotate(${local(drag.dx) * 0.06}deg)`, transition: 'none' }
    return { transform: 'translate(0,0) rotate(0)', transition: reduced ? 'none' : 'transform 220ms cubic-bezier(0.2,0.7,0.2,1)' }
  }

  const favourites = (
    <ul className="flex flex-wrap gap-2">
      {deck.favourites.map((p) => (
        <li key={p.id} className="flex items-center gap-1.5 rounded-full border-2 border-kw-line bg-white py-0.5 pl-0.5 pr-3 text-xs font-bold text-kw-ink">
          <KawaiiFace seed={p.id} className="h-6 w-6" />
          {p.name.split(' ')[0]}
        </li>
      ))}
    </ul>
  )

  return (
    <AppScreen
      accent="pink"
      title="Discover"
      subtitle="Swipe left to favourite, right to skip"
      action={
        <span className="flex items-center gap-1 rounded-full bg-(--kw-accent-soft) px-3 py-1 text-xs font-black text-(--kw-accent-ink)" aria-label={`${deck.favourites.length} favourites`}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0112 6.4 5.3 5.3 0 0121.3 12C19 16.4 12 21 12 21z" />
          </svg>
          {deck.favourites.length}
        </span>
      }
    >
      <div className="grid h-full gap-5 px-5 pb-4 @2xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-h-0 flex-col">
          <div
            tabIndex={0}
            role="group"
            aria-label="Card stack. Left arrow saves to favourites, right arrow skips, Backspace undoes."
            onKeyDown={onKeyDown}
            className="relative mx-auto min-h-[18rem] w-full max-w-[21rem] flex-1 select-none rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-(--kw-accent) @2xl:max-w-[25rem]"
          >
            {done && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-(--kw-accent) bg-white p-6 text-center">
                <KawaiiFace seed={9} className="h-20 w-20" />
                <p className="mt-3 text-lg font-black text-kw-ink">That&rsquo;s everyone!</p>
                <p className="mt-1 text-sm font-semibold text-kw-muted">
                  {deck.favourites.length} saved &middot; {deck.skipped.length} skipped
                </p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'reset', items: profiles })}
                  className="mt-4 rounded-2xl border-2 border-(--kw-accent) bg-(--kw-accent) px-5 py-2 text-sm font-extrabold text-kw-ink kw-pop"
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
                  : { transform: `translateY(${i * 12}px) scale(${1 - i * 0.05})`, transition: reduced ? 'none' : 'transform 220ms' }
                return (
                  <article
                    key={person.id}
                    onPointerDown={isTop ? onPointerDown : undefined}
                    onPointerMove={isTop ? onPointerMove : undefined}
                    onPointerUp={isTop ? onPointerUp : undefined}
                    onPointerCancel={isTop ? onPointerUp : undefined}
                    style={{ ...style, zIndex: 10 - i, touchAction: 'pan-y' }}
                    className={`absolute inset-0 flex flex-col overflow-hidden rounded-3xl border-2 border-kw-line bg-white shadow-[0_18px_30px_-18px_rgba(74,59,92,0.45)] ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                    aria-hidden={!isTop}
                  >
                    <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-(--kw-accent-soft) to-white">
                      <Sparkle className="absolute left-6 top-6 h-4 w-4 text-(--kw-accent)" />
                      <Sparkle className="absolute right-8 top-12 h-3 w-3 text-(--kw-accent)" delay={700} />
                      <Sparkle className="absolute bottom-8 left-10 h-3 w-3 text-(--kw-accent)" delay={1300} />
                      <KawaiiFace seed={person.id} className="kw-float h-32 w-32 drop-shadow-[0_8px_0_rgba(255,255,255,0.8)] @2xl:h-40 @2xl:w-40" />
                      {isTop && (
                        <>
                          <span
                            style={{ opacity: favOpacity }}
                            className="absolute left-4 top-4 -rotate-12 rounded-xl border-4 border-[#FF5C9D] bg-white/80 px-3 py-1 text-sm font-black tracking-wider text-[#FF5C9D]"
                          >
                            LOVE IT
                          </span>
                          <span
                            style={{ opacity: skipOpacity }}
                            className="absolute right-4 top-4 rotate-12 rounded-xl border-4 border-kw-muted bg-white/80 px-3 py-1 text-sm font-black tracking-wider text-kw-muted"
                          >
                            NOPE
                          </span>
                        </>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-xl font-black text-kw-ink">
                          {person.name}, {person.age}
                        </h3>
                        <span className="shrink-0 text-xs font-bold text-kw-muted">{person.distanceKm} km away</span>
                      </div>
                      <p className="text-sm font-semibold text-kw-muted">{person.tagline}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {person.interests.map((t) => (
                          <KChip key={t} small active>
                            {t}
                          </KChip>
                        ))}
                      </div>
                    </div>
                  </article>
                )
              })
              .reverse()}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => commit('favourite')}
              disabled={done || !!exit}
              aria-label="Save to favourites (left swipe)"
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FF8FB8] bg-[#FF8FB8] text-white kw-pop transition-transform active:scale-90 disabled:opacity-40"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0112 6.4 5.3 5.3 0 0121.3 12C19 16.4 12 21 12 21z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'undo' })}
              disabled={deck.history.length === 0 || !!exit}
              aria-label="Undo last swipe"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-kw-line bg-white text-kw-muted transition-transform active:scale-90 disabled:opacity-40"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => commit('skip')}
              disabled={done || !!exit}
              aria-label="Skip (right swipe)"
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-kw-line bg-white text-kw-muted transition-transform active:scale-90 disabled:opacity-40"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] font-bold text-kw-muted">Drag the card, tap a button, or use &larr; &rarr; keys</p>
          <p className="sr-only" role="status" aria-live="polite">
            {announce}
          </p>

          <div className="mt-3 @2xl:hidden">
            <p className="text-[11px] font-black uppercase tracking-wide text-kw-muted">Favourites ({deck.favourites.length})</p>
            {deck.favourites.length === 0 ? <p className="mt-1 text-xs font-semibold text-kw-muted">Nobody yet. Swipe left on someone you like.</p> : <div className="mt-1.5">{favourites}</div>}
          </div>
        </div>

        <aside className="hidden @2xl:block">
          <div className="rounded-3xl border-2 border-kw-line bg-white p-4">
            <p className="text-sm font-black text-kw-ink">Your favourites ({deck.favourites.length})</p>
            {deck.favourites.length === 0 ? <p className="mt-2 text-sm font-semibold text-kw-muted">Swipe left on someone you like and they land here.</p> : <div className="mt-3">{favourites}</div>}
          </div>
          <p className="mt-3 text-xs font-semibold text-kw-muted">
            Skipped: {deck.skipped.length} &middot; Left to see: {deck.queue.length}
          </p>
        </aside>
      </div>
    </AppScreen>
  )
}

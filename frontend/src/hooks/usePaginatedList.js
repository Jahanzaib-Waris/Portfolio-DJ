import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// A malicious/hand-edited `?page=` shouldn't make the initial load fire an
// unbounded number of sequential requests.
const MAX_INITIAL_DEPTH = 50

/**
 * Loads a DRF-paginated list endpoint one page at a time.
 *
 * The API pages at PAGE_SIZE (10), so without this the 11th project or quote
 * is simply unreachable. Falls back to treating the payload as a plain array if
 * pagination is ever turned off server-side.
 *
 * The `page` URL search param tracks how many pages have been loaded via "Load
 * more", so a shared/reloaded link restores that scroll depth instead of
 * silently resetting to the first 10 items.
 *
 * `fetcher` must be a stable reference (import it at module scope, don't inline it).
 */
export default function usePaginatedList(fetcher) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDepth = Math.min(
    MAX_INITIAL_DEPTH,
    Math.max(1, parseInt(searchParams.get('page'), 10) || 1),
  )

  const [items, setItems] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreFailed, setMoreFailed] = useState(false)
  // Bumped to re-run the initial fetch — used by admin screens after a delete.
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')

    async function loadInitial() {
      const collected = []
      let page = 1
      let next = null

      try {
        // Sequential, not parallel: page N+1 only exists once page N's
        // response says so, and the depth here is bounded by MAX_INITIAL_DEPTH.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const data = await fetcher({ page })
          if (cancelled) return

          collected.push(...(data.results ?? data))
          next = data.next ? page + 1 : null

          if (!next || page >= initialDepth) break
          page = next
        }

        setItems(collected)
        setNextPage(next)
        setLoadState('ready')
      } catch {
        if (!cancelled) setLoadState('error')
      }
    }

    loadInitial()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, reloadToken])

  const loadMore = useCallback(() => {
    if (!nextPage || loadingMore) return

    setLoadingMore(true)
    setMoreFailed(false)

    fetcher({ page: nextPage })
      .then((data) => {
        setItems((prev) => [...prev, ...(data.results ?? data)])
        setNextPage(data.next ? nextPage + 1 : null)
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(nextPage))
            return next
          },
          { replace: true },
        )
      })
      // Keep whatever's already on screen; surface the failure next to the button.
      .catch(() => setMoreFailed(true))
      .finally(() => setLoadingMore(false))
  }, [fetcher, nextPage, loadingMore, setSearchParams])

  return {
    items,
    loadState,
    hasMore: Boolean(nextPage),
    loadingMore,
    moreFailed,
    loadMore,
    reload,
  }
}

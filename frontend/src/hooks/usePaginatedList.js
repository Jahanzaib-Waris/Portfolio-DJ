import { useCallback, useEffect, useState } from 'react'

/**
 * Loads a DRF-paginated list endpoint one page at a time.
 *
 * The API pages at PAGE_SIZE (10), so without this the 11th blog post or project
 * is simply unreachable. Falls back to treating the payload as a plain array if
 * pagination is ever turned off server-side.
 *
 * `fetcher` must be a stable reference (import it at module scope, don't inline it).
 */
export default function usePaginatedList(fetcher) {
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

    fetcher({ page: 1 })
      .then((data) => {
        if (cancelled) return
        setItems(data.results ?? data)
        setNextPage(data.next ? 2 : null)
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, reloadToken])

  const loadMore = useCallback(() => {
    if (!nextPage || loadingMore) return

    setLoadingMore(true)
    setMoreFailed(false)

    fetcher({ page: nextPage })
      .then((data) => {
        setItems((prev) => [...prev, ...(data.results ?? data)])
        setNextPage(data.next ? nextPage + 1 : null)
      })
      // Keep whatever's already on screen; surface the failure next to the button.
      .catch(() => setMoreFailed(true))
      .finally(() => setLoadingMore(false))
  }, [fetcher, nextPage, loadingMore])

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

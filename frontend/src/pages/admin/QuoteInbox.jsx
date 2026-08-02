import { useCallback, useEffect, useState } from 'react'

import { deleteQuoteRequest, getQuoteRequests } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import usePaginatedList from '../../hooks/usePaginatedList'

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

export default function QuoteInbox() {
  const { items: quotes, loadState, hasMore, loadingMore, moreFailed, loadMore, reload } =
    usePaginatedList(getQuoteRequests)

  const [expanded, setExpanded] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    document.title = 'Quote requests — Control Panel'
  }, [])

  const cancelDelete = useCallback(() => {
    setPendingDelete(null)
    setDeleteError(null)
  }, [])

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteQuoteRequest(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } catch {
      setDeleteError('Could not delete that request. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow system-heading text-xs text-neon-indigo">// Inbox</p>
      <h1 className="mt-3 text-2xl text-white sm:text-3xl">Quote requests</h1>
      <p className="mt-2 text-sm text-slate-400">
        Submissions from the site&rsquo;s Request a Quote form, newest first.
      </p>

      {loadState === 'error' && (
        <p className="mt-8 text-sm text-status-red">Failed to load requests. Try refreshing.</p>
      )}

      {loadState === 'ready' && quotes.length === 0 && (
        <StatusPanel className="mt-8 p-8 text-center">
          <p className="text-slate-400">No requests yet.</p>
        </StatusPanel>
      )}

      <div className="mt-8 space-y-3">
        {loadState === 'loading' &&
          [1, 2, 3].map((i) => (
            <StatusPanel key={i} glow={false} className="p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-56" />
            </StatusPanel>
          ))}

        {quotes.map((quote) => {
          const isOpen = expanded === quote.id
          return (
            <StatusPanel key={quote.id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : quote.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isOpen}
                >
                  <h2 className="truncate text-sm font-semibold text-white">{quote.name}</h2>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {quote.email} &middot; {formatDate(quote.submitted_at)}
                  </p>
                  {!isOpen && (
                    <p className="mt-2 truncate text-xs text-slate-400">{quote.project_details}</p>
                  )}
                </button>

                <div className="flex shrink-0 gap-2 text-xs">
                  <a
                    href={`mailto:${quote.email}?subject=${encodeURIComponent('Re: your project enquiry')}`}
                    className="rounded-md border border-neon-blue/50 px-3 py-1.5 text-neon-blue transition-colors hover:bg-neon-blue/10"
                  >
                    Reply
                  </a>
                  <button
                    onClick={() => setPendingDelete(quote)}
                    className="rounded-md border border-panel-edge px-3 py-1.5 text-slate-400 transition-colors hover:border-status-red/60 hover:text-status-red"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 border-t border-panel-edge/60 pt-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {quote.project_details}
                  </p>
                </div>
              )}
            </StatusPanel>
          )
        })}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more.</p>}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this request?"
        message={
          deleteError ||
          `The request from ${pendingDelete?.name} will be permanently removed.`
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

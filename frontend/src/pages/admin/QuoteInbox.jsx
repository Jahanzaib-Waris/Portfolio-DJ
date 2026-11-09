import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { convertQuoteToLead, deleteQuoteRequest, getQuoteRequests } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import SearchInput from '../../components/admin/SearchInput'
import { useToast } from '../../components/admin/toastStore'
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
  const [query, setQuery] = useState('')
  const filteredQuotes = quotes.filter((quote) => {
    const term = query.trim().toLowerCase()
    if (!term) return true
    return (
      quote.name.toLowerCase().includes(term) ||
      quote.email.toLowerCase().includes(term) ||
      quote.project_details.toLowerCase().includes(term)
    )
  })

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [convertingId, setConvertingId] = useState(null)
  const [convertedMap, setConvertedMap] = useState({})

  const toast = useToast()

  const handleConvertToDeal = async (quote) => {
    setConvertingId(quote.id)
    try {
      const created = await convertQuoteToLead(quote)
      setConvertedMap((prev) => ({ ...prev, [quote.id]: created.id }))
      toast.success(`Converted "${quote.name}" into a tracked CRM deal!`)
    } catch (err) {
      toast.error('Could not convert quote: ' + (err.message || 'Unknown error'))
    } finally {
      setConvertingId(null)
    }
  }

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
      toast.success('Quote request deleted.')
      setPendingDelete(null)
      reload()
    } catch {
      setDeleteError('Could not delete that request. Try again.')
      toast.error('Could not delete that request. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
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

      {loadState === 'ready' && quotes.length > 0 && (
        <div className="mt-6">
          <SearchInput value={query} onChange={setQuery} placeholder="Search requests..." />
        </div>
      )}

      {loadState === 'ready' && quotes.length > 0 && filteredQuotes.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">No requests match &ldquo;{query}&rdquo;.</p>
      )}

      <div className="mt-4 space-y-3">
        {loadState === 'loading' &&
          [1, 2, 3].map((i) => (
            <StatusPanel key={i} glow={false} className="p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-56" />
            </StatusPanel>
          ))}

        {filteredQuotes.map((quote) => {
          const isOpen = expanded === quote.id
          return (
            <StatusPanel key={quote.id} className="p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : quote.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isOpen}
                >
                  <h2 className="truncate text-sm font-semibold text-white">{quote.name}</h2>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {quote.email} &middot; {formatDate(quote.submitted_at)}
                  </p>
                  {!isOpen && (
                    <p className="mt-2 truncate text-xs text-slate-400">{quote.project_details}</p>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto sm:shrink-0 justify-start sm:justify-end">
                  {convertedMap[quote.id] ? (
                    <Link
                      to="/admin/crm"
                      className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-400 font-semibold transition-colors hover:bg-emerald-500/20"
                    >
                      ✓ In CRM Pipeline →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={convertingId === quote.id}
                      onClick={() => handleConvertToDeal(quote)}
                      className="rounded-md border border-neon-indigo/50 bg-neon-indigo/10 px-2.5 py-1.5 text-white font-medium transition-colors hover:bg-neon-indigo/20 disabled:opacity-50"
                      title="Convert this quote request into a tracked CRM Deal"
                    >
                      {convertingId === quote.id ? 'Converting...' : ' Convert to Deal'}
                    </button>
                  )}
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
                <div className="mt-4 border-t border-panel-edge/60 pt-4 space-y-3">
                  {(quote.service || quote.backend || quote.budget || quote.timeline) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {quote.service && (
                        <span className="fb-chip bg-neon-indigo/15 border-neon-indigo/40 text-white font-medium">
                          {quote.service}
                        </span>
                      )}
                      {quote.backend && (
                        <span className="fb-chip bg-abyss border-panel-edge text-slate-300">
                          Backend: {quote.backend}
                        </span>
                      )}
                      {quote.budget && (
                        <span className="fb-chip bg-abyss border-panel-edge text-slate-300">
                          Budget: {quote.budget}
                        </span>
                      )}
                      {quote.timeline && (
                        <span className="fb-chip bg-abyss border-panel-edge text-slate-300">
                          Timeline: {quote.timeline}
                        </span>
                      )}
                    </div>
                  )}
                  {quote.project_link && (
                    <p className="text-xs text-slate-400 break-all">
                      Link:{' '}
                      <a
                        href={quote.project_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neon-blue hover:underline break-all"
                      >
                        {quote.project_link}
                      </a>
                    </p>
                  )}
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

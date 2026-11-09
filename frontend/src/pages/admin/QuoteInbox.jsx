import { Fragment, useCallback, useEffect, useState } from 'react'

import { convertQuoteToLead, deleteQuoteRequest, getCrmLeads, getQuoteRequests } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import RowActionsMenu from '../../components/admin/RowActionsMenu'
import SearchInput from '../../components/admin/SearchInput'
import VisitHistory from '../../components/admin/VisitHistory'
import { editButtonClass, rowClass, tableWrapClass, tdClass, thClass } from '../../components/admin/formStyles'
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

  // Quotes already turned into CRM leads (manually, or automatically by quote-notify).
  useEffect(() => {
    let cancelled = false
    getCrmLeads()
      .then(({ items }) => {
        if (cancelled) return
        const map = {}
        items.forEach((lead) => {
          if (lead.quote_request_id) map[lead.quote_request_id] = lead.id
        })
        setConvertedMap((prev) => ({ ...map, ...prev }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
    <div className="mx-auto max-w-5xl">
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

      {(loadState === 'loading' || filteredQuotes.length > 0) && (
        <div className={tableWrapClass}>
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge">
              <tr>
                <th scope="col" className={thClass}>From</th>
                <th scope="col" className={`${thClass} hidden md:table-cell`}>Message</th>
                <th scope="col" className={`${thClass} hidden sm:table-cell`}>Received</th>
                <th scope="col" className={`${thClass} text-right`}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-edge/70">
              {loadState === 'loading' &&
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className={tdClass}><Skeleton className="h-4 w-40 max-w-full" /></td>
                    <td className={`${tdClass} hidden md:table-cell`}><Skeleton className="h-4 w-56" /></td>
                    <td className={`${tdClass} hidden sm:table-cell`}><Skeleton className="h-4 w-24" /></td>
                    <td className={tdClass}></td>
                  </tr>
                ))}

              {filteredQuotes.map((quote) => {
                const isOpen = expanded === quote.id
                return (
                  <Fragment key={quote.id}>
                    <tr className={rowClass}>
                      <td className={`${tdClass} max-w-0 w-full sm:w-auto sm:max-w-[16rem]`}>
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : quote.id)}
                          aria-expanded={isOpen}
                          className="block w-full text-left"
                        >
                          <span className="block truncate font-medium text-white">{quote.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {quote.email}
                            <span className="sm:hidden"> &middot; {formatDate(quote.submitted_at)}</span>
                          </span>
                        </button>
                      </td>
                      <td className={`${tdClass} hidden max-w-xs md:table-cell`}>
                        <p className="truncate text-xs text-slate-300">{quote.project_details}</p>
                      </td>
                      <td className={`${tdClass} hidden whitespace-nowrap text-xs text-slate-400 sm:table-cell`}>
                        {formatDate(quote.submitted_at)}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`mailto:${quote.email}?subject=${encodeURIComponent('Re: your project enquiry')}`}
                            className={`${editButtonClass} hidden sm:inline-block`}
                          >
                            Reply
                          </a>
                          <RowActionsMenu
                            label={`Actions for ${quote.name}`}
                            items={[
                              {
                                label: 'Reply by email',
                                href: `mailto:${quote.email}?subject=${encodeURIComponent('Re: your project enquiry')}`,
                              },
                              convertedMap[quote.id]
                                ? { label: 'View in CRM pipeline', to: '/admin/crm' }
                                : {
                                    label: convertingId === quote.id ? 'Converting...' : 'Convert to deal',
                                    disabled: convertingId === quote.id,
                                    onSelect: () => handleConvertToDeal(quote),
                                  },
                              { label: 'Delete', danger: true, onSelect: () => setPendingDelete(quote) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-abyss/40">
                        <td colSpan={4} className="px-3 py-4 sm:px-4">
                          <div className="space-y-3">
                            {(quote.service || quote.backend || quote.budget || quote.timeline) && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {quote.service && (
                                  <span className="fb-chip border-neon-indigo/40 bg-neon-indigo/15 font-medium text-white">
                                    {quote.service}
                                  </span>
                                )}
                                {quote.backend && (
                                  <span className="fb-chip border-panel-edge bg-abyss text-slate-300">
                                    Backend: {quote.backend}
                                  </span>
                                )}
                                {quote.budget && (
                                  <span className="fb-chip border-panel-edge bg-abyss text-slate-300">
                                    Budget: {quote.budget}
                                  </span>
                                )}
                                {quote.timeline && (
                                  <span className="fb-chip border-panel-edge bg-abyss text-slate-300">
                                    Timeline: {quote.timeline}
                                  </span>
                                )}
                              </div>
                            )}
                            {quote.project_link && (
                              <p className="break-all text-xs text-slate-400">
                                Link:{' '}
                                <a
                                  href={quote.project_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="break-all text-neon-blue hover:underline"
                                >
                                  {quote.project_link}
                                </a>
                              </p>
                            )}
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                              {quote.project_details}
                            </p>
                            <div className="border-t border-panel-edge/60 pt-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Before they contacted you
                              </p>
                              {quote.visitor_id ? (
                                <VisitHistory visitorIds={[quote.visitor_id]} />
                              ) : (
                                <p className="text-xs text-slate-400">
                                  No browser ID was sent with this request (tracking was off, or it was submitted before visit tracking existed).
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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

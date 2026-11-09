import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { deleteBlogPost, getBlogPosts } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import RowActionsMenu from '../../components/admin/RowActionsMenu'
import SearchInput from '../../components/admin/SearchInput'
import { editButtonClass, rowClass, tableWrapClass, tdClass, thClass } from '../../components/admin/formStyles'
import { useToast } from '../../components/admin/toastStore'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import usePaginatedList from '../../hooks/usePaginatedList'

export default function BlogList() {
  // Signed in as staff, this endpoint returns drafts as well as published posts.
  const { items: posts, loadState, hasMore, loadingMore, moreFailed, loadMore, reload } =
    usePaginatedList(getBlogPosts)

  const [query, setQuery] = useState('')
  const filteredPosts = posts.filter((post) => {
    const term = query.trim().toLowerCase()
    if (!term) return true
    return post.title.toLowerCase().includes(term) || post.slug.toLowerCase().includes(term)
  })

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    document.title = 'Blog posts — Control Panel'
  }, [])

  const cancelDelete = useCallback(() => {
    setPendingDelete(null)
    setDeleteError(null)
  }, [])

  const toast = useToast()

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteBlogPost(pendingDelete.slug)
      toast.success(`Deleted "${pendingDelete.title}"`)
      setPendingDelete(null)
      reload()
    } catch {
      setDeleteError('Could not delete that post. Try again.')
      toast.error('Could not delete that post. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-3 text-2xl text-white sm:text-3xl">Blog posts</h1>
          <p className="mt-2 text-sm text-slate-400">Drafts are visible here only.</p>
        </div>
        <SystemButton as={Link} to="/admin/blog/new" variant="primary">
          New post
        </SystemButton>
      </div>

      {loadState === 'error' && (
        <p className="mt-8 text-sm text-status-red">Failed to load posts. Try refreshing.</p>
      )}

      {loadState === 'ready' && posts.length === 0 && (
        <StatusPanel className="mt-8 p-8 text-center">
          <p className="text-slate-400">No posts yet.</p>
          <SystemButton as={Link} to="/admin/blog/new" className="mt-4">
            Write the first one
          </SystemButton>
        </StatusPanel>
      )}

      {loadState === 'ready' && posts.length > 0 && (
        <div className="mt-6">
          <SearchInput value={query} onChange={setQuery} placeholder="Search posts..." />
        </div>
      )}

      {loadState === 'ready' && posts.length > 0 && filteredPosts.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">No posts match &ldquo;{query}&rdquo;.</p>
      )}

      {(loadState === 'loading' || filteredPosts.length > 0) && (
        <div className={tableWrapClass}>
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge">
              <tr>
                <th scope="col" className={thClass}>Title</th>
                <th scope="col" className={thClass}>Status</th>
                <th scope="col" className={`${thClass} hidden sm:table-cell`}>Date</th>
                <th scope="col" className={`${thClass} text-right`}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-edge/70">
              {loadState === 'loading' &&
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className={tdClass}><Skeleton className="h-4 w-48 max-w-full" /></td>
                    <td className={tdClass}><Skeleton className="h-4 w-14" /></td>
                    <td className={`${tdClass} hidden sm:table-cell`}><Skeleton className="h-4 w-20" /></td>
                    <td className={tdClass}></td>
                  </tr>
                ))}

              {filteredPosts.map((post) => {
                const todayStr = new Date().toISOString().slice(0, 10)
                const isScheduled = post.is_published && post.published_date && post.published_date > todayStr

                return (
                  <tr key={post.id} className={rowClass}>
                    <td className={`${tdClass} max-w-0 w-full sm:w-auto sm:max-w-sm`}>
                      <Link
                        to={`/admin/blog/${post.slug}/edit`}
                        className="block truncate font-medium text-white hover:text-neon-blue"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        <span className="sm:hidden">{post.published_date} &middot; </span>/{post.slug}
                      </p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {isScheduled ? (
                        <span className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-2 py-0.5 text-xs font-medium text-neon-blue">
                          Scheduled
                        </span>
                      ) : post.is_published ? (
                        <span className="rounded-full border border-status-green/30 bg-status-green/15 px-2 py-0.5 text-xs font-medium text-status-green">
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-panel-edge bg-abyss px-2 py-0.5 text-xs font-medium text-slate-300">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} hidden whitespace-nowrap text-xs text-slate-400 sm:table-cell`}>
                      {post.published_date}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/blog/${post.slug}/edit`} className={`${editButtonClass} hidden sm:inline-block`}>
                          Edit
                        </Link>
                        <RowActionsMenu
                          label={`Actions for ${post.title}`}
                          items={[
                            { label: 'Edit', to: `/admin/blog/${post.slug}/edit` },
                            { label: 'View on site', to: `/blogs/${post.slug}`, hidden: !post.is_published },
                            { label: 'Delete', danger: true, onSelect: () => setPendingDelete(post) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
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
        title="Delete this post?"
        message={
          deleteError ||
          `"${pendingDelete?.title}" will be permanently removed. This cannot be undone.`
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

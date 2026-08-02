import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { deleteBlogPost, getBlogPosts } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import usePaginatedList from '../../hooks/usePaginatedList'

export default function BlogList() {
  // Signed in as staff, this endpoint returns drafts as well as published posts.
  const { items: posts, loadState, hasMore, loadingMore, moreFailed, loadMore, reload } =
    usePaginatedList(getBlogPosts)

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

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteBlogPost(pendingDelete.slug)
      setPendingDelete(null)
      reload()
    } catch {
      setDeleteError('Could not delete that post. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow system-heading text-xs text-neon-indigo">// Content</p>
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

      <div className="mt-8 space-y-3">
        {loadState === 'loading' &&
          [1, 2, 3].map((i) => (
            <StatusPanel key={i} glow={false} className="p-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-2 h-3 w-24" />
            </StatusPanel>
          ))}

        {posts.map((post) => (
          <StatusPanel key={post.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-white">{post.title}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    post.is_published
                      ? 'bg-status-green/10 text-status-green'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  {post.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {post.published_date} &middot; /{post.slug}
              </p>
            </div>

            <div className="flex shrink-0 gap-2 text-xs">
              {post.is_published && (
                <Link
                  to={`/blogs/${post.slug}`}
                  className="rounded-md border border-panel-edge px-3 py-1.5 text-slate-300 transition-colors hover:border-neon-blue/60 hover:text-neon-blue"
                >
                  View
                </Link>
              )}
              <Link
                to={`/admin/blog/${post.slug}/edit`}
                className="rounded-md border border-neon-blue/50 px-3 py-1.5 text-neon-blue transition-colors hover:bg-neon-blue/10"
              >
                Edit
              </Link>
              <button
                onClick={() => setPendingDelete(post)}
                className="rounded-md border border-panel-edge px-3 py-1.5 text-slate-400 transition-colors hover:border-status-red/60 hover:text-status-red"
              >
                Delete
              </button>
            </div>
          </StatusPanel>
        ))}
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

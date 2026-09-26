import { Link } from 'react-router-dom'
import { getBlogPosts } from '../api/client'
import SystemButton from '../components/SystemButton'
import { CardSkeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'
import usePaginatedList from '../hooks/usePaginatedList'

export default function Blogs() {
  useDocumentMeta('Blog — Portfolio', "Write-ups on what I'm building, breaking, and learning.")

  const {
    items: posts,
    loadState,
    hasMore,
    loadingMore,
    moreFailed,
    loadMore,
  } = usePaginatedList(getBlogPosts)

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="fb-kicker mb-3">FROM THE BLOG</p>
      <h1 className="text-4xl text-white sm:text-5xl tracking-tight font-bold">Blog</h1>
      <p className="mt-4 max-w-lg fb-lead">Write-ups on what I&rsquo;m building, breaking, and learning.</p>

      {loadState === 'error' && (
        <p className="mt-8 text-status-red">Failed to load blog posts. Try refreshing the page.</p>
      )}
      {loadState === 'ready' && posts.length === 0 && (
        <p className="mt-8 text-slate-400">No blog posts published yet &mdash; check back soon.</p>
      )}

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {posts.map((post) => (
          <Link key={post.id} to={`/blogs/${post.slug}`}>
            <div className="system-panel system-panel-glow group h-full overflow-hidden p-6 transition-transform hover:-translate-y-1">
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="-mx-6 -mt-6 mb-4 h-40 w-[calc(100%+3rem)] object-cover border-b border-panel-edge"
                />
              )}
              <div className="mb-2 text-xs">
                <span className="fb-kicker">{post.published_date}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white group-hover:text-neon-blue transition-colors">{post.title}</h2>
              {post.excerpt && <p className="mt-2 text-sm text-[#A1A7CA]">{post.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} variant="outline" disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more posts'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more. Try again.</p>}
        </div>
      )}
    </div>
  )
}

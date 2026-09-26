import { Link } from 'react-router-dom'
import { getBlogPosts } from '../api/client'
import SystemButton from '../components/SystemButton'
import { CardSkeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'
import usePaginatedList from '../hooks/usePaginatedList'

const fallbackPosts = [
  {
    id: 'b1',
    slug: 'fix-flutterflow-google-maps-ios',
    title: 'Fix: Google Maps blank screen on iOS release builds in FlutterFlow',
    published_date: 'Sep 18, 2026',
    category: 'FlutterFlow Fixes',
    excerpt: 'Step-by-step resolution for the missing API key plist declaration that causes silent map failure on TestFlight and App Store releases.',
  },
  {
    id: 'b2',
    slug: 'custom-dart-action-with-return-value',
    title: 'How to create custom Dart actions that return complex data in FlutterFlow',
    published_date: 'Sep 12, 2026',
    category: 'Custom Code',
    excerpt: 'Write type-safe Dart functions returning custom data types, JSON maps, and lists to use directly within your FlutterFlow UI builder.',
  },
  {
    id: 'b3',
    slug: 'supabase-auth-rls-flutterflow',
    title: 'Connecting Supabase Row Level Security with FlutterFlow authenticated users',
    published_date: 'Aug 29, 2026',
    category: 'Integrations',
    excerpt: 'How to pass JWT tokens correctly from FlutterFlow to Supabase so that your PostgreSQL RLS policies enforce real user tenancy.',
  },
  {
    id: 'b4',
    slug: 'nested-scrollview-renderflex-overflow',
    title: 'Resolving RenderFlex overflow errors in complex nested lists',
    published_date: 'Aug 14, 2026',
    category: 'FlutterFlow Fixes',
    excerpt: 'Diagnosing unbounded height exceptions in ListView widgets inside Column components and the clean fix without breaking scrolling.',
  },
]

export default function Blogs() {
  useDocumentMeta('Blog — Jahanzaib Waris', 'Practical FlutterFlow fixes, custom Dart code, and tutorials.')

  const {
    items: posts,
    loadState,
    hasMore,
    loadingMore,
    moreFailed,
    loadMore,
  } = usePaginatedList(getBlogPosts)

  const displayPosts = posts.length > 0 ? posts : (loadState !== 'loading' ? fallbackPosts : [])

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="fb-kicker mb-3">FROM THE BLOG</p>
        <h1 className="text-4xl text-white sm:text-5xl tracking-tight font-extrabold">Blog &amp; Fixes</h1>
        <p className="mt-4 max-w-lg fb-lead">Practical FlutterFlow fixes, custom Dart functions, and architectural patterns you can paste straight into your projects.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && posts.length === 0 && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {displayPosts.map((post) => (
          <Link key={post.id} to={`/blogs/${post.slug}`}>
            <div className="fb-card group cursor-pointer transition-transform hover:-translate-y-1">
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="-mx-7 -mt-7 mb-2 h-44 w-[calc(100%+3.5rem)] object-cover rounded-t-[16px] border-b border-panel-edge"
                />
              )}
              <div className="flex items-center gap-3 text-xs mb-1">
                {post.category && (
                  <span className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue">
                    {post.category}
                  </span>
                )}
                <span className="font-mono-ui text-[#A1A7CA] text-xs">{post.published_date}</span>
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">
                {post.title}
              </h2>
              {post.excerpt && <p className="text-sm text-[#A1A7CA] mt-2 line-clamp-3">{post.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} variant="outline" disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more posts'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more. Try again.</p>}
        </div>
      )}
    </div>
  )
}

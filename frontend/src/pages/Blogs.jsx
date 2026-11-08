import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBlogPosts } from '../api/client'
import SystemButton from '../components/SystemButton'
import { CardSkeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'
import usePaginatedList from '../hooks/usePaginatedList'

const fallbackPosts = [
  {
    id: 'b-sched-1',
    slug: 'flutterflow-streaming-ai-sse-supabase',
    title: 'Streaming Real-Time AI Responses in FlutterFlow with Server-Sent Events (SSE) & Supabase Edge Functions',
    published_date: 'Nov 01, 2026',
    published_date_raw: '2026-11-01',
    category: 'AI & Integrations',
    excerpt: 'Eliminate 15-second mobile UI freezes by implementing token-by-token streaming AI responses in FlutterFlow using Supabase Edge Functions and custom Dart stream controllers.',
  },
  {
    id: 'b-sched-2',
    slug: 'flutterflow-revenuecat-subscriptions-webhooks',
    title: 'Fixing RevenueCat Paywall Entitlements & Server-Side Webhook Sync in FlutterFlow',
    published_date: 'Nov 02, 2026',
    published_date_raw: '2026-11-02',
    category: 'Monetization',
    excerpt: 'Resolve missing customer entitlements, sandbox vs production receipt validation discrepancies, and real-time Supabase user tier synchronization.',
  },
  {
    id: 'b-sched-3',
    slug: 'flutterflow-offline-first-supabase-cache',
    title: 'Architecting Offline-First FlutterFlow Apps with Supabase & SQLite Local Caching',
    published_date: 'Nov 04, 2026',
    published_date_raw: '2026-11-04',
    category: 'Architecture',
    excerpt: 'Build resilient mobile apps that work flawlessly in airplane mode, featuring optimistic UI updates, local SQLite persistence, and two-way sync reconciliation.',
  },
  {
    id: 'b-sched-4',
    slug: 'flutterflow-deep-links-universal-links-fix',
    title: 'Fixing Broken Deep Links & Universal Links in FlutterFlow for iOS & Android',
    published_date: 'Nov 06, 2026',
    published_date_raw: '2026-11-06',
    category: 'FlutterFlow Fixes',
    excerpt: 'Complete troubleshooting checklist for Apple Associated Domains, Android assetlinks.json verification, route parameter parsing, and magic link authentication.',
  },
  {
    id: 'b-sched-5',
    slug: 'flutterflow-push-notifications-supabase-webhooks-fcm',
    title: 'Triggering Push Notifications with Supabase Database Webhooks and Firebase Cloud Messaging (FCM)',
    published_date: 'Nov 08, 2026',
    published_date_raw: '2026-11-08',
    category: 'Integrations',
    excerpt: 'Eliminate client polling and trigger instant, targeted push notifications via PostgreSQL database webhooks and Firebase Cloud Messaging HTTP v1 API.',
  },
  {
    id: 'b-sched-6',
    slug: 'flutterflow-listview-performance-optimization',
    title: 'Eliminating Frame Drops & Stutter in Heavy FlutterFlow ListViews (60 FPS Guide)',
    published_date: 'Nov 10, 2026',
    published_date_raw: '2026-11-10',
    category: 'Performance',
    excerpt: 'Fix jank, laggy scrolling, and memory leaks in media-heavy FlutterFlow lists by optimizing widget rebuilds, image caching, and RepaintBoundary isolation.',
  },
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
  const blogsSchema = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'FlutterFlow Guides, Fixes & Dart Code — Jerry Dev Studio',
        url: 'https://jerry-dev-studio.web.app/blogs',
        description: 'Practical fixes for real FlutterFlow problems, reusable Dart code snippets, and production architecture tutorials.',
        publisher: {
          '@type': 'Organization',
          name: 'Jerry Dev Studio',
          url: 'https://jerry-dev-studio.web.app/',
          logo: 'https://jerry-dev-studio.web.app/logo.png',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://jerry-dev-studio.web.app/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog & Fixes',
            item: 'https://jerry-dev-studio.web.app/blogs',
          },
        ],
      },
    ],
    [],
  )

  useDocumentMeta({
    title: 'FlutterFlow Guides, Fixes & Dart Code — Jerry Dev Studio',
    description: 'Practical fixes for real FlutterFlow problems, reusable Dart code snippets, and production architecture tutorials.',
    canonicalPath: '/blogs',
    keywords: 'FlutterFlow fixes, Dart code snippets, FlutterFlow tutorials, Supabase FlutterFlow, mobile app bugs, iOS FlutterFlow blank screen',
    schema: blogsSchema,
  })

  const {
    items: posts,
    loadState,
    hasMore,
    loadingMore,
    moreFailed,
    loadMore,
  } = usePaginatedList(getBlogPosts)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const validFallbackPosts = useMemo(
    () => fallbackPosts.filter((p) => !p.published_date_raw || p.published_date_raw <= todayStr),
    [todayStr],
  )
  const displayPosts = posts.length > 0 ? posts : (loadState !== 'loading' ? validFallbackPosts : [])

  const categories = useMemo(() => {
    const cats = new Set()
    displayPosts.forEach((p) => {
      if (p.category) cats.add(p.category)
    })
    return ['All', ...Array.from(cats)]
  }, [displayPosts])

  const filteredPosts = useMemo(() => {
    return displayPosts.filter((post) => {
      const matchesCat =
        selectedCategory === 'All' ||
        post.category?.toLowerCase() === selectedCategory.toLowerCase()
      if (!matchesCat) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        post.title?.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q) ||
        post.category?.toLowerCase().includes(q)
      )
    })
  }, [displayPosts, selectedCategory, searchQuery])

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'All'
  const featuredPost = !isFiltered && filteredPosts.length > 0 ? filteredPosts[0] : null
  const gridPosts = !isFiltered && filteredPosts.length > 0 ? filteredPosts.slice(1) : filteredPosts

  return (
    <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-8 sm:py-16">
      <div className="max-w-3xl">
        <p className="fb-kicker mb-3">// KNOWLEDGE BASE &amp; SOLUTIONS</p>
        <h1 className="text-3xl text-white sm:text-5xl lg:text-6xl tracking-tight font-extrabold break-words">
          Blog &amp; Fixes
        </h1>
        <p className="mt-3 sm:mt-4 max-w-2xl fb-lead text-base sm:text-lg text-[#A1A7CA]">
          Practical FlutterFlow fixes, custom Dart functions, and production architecture patterns you can integrate straight into your mobile and Supabase apps.
        </p>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-panel-edge/80 py-5">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-neon-blue text-abyss font-bold shadow-md shadow-neon-blue/20 scale-[1.02]'
                  : 'bg-panel-edge/40 text-[#A1A7CA] hover:bg-panel-edge hover:text-white border border-panel-edge'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, fixes &amp; Dart code..."
            className="w-full rounded-xl border border-panel-edge bg-abyss/60 px-4 py-2.5 text-xs text-white placeholder-[#A1A7CA]/60 outline-none transition-colors focus:border-neon-blue"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A7CA] hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              &#x2715;
            </button>
          )}
        </div>
      </div>

      {/* Active filter counter pill */}
      {isFiltered && (
        <div className="mt-6 flex items-center justify-between text-xs text-[#A1A7CA]">
          <span>
            Showing <strong className="text-white">{filteredPosts.length}</strong>{' '}
            {filteredPosts.length === 1 ? 'guide' : 'guides'}
            {selectedCategory !== 'All' ? ` in "${selectedCategory}"` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
            }}
            className="text-neon-blue hover:underline font-semibold cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loadState === 'loading' && posts.length === 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Zero State */}
      {filteredPosts.length === 0 && loadState !== 'loading' && (
        <div className="mt-10 rounded-2xl border border-dashed border-panel-edge/80 bg-abyss/40 py-16 px-6 text-center">
          <p className="text-base font-bold text-white mb-2">No matching guides found</p>
          <p className="text-xs text-[#A1A7CA] mb-4">
            Try adjusting your search terms or selecting another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
            }}
            className="text-xs font-semibold text-neon-blue hover:underline cursor-pointer"
          >
            Reset filters &rarr;
          </button>
        </div>
      )}

      {/* Featured Spotlight Hero Card */}
      {featuredPost && (
        <div className="mt-8 mb-12">
          <Link to={`/blogs/${featuredPost.slug}`} className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-neon-blue/30 bg-gradient-to-br from-panel/90 via-abyss/80 to-[#0A0C16] p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:border-neon-blue/60 hover:shadow-2xl hover:shadow-neon-blue/10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Hero Content */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-blue/15 border border-neon-blue/40 px-3 py-1 text-[11px] font-bold text-neon-blue">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-blue animate-pulse" />
                      LATEST FEATURED GUIDE
                    </span>
                    {featuredPost.category && (
                      <span className="fb-chip bg-neon-indigo/15 border-neon-indigo/30 text-neon-indigo font-semibold text-[11px]">
                        {featuredPost.category}
                      </span>
                    )}
                    <span className="font-mono-ui text-[#A1A7CA] text-xs">
                      {featuredPost.published_date}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-neon-blue transition-colors">
                    {featuredPost.title}
                  </h2>

                  {featuredPost.excerpt && (
                    <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-4 text-sm font-semibold text-neon-blue">
                    <span className="inline-flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform duration-200">
                      Read Complete Architecture &amp; Code &rarr;
                    </span>
                    <span className="text-[#A1A7CA] font-normal">&middot; Jerry Dev Studio</span>
                  </div>
                </div>

                {/* Hero Cover Image or Code Visual */}
                <div className="lg:col-span-5">
                  {featuredPost.cover_image ? (
                    <div className="overflow-hidden rounded-xl border border-panel-edge bg-void/60 shadow-xl">
                      <img
                        src={featuredPost.cover_image}
                        alt={featuredPost.title}
                        loading="eager"
                        className="h-56 sm:h-64 lg:h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-panel-edge/80 bg-void/80 p-5 font-mono text-xs text-slate-300 space-y-2">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-panel-edge/60 text-[#A1A7CA]">
                        <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                        <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                        <span className="ml-2 text-[10px]">architecture_spec.dart</span>
                      </div>
                      <p className="text-neon-blue">// Production Architecture Pattern</p>
                      <p className="text-slate-300 line-clamp-4 leading-relaxed">{featuredPost.excerpt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 3-Column Responsive Grid for Articles */}
      {gridPosts.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <Link key={post.id} to={`/blogs/${post.slug}`} className="group flex flex-col h-full">
              <div className="flex flex-col h-full rounded-2xl border border-panel-edge bg-abyss/50 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-neon-blue/40 hover:bg-abyss/80 hover:shadow-xl hover:shadow-neon-blue/5">
                {post.cover_image && (
                  <div className="-mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl border-b border-panel-edge">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-xs mb-3">
                  {post.category && (
                    <span className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {post.category}
                    </span>
                  )}
                  <span className="font-mono-ui text-[#C2C7E4] text-xs">{post.published_date}</span>
                </div>

                <h2 className="text-lg sm:text-[19px] font-bold text-white group-hover:text-neon-blue transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-sm sm:text-[15px] text-[#C2C7E4] mt-3 line-clamp-3 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-5 pt-4 border-t border-panel-edge/60 flex items-center justify-between text-sm font-semibold text-neon-blue">
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read guide &rarr;
                  </span>
                  <span className="text-xs text-[#A1A7CA] font-mono">Verified Solution</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} variant="outline" disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more posts'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more. Try again.</p>}
        </div>
      )}
    </div>
  )
}

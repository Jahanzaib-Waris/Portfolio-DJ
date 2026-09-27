import { useState, useMemo } from 'react'
import { Link, useSearchParams, useOutletContext } from 'react-router-dom'
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

const topics = [
  {
    id: 'custom-code',
    label: 'Custom Code',
    matchTerms: ['custom code', 'custom-code', 'dart', 'code'],
    title: 'Custom Code',
    description: 'Custom widgets, actions and functions in Dart.',
  },
  {
    id: 'flutter',
    label: 'Flutter',
    matchTerms: ['flutter'],
    title: 'Flutter',
    description: 'Native Flutter architecture, state management, and custom responsive layouts.',
  },
  {
    id: 'flutterflow-fixes',
    label: 'FlutterFlow Fixes',
    matchTerms: ['flutterflow fixes', 'flutterflow', 'fixes', 'fix'],
    title: 'FlutterFlow Fixes',
    description: 'Real FlutterFlow problems and how to solve them.',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    matchTerms: ['integrations', 'integration', 'supabase', 'firebase', 'api'],
    title: 'Integrations',
    description: 'Third-party APIs, Supabase, Firebase, and payment gateway connections.',
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    matchTerms: ['tutorials', 'tutorial', 'guides', 'guide'],
    title: 'Tutorials',
    description: 'Step-by-step guides from architecture to production App Store deployment.',
  },
]

export default function Solutions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTopic = searchParams.get('topic') || 'flutterflow-fixes'
  const [activeTopicId, setActiveTopicId] = useState(
    topics.some((t) => t.id === initialTopic) ? initialTopic : 'flutterflow-fixes',
  )

  const outlet = useOutletContext() || {}
  const onRequestQuote = outlet.onRequestQuote

  const currentTopic = useMemo(
    () => topics.find((t) => t.id === activeTopicId) || topics[2],
    [activeTopicId],
  )

  useDocumentMeta(
    `${currentTopic.title} — Solutions | Jahanzaib Waris`,
    currentTopic.description,
  )

  const {
    items: posts,
    loadState,
    hasMore,
    loadingMore,
    moreFailed,
    loadMore,
  } = usePaginatedList(getBlogPosts)

  const allPosts = useMemo(
    () => (posts.length > 0 ? posts : (loadState !== 'loading' ? fallbackPosts : [])),
    [posts, loadState],
  )

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const cat = (post.category || '').toLowerCase()
      return currentTopic.matchTerms.some((term) => cat.includes(term.toLowerCase()))
    })
  }, [allPosts, currentTopic])

  const handleSelectTopic = (id) => {
    setActiveTopicId(id)
    setSearchParams({ topic: id })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-20">
      {/* 1. Header with Kicker, Dynamic Title, Description, and Topic Chips */}
      <div className="max-w-3xl">
        <p className="fb-kicker mb-3 tracking-widest text-[#38BDF8]">TOPIC</p>
        <h1 className="text-4xl text-white sm:text-5xl tracking-tight font-extrabold">
          {currentTopic.title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#A1A7CA] max-w-xl leading-relaxed">
          {currentTopic.description}
        </p>

        {/* Filter Chips matching reference */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {topics.map((t) => {
            const isActive = t.id === activeTopicId
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTopic(t.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[rgb(124_108_255_/_0.18)] border border-[#6D5AF6] text-white shadow-[0_0_14px_rgba(109,90,246,0.35)]'
                    : 'bg-[#0D1024] border border-panel-edge text-[#A1A7CA] hover:border-[#6D5AF6] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Solutions Cards or Empty State */}
      <div className="mt-12">
        {loadState === 'loading' && posts.length === 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {loadState !== 'loading' && filteredPosts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-panel-edge/80 bg-abyss/40 py-16 px-6 text-center">
            <p className="text-sm text-[#A1A7CA]">
              Nothing in this topic yet. Check back soon.
            </p>
          </div>
        )}

        {filteredPosts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredPosts.map((post) => (
              <Link key={post.id} to={`/blogs/${post.slug}`}>
                <div className="fb-card group cursor-pointer transition-transform hover:-translate-y-1">
                  {post.cover_image && (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="-mx-7 -mt-7 mb-2 h-44 w-[calc(100%+3.5rem)] object-cover rounded-t-[16px] border-b border-panel-edge"
                    />
                  )}
                  <div className="flex items-center gap-3 text-xs mb-1">
                    {post.category && (
                      <span className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue">
                        {post.category}
                      </span>
                    )}
                    <span className="font-mono-ui text-[#A1A7CA] text-xs">
                      {post.published_date}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-[#A1A7CA] mt-2 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && filteredPosts.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <SystemButton onClick={loadMore} variant="outline" disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load more solutions'}
            </SystemButton>
            {moreFailed && (
              <p className="text-sm text-status-red">
                Couldn&rsquo;t load more. Try again.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Closing CTA Band matching reference image */}
      <section className="fb-section fb-section--tight mt-16">
        <div className="fb-cta">
          <p className="fb-kicker mb-3 text-center">STUCK ON SOMETHING?</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-center">
            Have a FlutterFlow app that needs work?
          </h2>
          <p className="mt-4 text-center fb-lead mx-auto max-w-xl">
            A new build, a bug you cannot crack, or an integration your app is missing. Tell me about it and I will tell you how I would tackle it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <SystemButton
              onClick={onRequestQuote}
              as={onRequestQuote ? 'button' : Link}
              to={onRequestQuote ? undefined : '/#start'}
              size="lg"
              variant="primary"
            >
              Start a project
            </SystemButton>
            <SystemButton as={Link} to="/#services" size="lg" variant="outline">
              See services
            </SystemButton>
          </div>
        </div>
      </section>
    </div>
  )
}

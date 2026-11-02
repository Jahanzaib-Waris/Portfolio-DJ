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

  const solutionsSchema = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${currentTopic.title} — Jerry Dev Studio`,
        serviceType: 'Mobile Application Development',
        provider: {
          '@type': 'Organization',
          name: 'Jerry Dev Studio',
          url: 'https://jerry-dev-studio.web.app/',
        },
        description: currentTopic.description,
        areaServed: 'Worldwide',
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
            name: 'Solutions',
            item: 'https://jerry-dev-studio.web.app/solutions',
          },
        ],
      },
    ],
    [currentTopic],
  )

  useDocumentMeta({
    title: `${currentTopic.title} — Solutions | Jerry Dev Studio`,
    description: currentTopic.description,
    canonicalPath: '/solutions',
    keywords: 'FlutterFlow solutions, mobile app engineering, custom Dart actions, Supabase integration, mobile app bug fixes',
    schema: solutionsSchema,
  })

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

      {/* 3. Studio Engagement Models / Packages */}
      <section className="mt-20 border-t border-panel-edge/80 pt-16">
        <div className="max-w-2xl">
          <p className="fb-kicker mb-3">HOW WE ENGAGE</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Flexible Engineering Packages
          </h2>
          <p className="mt-4 fb-lead">
            Transparent engagement models tailored for early-stage founders, scaling products, and established dev teams.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Package 1 */}
          <div className="fb-card flex flex-col justify-between border-panel-edge bg-abyss/40 p-6 sm:p-7 relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue text-xs">
                  Fixed Scope
                </span>
                <span className="font-mono-ui text-xs text-[#A1A7CA]">2–4 Days</span>
              </div>
              <h3 className="text-xl font-bold text-white">Codebase Audit &amp; Bug Triage</h3>
              <p className="mt-3 text-sm text-[#A1A7CA] leading-relaxed">
                Stuck on a tricky crash, grey screen, or custom action failure? We perform a comprehensive architectural audit, diagnose root causes, and ship tested Dart fixes.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-[#ECEEFB] font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-status-green">&#10003;</span> RenderFlex &amp; layout overflow resolution
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-status-green">&#10003;</span> Custom Dart action &amp; widget debugging
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-status-green">&#10003;</span> App Store review rejection diagnostics
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-panel-edge/60">
              <SystemButton onClick={onRequestQuote} variant="outline" className="w-full justify-center">
                Request an audit &rarr;
              </SystemButton>
            </div>
          </div>

          {/* Package 2 (Featured) */}
          <div className="fb-card flex flex-col justify-between border-neon-blue/40 bg-neon-blue/[0.03] p-6 sm:p-7 relative shadow-lg shadow-neon-blue/5">
            <div className="absolute top-0 right-0 bg-neon-blue text-abyss text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-lg font-mono-ui">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="fb-chip bg-neon-blue/20 border-neon-blue/40 text-neon-blue text-xs font-semibold">
                  End-to-End Build
                </span>
                <span className="font-mono-ui text-xs text-[#A1A7CA]">2–4 Weeks</span>
              </div>
              <h3 className="text-xl font-bold text-white">MVP Launch Sprint</h3>
              <p className="mt-3 text-sm text-[#A1A7CA] leading-relaxed">
                Turn your Figma designs or product roadmap into a polished, responsive iOS &amp; Android app ready for user acquisition and investor showcases.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-[#ECEEFB] font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-neon-blue">&#10003;</span> Pixel-perfect FlutterFlow UI implementation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-blue">&#10003;</span> Scalable Supabase / Firebase schema &amp; RLS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-blue">&#10003;</span> Stripe / RevenueCat subscriptions &amp; Auth
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-blue">&#10003;</span> Apple &amp; Google Play Store release prep
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-panel-edge/60">
              <SystemButton onClick={onRequestQuote} variant="primary" className="w-full justify-center">
                Start an MVP sprint &rarr;
              </SystemButton>
            </div>
          </div>

          {/* Package 3 */}
          <div className="fb-card flex flex-col justify-between border-panel-edge bg-abyss/40 p-6 sm:p-7 relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue text-xs">
                  Ongoing Support
                </span>
                <span className="font-mono-ui text-xs text-[#A1A7CA]">Monthly Retainer</span>
              </div>
              <h3 className="text-xl font-bold text-white">Dedicated Engineering Retainer</h3>
              <p className="mt-3 text-sm text-[#A1A7CA] leading-relaxed">
                Reserve dedicated engineering capacity for your product team. Continuous feature rollouts, complex API integrations, and SLA-backed priority bug fixes.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-[#ECEEFB] font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-status-green">&#10003;</span> Reserved weekly engineering hours
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-status-green">&#10003;</span> Direct Slack / Discord team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-status-green">&#10003;</span> Continuous database &amp; API maintenance
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-panel-edge/60">
              <SystemButton onClick={onRequestQuote} variant="outline" className="w-full justify-center">
                Discuss a retainer &rarr;
              </SystemButton>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Closing CTA Band */}
      <section className="fb-section fb-section--tight mt-16">
        <div className="fb-cta">
          <p className="fb-kicker mb-3 text-center">STUCK ON SOMETHING?</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-center">
            Have a FlutterFlow app that needs work?
          </h2>
          <p className="mt-4 text-center fb-lead mx-auto max-w-xl">
            A new build, a blocker you cannot crack, or an integration your app is missing. Share your requirements and our studio will provide a clear engineering breakdown.
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

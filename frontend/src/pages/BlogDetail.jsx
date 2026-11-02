import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useOutletContext } from 'react-router-dom'
import { getBlogPost, getBlogPosts } from '../api/client'
import RichTextContent from '../components/RichTextContent'
import StatusPanel from '../components/StatusPanel'
import { Skeleton } from '../components/Skeleton'
import SystemButton from '../components/SystemButton'
import useDocumentMeta from '../hooks/useDocumentMeta'
import fallbackPostDetails from '../data/fallbackBlogDetails.json'

/** Rough word-count reading-time estimate from an HTML string */
function readingTime(html = '') {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M10 12L6 8l4-4" />
  </svg>
)

export default function BlogDetail() {
  const { slug } = useParams()
  const { onRequestQuote } = useOutletContext() || {}
  const [post, setPost] = useState(null)
  const [allPosts, setAllPosts] = useState([])
  const [loadState, setLoadState] = useState('loading')

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const rawFallback = fallbackPostDetails[slug]
  const isFallbackScheduled = rawFallback?.published_date_raw && rawFallback.published_date_raw > todayStr
  const effectivePost = post || (!isFallbackScheduled ? rawFallback : null)
  const mins = effectivePost ? readingTime(effectivePost.content) : null

  useEffect(() => {
    getBlogPosts()
      .then((res) => {
        const list = res.results || res.items || res
        if (Array.isArray(list)) setAllPosts(list)
      })
      .catch(() => {})
  }, [])

  const relatedPosts = useMemo(() => {
    const fallbackList = Object.entries(fallbackPostDetails).map(([s, p]) => ({ slug: s, ...p }))
    const pool = (allPosts.length > 0 ? allPosts : fallbackList)
      .filter((p) => p.slug !== slug && (!p.published_date_raw || p.published_date_raw <= todayStr))
    const sameCat = pool.filter((p) => p.category === effectivePost?.category)
    const otherCat = pool.filter((p) => p.category !== effectivePost?.category)
    return [...sameCat, ...otherCat].slice(0, 2)
  }, [allPosts, slug, effectivePost?.category, todayStr])

  const blogDetailSchema = useMemo(() => {
    if (!effectivePost) return null
    const postUrl = `https://jerry-dev-studio.web.app/blogs/${slug}`
    const imageUrl = effectivePost.cover_image
      ? (effectivePost.cover_image.startsWith('http')
          ? effectivePost.cover_image
          : `https://jerry-dev-studio.web.app${effectivePost.cover_image.startsWith('/') ? '' : '/'}${effectivePost.cover_image}`)
      : 'https://jerry-dev-studio.web.app/logo.png'

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: effectivePost.title,
        description: effectivePost.excerpt,
        image: imageUrl,
        datePublished: effectivePost.published_date_raw || effectivePost.published_date || '2026-11-01',
        dateModified: '2026-11-01',
        author: {
          '@type': 'Organization',
          name: 'Jerry Dev Studio',
          url: 'https://jerry-dev-studio.web.app/',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Jerry Dev Studio',
          url: 'https://jerry-dev-studio.web.app/',
          logo: {
            '@type': 'ImageObject',
            url: 'https://jerry-dev-studio.web.app/logo.png',
          },
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
          {
            '@type': 'ListItem',
            position: 3,
            name: effectivePost.title,
            item: postUrl,
          },
        ],
      },
    ]
  }, [effectivePost, slug])

  useDocumentMeta({
    title: effectivePost ? `${effectivePost.title} — Jerry Dev Studio` : 'Article — Jerry Dev Studio',
    description: effectivePost?.excerpt,
    canonicalPath: `/blogs/${slug}`,
    image: effectivePost?.cover_image,
    type: 'article',
    keywords: `${effectivePost?.category || 'FlutterFlow'}, FlutterFlow fix, Dart, mobile engineering, Jerry Dev Studio`,
    schema: blogDetailSchema,
  })

  useEffect(() => {
    let canceled = false
    setLoadState('loading')
    getBlogPost(slug)
      .then((data) => {
        if (canceled) return
        if (data) {
          setPost(data)
          setLoadState('ready')
        } else if (rawFallback) {
          if (isFallbackScheduled) {
            setPost(null)
            setLoadState('error')
          } else {
            setLoadState('ready')
          }
        } else {
          setLoadState('error')
        }
      })
      .catch(() => {
        if (canceled) return
        if (rawFallback && !isFallbackScheduled) {
          setLoadState('ready')
        } else {
          setLoadState('error')
        }
      })
    return () => {
      canceled = true
    }
  }, [slug, rawFallback, isFallbackScheduled])

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Breadcrumb back link */}
      <Link
        to="/blogs"
        className="mb-10 inline-flex items-center gap-1.5 text-sm font-semibold text-[#A1A7CA] hover:text-white transition-colors"
      >
        <ChevronLeft />
        Blog &amp; Fixes
      </Link>

      {loadState === 'loading' && !effectivePost && (
        <StatusPanel glow={false} className="space-y-4 p-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-8 h-64 w-full" />
        </StatusPanel>
      )}

      {loadState === 'error' && !effectivePost && (
        <StatusPanel className="p-8 text-center">
          <p className="text-status-red text-base font-semibold">Article not found</p>
          <p className="mt-2 text-xs text-slate-400">
            This article may still be scheduled for publication or the link has moved.
          </p>
          <div className="mt-6">
            <SystemButton as={Link} to="/blogs">
              Explore All Articles
            </SystemButton>
          </div>
        </StatusPanel>
      )}

      {effectivePost && (
        <article className="overflow-hidden">
          {effectivePost.cover_image && (
            <img
              src={effectivePost.cover_image}
              alt={effectivePost.title}
              className="mb-8 h-auto w-full rounded-[24px] border border-panel-edge object-cover shadow-2xl"
            />
          )}

          {/* Metadata pill row */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {effectivePost.category && (
              <span className="fb-chip border-neon-blue/30 bg-neon-blue/10 text-neon-blue font-medium">
                {effectivePost.category}
              </span>
            )}
            <span className="font-mono-ui text-[#A1A7CA]">
              {effectivePost.published_date}
            </span>
            {mins && (
              <>
                <span className="text-slate-600">&middot;</span>
                <span className="text-slate-400">{mins} min read</span>
              </>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
            {effectivePost.title}
          </h1>

          {effectivePost.excerpt && (
            <p className="mt-4 text-lg text-slate-300 leading-relaxed">
              {effectivePost.excerpt}
            </p>
          )}

          <div className="mt-10 border-t border-panel-edge pt-10">
            <RichTextContent className="markdown-body">
              {effectivePost.content}
            </RichTextContent>
          </div>

          {/* Consultation / Work with studio CTA banner */}
          <div className="mt-16 rounded-2xl border border-neon-blue/30 bg-gradient-to-r from-neon-blue/10 via-[#0A0C16] to-neon-indigo/10 p-6 sm:p-8 backdrop-blur-sm">
            <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <span className="eyebrow system-heading text-xs text-neon-blue">
                  // NEED ARCHITECTURAL ASSISTANCE?
                </span>
                <h3 className="mt-2 text-xl font-bold text-white">
                  Facing a complex FlutterFlow or mobile engineering blocker?
                </h3>
                <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
                  Jerry Dev Studio audits codebases, builds custom Dart actions, fixes App Store rejections, and builds production apps with full Supabase backends.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 shrink-0">
                <SystemButton variant="primary" onClick={onRequestQuote}>
                  Request consultation
                </SystemButton>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 border-t border-panel-edge pt-12">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Related Articles &amp; Solutions
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.slug}
                    to={`/blogs/${rel.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-panel-edge bg-void/50 p-5 transition-all hover:border-neon-blue/40 hover:bg-abyss/60"
                  >
                    <div>
                      {rel.category && (
                        <span className="text-[11px] font-semibold text-neon-blue uppercase tracking-wider">
                          {rel.category}
                        </span>
                      )}
                      <h4 className="mt-2 text-base font-bold text-white group-hover:text-neon-blue transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      {rel.excerpt && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {rel.excerpt}
                        </p>
                      )}
                    </div>
                    <span className="mt-4 inline-flex items-center text-xs font-semibold text-neon-blue group-hover:translate-x-1 transition-transform">
                      Read article &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  )
}

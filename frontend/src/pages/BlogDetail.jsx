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

const ChevronRight = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M6 12l4-4-4-4" />
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-emerald-400">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

export default function BlogDetail() {
  const { slug } = useParams()
  const { onRequestQuote } = useOutletContext() || {}
  const [post, setPost] = useState(null)
  const [allPosts, setAllPosts] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [readingProgress, setReadingProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState('')
  const [copied, setCopied] = useState(false)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const rawFallback = fallbackPostDetails[slug]
  const isFallbackScheduled = rawFallback?.published_date_raw && rawFallback.published_date_raw > todayStr
  const effectivePost = post || (!isFallbackScheduled ? rawFallback : null)
  const mins = effectivePost ? readingTime(effectivePost.content) : null

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch all posts for related/next/previous navigation
  useEffect(() => {
    getBlogPosts()
      .then((res) => {
        const list = res.results || res.items || res
        if (Array.isArray(list)) setAllPosts(list)
      })
      .catch(() => {})
  }, [])

  const pool = useMemo(() => {
    const fallbackList = Object.entries(fallbackPostDetails).map(([s, p]) => ({ slug: s, ...p }))
    const combined = allPosts.length > 0 ? allPosts : fallbackList
    return combined.filter((p) => !p.published_date_raw || p.published_date_raw <= todayStr)
  }, [allPosts, todayStr])

  const currentIndex = useMemo(() => pool.findIndex((p) => p.slug === slug), [pool, slug])
  const prevPost = currentIndex > 0 ? pool[currentIndex - 1] : null
  const nextPost = currentIndex >= 0 && currentIndex < pool.length - 1 ? pool[currentIndex + 1] : null

  const relatedPosts = useMemo(() => {
    const otherPosts = pool.filter((p) => p.slug !== slug)
    const sameCat = otherPosts.filter((p) => p.category === effectivePost?.category)
    const otherCat = otherPosts.filter((p) => p.category !== effectivePost?.category)
    return [...sameCat, ...otherCat].slice(0, 3)
  }, [pool, slug, effectivePost?.category])

  // Extract Table of Contents from HTML
  const toc = useMemo(() => {
    if (!effectivePost?.content) return []
    const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi
    const items = []
    let match
    while ((match = regex.exec(effectivePost.content)) !== null) {
      const level = parseInt(match[1], 10)
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      if (title && id) {
        items.push({ level, title, id })
      }
    }
    return items
  }, [effectivePost?.content])

  // ScrollSpy for Active Heading
  useEffect(() => {
    if (toc.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -65% 0px',
        threshold: 0,
      }
    )

    toc.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [toc])

  const scrollToHeading = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `#${id}`)
      setActiveHeading(id)
      setMobileTocOpen(false)
    }
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://jerry-dev-studio.web.app/blogs/${slug}`
  const shareText = effectivePost ? effectivePost.title : 'Jerry Dev Studio Guide'

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
    <>
      {/* Fixed Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-neon-blue via-neon-indigo to-neon-deep z-50 transition-all duration-75 pointer-events-none"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Modern Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-[#A1A7CA]">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-panel-edge">/</span>
          <Link to="/blogs" className="hover:text-white transition-colors">
            Blog &amp; Fixes
          </Link>
          {effectivePost?.category && (
            <>
              <span className="text-panel-edge">/</span>
              <span className="text-neon-blue font-semibold">{effectivePost.category}</span>
            </>
          )}
        </nav>

        {loadState === 'loading' && !effectivePost && (
          <StatusPanel glow={false} className="space-y-4 p-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-8 h-64 w-full" />
          </StatusPanel>
        )}

        {loadState === 'error' && !effectivePost && (
          <StatusPanel className="p-8 text-center max-w-2xl mx-auto my-12">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            {/* Primary Article Content Stream */}
            <main className="lg:col-span-8 min-w-0">
              <article>
                {/* Header Meta Chips */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {effectivePost.category && (
                    <span className="fb-chip border-neon-blue/30 bg-neon-blue/10 text-neon-blue font-bold px-3 py-1 rounded-full text-xs">
                      {effectivePost.category}
                    </span>
                  )}
                  <span className="font-mono-ui text-[#C2C7E4] text-xs">
                    {effectivePost.published_date}
                  </span>
                  {mins && (
                    <>
                      <span className="text-slate-500">&middot;</span>
                      <span className="text-[#C2C7E4] font-medium text-xs">{mins} min read</span>
                    </>
                  )}
                  <span className="text-slate-500">&middot;</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Solution
                  </span>
                </div>

                {/* Display Title */}
                <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.85rem] leading-[1.18] break-words">
                  {effectivePost.title}
                </h1>

                {/* Lead Excerpt */}
                {effectivePost.excerpt && (
                  <p className="mt-4 sm:mt-5 text-base sm:text-xl text-slate-200 leading-relaxed font-normal">
                    {effectivePost.excerpt}
                  </p>
                )}

                {/* Author & Action Bar */}
                <div className="mt-8 pt-5 pb-6 border-y border-panel-edge flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-neon-blue to-neon-indigo p-[2px] shrink-0">
                      <div className="h-full w-full rounded-full bg-void flex items-center justify-center text-xs font-bold text-white">
                        JD
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Jerry Dev Studio</div>
                      <div className="text-xs text-[#A1A7CA]">Senior Mobile &amp; Backend Engineering</div>
                    </div>
                  </div>

                  {/* Share buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-panel-edge bg-abyss/90 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:border-neon-blue/50 transition-colors cursor-pointer"
                      title="Copy article link"
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                      <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-panel-edge bg-abyss/90 text-slate-300 hover:text-white hover:border-neon-blue/50 transition-colors"
                      aria-label="Share on X (Twitter)"
                    >
                      <XIcon />
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-panel-edge bg-abyss/90 text-slate-300 hover:text-white hover:border-neon-blue/50 transition-colors"
                      aria-label="Share on LinkedIn"
                    >
                      <LinkedInIcon />
                    </a>
                  </div>
                </div>

                {/* Optional Cover Image */}
                {effectivePost.cover_image && (
                  <div className="mt-8 overflow-hidden rounded-2xl border border-panel-edge bg-abyss/50 shadow-2xl">
                    <img
                      src={effectivePost.cover_image}
                      alt={effectivePost.title}
                      className="h-auto w-full max-h-[460px] object-cover"
                    />
                  </div>
                )}

                {/* Mobile Collapsible Table of Contents (screens < lg) */}
                {toc.length > 0 && (
                  <div className="mt-8 lg:hidden rounded-2xl border border-panel-edge bg-abyss/85 p-3.5 sm:p-5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setMobileTocOpen(!mobileTocOpen)}
                      className="w-full flex items-center justify-between text-left text-sm font-bold text-white cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neon-blue">
                          <path d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        <span>Table of Contents ({toc.length} sections)</span>
                      </span>
                      <span className="text-neon-blue text-xs font-semibold px-2.5 py-1 rounded-md bg-neon-blue/10 border border-neon-blue/30">
                        {mobileTocOpen ? 'Hide ▲' : 'Tap to Jump ▼'}
                      </span>
                    </button>

                    {mobileTocOpen && (
                      <nav className="mt-4 pt-4 border-t border-panel-edge/70 space-y-2">
                        {toc.map((item, idx) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => scrollToHeading(e, item.id)}
                            className={`block text-sm transition-colors py-2 px-2.5 rounded-lg ${
                              item.level === 3 ? 'pl-6 text-slate-400' : 'font-medium text-slate-200'
                            } ${
                              activeHeading === item.id ? 'text-neon-blue font-bold bg-neon-blue/15 border-l-2 border-neon-blue' : 'hover:text-neon-blue hover:bg-white/5'
                            }`}
                          >
                            <span className="text-slate-500 font-mono text-xs mr-2">{idx + 1}.</span>
                            {item.title}
                          </a>
                        ))}
                      </nav>
                    )}
                  </div>
                )}

                {/* Rich Markdown Article Body */}
                <div className="mt-10">
                  <RichTextContent className="markdown-body">
                    {effectivePost.content}
                  </RichTextContent>
                </div>

                {/* Community Feedback & Corrections Note */}
                <div className="mt-12 rounded-xl border border-panel-edge/80 bg-abyss/40 p-5 text-xs text-slate-400">
                  <div className="flex items-start gap-3">
                    <span className="text-neon-blue font-mono font-bold mt-0.5">ℹ</span>
                    <div>
                      <span className="font-semibold text-slate-200">
                        Maintained &amp; Reviewed by Jerry Dev Studio:
                      </span>{' '}
                      Found an outdated SDK signature, breaking Flutter upgrade, or edge case? Readers are welcome to submit notes or request patch snippets directly via our{' '}
                      <button
                        type="button"
                        onClick={onRequestQuote}
                        className="text-neon-blue hover:underline font-semibold cursor-pointer"
                      >
                        engineering desk
                      </button>
                      .
                    </div>
                  </div>
                </div>

                {/* Next / Previous Article Navigation */}
                {(prevPost || nextPost) && (
                  <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-panel-edge pt-8">
                    {prevPost ? (
                      <Link
                        to={`/blogs/${prevPost.slug}`}
                        className="group flex flex-col justify-between rounded-xl border border-panel-edge bg-abyss/40 p-4 transition-all hover:border-neon-blue/40 hover:bg-abyss/80"
                      >
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A1A7CA] group-hover:text-neon-blue transition-colors">
                          <ChevronLeft /> Previous Guide
                        </span>
                        <h4 className="mt-2 text-sm font-bold text-white group-hover:text-neon-blue transition-colors line-clamp-2">
                          {prevPost.title}
                        </h4>
                      </Link>
                    ) : <div />}

                    {nextPost ? (
                      <Link
                        to={`/blogs/${nextPost.slug}`}
                        className="group flex flex-col justify-between rounded-xl border border-panel-edge bg-abyss/40 p-4 text-right transition-all hover:border-neon-blue/40 hover:bg-abyss/80"
                      >
                        <span className="inline-flex items-center justify-end gap-1 text-[11px] font-semibold text-[#A1A7CA] group-hover:text-neon-blue transition-colors">
                          Next Guide <ChevronRight />
                        </span>
                        <h4 className="mt-2 text-sm font-bold text-white group-hover:text-neon-blue transition-colors line-clamp-2">
                          {nextPost.title}
                        </h4>
                      </Link>
                    ) : <div />}
                  </div>
                )}

                {/* Studio Consultation Banner */}
                <div className="mt-14 rounded-2xl border border-neon-blue/30 bg-gradient-to-r from-neon-blue/10 via-[#0A0C16] to-neon-indigo/10 p-6 sm:p-8 backdrop-blur-sm">
                  <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
                    <div>
                      <span className="eyebrow system-heading text-xs text-neon-blue">
                        // NEED ARCHITECTURAL ASSISTANCE?
                      </span>
                      <h3 className="mt-2 text-xl font-bold text-white">
                        Facing a complex FlutterFlow or Supabase blocker?
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                        Jerry Dev Studio audits codebases, builds custom Dart actions, fixes App Store rejections, and builds production apps with real-time backends.
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
                  <div className="mt-16 border-t border-panel-edge pt-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A7CA] mb-6">
                      Related Articles &amp; Solutions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {relatedPosts.map((rel) => (
                        <Link
                          key={rel.slug}
                          to={`/blogs/${rel.slug}`}
                          className="group flex flex-col justify-between rounded-xl border border-panel-edge bg-abyss/40 p-4 transition-all hover:border-neon-blue/40 hover:bg-abyss/70"
                        >
                          <div>
                            {rel.category && (
                              <span className="text-[10px] font-bold text-neon-blue uppercase tracking-wider">
                                {rel.category}
                              </span>
                            )}
                            <h4 className="mt-1.5 text-xs font-bold text-white group-hover:text-neon-blue transition-colors line-clamp-2 leading-snug">
                              {rel.title}
                            </h4>
                          </div>
                          <span className="mt-4 inline-flex items-center text-[11px] font-semibold text-neon-blue group-hover:translate-x-1 transition-transform">
                            Read article &rarr;
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </main>

            {/* Sticky Intelligence Sidebar (Desktop lg+) */}
            <aside className="hidden lg:block lg:col-span-4 min-w-0 sticky top-24 space-y-6">
              {/* Interactive Table of Contents */}
              {toc.length > 0 && (
                <div className="rounded-2xl border border-panel-edge bg-abyss/70 p-5 backdrop-blur-md shadow-lg">
                  <div className="pb-3 border-b border-panel-edge/60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neon-blue">
                          <path d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Table of Contents
                      </span>
                      <span className="text-xs text-[#A1A7CA] font-medium">
                        {toc.length} sections
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Click any heading to jump to that section
                    </p>
                  </div>

                  <nav className="mt-3.5 space-y-1.5 max-h-[380px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {toc.map((item, idx) => {
                      const isActive = activeHeading === item.id
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => scrollToHeading(e, item.id)}
                          className={`block py-1.5 px-2.5 text-sm transition-colors rounded-lg ${
                            item.level === 3 ? 'pl-5 text-slate-400 text-[13px]' : 'text-slate-200 font-medium'
                          } ${
                            isActive
                              ? 'text-neon-blue font-bold bg-neon-blue/15 border-l-2 border-neon-blue'
                              : 'hover:text-neon-blue hover:bg-white/5'
                          }`}
                        >
                          <span className="line-clamp-2">
                            <span className="text-slate-500 font-mono text-xs mr-1.5">{idx + 1}.</span>
                            {item.title}
                          </span>
                        </a>
                      )
                    })}
                  </nav>
                </div>
              )}

              {/* Guide Overview Card (replacing vague 'Article Intelligence') */}
              <div className="rounded-2xl border border-panel-edge bg-abyss/70 p-5 backdrop-blur-md shadow-lg">
                <div className="pb-3 border-b border-panel-edge/60">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neon-indigo">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Guide Overview
                  </span>
                </div>
                <div className="mt-3.5 space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-panel-edge/40">
                    <span className="text-slate-300">Written By</span>
                    <span className="text-white font-semibold">Jerry Dev Studio</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-panel-edge/40">
                    <span className="text-slate-300">Category</span>
                    <span className="text-neon-blue font-semibold">{effectivePost.category || 'Mobile Engineering'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-panel-edge/40">
                    <span className="text-slate-300">Estimated Reading</span>
                    <span className="text-white font-semibold">{mins} min</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-panel-edge/40">
                    <span className="text-slate-300">Audience</span>
                    <span className="text-white font-semibold">Developers &amp; Founders</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-300">Tech Stack</span>
                    <span className="text-emerald-400 font-mono text-xs font-semibold">Flutter &middot; Dart &middot; Supabase</span>
                  </div>
                </div>
              </div>

              {/* Sticky Studio Consultation CTA */}
              <div className="rounded-2xl border border-neon-blue/30 bg-gradient-to-b from-neon-blue/10 via-panel/90 to-neon-indigo/10 p-6 text-center shadow-lg">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neon-blue/15 text-neon-blue mb-3.5 border border-neon-blue/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-white">Need Help With This?</h4>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Stuck on this bug or building a FlutterFlow application? Jerry Dev Studio audits codebases, builds custom Dart actions, and engineers complete Supabase backends.
                </p>
                <div className="mt-5">
                  <SystemButton variant="primary" className="w-full text-sm font-semibold py-2.5" onClick={onRequestQuote}>
                    Request Consultation
                  </SystemButton>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}

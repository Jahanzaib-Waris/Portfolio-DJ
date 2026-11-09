import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import StatusPanel from '../../../components/StatusPanel'
import { helpTopics } from './helpTopics'

export default function HelpTopic() {
  const { slug } = useParams()
  const { hash } = useLocation()
  const index = helpTopics.findIndex((t) => t.slug === slug)
  const topic = helpTopics[index]

  useEffect(() => {
    document.title = `${topic ? topic.title : 'Help'} — Control Panel`
  }, [topic])

  // Jump to #section links (react-router doesn't scroll to hashes by itself).
  useEffect(() => {
    if (!topic) return
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [slug, hash, topic])

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl">
        <StatusPanel glow={false} className="p-8 text-center">
          <p className="text-base font-semibold text-white">That help topic doesn&rsquo;t exist.</p>
          <Link to="/admin/help" className="mt-3 inline-block text-sm text-neon-blue hover:underline">
            Back to all topics
          </Link>
        </StatusPanel>
      </div>
    )
  }

  const prev = helpTopics[index - 1]
  const next = helpTopics[index + 1]

  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/admin" className="hover:text-white">Admin</Link>
        <span className="text-slate-600">/</span>
        <Link to="/admin/help" className="hover:text-white">Help &amp; Guide</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200">{topic.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        {/* Topic list: stacked above the article on small screens, a side rail on large ones */}
        <aside aria-label="Help topics" className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Topics</p>
          <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {helpTopics.map((t) => (
              <li key={t.slug} className="shrink-0">
                <Link
                  to={`/admin/help/${t.slug}`}
                  aria-current={t.slug === slug ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    t.slug === slug
                      ? 'bg-neon-indigo/20 font-medium text-white'
                      : 'text-slate-400 hover:bg-panel-edge/40 hover:text-white'
                  }`}
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <article className="min-w-0">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{topic.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{topic.summary}</p>

          <nav aria-label="On this page" className="mt-5 rounded-xl border border-panel-edge bg-panel/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">On this page</p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {topic.sections.map((s) => (
                <li key={s.id}>
                  <Link to={`/admin/help/${topic.slug}#${s.id}`} className="text-sm text-neon-blue hover:underline">
                    {s.heading}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-8 space-y-10">
            {topic.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-4">
                <h2 className="mb-3 text-lg font-semibold text-white">{s.heading}</h2>
                <div className="space-y-3">{s.body}</div>
              </section>
            ))}
          </div>

          <nav aria-label="More topics" className="mt-12 grid gap-3 border-t border-panel-edge pt-6 sm:grid-cols-2">
            {prev ? (
              <Link to={`/admin/help/${prev.slug}`} className="rounded-xl border border-panel-edge p-3 transition-colors hover:border-neon-blue/60">
                <span className="text-xs text-slate-400">Previous</span>
                <span className="block text-sm font-medium text-white">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/admin/help/${next.slug}`} className="rounded-xl border border-panel-edge p-3 text-left transition-colors hover:border-neon-blue/60 sm:text-right">
                <span className="text-xs text-slate-400">Next</span>
                <span className="block text-sm font-medium text-white">{next.title}</span>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  )
}

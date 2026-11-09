import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchInput from '../../../components/admin/SearchInput'
import StatusPanel from '../../../components/StatusPanel'
import { helpTopics, quickAnswers } from './helpTopics'

export default function HelpIndex() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    document.title = 'Help & Guide — Control Panel'
  }, [])

  const term = query.trim().toLowerCase()
  const topics = useMemo(() => {
    if (!term) return helpTopics
    return helpTopics.filter((t) =>
      [t.title, t.summary, ...t.keywords, ...t.sections.map((s) => s.heading)].join(' ').toLowerCase().includes(term),
    )
  }, [term])

  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/admin" className="hover:text-white">Admin</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200">Help &amp; Guide</span>
      </nav>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Help &amp; Guide</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        How the admin panel works, in short topics. New here? Start with <Link className="text-neon-blue hover:underline" to="/admin/help/getting-started">Getting started</Link>.
      </p>

      <div className="mt-5">
        <SearchInput value={query} onChange={setQuery} placeholder="Search help topics..." className="max-w-md" />
      </div>

      {!term && (
        <section className="mt-6" aria-labelledby="quick-answers">
          <h2 id="quick-answers" className="text-sm font-semibold text-white">Quick answers</h2>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {quickAnswers.map((qa) => (
              <li key={qa.question}>
                <Link
                  to={`/admin/help/${qa.slug}#${qa.anchor}`}
                  className="block rounded-lg border border-panel-edge px-3 py-2 text-sm text-slate-300 transition-colors hover:border-neon-blue/60 hover:text-white"
                >
                  {qa.question}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mt-8 text-sm font-semibold text-white">{term ? 'Matching topics' : 'All topics'}</h2>
      {topics.length === 0 ? (
        <StatusPanel glow={false} className="mt-3 p-8 text-center text-sm text-slate-400">
          No topic matches &ldquo;{query}&rdquo;. Try a word like pitch, quote, follow-up or blog.
        </StatusPanel>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {topics.map((topic, i) => (
            <li key={topic.slug}>
              <Link
                to={`/admin/help/${topic.slug}`}
                className="flex h-full flex-col rounded-xl border border-panel-edge bg-panel/70 p-4 transition-colors hover:border-neon-blue/60"
              >
                <span className="text-xs font-medium text-slate-400">
                  {term ? 'Topic' : `Topic ${i + 1}`} &middot; {topic.sections.length} sections
                </span>
                <span className="mt-1 text-base font-semibold text-white">{topic.title}</span>
                <span className="mt-1 text-sm text-slate-300">{topic.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
